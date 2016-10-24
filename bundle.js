(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var exports = module.exports = {};


/**************************
 *** Common data tables ***
 **************************/

var bst_nt5 = [
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 0, 4, 1,  4, 4, 4, 2,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  3, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 0, 4, 1,  4, 4, 4, 2,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  3, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,

	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,
	4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4,  4, 4, 4, 4
];

/************************
 *** Generic routines ***
 ************************/

/**
 * Encode a sequence string with table
 *
 * @param seq    sequence
 * @param table  encoding table; must be of size 256
 *
 * @return an integer array
 */

function bsg_enc_seq(seq, table)
//seq parameter are both sequences
//but probably this function is called twice for both seqences
{

	if (table == null) return null;
	var s = [];
	s.length = seq.length;
	for (var i = 0; i < seq.length; ++i)

		s[i] = table[seq.charCodeAt(i)];


	return s;
}

/**************************
 *** Pairwise alignment ***
 **************************/

/*
 * The following implements local and global pairwise alignment with affine gap
 * penalties. There are two formulations: the Durbin formulation as is
 * described in his book and the Green formulation as is implemented in phrap.
 * The Durbin formulation is easier to understand, while the Green formulation
 * is simpler to code and probably faster in practice.
 *
 * The Durbin formulation is:
 *
 *   M(i,j) = max{M(i-1,j-1)+S(i,j), E(i-1,j-1), F(i-1,j-1)}
 *   E(i,j) = max{M(i-1,j)-q-r, F(i-1,j)-q-r, E(i-1,j)-r}
 *   F(i,j) = max{M(i,j-1)-q-r, F(i,j-1)-r, E(i,j-1)-q-r}
 *
 * where q is the gap open penalty, r the gap extension penalty and S(i,j) is
 * the score between the i-th residue in the row sequence and the j-th residue
 * in the column sequence. Note that the original Durbin formulation disallows
 * transitions between between E and F states, but we allow them here.
 *
 * In the Green formulation, we introduce:
 *
 *   H(i,j) = max{M(i,j), E(i,j), F(i,j)}
 *
 * The recursion becomes:
 *
 *   H(i,j) = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
 *   E(i,j) = max{H(i-1,j)-q, E(i-1,j)} - r
 *   F(i,j) = max{H(i,j-1)-q, F(i,j-1)} - r
 *
 * It is in fact equivalent to the Durbin formulation. In implementation, we
 * calculate the scores in a different order:
 *
 *   H(i,j)   = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
 *   E(i+1,j) = max{H(i,j)-q, E(i,j)} - r
 *   F(i,j+1) = max{H(i,j)-q, F(i,j)} - r
 *
 * i.e. at cell (i,j), we compute E for the next row and F for the next column.
 * Please see inline comments below for details.
 *
 *
 * The following implementation is ported from klib/ksw.c. The original C
 * implementation has a few bugs which have been fixed here. Like the C
 * version, this implementation should be very efficient. It could be made more
 * efficient if we use typed integer arrays such as Uint8Array. In addition,
 * I mixed the local and global alignments together. For performance,
 * it would be preferred to separate them out.
 */

/**
 * Generate scoring matrix from match/mismatch score
 *
 * @param n     size of the alphabet
 * @param a     match score, positive
 * @param b     mismatch score, negative
 *
 * @return sqaure scoring matrix. The last row and column are zero, for
 * matching an ambiguous residue.
 */
function bsa_gen_score_matrix(n, a, b)
{

	var m = [];
	if (b > 0) b = -b; // mismatch score b should be non-positive
	for (var i = 0; i < n - 1; ++i) {
		m[i] = [];
		for (var j = 0; j < n - 1; ++j)
			m[i][j] = i == j? a : b;
		m[i][j] = 0;
	}
	m[n-1] = [];
	for (var j = 0; j < n; ++j) m[n-1][j] = 0;

	return m;
}

/**
 * Generate query profile (a preprocessing step)
 *
 * @param _s      sequence in string or post bsg_enc_seq()
 * @param _m      score matrix or [match,mismatch] array
 * @param table   encoding table; must be consistent with _s and _m
 *
 * @return query profile. It is a two-dimensional integer matrix.
 */
function bsa_gen_query_profile(_s, _m, table)
{
	var s = typeof _s == 'string'? bsg_enc_seq(_s, table) : _s;
	var qp = [], matrix;
	if (_m.length >= 2 && typeof _m[0] == 'number' && typeof _m[1] == 'number') { // match/mismatch score
		if (table == null) return null;

		var n = typeof table == 'number'? table : table[table.length-1] + 1;



		matrix = bsa_gen_score_matrix(n, _m[0], _m[1]);
	} else matrix = _m; // _m is already a matrix; FIXME: check if it is really a square matrix!
	for (var j = 0; j < matrix.length; ++j) {
		var qpj, mj = matrix[j];
		qpj = qp[j] = [];
		for (var i = 0; i < s.length; ++i)
			qpj[i] = mj[s[i]];
	}

	return qp;
}

/**
 * Local or global pairwise alignemnt
 *
 * @param is_local  perform local alignment
 * @param target    target string
 * @param query     query string or query profile
 * @param matrix    square score matrix or [match,mismatch] array
 * @param gapsc     [gap_open,gap_ext] array; k-length gap costs gap_open+gap_ext*k
 * @param w         bandwidth, disabled by default
 * @param table     encoding table. It defaults to bst_nt5.
 *
 * @return [score,target_start,cigar]. cigar is encoded in the BAM way, where
 * higher 28 bits keeps the length and lower 4 bits the operation in order of
 * "MIDNSH". See bsa_cigar2str() for converting cigar to string.
 */
exports.bsa_align = function(is_local, target, query, matrix, gapsc, w, table)
{
	// convert bases to integers
	if (table == null) table = bst_nt5;
	var t = bsg_enc_seq(target, table);

	var qp = bsa_gen_query_profile(query, matrix, table);

	var qlen = qp[0].length;


	// adjust band width
	var max_len = qlen > t.length? qlen : t.length;
	w = w == null || w < 0? max_len : w;
	var len_diff = t.target > qlen? t.target - qlen : qlen - t.target;
	w = w > len_diff? w : len_diff;

	// set gap score
	var gapo, gape; // these are penalties which should be non-negative
	if (typeof gapsc == 'number') gapo = 0, gape = gapsc > 0? gapsc : -gapsc;
	else gapo = gapsc[0] > 0? gapsc[0] : -gapsc[0], gape = gapsc[1] > 0? gapsc[1] : -gapsc[1];
	var gapoe = gapo + gape; // penalty for opening the first gap

	// initial values
	var NEG_INF = -0x40000000;
	var H = [], E = [], z = [], score, max = 0, end_i = -1, end_j = -1;
	if (is_local) {
		for (var j = 0; j <= qlen; ++j) H[j] = E[j] = 0;
	} else {
		H[0] = 0; E[0] = -gapoe - gapoe;
		for (var j = 1; j <= qlen; ++j) {
			if (j >= w) H[j] = E[j] = NEG_INF; // everything is -inf outside the band
			else H[j] = -(gapo + gape * j), E[j] = E[j-1] - gape;
		}
	}

	// the DP loop
	for (var i = 0; i < t.length; ++i) {
		var h1 = 0, f = 0, m = 0, mj = -1;

		var zi, qpi = qp[t[i]];

		zi = z[i] = [];
		var beg = i > w? i - w : 0;
		var end = i + w + 1 < qlen? i + w + 1 : qlen; // only loop through [beg,end) of the query sequence
		if (!is_local) {
			h1 = beg > 0? NEG_INF : -gapoe - gape * i;
			f = beg > 0? NEG_INF : -gapoe - gapoe - gape * i;
		}
		for (var j = beg; j < end; ++j) {
			// At the beginning of the loop: h=H[j]=H(i-1,j-1), e=E[j]=E(i,j), f=F(i,j) and h1=H(i,j-1)
			// If we only want to compute the max score, delete all lines involving direction "d".
			var e = E[j], h = H[j], d;
			H[j] = h1;           // set H(i,j-1) for the next row
			h += qpi[j];         // h = H(i-1,j-1) + S(i,j)
			d = h > e? 0 : 1;
			h = h > e? h : e;
			d = h > f? d : 2;
			h = h > f? h : f;    // h = H(i,j) = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
			d = !is_local || h > 0? d : 1<<6;
			h1 = h;              // save H(i,j) to h1 for the next column
			mj = m > h? mj : j;
			m = m > h? m : h;    // update the max score in this row
			h -= gapoe;
			h = !is_local || h > 0? h : 0;
			e -= gape;
			d |= e > h? 1<<2 : 0;
			e = e > h? e : h;    // e = E(i+1,j)
			E[j] = e;            // save E(i+1,j) for the next row
			f -= gape;
			d |= f > h? 2<<4 : 0;
			f = f > h? f : h;    // f = F(i,j+1)
			zi[j] = d;           // z[i,j] keeps h for the current cell and e/f for the next cell
		}
		H[end] = h1, E[end] = is_local? 0 : NEG_INF;
		if (m > max) max = m, end_i = i, end_j = mj;
	}
	if (is_local && max == 0) return null;
	score = is_local? max : H[qlen];

	// backtrack to recover the alignment/cigar
	function push_cigar(ci, op, len) {
		if (ci.length == 0 || op != (ci[ci.length-1]&0xf))
			ci.push(len<<4|op);
		else ci[ci.length-1] += len<<4;
	}
	var cigar = [], tmp, which = 0, i, k, start_i = 0;
	if (is_local) {
		i = end_i, k = end_j;
		if (end_j != qlen - 1) // then add soft cliping
			push_cigar(cigar, 4, qlen - 1 - end_j);
	} else i = t.length - 1, k = (i + w + 1 < qlen? i + w + 1 : qlen) - 1; // (i,k) points to the last cell
	while (i >= 0 && k >= 0) {
		tmp = z[i][k - (i > w? i - w : 0)];
		which = tmp >> (which << 1) & 3;
		if (which == 0 && tmp>>6) break;
		if (which == 0) which = tmp & 3;
		if (which == 0)      { push_cigar(cigar, 0, 1); --i, --k; } // match
		else if (which == 1) { push_cigar(cigar, 2, 1); --i; } // deletion
		else                 { push_cigar(cigar, 1, 1), --k; } // insertion
	}
	if (is_local) {
		if (k >= 0) push_cigar(cigar, 4, k + 1); // add soft clipping
		start_i = i + 1;
	} else { // add the first insertion or deletion
		if (i >= 0) push_cigar(cigar, 2, i + 1);
		if (k >= 0) push_cigar(cigar, 1, k + 1);
	}
	for (var i = 0; i < cigar.length>>1; ++i) // reverse CIGAR
		tmp = cigar[i], cigar[i] = cigar[cigar.length-1-i], cigar[cigar.length-1-i] = tmp;
	return [score, start_i, cigar];
}

// function bsa_cigar2gaps(target, query, start, cigar)
// {
// 	var oq = '', ot = '', lq = 0, lt = start;
// 	for (var k = 0; k < cigar.length; ++k) {
// 		var op = cigar[k]&0xf, len = cigar[k]>>4;
// 		if (op == 0) { // match
// 			oq += query.substr(lq, len);
// 			ot += target.substr(lt, len);
// 			lq += len, lt += len;
// 		} else if (op == 1) { // insertion
// 			oq += query.substr(lq, len);
// 			ot += Array(len+1).join("-");
// 			lq += len;
// 		} else if (op == 2) { // deletion
// 			oq += Array(len+1).join("-");
// 			ot += target.substr(lt, len);
// 			lt += len;
// 		} else if (op == 4) { // soft clip
// 			lq += len;
// 		}
// 		console.log(op)
// 	}
//
// 	return [ot, oq];
// }

exports.bsa_cigar2str = function(cigar)
{
	var s = [];
	for (var k = 0; k < cigar.length; ++k)
		s.push((cigar[k]>>4).toString() + "MIDNSHP=XB".charAt(cigar[k]&0xf));
	return s.join("");
}

},{}],2:[function(require,module,exports){
module.exports={
    "1": {"id":"T7","seq":"TAATACGACTCACTATAGG"},
    "2": {"id":"SP6","seq":"ATTTAGGTGACACTATAG"},
    "3": {"id":"T3","seq":"ATTAACCCTCACTAAAGGG"},
    "4": {"id":"BGH polyA","seq":"TGTGCCTTCTAGTTGCCAGCCATCTGTTGTTTGCCCCTCCCCCGTGCCTTCCTTGACCCTGGAAGGTGCCACTCCCACTGTCCTTTCCTAATAAAATGAGGAAATTGCATCGCATTGTCTGAGTAGGTGTCATTCTATTCTGGGGGGTGGGGTGGGGCAGGACAGCAAGGGGGAGGATTGGGAAGACAATAGCAGGCATGCTGGGGATGCGGTGGGCTCTATGGC"},
    "5": {"id":"SV40 ori","seq":"ATCCCGCCCCTAACTCCGCCCAGTTCCGCCCATTCTCCGCCCCATGGCTGACTAATTTTTTTTATTTATGCAGAGGCC"},
    "6": {"id":"SV40 polyA1","seq":"TGATCATAATCAAGCCATATCACATCTGTAGAGGTTTACTTGCTTTAAAAAACCTCCACACCTCCCCCTGAACCTGAAACATAAAATGAATGCAATTGTTGTTGTTAACTTGTTTATTGCAGCTTATAATGGTTACAAATAAAGCAATAGCATCACAAATTTCACAAATAAAGCATTTTTTTCACTGCATTCTAGTTGTGGTTTGTCCAAACTCATCAATGTATCTTATCATGTCTGGATCTGC"},
    "7": {"id":"SV40 polyA2","seq":"CCATGGCCCAACTTGTTTATTGCAGCTTATAATGGTTACAAATAAAGCAATAGCATCACAAATTTCACAAATAAAGCATTTTTTTCACTGCATTCTAGTTGTGGTTTGTCCAAACTCATCAATGTATCTTATCATGTCTGGATCTC"},
    "8": {"id":"3_AcPH","seq":"GACTCTGCTGAAGAGGAGGAAATTCTCCTTGAAGTTTCCCTGGTGTTCAAAGTAAAGGAGTTTGCACCAGACGCACCTCTGTTCACTGGTCCGGCGTATTAA"},
    "9": {"id":"5_LTR","seq":"AACGCCATTTTGCAAGGCATGGAAAAATACATAACGCATGCCCCATATATGGAGTTCCGCGTTACATAACTTACGGTAAATGGCCCGCCTGGCTGACCGCCCAACGACCCCCGCCCATTGACGTCAATAATGACGTATGTTCCCATAGTAACGCCAATAGGGACTTTCCATTGACGTCAATGGGTGGAGTATTTACGGTAAACTGCCCACTTGGCAGTACATCAAGTGTATCATATGCCAAGTACGCCCCCTATTGACGTCAATGACGGTAAATGGCCCGCCTGGCATTATGCCCAGTACATGACCTTATGGGACTTTCCTACTTGGCAGTACATCTACGTATTAGTCATCGCTATTACCATGGTGATGCGGTTTTGGCAGTACATCAATGGGCGTGGATAGCGGTTTGACTCACGGGGATTTCCAAGTCTCCACCCCATTGACGTCAATGGGAGTTTGTTTTGGCACCAAAATCAACGGGACTTTCCAAAATGTCGTAACAACTCCGCCCCATTGACGCAAATGGGCGGTAGGCGTGTACGGTGGGAGGTCTATATAAGCAGAGATGCATCCTCACTCGGGGCGCCAGTCCTCCGATTGACTGAGTCGCCCGGGTACCCGTGTATCCAATAAACCCTCTTGCAGTTGCATCCGACTTGTGGTCTCGCTGTTCCTTGGGAGGGTCTCCTCTGAGTGATTGACTACCCGTCAGCGGGGGTCTTTCATT"},
    "10": {"id":"5_LTR2","seq":"AACGCCATTTTGCAAGGCATGGAAAAATACATAACTGAGAATAGAAAAGTTCAGATCAAGGTCAGGAACAGATGGAACAGCTGAATATGGGCCAAAGCGGATATCTGTGGTAAGCAGTTCCTGCCCCGGCTCAGGGCCAAGAACAGATGGAACAGCTGAATATGGGCCAAACAGGATATCTGTGGTAAGCAGTTCCTGCCCCGGCTCAGGGCCAAGAACAGATGGTCCCCAGATGCGGTCCAGCCCTCAGCAGTTTCTAGAGAACCATCAGATGTTTCCAGGGTGCCCCAAGGACCTGAAATGACCCTGTGCCTTATTTGAACTAACCAATCAGTTCGCTTCTCGCTTCTGTTCGCGCGCTTCTGCTCCCCGAGCTCAATAAAAGAGCCCACAACCCCTCACTCGGGGCGCCAGTCCTCCGATTGACTGAGTCGCCCGGGTACCCGTGTATCCAATAAACCCTCTTGCAGTTGCATCCGACTTGTGGTCTCGCTGTTCCTTGGGAGGGTCTCCTCTGAGTGATTGACTACCCGTCAGCGGGGGTCTTTCATT"},
    "11": {"id":"Ac_3_flank","seq":"GTTATTAGTACATTTATTAAGCGCTAGATTCTGTGCGTTGTTGATTTACAGACAATTGTTGTACGTATTTTAATAATTCATTAAATTTATAATCTTTAGGGTGGTATGTTAGAGCGAAAATCAAATGATTTTCAGCGTCTTTATATCTGAATTTAAATATTAAATCCTCAATAGATTTGTAAAATAGGTTTCGATTAGTTTCAAACAAGGGTTGTTTTTCCGAACCGATGGCTGGACTATCTAATGGATTTTCGCTCAACGCCACAAAACTTGCCAAATCTTGTAGCAGCAATCTAGCTTTGTCGATATTCGTTTGTGTTTTGTTTTGTAATAAAGGTTCGACGTCGTTCAAAATATTATGCGCTTTTGTATTTCTTTCATCACTGTCGTTAGTGTACAATTGACTCGACGTAAACACGTTAAATAAAGCTTGGACATATTTAACATCGGGCGTGTTAGCTTTATTAGGCCGATTATCGTCGTCGTCCCAACCCTCGTCGTTAGAAGTTGCTTCCGAAGACGATTTTGCCATAGCCACACGACGCCTATTAATTGTGTCGGCTAACACGTCCGCGATCAAATTTGTAGTTGAGCTTTTTGGAATTATTTCTGATTGCGGGCGTTTTTGGGCGGGTTTCAATCTAACTGTGCCCGATTTTAATTCAGACAACACGTTAGAAAGCGATGGTGCAGGCGGTGGTAACATTTCAGACGGCAAATCTACTAATGGCGGCGGTGGTGGAGCTGATGATAAATCTACCATCGGTGGAGGCGCAGGCGGGGCTGGCGGCGGAGGCGGAGGCGGAGGTGGTGGCGGTGATGCAGACGGCGGTTTAGGCTCAAATGTCTCTTTAGGCAACACAGTCGGCACCTCAACTATTGTACTGGTTTCGGGCGCCGTTTTTGGTTTGACCGGTCTGAGACGAGTGCGATTTTTTTCGTTTCTAATAGCTTCCAACAATTGTTGTCTGTCGTCTAAAGGTGCAGCGGGTTGAGGTTCCGTCGGCATTGGTGGAGCGGGCGGCAATTCAGACATCGATGGTGGTGGTGGTGGTGGAGGCGCTGGAATGTTAGGCACGGGAGAAGGTGGTGGCGGCGGTGCCGCCGGTATAATTTGTTCTGGTTTAGTTTGTTCGCGCACGATTGTGGGCACCGGCGCAGGCGCCGCTGGCTGCACAACGGAAGGTCGTCTGCTTCGAGGCAGCGCTTGGGGTGGTGGCAATTCAATATTATAATTGGAATACAAATCGTAAAAATCTGCTATAAGCATTGTAATTTCGCTATCGTTTACCGTGCCGATATTTAACAACCGCTCAATGTAAGCAATTGTATTGTAAAGAGATTGTCTCAAGCTCGGATCGATCCCGCACGCCGATAACAAGCCTTTTCATTTTTACTACAGCATTGTAGTGGCGAGACACTTCGCTGTCGTCG"},
    "12": {"id":"Ac_5_flank","seq":"AACGGCTCCGCCCACTATTAATGAAATTAAAAATTCCAATTTTAAAAAACGCAGCAAGAGAAACATTTGTATGAAAGAATGCGTAGAAGGAAAGAAAAATGTCGTCGACATGCTGAACAACAAGATTAATATGCCTCCGTGTATAAAAAAAATATTGAACGATTTGAAAGAAAACAATGTACCGCGCGGCGGTATGTACAGGAAGAGGTTTATACTAAACTGTTACATTGCAAACGTGGTTTCGTGTGCCAAGTGTGAAAACCGATGTTTAATCAAGGCTCTGACGCATTTCTACAACCACGACTCCAAGTGTGTGGGTGAAGTCATGCATCTTTTAATCAAATCCCAAGATGTGTATAAACCACCAAACTGCCAAAAAATGAAAACTGTCGACAAGCTCTGTCCGTTTGCTGGCAACTGCAAGGGTCTCAATCCTATTTGTAATTATTGAATAATAAAACAATTATAAATGCTAAATTTGTTTTTTATTAACGATACAAACCAAACGCAACAAGAACATTTGTAGTATTATCTATAATTGAAAACGCGTAGTTATAATCGCTGAGGTAATATTTAAAATCATTTTCAAATGATTCACAGTTAATTTGCGACAATATAATTTTATTTTCACATAAACTAGACGCCTTGTCGTCTTCTTCTTCGTATTCCTTCTCTTTTTCATTTTTCTCCTCATAAAAATTAACATAGTTATTATCGTATCCATATATGTATCTATCGTATAGAGTAAATTTTTTGTTGTCATAAATATATATGTCTTTTTTAATGGGGTGTATAGTACCGCTGCGCATAGTTTTTCTGTAATTTACAACAGTGCTATTTTCTGGTAGTTCTTCGGAGTGTGTTGCTTTAATTATTAAATTTATATAATCAATGAATTTGGGATCGTCGGTTTTGTACAATATGTTGCCGGCATAGTACGCAGCTTCTTCTAGTTCAATTACACCATTTTTTAGCAGCACCGGATTAACATAACTTTCCAAAATGTTGTACGAACCGTTAAACAAAAACAGTTCACCTCCCTTTTCTATACTATTGTCTGCGAGCAGTTGTTTGTTGTTAAAAATAACAGCCATTGTAATGAGACGCACAAACTAATATCACAAACTGGAAATGTCTATCAATATAT"},
    "13": {"id":"AraC","seq":"ATGGCTGAAGCGCAAAATGATCCCCTGCTGCCGGGATACTCGTTTAATGCCCATCTGGTGGCGGGTTTAACGCCGATTGAGGCCAACGGTTATCTCGATTTTTTTATCGACCGACCGCTGGGAATGAAAGGTTATATTCTCAATCTCACCATTCGCGGTCAGGGGGTGGTGAAAAATCAGGGACGAGAATTTGTTTGCCGACCGGGTGATATTTTGCTGTTCCCGCCAGGAGAGATTCATCACTACGGTCGTCATCCGGAGGCTCGCGAATGGTATCACCAGTGGGTTTACTTTCGTCCGCGCGCCTACTGGCATGAATGGCTTAACTGGCCGTCAATATTTGCCAATACGGGGTTCTTTCGCCCGGATGAAGCGCACCAGCCGCATTTCAGCGACCTGTTTGGGCAAATCATTAACGCCGGGCAAGGGGAAGGGCGCTATTCGGAGCTGCTGGCGATAAATCTGCTTGAGCAATTGTTACTGCGGCGCATGGAAGCGATTAACGAGTCGCTCCATCCACCGATGGATAATCGGGTACGCGAGGCTTGTCAGTACATCAGCGATCACCTGGCAGACAGCAATTTTGATATCGCCAGCGTCGCACAGCATGTTTGCTTGTCGCCGTCGCGTCTGTCACATCTTTTCCGCCAGCAGTTAGGGATTAGCGTCTTAAGCTGGCGCGAGGACCAACGTATCAGCCAGGCGAAGCTGCTTTTGAGCACCACCCGGATGCCTATCGCCACCGTCGGTCGCAATGTTGGTTTTGACGATCAACTCTATTTCTCGCGGGTATTTAAAAAATGCACCGGGGCCAGCCCGAGCGAGTTCCGTGCCGGTTGTGAAGAAAAAGTGAATGATGTAGCCGTCAAGTTGTCATAA"},
    "14": {"id":"AraI1I2","seq":"ATAGCATTTTTATCCATAAGATTAGCGGATCCTACCTGA"},
    "15": {"id":"ars1","seq":"GACAGAATGGGATACAAGGGCATCGTCTATAATTATAGCTAAAAATTGTATTTTAATTTGTATTTTTTGTAATTTTATTTCTCATTGTTTTACTTAAAATGAATGCGAATTAGAGAAAACTTCAACGAAATGTCAAAATAAGCTCAGCAAAATATACAATTTTAGGGAAAGCGATCAGCAACTTATTCTCCGTTGTAGATTCTTTTTCTTCATAAATTCCAACAACGTAACTGCCAATTGATTTTTCTCTAGATGCTAATAAATTGGAACTAATGAGTATAATAACACAGGTTTTGATAAATTGTAAACTCTTACTCAAAAAAAGAATGTTAAAACTAATTTAACCTTTTTATAAAGGCTCATGGCGTTAAAGAGGATAGTAAAAATTCTACAATTTTTTAATTTAATGTCGCAATTGTCTTGCGAATATAATTCTATTAATTTTCGCTAACTGCTGTTTTAGTACTATTACTTTCAATATGCCTTATATGCAACTTTAATTCATGAAGAATGCAATATTTTTGCAATCTTTCTTGTACTGAGCGCTTTTTATCATTTAGTACTCATTATTTAATTTTTCAGTAAAGGGCAATAAATAAATTTGTAGAAGATGCAATGTAATCTCCTCTATCCTTTTGCTCATATATGTTTATGAGTATACCTAGTCTAGAAAGGCTTGTATTTAAAATATTATTCAATAAAAATTCACAATTTTTACGACATGTGCTACCATTCACCTAACTTCCTGATTATAAAATTGGTTCGTTTATACTAATTACTTAAGTACCTTTAACTAAACAAAATGCCTATATATATATTAATTTACAATGAGTGTCAGATAAGTCACTATGTCCGAGTGGTTAAGGAG"},
    "16": {"id":"attB1","seq":"ACAAGTTTGTACAAAAAAGCAGGCT"},
    "17": {"id":"attB2","seq":"ACCCAGCTTTCTTGTACAAAGTGGT"},
    "18": {"id":"attL1","seq":"AGCCTGCTTTTTTGTACAAAGTTGGCATTATAAAAAAGCATTGCTCATCAATTTGTTGCAACGAACAGGTCACTATCAGTCAAAATAAAATCATTATTTG"},
    "19": {"id":"attL2","seq":"ACCCAGCTTTCTTGTACAAAGTTGGCATTATAAGAAAGCATTGCTTATCAATTTGTTGCAACGAACAGGTCACTATCAGTCAAAATAAAATCATTATTTG"},
    "20": {"id":"attP","seq":"AAATAATGATTTTATTTTGACTGATAGTGACCTGTTCGTTGCAACACATTGATGAGCAATGCTTTTTTATAATGCCAACTTTGTACAAAAAAGCTGAACGAGAAACGTAAAATGATATAAATATCAATATATTAAATTAGATTTTGCATAAAAAACAGACTACATAATACTGTAAAACACAACATATCCAGTCACTATGAATCAACTACTTAGATGGTATTAGTGACCTGTA"},
    "22": {"id":"attR1","seq":"ACAAGTTTGTACAAAAAAGCTGAACGAGAAACGTAAAATGATATAAATATCAATATATTAAATTAGATTTTGCATAAAAAACAGACTACATAATACTGTAAAACACAACATATCCAGTCACTATG"},
    "23": {"id":"attR2","seq":"CATAGTGACTGGATATGTTGTGTTTTACAGTATTATGTAGTCTGTTTTTTATGCAAAATCTAATTTAATATATTGATATTTATATCATTTTACGTTTCTCG"},
    "24": {"id":"bGlob_int","seq":"CGAATCCCGGCCGGGAACGGTGCATTGGAACGCGGATTCCCCGTGCCAAGAGTGACGTAAGTACCGCCTATAGAGTCTATAGGCCCACAAAAAATGCTTTCTTCTTTTAATATACTTTTTTGTTTATCTTATTTCTAATACTTTCCCTAATCTCTTTCTTTCAGGGCAATAATGATACAATGTATCATGCCTCTTTGCACCATTCTAAAGAATAACAGTGATAATTTCTGGGTTAAGGCAATAGCAATATTTCTGCATATAAATATTTCTGCATATAAATTGTAACTGATGTAAGAGGTTTCATATTGCTAATAGCAGCTACAATCCAGCTACCATTCTGCTTTTATTTTATGGTTGGGATAAGGCTGGATTATTCTGAGTCCAAGCTAGGCCCTTTTGCTAATCATGTTCATACCTCTTATCTTCCTCCCACAGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTGGGAT"},
    "25": {"id":"bGlob_int","seq":"GTGAGTTTGGGGACCCTTGATTGTTCTTTCTTTTTCGCTATTGTAAAATTCATGTTATATGGAGGGGGCAAAGTTTTCAGGGTGTTGTTTAGAATGGGAAGATGTCCCTTGTATCACCATGGACCCTCATGATAATTTTGTTTCTTTCACTTTCTACTCTGTTGACAACCATTGTCTCCTCTTATTTTCTTTTCATTTTCTGTAACTTTTTCGTTAAACTTTAGCTTGCATTTGTAACGAATTTTTAAATTCACTTTTGTTTATTTGTCAGATTGTAAGTACTTTCTCTAATCACTTTTTTTTCAAGGCAATCAGGGTATATTATATTGTACTTCAGCACAGTTTTAGAGAACAATTGTTATAATTAAATGATAAGGTAGAATATTTCTGCATATAAATTCTGGCTGGCGTGGAAATATTCTTATTGGTAGAAACAACTACATCCTGGTCATCATCCTGCCTTTCTCTTTATGGTTACAATGATATACACTGTTTGAGATGAGGATAAAATACTCTGAGTCCAAACCGGGCCCCTCTGCTAACCATGTTCATGCCTTCTTCTTTTTCCTACAG"},
    "26": {"id":"biotin_Pinpoint_Xa-1","seq":"ATGAAACTGAAGGTAACAGTCAACGGCACTGCGTATGACGTTGACGTTGACGTCGACAAGTCACACGAAAACCCGATGGGCACCATCCTGTTCGGCGGCGGCACCGGCGGCGCGCCGGCACCGGCAGCAGGTGGCGCAGGCGCCGGTAAGGCCGGAGAGGGCGAGATTCCCGCTCCGCTGGCCGGCACCGTCTCCAAGATCCTCGTGAAGGAGGGTGACACGGTCAAGGCTGGTCAGACCGTGCTCGTTCTCGAGGCCATGAAGATGGAGACCGAGATCAACGCTCCCACCGACGGCAAGGTCGAGAAGGTCCTGGTCAAGGAGCGTGACGCGGTGCAGGGCGGTCAGGGTCTCATCAAGATCGGGGATCTCGAGCTCATCGAAGG"},
    "27": {"id":"CAP_BS","seq":"TTGCTATGCCATAG"},
    "28": {"id":"ccdB","seq":"ATGCAGTTTAAGGTTTACACCTATAAAAGAGAGAGCCGTTATCGTCTGTTTGTGGATGTACAGAGTGATATTATTGACACGCCCGGGCGACGGATGGTGATCCCCCTGGCCAGTGCACGTCTGCTGTCAGATAAAGTCTCCCGTGAACTTTACCCGGTGGTGCATATCGGGGATGAAAGCTGGCGCATGATGACCACCGATATGGCCAGTGTGCCGGTCTCCGTTATCGGGGAAGAAGTGGCTGATCTCAGCCACCGCGAAAATGACATCAAAAACGCCATTAACCTGATGTTCTGGGGAATATAA"},
    "29": {"id":"CEN4","seq":"cgctgggccattctcatgaagaatatcttgaatttattgtcatattactagttggtgtggaagtccatatatcggtgatcaatatagtggttgacatgctggctagtcaacattgagccttttgatcatgcaaatatattacggtattttacaatcaaatatcaaacttaactattgactttataacttatttaggtggtaacattcttataaaaaagaaaaaaattactgcaaaacagtactagcttttaacttgtatcctaggttatctatgctgtctcaccatagagaatattacctatttcagaatgtatgtccatgattcgccgggtaaatacatataatacacaaatctggcttaataaagtctataatatatctcataaagaagtgctaaattggctagtgctatatatttttaagaaaatttcttttgactaagtccatatcgactttgtaaaagttcactttagcatacatatattacacgagccagaaattgtaacttttgcctaaaatcacaaattgcaaaatttaattgcttgcaaaaggtcacatgcttataatcaacttttttaaaaatttaaaatacttttttattttttatttttaaacataaatgaaataatttatttattgtttatgattaccgaaacataaaacctgctcaagaaaaagaaactgttttgtccttggaaaaaaagcactacctaggagcggccaaaatgccgaggctttcatagcttaaactctttacagaaaataggcattatagatcagttcgagttttcttattcttccttccggttttatcgtcacagttttacagtaaataagtatcacctcttagagt"},
    "30": {"id":"CEN6_ARS4","seq":"GGTCCTTTTCATCACGTGCTATAAAAATAATTATAATTTAAATTTTTTAATATAAATATATAAATTAAAAATAGAAAGTAAAAAAAGAAATTAAAGAAAAAATAGTTTTTGTTTTCCGAAGATGTAAAAGACTCTAGGGGGATCGCCAACAAATACTACCTTTTATCTTGCTCTTCCTGCTCTCAGGTATTAATGCCGAATTGTTTCATCTTGTCTGTGTAGAAGACCACACACGAAAATCCTGTGATTTTACATTTTACTTATCGTTAATCGAATGTATATCTATTTAATCTGCTTTTCTTGTCTAATAAATATATATGTAAAGTACGCTTTTTGTTGAAATTTTTTAAACCTTTGTTTATTTTTTTTTCTTCATTCCGTAACTCTTCTACCTTCTTTATTTACTTTCTAAAATCCAAATACAAAACATAAAAATAAATAAACACAGAGTAAATTCCCAAATTATTCCATCATTAAAAGATACGAGGCGCGTGTAAGTTACAGGCAAGCGATCCGTCC"},
    "31": {"id":"chim_int","seq":"GTAAGTATCAAGGTTACAAGACAGGTTTAAGGAGACCAATAGAAACTGGGCTTGTCGAGACAGAGAAGACTCTTGCGTTTCTGATAGGCACCTATTGGTCTTACTGACATCCACTTTGCCTTTCTCTCCACAG"},
    "32": {"id":"cosN","seq":"CCGTAACCTGTCGGATCACCGGAAAGGACCCGTAAAGTGATAATGATTATCATCTACATATCACAACGTGCGTGGAGGCCATCAAACCAC"},
    "33": {"id":"cPPT","seq":"AAAAGAAAAGGGGGGA"},
    "34": {"id":"cPPT","seq":"AAAAGAAGAGGTAGGA"},
    "35": {"id":"cPPT","seq":"AAAAGAAGGGGAGGAA"},
    "36": {"id":"cPPT","seq":"AAACAAAGGGGTAGAA"},
    "37": {"id":"cPPT","seq":"AAACAAAGGGGTAGAC"},
    "38": {"id":"CRE_NLS","seq":"ATGGCACCCAAGAAGAAGAGGAAGGTGTCCAATTTACTGACCGTACACCAAAATTTGCCTGCATTACCGGTCGATGCAACGAGTGATGAGGTTCGCAAGAACCTGATGGACATGTTCAGGGATCGCCAGGCGTTTTCTGAGCATACCTGGAAAATGCTTCTGTCCGTTTGCCGGTCGTGGGCGGCATGGTGCAAGTTGAATAACCGGAAATGGTTTCCCGCAGAACCTGAAGATGTTCGCGATTATCTTCTATATCTTCAGGCGCGCGGTCTGGCAGTAAAAACTATCCAGCAACATTTGGGCCAGCTAAACATGCTTCATCGTCGGTCCGGGCTGCCACGACCAAGTGACAGCAATGCTGTTTCACTGGTTGTGCGGCGGATCCGAAAAGAAAACGTTGATGCCGGTGAACGTGCAAAACAGGCTCTAGCGTTCGAACGCACTGATTTCGACCAGGTTCGTTCACTCATGGAAAATAGCGATCGCTGCCAGGATATACGTAATCTGGCATTTCTGGGGATTGCTTATAACACCCTGTTACGTATAGCCGAAATTGCCAGGATCAGGGTTAAAGATATCTCACGTACTGACGGTGGGAGAATGTTAATCCATATTGGCAGAACGAAAACGCTGGTTAGCACCGCAGGTGTAGAGAAGGCACTTAGCCTGGGGGTAACTAAACTGGTCGAGCGATGGATTTCCGTCTCTGGTGTAGCTGATGATCCGAATAACTACCTGTTTTGCCGGGTCAGAAAAAATGGTGTTGCCGCGCCATCTGCCACCAGCCAGCTATCAACTCGCGCCCTGGAAGGGATTTTTGAAGCAACTCATCGATTGATTTACGGCGCTAAGGATGACTCTGGTCAGAGATACCTGGCCTGGTCTGGACACAGTGCCCGTGTCGGAGCCGCGCGAGATATGGCCCGCGCTGGAGTTTCAATACCGGAGATCATGCAAGCTGGTGGCTGGACCAATGTAAATATTGTCATGAACTATATCCGTAACCTGGATAGTGAAACAGGGGCAATGGTGCGCCTGCTGCAAGATGGCGATTAG"},
    "39": {"id":"CX_lead","seq":"ATGACCATGATTACGAATTCCCGGGGATCC"},
    "40": {"id":"delta_U3","seq":"TGGAAGGGCTAATTCACTCCCAACGAAGACAAGATCTGCTTTTTGCTTGTACT"},
    "41": {"id":"EK","seq":"GATGACGACGACAAG"},
    "42": {"id":"EK","seq":"GATGACGATGACAAG"},
    "43": {"id":"Encap","seq":"GTGCGCCGGTGTACACAGGAAGTGACAATTTTCGCGCGGTTTTAGGCGGATGTTGTAGTAAATTTGGGCGTAACCGAGTAAGATTTGGCCATTTTCGCGGGAAAACTGAATAAGAGGAAGTGAAATCTGAATAATTTTGTGTTACTCAT"},
    "44": {"id":"FRT","seq":"GAAGTTCCTATTCCGAAGTTCCTATTCTCTAGAAAGTATAGGAACTTC"},
    "45": {"id":"gag","seq":"ATGGGCCCGGGCCAGACTGTTACCACTCCCTTAAGTTTGACCTTAGGTCACTGGAAAGATGTCGAGCGGATCGCTCACAACCAGTCGGTAGATGTCAAGAAGAGACGTTGGGTTACCTTCTGCTCTGCAGAATGGCCAACCTTTAACGTCGGATGGCCGCGAGACGGCACCTTTAACCGAGACCTCATCACCCAGGTTAAGATCAAGGTCTTTTCACCTGGCCCGCATGGACACCCAGACCAGGTCCCCTACATCGTGACCTGGGAAGCCTTGGCTTTTGACCCCCCTCCCTGGGTCAAGCCCTTTGTACACCCTAAGCCTCCGCCTCCTCTTCCTCCATCCGCCCCGTCTCTCCCCCTTGAACCTCCTCGTTCGACCCCGCCTCGATCCTCCCTTTATCCAGCCCTCACTCCTTCTCTAGGCGCCCCCATATGGCCATATGAGATCTTATATGGGGCACCCCCGCCCCTTGTAAACTTCCCTGACCCTGACATG"},
    "46": {"id":"HIV-1_5_LTR","seq":"GGGTCTCTCTGGTTAGACCAGATCTGAGCCTGGGAGCTCTCTGGCTAACTAGGGAACCCACTGCTTAAGCCTCAATAAAGCTTGCCTTGAGTGCTTCAAGTAGTGTGTGCCCGTCTGTTGTGTGACTCTGGTAACTAGAGATCCCTCAGACCCTTTTAGTCAGTGTGGAAAATCTCTAGCA"},
    "47": {"id":"HIV-1_psi_pack","seq":"TGAGTACGCCAAAAATTTTGACTAGCGGAGGCTAGAAGGAGAGAG"},
    "48": {"id":"HIV_Rev_NES","seq":"CTACCACCGCTTGAGAGACTTACTCTTGAT"},
    "49": {"id":"IgK_secretion","seq":"ATGGAGACAGACACACTCCTGCTATGGGTACTGCTGCTCTGGGTTCCAGGTTCCACTGGTGAC"},
    "50": {"id":"lacY","seq":"ATGTACTATTTAAAAAACACAAACTTTTGGATGTTCGGTTTATTCTTTTTCTTTTACTTTTTTATCATGGGAGCCTACTTCCCGTTTTTCCCGATTTGGCTACATGACATCAACCATATCAGCAAAAGTGATACGGGTATTATTTTTGCCGCTATTTCTCTGTTCTCGCTATTATTCCAACCGCTGTTTGGTCTGCTTTCTGA"},
    "51": {"id":"lacZ_a","seq":"TTCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGG"},
    "52": {"id":"LITR","seq":"CATCATCAATAATATACCTTATTTTGGATTGAAGCCAATATGATAATGAGGGGGTGGAGTTTGTGACGTGGCGCGGGGCGTGGGAACGGGGCGGGTGACGTAG"},
    "53": {"id":"loxH","seq":"ATTACCTCATATAGCATACATTATACGAAGTTAT"},
    "54": {"id":"loxP","seq":"ATAACTTCGTATAGCATACATTATACGAAGTTAT"},
    "55": {"id":"minicis","seq":"ATGTATCGATTAAATAAGGAGGAATAA"},
    "56": {"id":"modSV40_late_16s_int","seq":"GTAAGTTTAGTCTTTTTGTCTTTTATTTCAGGTCCCGGATCCGGTGGTGGTGCAAATCAAAGAACTGCTCCTCAGTGGATGTTGCCTTTACTTCTAG"},
    "57": {"id":"precision","seq":"CTGGAAGTTCTGTTCCAGGGG"},
    "58": {"id":"psi_plus_pack","seq":"CCAGCAACTTATCTGTGTCTGTCCGATTGTCTAGTGTCTATGTTTGATGTTATGCGCCTGCGTCTGTACTAGTTAGCTAACTAGCTCTGTATCTGGCGGACCCGTGGTGGAACTGACGAGTTCTGAACACCCGGCCGCAACCCTGGGAGACGTCCCAGGGACTTTGGGGGCCGTTTTTGTGGCCCGACCTGAGGAAGGGAGTCGATGTGGAATCCGACCCCGTCAGGATATGTGGTTCTGGTAGGAGACGAGAACCTAAAACAGTTCCCGCCTCCGTCTGAATTTTTGCTTTCGGTTTGGAACCGAAGCCGCGCGTCTTGTCTGCTGCAGCGCTGCAGCATCGTTCTGTGTTGTCTCTGTCTGACTGTGTTTCTGTATTTGTCTGAAAATTAGGGCCAGACTGTTACCACTCCCTTAAGTTTGACCTTAGGTCACTGGAAAGATGTCGAGCGGATCGCTCACAACCAGTCGGTAGATGTCAAGAAGAGACGTTGGGTTACCTTCTGCTCTGCAGAATGGCCAACCTTTAACGTCGGATGGCCGCGAGACGGCACCTTTAACCGAGACCTCATCACCCAGGTTAAGATCAAGGTCTTTTCACCTGGCCCGCATGGACACCCAGACCAGGTCCCCTACATCGTGACCTGGGAAGCCTTGGCTTTTGACCCCCCTCCCTGGGTCAAGCCCTTTGTACACCCTAAGCCTCCGCCTCCTCTTCCTCCATCCGCCCCGTCTCTCCCCCTTGAACCTCCTCGTTCGACCCCGCCTCGATCCTCCCTTTATCCAGCCCTCACTCCTTCTCTAGGCGCC"},
    "59": {"id":"psi_plus_pack2","seq":"TTGGGGGCTCGTCCGGGATCGGGAGACCCCTGCCCAGGGACCACCGACCCACCACCGGGAGGTAAGCTGGCCAGCAACTTATCTGTGTCTGTCCGATTGTCTAGTGTCTATGACTGATTTTATGCGCCTGCGTCGGTACTAGTTAGCTAACTAGCTCTGTATCTGGCGGACCCGTGGTGGAACTGACGAGTTCGGAACACCCGGCCGCAACCCTGGGAGACGTCCCAGGGACTTCGGGGGCCGTTTTTGTGGCCCGACCTGAGTCCAAAAATCCCGATCGTTTTGGACTCTTTGGTGCACCCCCCTTAGAGGAGGGATATGTGGTTCTGGTAGGAGACGAGAACCTAAAACAGTTCCCGCCTCCGTCTGAATTTTTGCTTTCGGTTTGGGACCGAAGCCGCGCCGCGCGTCTTGTCTGCTGCAGCATCGTTCTGTGTTGTCTCTGTCTGACTGTGTTTCTGTATTTGTCTGAAAATATGGGCCCGGGCCAGACTGTTACCACTCCCTTAAGTTTGACCTTAGGTCACTGGAAAGATGTCGAGCGGATCGCTCACAACCAGTCGGTAGATGTCAAGAAGAGACGTTGGGTTACCTTCTGCTCTGCAGAATGGCCAACCTTTAACGTCGGATGGCCGCGAGACGGCACCTTTAACCGAGACCTCATCACCCAGGTTAAGATCAAGGTCTTTTCACCTGGCCCGCATGGACACCCAGACCAGGTCCCCTACATCGTGACCTGGGAAGCCTTGGCTTTTGACCCCCCTCCCTGGGTCAAGCCCTTTGTACACCCTAAGCCTCCGCCTCCTCTTCCTCCATCCGCCCCGTCTCTCCCCCTTGAACCTCCTCGTTCGACCCCGCCTCGATCCTCCCTTTATCCAGCCCTCACTCCTTCTCTAGGCGCCCCCATATGGCCATATGAGATCTTATATGGGGCACCCCCGCCCCTTGTAAACTTCCCTGACCCTGACATGACAAGAGTTACTAACAGCCCCTCTCTCCAAGCTCACTTACAGGCTCTCTACTTAGTCCAGCACGAAGTCTGGAGACCTCTGGCGGCACGTACCAAGAACAACTGGACCGACCGGTGGTACCTCACCCTTACCGAGTCGGCGACACAGTGTGGGTCCGCCGACACCAGACTAAGAACCTAGAACCTCGCTGGAAAGGACCTTACACAGTCCTGCTGACCACCCCCACCGCCCTCAAAGTAGACGGCATCGCAGCTTGGATACACGCCGCCCACGTGAAGGCTGCCGACCCCGGGGGTGGACCATCCTCTAGACTGCC"},
    "60": {"id":"RITR","seq":"CTACGTCACCCGCCCCGTTCCCACGCCCCGCGCCACGTCACAAACTCCACCCCCTCATTATCATATTGGCTTCAATCCAAAATAAGGTATATTATTGATGATG"},
    "61": {"id":"ROP","seq":"GTGACCAAACAGGAAAAAACCGCCCTTAACATGGCCCGCTTTATCAGAAGCCAGACATTAACGCTTCTGGAGAAACTCAACGAGCTGGACGCGGATGAACAGGCAGACATCTGTGAATCGCTTCACGACCACGCTGATGAGCTTTACCGCAGCTGCCTCGCGCGTTTCGGTGATGACGGTGAAAACCTCTGA"},
    "62": {"id":"r_ORF1629","seq":"CGCCCGAAACCAGTACAATAGTTGAGGTGCCGACTGTGTTGCCTGAAAGAGACAATTTGAGCCTAAACCGCCGTCTGCATCACCGCCACCACCTCCGCCTCCGCCTCCGCCGCCAGCCCCGCCTGCGCCTCCACCGATGGTAGATTTATCATCAGCTCCACCACCGCCGCCATTAGTAGATTTGCCGTCTGAAATGTTACCACCGCCTGCACCATCGCTTTCTAACGTGTTGTCTGAATTAAAATCGGGCACAGTTAGATTGAAACCCGCCCAAAAACGCCCGCAATCAGAAATAATTCCAAAAAGCTCAACTACAAATTTGATCGCGGACGTGTTAGCCGACACAATTAATAGGCGTCGTGTGGCTATGGCAAAATCGTCTTCGGAAGCAACTTCTAACGACGAGGGTTGGGACGACGACGATAATCGGCCTAATAAAGCTAACACGCCCGATGTTAAATATGTCCAGGCTTTATTTAACGTGTTTACGTCGAGTCAATTGTACACTAACGACAGTGATGAAAGAAATACAAAAGCGCATAATATTTTGAACGACGTCGAACCTTTATTACAAAACAAAACACAAACGAATATCGACAAAGCTAGATTGCTGCTACAAGATTTGGCAAGTTTTGTGGCGTTGAGCGAAAATCCATTAGATAGTCCAGCCATCGGTTCGGAAAAACAACCCTTGTTTGAAACTAATCGAAACCTATTTTACAAATCTATTGAGGATTTAATATTTAAATTCAGATATAAAGACGCTGAAAATCATTTGATTTTCGCTCTAACATACCACCC"},
    "63": {"id":"sh_ble","seq":"ATGGCCAAGTTGACCAGTGCCGTTCCGGTGCTCACCGCGCGCGACGTCGCCGGAGCGGTCGAGTTCTGGACCGACCGGCTCGGGTTCTCCCGGGACTTCGTGGAGGACGACTTCGCCGGTGTGGTCCGGGACGACGTGACCCTGTTCATCAGCGCGGTCCAGGACCAGGTGGTGCCGGACAACACCCTGGCCTGGGTGTGGGTGCGCGGCCTGGACGAGCTGTACGCCGAGTGGTCGGAGGTCGTGTCCACGAACTTCCGGGACGCCTCCGGGCCGGCCATGACCGAGATCGGCGAGCAGCCGTGGGGGCGGGAGTTCGCCCTGCGCGACCCGGCCGGCAACTGCGTGCACTTCGTGGCCGAGGAGCAGGACTGA"},
    "64": {"id":"T7","seq":"TAATACGACTCACTATAGG"},
    "65": {"id":"SP6","seq":"ATTTAGGTGACACTATAG"},
    "66": {"id":"T3","seq":"ATTAACCCTCACTAAAGGG"},
    "67": {"id":"CMV","seq":"ACATTGATTATTGAGTAGTTATTAATAGTAATCAATTACGGGGTCATTAGTTCATAGCCCATATATGGAGTTCCGCGTTACATAACTTACGGTAAATGGCCCGCCTGGCTGACCGCCCAACGACCCCCGCCCATTGACGTCAATAATGACGTATGTTCCCATAGTAACGCCAATAGGGACTTTCCATTGACGTCAATGGGTGGAGTATTTACGGTAAACTGCCCACTTGGCAGTACATCAAGTGTATCATATGCCAAGTACGCCCCCTATTGACGTCAATGACGGTAAATGGCCCGCCTGGCATTATGCCCAGTACATGACCTTATGGGACTTTCCTACTTGGCAGTACATCTACGGTTAGTCATCGCTATTACCATAGTGATGCGGTTTTGGCAGTACATCAATGGGCGTGGATAGCGGTTTGACTCACGGGGATTTCCAAGTCTCCACCCCATTGACGTCAATGGGAGTTTGTTTTGGCACCAAAATCAACGGGACTTTCCAAAATGTCGTAACAACTCCGCCCCATTGACGCAAATGGGCGGTAGGCGTGTACGGTGGGAGGTCTATATAAGCAGAGCTTTCTGGCTAACTAGAGAACCCACTGCTTACTGGC"},

}

},{}],3:[function(require,module,exports){
var restriction_emzymes = require('./restriction_emzymes.json');
var selection_markers = require('./selection_markers.json');
var features = require('./features.json');
var tags = require('./tags.json');
var alignFun = require('./alignment.js');

onmessage = function(e) {

    var res = getResults(e.data.generalFeaturesCbox, e.data.restriction_emzymesCbox, e.data.selection_markersCbox, e.data.tagsCbox, e.data.target, [e.data.ms, e.data.mms], [e.data.gapo, e.data.gape]);
    postMessage(res);
}

function getResults(generalFeaturesCbox, restriction_emzymesCbox, selection_markersCbox, tagsCbox, target, [ms, mms], [gapo, gape]) {

    var reversedTarget = getOppositeStrand(target);
    var featuresData = [];

    if (generalFeaturesCbox) {

        var generalFeaturesData = getData(features, target, false, [ms, mms], [gapo, gape]);
        var generalFeaturesDataReversedTarget = getData(features, reversedTarget, true, [ms, mms], [gapo, gape]);

        for (var i = 0; i < generalFeaturesData.length; i++) {
            featuresData.push(generalFeaturesData[i]);
        }

        for (var i = 0; i < generalFeaturesDataReversedTarget.length; i++) {
            featuresData.push(generalFeaturesDataReversedTarget[i]);
        }
    }

    if (restriction_emzymesCbox) {

        var restriction_emzymesData = getData(restriction_emzymes, target, false, [ms, mms], [gapo, gape]);

        for (var i = 0; i < restriction_emzymesData.length; i++) {
            featuresData.push(restriction_emzymesData[i]);
        }
    }

    if (selection_markersCbox) {
        var selection_markersData = getData(selection_markers, target, false, [ms, mms], [gapo, gape]);
        var selection_markersDataReversedTarget = getData(selection_markers, reversedTarget, true, [ms, mms], [gapo, gape]);

        for (var i = 0; i < selection_markersData.length; i++) {
            featuresData.push(selection_markersData[i]);
        }
        for (var i = 0; i < selection_markersDataReversedTarget.length; i++) {
            featuresData.push(selection_markersDataReversedTarget[i]);
        }
    }

    if (tagsCbox) {
        var tagsData = getData(tags, target, false, [ms, mms], [gapo, gape]);
        var tagsDataReversedTarget = getData(tags, reversedTarget, true, [ms, mms], [gapo, gape]);

        for (var i = 0; i < tagsData.length; i++) {
            featuresData.push(tagsData[i]);
        }
        for (var i = 0; i < tagsDataReversedTarget.length; i++) {
            featuresData.push(tagsDataReversedTarget[i]);
        }
    }
    return featuresData;

}


function getData(features, target, reversed, [ms, mms], [gapo, gape]) {

    var f;
    var tempData = []
    for (var feature in features) {

        if (features[feature].seq.length > 30) {

            f = do_align(features[feature].seq, target, [ms, mms], [gapo, gape]);

            var end = f[1] + f[3];

            while (end <= target.length + f[1]) {

                tempData.push({
                    reversed: reversed,
                    id: features[feature].id,
                    fullLength: target.length,
                    featureLength: f[1],
                    cigar: f[2],
                    start: f[3],
                    score: f[4]
                });

                f = do_align(features[feature].seq, target.slice(end), [ms, mms], [gapo, gape]);

                if (f == null) {

                    break;
                }

                f[3] += end;

                end = f[3] + f[1];
            }
        } else {

            var indexOfFeature = [];

            indexOfFeature.push(getIndices(target, features[feature].seq));

            if (indexOfFeature[0].length >= 1 && indexOfFeature[0].length <= 2) {

                for (var i = 0; indexOfFeature[0][i]; i++) {

                    tempData.push({
                        reversed: reversed,
                        fullLength: target.length,
                        id: features[feature].id,
                        featureLength: features[feature].seq.length,
                        start: indexOfFeature[0][i],
                        cigar: '',
                        score: features[feature].seq.length

                    })
                }
            }
        }
    }
    return tempData;
}

function getIndices(sequence, feature) {

    sequence = sequence.concat(sequence.slice(0, feature.length));
    var indices = [];
    var index = sequence.indexOf(feature);
    var prev = 0;

    while (index > -1) {

       indices.push(index + prev);
       prev += index + feature.length;
       sequence = sequence.slice(index + feature.length);
       index = sequence.indexOf(feature);

    }

    return indices;
}

function do_align(query, target, [ms, mms], [gapo, gape]) {

	var is_local = true;

	var rst = alignFun.bsa_align(is_local, target, query, [ms, mms], [gapo, gape]);
    if (!rst) {
        return rst;
    }

	var str = 'score: ' + rst[0] + '\n';
	str += 'start: ' + rst[1] + '\n';
	str += 'cigar: ' + alignFun.bsa_cigar2str(rst[2]) + '\n\n';


    var length = target.length;
    var featureLength = query.length;
    var score = parseInt(rst[0] + '\n', 10);
    var start = parseInt(rst[1] + '\n', 10);
    var cigar = alignFun.bsa_cigar2str(rst[2]) + '\n\n';

    return [length, featureLength, cigar, start, score];
}

function getOppositeStrand(sequence) {
    var oppStrand = '';

    for (var i = 0; i < sequence.length; i++) {
        switch(sequence[i]) {
            case 'C':
            oppStrand += 'G';
            break;
            case 'T':
            oppStrand += 'A';
            break;
            case 'A':
            oppStrand += 'T';
            break;
            case 'G':
            oppStrand += 'C';
            default:
            break;
        }
    }

    oppStrand = oppStrand.split('').reverse().join('');
    return oppStrand;
}

},{"./alignment.js":1,"./features.json":2,"./restriction_emzymes.json":6,"./selection_markers.json":7,"./tags.json":8}],4:[function(require,module,exports){
var work = require('webworkify');
var viz = require('./visualization.js');

var templates = document.querySelectorAll('script[type="text/handlebars"]');
Handlebars.templates = Handlebars.templates || {};
Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var $b = $('#button');
var results = $('#results');
var noSelection = $('#noSelection');

$b.on('click', function(){

    var time_start = new Date().getTime();
    var generalFeaturesCbox = document.getElementById('cbox1').checked;
    var restriction_emzymesCbox = document.getElementById('cbox2').checked;
    var tagsCbox = document.getElementById('cbox3').checked;
    var selection_markersCbox = document.getElementById('cbox4').checked;
    var ms   = parseInt(document.getElementById('match').value);
    var mms  = parseInt(document.getElementById('mismatch').value);
    var gapo = parseInt(document.getElementById('gapo').value);
    var gape = parseInt(document.getElementById('gape').value);
    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');

    if (generalFeaturesCbox == false && restriction_emzymesCbox == false && tagsCbox == false && selection_markersCbox == false) {
        noSelection.html(Handlebars.templates.noSel({
            selectionError: 'choose some features'
        }));

        return;
    }

    var message = {
        generalFeaturesCbox: generalFeaturesCbox,
        restriction_emzymesCbox: restriction_emzymesCbox,
        tagsCbox: tagsCbox,
        selection_markersCbox: selection_markersCbox,
        ms: ms,
        mms: mms,
        gapo: gapo,
        gape: gape,
        target: target
    }

    var worker = work(require('./getResultsFunction.js'));
    $(".loader").css("visibility", "visible");
    worker.postMessage(message); // send the worker a message

    worker.onmessage = function(e) {

        var visualized = viz.visualize(e.data);

        $("#visualizedText").css("visibility", "visible");
        results.html(Handlebars.templates.mapRes({
            featuresDescription: visualized
        }));
        $(".loader").css("visibility", "hidden");
        var elapse = (new Date().getTime() - time_start) / 1000.0;
        document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

    }

});

},{"./getResultsFunction.js":3,"./visualization.js":9,"webworkify":5}],5:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}],6:[function(require,module,exports){
module.exports={
    "1": {"id":"AsiSI","seq":"GCGATCGC"},
    "2": {"id":"BspDI","seq":"ATCGAT"},
    "3": {"id":"BstZI","seq":"CGGCCG"},
    "4": {"id":"SacII","seq":"CCGCGG"},
    "5": {"id":"CspI","seq":"CGGWCCG"},
    "6": {"id":"TspI","seq":"GTSAC"},
    "7": {"id":"BspI","seq":"CTGCAG"},
    "8": {"id":"AcyI","seq":"GRCGYC"},
    "9": {"id":"AhlI","seq":"ACTAGT"},
    "10": {"id":"SauI","seq":"GGNCC"},
    "11": {"id":"TaqI","seq":"TCGA"},
    "12": {"id":"SseBI","seq":"AGGCCT"},
    "13": {"id":"EaeI","seq":"YGGCCR"},
    "14": {"id":"PspLI","seq":"CGTACG"},
    "15": {"id":"HpyI","seq":"CGWCG"},
    "16": {"id":"VneI","seq":"GTGCAC"},
    "17": {"id":"AspHI","seq":"GWGCWC"},
    "18": {"id":"PspOMI","seq":"GGGCCC"},
    "19": {"id":"HinfI","seq":"GANTC"},
    "20": {"id":"AccII","seq":"CGCG"},
    "21": {"id":"PmeI","seq":"GTTTAAAC"},
    "22": {"id":"TasI","seq":"AATT"},
    "23": {"id":"BstSCI","seq":"CCNGG"},
    "24": {"id":"BstACI","seq":"GRCGYC"},
    "25": {"id":"EcoTI","seq":"ATGCAT"},
    "26": {"id":"PspCI","seq":"CACGTG"},
    "27": {"id":"SpaHI","seq":"GCATGC"},
    "28": {"id":"EcoRI","seq":"GAATTC"},
    "29": {"id":"FspI","seq":"TGCGCA"},
    "30": {"id":"HpyCHIII","seq":"ACNGT"},
    "31": {"id":"BstBAI","seq":"YACGTR"},
    "32": {"id":"PspII","seq":"RGGWCCY"},
    "33": {"id":"PspPPI","seq":"RGGWCCY"},
    "34": {"id":"PciI","seq":"ACATGT"},
    "35": {"id":"TliI","seq":"CTCGAG"},
    "36": {"id":"PflMI","seq":"CCANNNNNTGG"},
    "37": {"id":"HindII","seq":"GTYRAC"},
    "38": {"id":"BspLUI","seq":"ACATGT"},
    "39": {"id":"ScrFI","seq":"CCNGG"},
    "40": {"id":"EcoI","seq":"GGWCC"},
    "41": {"id":"NcoI","seq":"CCATGG"},
    "42": {"id":"BspI","seq":"GCTNAGC"},
    "43": {"id":"SwaI","seq":"ATTTAAAT"},
    "44": {"id":"BstKTI","seq":"GATC"},
    "45": {"id":"NspV","seq":"TTCGAA"},
    "46": {"id":"TscI","seq":"ACGT"},
    "47": {"id":"BspI","seq":"GGGCCC"},
    "50": {"id":"BsrGI","seq":"TGTACA"},
    "51": {"id":"EcoI","seq":"CGGCCG"},
    "52": {"id":"MluNI","seq":"TGGCCA"},
    "53": {"id":"AseI","seq":"ATTAAT"},
    "54": {"id":"AsuNHI","seq":"GCTAGC"},
    "55": {"id":"EcoI","seq":"GGTNACC"},
    "56": {"id":"EcoOI","seq":"GGTNACC"},
    "57": {"id":"AvrII","seq":"CCTAGG"},
    "58": {"id":"SauAI","seq":"GATC"},
    "59": {"id":"ZraI","seq":"GACGTC"},
    "60": {"id":"TruI","seq":"TTAA"},
    "61": {"id":"CfoI","seq":"GCGC"},
    "62": {"id":"EamI","seq":"GACNNNNNGTC"},
    "63": {"id":"BspTI","seq":"GGYRCC"},
    "64": {"id":"BanIII","seq":"ATCGAT"},
    "65": {"id":"MaeII","seq":"ACGT"},
    "66": {"id":"AflII","seq":"CTTAAG"},
    "67": {"id":"FspBI","seq":"CTAG"},
    "68": {"id":"HspAI","seq":"GCGC"},
    "69": {"id":"PstI","seq":"CTGCAG"},
    "70": {"id":"SatI","seq":"GCNGC"},
    "71": {"id":"PpuMI","seq":"RGGWCCY"},
    "72": {"id":"KasI","seq":"GGCGCC"},
    "73": {"id":"BpuI","seq":"GCTNAGC"},
    "74": {"id":"CspI","seq":"TTCGAA"},
    "75": {"id":"MspCI","seq":"CTTAAG"},
    "76": {"id":"MvaI","seq":"CCWGG"},
    "77": {"id":"HpaII","seq":"CCGG"},
    "78": {"id":"BsoBI","seq":"CYCGRG"},
    "79": {"id":"AccI","seq":"GTMKAC"},
    "80": {"id":"EcoRII","seq":"CCWGG"},
    "81": {"id":"SfrI","seq":"CTCGAG"},
    "82": {"id":"PinAI","seq":"ACCGGT"},
    "83": {"id":"HpyFVI","seq":"GCNNNNNNNGC"},
    "84": {"id":"BseDI","seq":"CCNNGG"},
    "85": {"id":"MphI","seq":"ATGCAT"},
    "86": {"id":"AspI","seq":"GGTACC"},
    "87": {"id":"BsaJI","seq":"CCNNGG"},
    "88": {"id":"DraI","seq":"TTTAAA"},
    "89": {"id":"EcoI","seq":"GRGCYC"},
    "90": {"id":"NheI","seq":"GCTAGC"},
    "91": {"id":"BstPAI","seq":"GACNNNNGTC"},
    "92": {"id":"NarI","seq":"GGCGCC"},
    "93": {"id":"BsePI","seq":"GCGCGC"},
    "94": {"id":"SfuI","seq":"TTCGAA"},
    "95": {"id":"EcoTI","seq":"CCWWGG"},
    "96": {"id":"PspPI","seq":"GGNCC"},
    "97": {"id":"SdaI","seq":"CCTGCAGG"},
    "98": {"id":"XagI","seq":"CCTNNNNNAGG"},
    "99": {"id":"AatI","seq":"AGGCCT"},
    "100": {"id":"PflII","seq":"CGTACG"},
    "101": {"id":"CaiI","seq":"CAGNNNCTG"},
    "102": {"id":"MlyI","seq":"GGCGCC"},
    "103": {"id":"BspEI","seq":"TCCGGA"},
    "104": {"id":"AspEI","seq":"GACNNNNNGTC"},
    "105": {"id":"MflI","seq":"RGATCY"},
    "106": {"id":"BstENI","seq":"CCTNNNNNAGG"},
    "107": {"id":"BstXI","seq":"RGATCY"},
    "108": {"id":"BseLI","seq":"CCNNNNNNNGG"},
    "109": {"id":"HpyI","seq":"GTNNAC"},
    "110": {"id":"BspHI","seq":"TCATGA"},
    "111": {"id":"AorHI","seq":"AGCGCT"},
    "112": {"id":"SstI","seq":"GAGCTC"},
    "113": {"id":"BamHI","seq":"GGATCC"},
    "114": {"id":"CfrI","seq":"CCGCGG"},
    "115": {"id":"XbaI","seq":"TCTAGA"},
    "116": {"id":"PshBI","seq":"ATTAAT"},
    "117": {"id":"AflIII","seq":"ACRYGT"},
    "118": {"id":"BfrBI","seq":"ATGCAT"},
    "119": {"id":"SunI","seq":"CGTACG"},
    "120": {"id":"ApaLI","seq":"GTGCAC"},
    "121": {"id":"HincII","seq":"GTYRAC"},
    "122": {"id":"BstCI","seq":"GCNNGC"},
    "123": {"id":"BstOI","seq":"CCWGG"},
    "124": {"id":"AsuCI","seq":"CCSGG"},
    "125": {"id":"XmaI","seq":"CCCGGG"},
    "126": {"id":"BshFI","seq":"GGCC"},
    "127": {"id":"KpnI","seq":"GGTACC"},
    "128": {"id":"PspAI","seq":"CCCGGG"},
    "129": {"id":"MroI","seq":"TCCGGA"},
    "130": {"id":"EcoI","seq":"AGGCCT"},
    "131": {"id":"PleI","seq":"CGATCG"},
    "132": {"id":"BseJI","seq":"GATNNNNATC"},
    "133": {"id":"BcnI","seq":"CCSGG"},
    "134": {"id":"PsyI","seq":"GACNNNGTC"},
    "135": {"id":"AvaII","seq":"GGWCC"},
    "136": {"id":"EcoI","seq":"CCWWGG"},
    "137": {"id":"PspNI","seq":"GGNNCC"},
    "138": {"id":"AmaI","seq":"CYCGRG"},
    "139": {"id":"XmaCI","seq":"CCCGGG"},
    "140": {"id":"BlpI","seq":"GCTNAGC"},
    "141": {"id":"BoxI","seq":"GACNNNNGTC"},
    "142": {"id":"SgfI","seq":"GCGATCGC"},
    "143": {"id":"AluI","seq":"AGCT"},
    "144": {"id":"BfuCI","seq":"GATC"},
    "145": {"id":"BsaI","seq":"ATCGAT"},
    "146": {"id":"BssECI","seq":"CCNNGG"},
    "147": {"id":"CpoI","seq":"CGGWCCG"},
    "148": {"id":"PspI","seq":"AACGTT"},
    "149": {"id":"BanI","seq":"GGYRCC"},
    "150": {"id":"HaeII","seq":"RGCGCY"},
    "151": {"id":"BstAUI","seq":"TGTACA"},
    "152": {"id":"BshTI","seq":"ACCGGT"},
    "153": {"id":"EgeI","seq":"GGCGCC"},
    "154": {"id":"NmuCI","seq":"GTSAC"},
    "155": {"id":"BstSFI","seq":"CTRYAG"},
    "156": {"id":"BspI","seq":"ATCGAT"},
    "157": {"id":"AlwI","seq":"GGATC"},
    "158": {"id":"MaeI","seq":"CTAG"},
    "159": {"id":"CelII","seq":"GCTNAGC"},
    "160": {"id":"RcaI","seq":"TCATGA"},
    "161": {"id":"BspI","seq":"TGTACA"},
    "162": {"id":"HinI","seq":"GCGC"},
    "163": {"id":"MssI","seq":"GTTTAAAC"},
    "164": {"id":"BsuI","seq":"ATCGAT"},
    "165": {"id":"BscI","seq":"CCNNNNNNNGG"},
    "166": {"id":"KspAI","seq":"GTTAAC"},
    "167": {"id":"ItaI","seq":"GCNGC"},
    "168": {"id":"PflBI","seq":"CCANNNNNTGG"},
    "169": {"id":"HaeIII","seq":"GGCC"},
    "170": {"id":"NdeII","seq":"GATC"},
    "171": {"id":"NotI","seq":"GCGGCCGC"},
    "172": {"id":"FriOI","seq":"GRGCYC"},
    "173": {"id":"AhdI","seq":"GACNNNNNGTC"},
    "174": {"id":"BstMWI","seq":"GCNNNNNNNGC"},
    "175": {"id":"KzoI","seq":"GATC"},
    "176": {"id":"BssNAI","seq":"GTATAC"},
    "177": {"id":"SinI","seq":"GGWCC"},
    "178": {"id":"AjnI","seq":"CCWGG"},
    "179": {"id":"MabI","seq":"ACCWGGT"},
    "180": {"id":"DdeI","seq":"CTNAG"},
    "181": {"id":"AspI","seq":"GACNNNGTC"},
    "182": {"id":"BmeI","seq":"GGWCC"},
    "183": {"id":"ScaI","seq":"AGTACT"},
    "184": {"id":"BspI","seq":"GDGCHC"},
    "185": {"id":"TaiI","seq":"ACGT"},
    "186": {"id":"BspI","seq":"TCCGGA"},
    "187": {"id":"BclI","seq":"TGATCA"},
    "188": {"id":"TfiI","seq":"GAWTC"},
    "189": {"id":"BstFNI","seq":"CGCG"},
    "190": {"id":"OliI","seq":"CACNNNNGTG"},
    "191": {"id":"SmiI","seq":"ATTTAAAT"},
    "192": {"id":"SgrAI","seq":"CRCCGGYG"},
    "193": {"id":"PspBI","seq":"GAGCTC"},
    "194": {"id":"XceI","seq":"RCATGY"},
    "195": {"id":"MvnI","seq":"CGCG"},
    "196": {"id":"BsiSI","seq":"CCGG"},
    "197": {"id":"ZspI","seq":"ATGCAT"},
    "198": {"id":"BseXI","seq":"CGGCCG"},
    "199": {"id":"AseII","seq":"CCSGG"},
    "201": {"id":"MspRI","seq":"CCNGG"},
    "202": {"id":"SacI","seq":"GAGCTC"},
    "203": {"id":"TthI","seq":"GACNNNGTC"},
    "204": {"id":"AlwI","seq":"GTGCAC"},
    "205": {"id":"EcoOI","seq":"RGGNCCY"},
    "206": {"id":"MboI","seq":"GATC"},
    "207": {"id":"VhaI","seq":"CTTAAG"},
    "208": {"id":"NlaIII","seq":"CATG"},
    "209": {"id":"CspAI","seq":"ACCGGT"},
    "210": {"id":"FunII","seq":"GAATTC"},
    "211": {"id":"MamI","seq":"GATNNNNATC"},
    "212": {"id":"SspBI","seq":"TGTACA"},
    "213": {"id":"BsiHKAI","seq":"GWGCWC"},
    "214": {"id":"BmeI","seq":"GKGCMC"},
    "215": {"id":"BseBI","seq":"CCWGG"},
    "216": {"id":"SalI","seq":"GTCGAC"},
    "217": {"id":"VanI","seq":"CCANNNNNTGG"},
    "218": {"id":"ApeKI","seq":"GCWGC"},
    "219": {"id":"MspAI","seq":"CMGCKG"},
    "220": {"id":"MwoI","seq":"GCNNNNNNNGC"},
    "221": {"id":"SphI","seq":"GCATGC"},
    "222": {"id":"BseSI","seq":"GKGCMC"},
    "223": {"id":"NlaIV","seq":"GGNNCC"},
    "224": {"id":"BspI","seq":"GATC"},
    "225": {"id":"AccBI","seq":"GGYRCC"},
    "226": {"id":"KpnI","seq":"TCCGGA"},
    "227": {"id":"CfrI","seq":"CCCGGG"},
    "228": {"id":"BssTI","seq":"CCWWGG"},
    "229": {"id":"PceI","seq":"AGGCCT"},
    "230": {"id":"DseDI","seq":"GACNNNNNNGTC"},
    "231": {"id":"BpuI","seq":"TTCGAA"},
    "232": {"id":"BstCI","seq":"ACNGT"},
    "233": {"id":"EagI","seq":"CGGCCG"},
    "234": {"id":"ErhI","seq":"CCWWGG"},
    "235": {"id":"AleI","seq":"CACNNNNGTG"},
    "236": {"id":"HinI","seq":"GRCGYC"},
    "237": {"id":"XmnI","seq":"GAANNNNTTC"},
    "238": {"id":"BstMBI","seq":"GATC"},
    "239": {"id":"TelI","seq":"GACNNNGTC"},
    "240": {"id":"BstYI","seq":"RGATCY"},
    "241": {"id":"MfeI","seq":"CAATTG"},
    "242": {"id":"PmaCI","seq":"CACGTG"},
    "243": {"id":"AlwI","seq":"GWGCWC"},
    "244": {"id":"BseI","seq":"GATNNNNATC"},
    "245": {"id":"NdeI","seq":"CATATG"},
    "246": {"id":"PdiI","seq":"GCCGGC"},
    "247": {"id":"BmeI","seq":"CCNGG"},
    "248": {"id":"VpaKBI","seq":"GGWCC"},
    "249": {"id":"BstDSI","seq":"CCRYGG"},
    "250": {"id":"BspII","seq":"RGCGCY"},
    "251": {"id":"DrdI","seq":"GACNNNNNNGTC"},
    "252": {"id":"HpyIII","seq":"TCNNGA"},
    "253": {"id":"AvaI","seq":"CYCGRG"},
    "254": {"id":"AatII","seq":"GACGTC"},
    "255": {"id":"BspI","seq":"TCGCGA"},
    "256": {"id":"BstEII","seq":"GGTNACC"},
    "257": {"id":"ApaI","seq":"GGGCCC"},
    "258": {"id":"AasI","seq":"GACNNNNNNGTC"},
    "259": {"id":"AxyI","seq":"CCTNAGG"},
    "260": {"id":"TseI","seq":"GCWGC"},
    "261": {"id":"CviAII","seq":"CATG"},
    "262": {"id":"BssAI","seq":"RCCGGY"},
    "263": {"id":"ApoI","seq":"RAATTY"},
    "264": {"id":"BcuI","seq":"ACTAGT"},
    "265": {"id":"BseI","seq":"CCTNAGG"},
    "266": {"id":"SexAI","seq":"ACCWGGT"},
    "267": {"id":"TauI","seq":"GCSGC"},
    "268": {"id":"BsaBI","seq":"GATNNNNATC"},
    "269": {"id":"NaeI","seq":"GCCGGC"},
    "270": {"id":"AccBI","seq":"CCANNNNNTGG"},
    "271": {"id":"EcoI","seq":"CCTNAGG"},
    "272": {"id":"BsuTUI","seq":"ATCGAT"},
    "273": {"id":"BssKI","seq":"CCNGG"},
    "274": {"id":"BtgI","seq":"CCRYGG"},
    "275": {"id":"BstDEI","seq":"CTNAG"},
    "276": {"id":"HspII","seq":"CATG"},
    "277": {"id":"PaeRI","seq":"CTCGAG"},
    "278": {"id":"MunI","seq":"CAATTG"},
    "279": {"id":"BsiWI","seq":"CGTACG"},
    "280": {"id":"BstUI","seq":"CGCG"},
    "281": {"id":"EcoI","seq":"CYCGRG"},
    "282": {"id":"DpnII","seq":"GATC"},
    "283": {"id":"MhlI","seq":"GDGCHC"},
    "284": {"id":"BshI","seq":"CGRYCG"},
    "285": {"id":"BalI","seq":"TGGCCA"},
    "286": {"id":"NciI","seq":"CCSGG"},
    "287": {"id":"BspI","seq":"TTCGAA"},
    "288": {"id":"FnuHI","seq":"GCNGC"},
    "289": {"id":"BsrFI","seq":"RCCGGY"},
    "290": {"id":"EclXI","seq":"CGGCCG"},
    "291": {"id":"StyDI","seq":"CCNGG"},
    "292": {"id":"FunI","seq":"AGCGCT"},
    "293": {"id":"BseCI","seq":"ATCGAT"},
    "294": {"id":"AccI","seq":"TGCGCA"},
    "295": {"id":"AspLEI","seq":"GCGC"},
    "296": {"id":"AvrI","seq":"CYCGRG"},
    "297": {"id":"BspTI","seq":"TTCGAA"},
    "298": {"id":"PagI","seq":"TCATGA"},
    "299": {"id":"BseAI","seq":"TCCGGA"},
    "301": {"id":"RsrII","seq":"CGGWCCG"},
    "302": {"id":"KspI","seq":"TGATCA"},
    "303": {"id":"PdmI","seq":"GAANNNNTTC"},
    "304": {"id":"FbaI","seq":"TGATCA"},
    "305": {"id":"StuI","seq":"AGGCCT"},
    "306": {"id":"PfeI","seq":"GAWTC"},
    "307": {"id":"ZhoI","seq":"ATCGAT"},
    "308": {"id":"PmlI","seq":"CACGTG"},
    "309": {"id":"BshNI","seq":"GGYRCC"},
    "310": {"id":"EclHKI","seq":"GACNNNNNGTC"},
    "311": {"id":"CciNI","seq":"GCGGCCGC"},
    "312": {"id":"PspI","seq":"CCWGG"},
    "313": {"id":"BbeI","seq":"GGCGCC"},
    "314": {"id":"PspEI","seq":"GGTNACC"},
    "315": {"id":"AsiI","seq":"GGATCC"},
    "316": {"id":"AlwNI","seq":"CAGNNNCTG"},
    "317": {"id":"HapII","seq":"CCGG"},
    "318": {"id":"XmiI","seq":"GTMKAC"},
    "319": {"id":"BseI","seq":"RCCGGY"},
    "320": {"id":"SmiMI","seq":"CAYNNNNRTG"},
    "321": {"id":"BsuI","seq":"CCTNAGG"},
    "322": {"id":"NruI","seq":"TCGCGA"},
    "323": {"id":"HpyCHV","seq":"TGCA"},
    "324": {"id":"MroXI","seq":"GAANNNNTTC"},
    "325": {"id":"AfeI","seq":"AGCGCT"},
    "326": {"id":"HindIII","seq":"AAGCTT"},
    "327": {"id":"PspGI","seq":"CCWGG"},
    "328": {"id":"CviTI","seq":"RGCY"},
    "329": {"id":"BfmI","seq":"CTRYAG"},
    "330": {"id":"HpaI","seq":"GTTAAC"},
    "331": {"id":"BmyI","seq":"GDGCHC"},
    "332": {"id":"SmaI","seq":"CCCGGG"},
    "333": {"id":"AsiAI","seq":"ACCGGT"},
    "334": {"id":"BstAPI","seq":"GCANNNNNTGC"},
    "335": {"id":"CfrI","seq":"GGNCC"},
    "336": {"id":"CviJI","seq":"RGCY"},
    "337": {"id":"BstBI","seq":"TTCGAA"},
    "338": {"id":"DpnI","seq":"GATC"},
    "339": {"id":"BssHII","seq":"GCGCGC"},
    "340": {"id":"ClaI","seq":"ATCGAT"},
    "341": {"id":"BstI","seq":"GTATAC"},
    "342": {"id":"BanII","seq":"GRGCYC"},
    "343": {"id":"SfcI","seq":"CTRYAG"},
    "344": {"id":"PshAI","seq":"GACNNNNGTC"},
    "345": {"id":"PsuI","seq":"RGATCY"},
    "346": {"id":"RsrI","seq":"CGGWCCG"},
    "347": {"id":"BstMCI","seq":"CGRYCG"},
    "348": {"id":"EcoTI","seq":"GRGCYC"},
    "349": {"id":"MslI","seq":"CAYNNNNRTG"},
    "350": {"id":"SgrBI","seq":"CCGCGG"},
    "351": {"id":"BsiHKCI","seq":"CYCGRG"},
    "352": {"id":"BstXI","seq":"CCANNNNNNTGG"},
    "353": {"id":"AdeI","seq":"CACNNNGTG"},
    "354": {"id":"BsiEI","seq":"CGRYCG"},
    "355": {"id":"XhoII","seq":"RGATCY"},
    "356": {"id":"AfaI","seq":"GTAC"},
    "357": {"id":"MspI","seq":"TGGCCA"},
    "358": {"id":"NspI","seq":"RCATGY"},
    "359": {"id":"PvuII","seq":"CAGCTG"},
    "360": {"id":"BssHI","seq":"CTCGAG"},
    "361": {"id":"AclI","seq":"AACGTT"},
    "362": {"id":"SlaI","seq":"CTCGAG"},
    "363": {"id":"SduI","seq":"GDGCHC"},
    "364": {"id":"BfaI","seq":"CTAG"},
    "365": {"id":"BspI","seq":"GACNNNNNNTGG"},
    "366": {"id":"CacI","seq":"GCNNGC"},
    "367": {"id":"TaaI","seq":"ACNGT"},
    "368": {"id":"PflFI","seq":"GACNNNGTC"},
    "369": {"id":"PpuXI","seq":"RGGWCCY"},
    "370": {"id":"PvuI","seq":"CGATCG"},
    "371": {"id":"DraII","seq":"RGGNCCY"},
    "372": {"id":"SnaBI","seq":"TACGTA"},
    "373": {"id":"MlsI","seq":"TGGCCA"},
    "374": {"id":"RsaI","seq":"GTAC"},
    "375": {"id":"XapI","seq":"RAATTY"},
    "376": {"id":"AspI","seq":"GAANNNNTTC"},
    "377": {"id":"CviRI","seq":"TGCA"},
    "378": {"id":"EcoRV","seq":"GATATC"},
    "379": {"id":"XhoI","seq":"CTCGAG"},
    "380": {"id":"SseI","seq":"CCTGCAGG"},
    "381": {"id":"EcoI","seq":"TACGTA"},
    "382": {"id":"NspIII","seq":"CYCGRG"},
    "383": {"id":"BsaWI","seq":"WCCGGW"},
    "384": {"id":"EclII","seq":"GAGCTC"},
    "385": {"id":"MluI","seq":"ACGCGT"},
    "386": {"id":"BstPI","seq":"GGTNACC"},
    "387": {"id":"BsiYI","seq":"CCNNNNNNNGG"},
    "388": {"id":"MroNI","seq":"GCCGGC"},
    "389": {"id":"MscI","seq":"TGGCCA"},
    "390": {"id":"PalI","seq":"GGCC"},
    "391": {"id":"XspI","seq":"CTAG"},
    "392": {"id":"FblI","seq":"GTMKAC"},
    "393": {"id":"SpeI","seq":"ACTAGT"},
    "394": {"id":"HinPI","seq":"GCGC"},
    "395": {"id":"PhoI","seq":"GGCC"},
    "396": {"id":"XmaJI","seq":"CCTAGG"},
    "397": {"id":"HspI","seq":"GRCGYC"},
    "398": {"id":"BstNSI","seq":"RCATGY"},
    "399": {"id":"FauNDI","seq":"CATATG"},
    "401": {"id":"AspSI","seq":"GGNCC"},
    "402": {"id":"CfrI","seq":"RCCGGY"},
    "403": {"id":"MseI","seq":"TTAA"},
    "404": {"id":"PspDI","seq":"TCGCGA"},
    "405": {"id":"BlnI","seq":"CCTAGG"},
    "406": {"id":"BspXI","seq":"ATCGAT"},
    "407": {"id":"NsiI","seq":"ATGCAT"},
    "408": {"id":"FspHI","seq":"GCNGC"},
    "409": {"id":"PauI","seq":"GCGCGC"},
    "410": {"id":"DriI","seq":"GACNNNNNGTC"},
    "411": {"id":"SfiI","seq":"GGCCNNNNNGGCC"},
    "412": {"id":"BstHHI","seq":"GCGC"},
    "413": {"id":"BglI","seq":"GCCNNNNNGGC"},
    "414": {"id":"SfoI","seq":"GGCGCC"},
    "415": {"id":"PaeI","seq":"GCATGC"},
    "416": {"id":"BshI","seq":"CGCG"},
    "417": {"id":"BstI","seq":"CTTAAG"},
    "418": {"id":"SbfI","seq":"CCTGCAGG"},
    "419": {"id":"BbvI","seq":"GWGCWC"},
    "420": {"id":"EcoIII","seq":"AGCGCT"},
    "421": {"id":"EcoNI","seq":"CCTNNNNNAGG"},
    "422": {"id":"AccIII","seq":"TCCGGA"},
    "423": {"id":"SfrI","seq":"CCGCGG"},
    "424": {"id":"TspI","seq":"AATT"},
    "425": {"id":"NgoMIV","seq":"GCCGGC"},
    "426": {"id":"BbrPI","seq":"CACGTG"},
    "427": {"id":"HpyCHIV","seq":"ACGT"},
    "428": {"id":"AccI","seq":"GGTACC"},
    "429": {"id":"AgeI","seq":"ACCGGT"},
    "430": {"id":"BsaAI","seq":"YACGTR"},
    "431": {"id":"BstHI","seq":"RGCGCY"},
    "432": {"id":"BmtI","seq":"GCTAGC"},
    "433": {"id":"BstSNI","seq":"TACGTA"},
    "434": {"id":"BbuI","seq":"GCATGC"},
    "435": {"id":"StyI","seq":"CCWWGG"},
    "436": {"id":"AviII","seq":"TGCGCA"},
    "437": {"id":"BfrI","seq":"CTTAAG"},
    "438": {"id":"BstUI","seq":"CCWGG"},
    "439": {"id":"BslI","seq":"CCNNNNNNNGG"},
    "440": {"id":"TruI","seq":"TTAA"},
    "441": {"id":"BspMAI","seq":"CTGCAG"},
    "442": {"id":"BsuRI","seq":"GGCC"},
    "443": {"id":"CfrI","seq":"YGGCCR"},
    "444": {"id":"SanDI","seq":"GGGWCCC"},
    "445": {"id":"BglII","seq":"AGATCT"},
    "446": {"id":"NsbI","seq":"TGCGCA"},
    "447": {"id":"AsuII","seq":"TTCGAA"},
    "448": {"id":"BstZI","seq":"GTATAC"},
    "449": {"id":"ZrmI","seq":"AGTACT"},
    "450": {"id":"AspAI","seq":"CCTAGG"},
    "451": {"id":"MspI","seq":"CCGG"},
    "452": {"id":"KspI","seq":"CCGCGG"},
    "453": {"id":"TspEI","seq":"AATT"},
    "454": {"id":"BsaHI","seq":"GRCGYC"},
    "455": {"id":"DraIII","seq":"CACNNNGTG"},
    "456": {"id":"EcoICRI","seq":"GAGCTC"},
    "457": {"id":"BstNI","seq":"CCWGG"},
    "458": {"id":"AcvI","seq":"CACGTG"},
    "459": {"id":"EcoI","seq":"CACGTG"},
    "460": {"id":"EheI","seq":"GGCGCC"},
    "461": {"id":"BspI","seq":"CCATGG"},
    "462": {"id":"EcoI","seq":"GATATC"}
}

},{}],7:[function(require,module,exports){
module.exports={
    "1": {"id":"Gal4_AD","seq":"AATTTTAATCAAAGTGGGAATATTGCTGATAGCTCATTGTCCTTCACTTTCACTAACAGTAGCAACGGTCCGAACCTCATAACAACTCAAACAAATTCTCAAGCGCTTTCACAACCAATTGCCTCCTCTAACGTTCATGATAACTTCATGAATAATGAAATCACGGCTAGTAAAATTGATGATGGTAATAATTCAAAACCACTGTCACCTGGTTGGACGGACCAAACTGCGTATAACGCGTTTGGAATCACTACAGGGATGTTTAATACCACTACAATGGATGATGTATATAACTATCTATTCGATGATGAAGATACCCCACCAAACCCAAAAAAAGAG"},
    "2": {"id":"Gal4_AD","seq":"ATGGATAAAGCGGAATTAATTCCCGAGCCTCCAAAAAAGAAGAGAAAGGTCGAATTGGGTACCGCCGCCAATTTTAATCAAAGTGGGAATATTGCTGATAGCTCATTGTCCTTCACTTTCACTAACAGTAGCAACGGTCCGAACCTCATAACAACTCAAACAAATTCTCAAGCGCTTTCACAACCAATTGCCTCCTCTAACGTTCATGATAACTTCATGAATAATGAAATCACGGCTAGTAAAATTGATGATGGTAATAATTCAAAACCACTGTCACCTGGTTGGACGGACCAAACTGCGTATAACGCGTTTGGAATCACTACAGGGATGTTTAATACCACTACAATGGATGATGTATATAACTATCTATTCGATGATGAAGATACCCCACCAAACCCAAAAAAAGAG"},
    "3": {"id":"Gal4_DBD","seq":"ATGAAGCTACTGTCTTCTATCGAACAAGCATGCGATATTTGCCGACTTAAAAAGCTCAAGTGCTCCAAAGAAAAACCGAAGTGCGCCAAGTGTCTGAAGAACAACTGGGAGTGTCGCTACTCTCCCAAAACCAAAAGGTCTCCGCTGACTAGGGCACATCTGACAGAAGTGGAATCAAGGCTAGAAAGACTGGAACAGCTATTTCTACTGATTTTTCCTCGAGAAGACCTTGACATGATTTTGAAAATGGATTCTTTACAGGATATAAAAGCATTGTTAACAGGATTATTTGTACAAGATAATGTGAATAAAGATGCCGTCACAGATAGATTGGCTTCAGTGGAGACTGATATGCCTCTAACATTGAGACAGCATAGAATAAGTGCGACATCATCATCGGAAGAGAGTAGTAACAAAGGTCAAAGACAGTTGACTGTATCG"},
    "4": {"id":"His_patch_thio","seq":"ATGGGATCTGATAAAATTATTCATCTGACTGATGATTCTTTTGATACTGATGTACTTAAGGCAGATGGTGCAATCCTGGTTGATTTCTGGGCACACTGGTGCGGTCCGTGCAAAATGATCGCTCCGATTCTGGATGAAATCGCTGACGAATATCAGGGCAAACTGACCGTTGCAAAACTGAACATCGATCACAACCCGGGCACTGCGCCGAAATATGGCATCCGTGGTATCCCGACTCTGCTGCTGTTCAAAAACGGTGAAGTGGCGGCAACCAAAGTGGGTGCACTGTCTAAAGGTCAGTTGAAAGAGTTCCTCGACGCTAACCTGGC"},
    "5": {"id":"amp","seq":"ATGAGTATTCAACATTTCCGTGTCGCCCTTATTCCCTTTTTTGCGGCATTTTGCCTTCCTGTTTTTGCTCACCCAGAAACGCTGGTGAAAGTAAAAGATGCTGAAGATCAGTTGGGTGCACGAGTGGGTTACATCGAACTGGATCTCAACAGCGGTAAGATCCTTGAGAGTTTTCGCCCCGAAGAACGTTTTCCAATGATGAGCACTTTTAAAGTTCTGCTATGTGGCGCGGTATTATCCCGTGTTGACGCCGGGCAAGAGCAACTCGGTCGCCGCATACACTATTCTCAGAATGACTTGGTTGAGTACTCACCAGTCACAGAAAAGCATCTTACGGATGGCATGACAGTAAGAGAATTATGCAGTGCTGCCATAACCATGAGTGATAACACTGCGGCCAACTTACTTCTGACAACGATCGGAGGACCGAAGGAGCTAACCGCTTTTTTGCACAACATGGGGGATCATGTAACTCGCCTTGATCGTTGGGAACCGGAGCTGAATGAAGCCATACCAAACGACGAGCGTGACACCACGATGCCTGTAGCAATGGCAACAACGTTGCGCAAACTATTAACTGGCGAACTACTTACTCTAGCTTCCCGGCAACAATTAATAGACTGGATGGAGGCGGATAAAGTTGCAGGACCACTTCTGCGCTCGGCCCTTCCGGCTGGCTGGTTTATTGCTGATAAATCTGGAGCCGGTGAGCGTGGGTCTCGCGGTATCATTGCAGCACTGGGGCCAGATGGTAAGCCCTCCCGTATCGTAGTTATCTACACGACGGGGAGTCAGGCAACTATGGATGAACGAAATAGACAGATCGCTGAGATAGGTGCCTCACTGATTAAGCATTGGTAA"},
    "6": {"id":"neo","seq":"ATGGGATCGGCCATTGAACAAGATGGATTGCACGCAGGTTCTCCGGCCGCTTGGGTGGAGAGGCTATTCGGCTATGACTGGGCACAACAGACAATCGGCTGCTCTGATGCCGCCGTGTTCCGGCTGTCAGCGCAGGGGCGCCCGGTTCTTTTTGTCAAGACCGACCTGTCCGGTGCCCTGAATGAACTGCAGGACGAGGCAGCGCGGCTATCGTGGCTGGCCACGACGGGCGTTCCTTGCGCAGCTGTGCTCGACGTTGTCACTGAAGCGGGAAGGGACTGGCTGCTATTGGGCGAAGTGCCGGGGCAGGATCTCCTGTCATCTCACCTTGCTCCTGCCGAGAAAGTATCCATCATGGCTGATGCAATGCGGCGGCTGCATACGCTTGATCCGGCTACCTGCCCATTCGACCACCAAGCGAAACATCGCATCGAGCGAGCACGTACTCGGATGGAAGCCGGTCTTGTCGATCAGGATGATCTGGACGAAGAGCATCAGGGGCTCGCGCCAGCCGAACTGTTCGCCAGGCTCAAGGCGCGCATGCCCGACGGCGATGATCTCGTCGTGACCCATGGCGATGCCTGCTTGCCGAATATCATGGTGGAAAATGGCCGCTTTTCTGGATTCATCGACTGTGGCCGGCTGGGTGTGGCGGACCGCTATCAGGACATAGCGTTGGCTACCCGTGATATTGCTGAAGAGCTTGGCGGCGAATGGGCTGACCGCTTCCTCGTGCTTTACGGTATCGCCGCTCCCGATTCGCAGCGCATCGCCTTCTATCGCCTTCTTGACGAGTTCTTC"},
    "7": {"id":"kan","seq":"atgattgaacaagatggattgcacgcaggttctccggccgcttgggtggagaggctattcggctatgactgggcacaacagacaatcggctgctctgatgccgccgtgttccggctgtcagcgcaggggcgcccggttctttttgtcaagaccgacctgtccggtgccctgaatgaactccaagacgaggcagcgcggctatcgtggctggccacgacgggcgttccttgcgcagctgtgctcgacgttgtcactgaagcgggaagggactggctgctattgggcgaagtgccggggcaggatctcctgtcatctcaccttgctcctgccgagaaagtatccatcatggctgatgcaatgcggcggctgcatacgcttgatccggctacctgcccattcgaccaccaagcgaaacatcgcatcgagcgagcacgtactcggatggaagccggtcttgtcgatcaggatgatctggacgaagagcatcaggggctcgcgccagccgaactgttcgccaggctcaaggcgcggatgcccgacggcgaggatctcgtcgtgacccatggcgatgcctgcttgccgaatatcatggtggaaaatggccgcttttctggattcatcgactgtggccggctgggtgtggcggaccgctatcaggacatagcgttggctacccgtgatattgctgaagagcttggcggcgaatgggctgaccgcttcctcgtgctttacggtatcgccgctcccgattcgcagcgcatcgccttctatcgccttcttgacgagttcttctga"},
    "8": {"id":"puro","seq":"atgaccgagtacaagcccacggtgcgcctcgccacccgcgacgacgtccccagggccgtacgcaccctcgccgccgcgttcgccgactaccccgccacgcgccacaccgtcgatccggaccgccacatcgagcgggtcaccgagctgcaagaactcttcctcacgcgcgtcgggctcgacatcggcaaggtgtgggtcgcggacgacggcgccgcggtggcggtctggaccacgccggagagcgtcgaagcgggggcggtgttcgccgagatcggcccgcgcatggccgagttgagcggttcccggctggccgcgcagcaacagatggaaggcctcctggcgccgcaccggcccaaggagcccgcgtggttcctggccaccgtcggcgtctcgcccgaccaccagggcaagggtctgggcagcgccgtcgtgctccccggagtggaggcggccgagcgcgccggggtgcccgccttcctggagacctccgcgccccgcaacctccccttctacgagcggctcggcttcaccgtcaccgccgacgtcgagtgcccgaaggaccgcgcgacctggtgcatgacccgcaagcccggtgcctga"},
    "9": {"id":"zeo","seq":"atggccaagttgaccagtgccgttccggtgctcaccgcgcgcgacgtcgccggagcggtcgagttctggaccgaccggctcgggttctcccgggacttcgtggaggacgacttcgccggtgtggtccgggacgacgtgaccctgttcatcagcgcggtccaggaccaggtggtgccggacaacaccctggcctgggtgttggtgcgcggcctggacgagctgtacgccgagtggtcggaggtcgtgtccacgaacttccgggacgcctccgggccggccatgaccgagatcggcgagcagccgtgggggcgggagttcgccctgcgcgacccggccggcaactgcgtgcacttcgtggccgaggagcaggactga"}

}

},{}],8:[function(require,module,exports){
module.exports={
    "1": {"id":"5xGal4_DBD","seq":"CGGAGTACTGTCCTCCGAGCGGAGTACTGTCCTCCGAGCGGAGTACTGTCCTCCGAGCGGAGTACTGTCCTCCGAGCGGAGTACTGTCCTCCGAG"},
    "2": {"id":"YFP","seq":"ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCTTCGGCTACGGCCTGCAGTGCTTCGCCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCCATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACCGCATCGAGCTGAAGGGCATCGACTTCAAGGAGGACGGCAACATCCTGGGGCACAAGCTGGAGTACAACTACAACAGCCACAACGTCTATATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCCGCCACAACATCGAGGACGGCAGCGTGCAGCTCGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCTACCAGTCCGCCCTGAGCAAAGACCCCAACGAGAAGCGCGATCACATGGTCCTGCTGGAGTTCGTGACCGCCGCCGGGATCACTCTCGGCATGGACGAGCTGTACAAGTAA"},
    "3": {"id":"RFP","seq":"atggtgagcaagggcgaggaggataacatggccatcatcaaggagttcatgcgcttcaaggtgcacatggagggctccgtgaacggccacgagttcgagatcgagggcgagggcgagggccgcccctacgagggcacccagaccgccaagctgaaggtgaccaagggtggccccctgcccttcgcctgggacatcctgtcccctcagttcatgtacggctccaaggcctacgtgaagcaccccgccgacatccccgactacttgaagctgtccttccccgagggcttcaagtgggagcgcgtgatgaacttcgaggacggcggcgtggtgaccgtgacccaggactcctccctgcaggacggcgagttcatctacaaggtgaagctgcgcggcaccaacttcccctccgacggccccgtaatgcagaagaagaccatgggctgggaggcctcctccgagcggatgtaccccgaggacggcgccctgaagggcgagatcaagcagaggctgaagctgaaggacggcggccactacgacgctgaggtcaagaccacctacaaggccaagaagcccgtgcagctgcccggcgcctacaacgtcaacatcaagttggacatcacctcccacaacgaggactacaccatcgtggaacagtacgaacgcgccgagggccgccactccaccggcggcatggacgagctgtacaagtaa"},
    "4": {"id":"eGFP","seq":"ATGGTGAGCAAGGGCGAGGAGCTGTTCACCGGGGTGGTGCCCATCCTGGTCGAGCTGGACGGCGACGTAAACGGCCACAAGTTCAGCGTGTCCGGCGAGGGCGAGGGCGATGCCACCTACGGCAAGCTGACCCTGAAGTTCATCTGCACCACCGGCAAGCTGCCCGTGCCCTGGCCCACCCTCGTGACCACCCTGACCTACGGCGTGCAGTGCTTCAGCCGCTACCCCGACCACATGAAGCAGCACGACTTCTTCAAGTCCGCCATGCCCGAAGGCTACGTCCAGGAGCGCACCATCTTCTTCAAGGACGACGGCAACTACAAGACCCGCGCCGAGGTGAAGTTCGAGGGCGACACCCTGGTGAACCGCATCGAGCTGAAGGGCATCGACTTCAAGGAGGACGGCAACATCCTGGGGCACAAGCTGGAGTACAACTACAACAGCCACAACGTCTATATCATGGCCGACAAGCAGAAGAACGGCATCAAGGTGAACTTCAAGATCCGCCACAACATCGAGGACGGCAGCGTGCAGCTCGCCGACCACTACCAGCAGAACACCCCCATCGGCGACGGCCCCGTGCTGCTGCCCGACAACCACTACCTGAGCACCCAGTCCGCCCTGAGCAAAGACCCCAACGAGAAGCGCGATCACATGGTCCTGCTGGAGTTCGTGACCGCCGCCGGGATCACTCTCGGCATGGACGAGCTGTACAAG"},
    "5": {"id":"6His","seq":"catcatcaccatcaccac"}
}

},{}],9:[function(require,module,exports){
var exports = module.exports = {};
exports.visualize = function(res) {
    var r = 250;
    var center = 500;
    var name = 'pcDNA3.1';
    console.log(res);
    var plasmidLength = res[0].fullLength;
    var U = 2*r*Math.PI;
    var visualizedData = [];


    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var canvas2 = document.getElementById("canvas2");
    var ctx2 = canvas2.getContext("2d");



    CanvasRenderingContext2D.prototype.fillTextCircle = function(text, x, y, radius, space, endAngle){
        var textMetrics = ctx.measureText(text);
        var textLength = textMetrics.width;
        var textLengthInRad = (2*Math.PI/U)*textLength;
        var textMiddle = textLengthInRad/2;
        var featureMiddle = endAngle - space/2;
        var startRotation =featureMiddle - textMiddle;

        console.log(space);
        var numRadsPerLetter = textLengthInRad / text.length;

        this.save();
        this.translate(x,y);
        this.rotate(startRotation-1.45*Math.PI);

        for(var i=0;i<text.length;i++){
            this.save();
            this.rotate(i*numRadsPerLetter);
            this.font ="20px sans-serif";
            this.fillStyle = "black";
            this.fillText(text[i],0,-radius);
            this.restore();
        }
        this.restore();
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.clearRect(0, 0, canvas.width, canvas.height);


    ctx.beginPath();

    ctx.arc(center, center, r, 0, 2*Math.PI, false);
    ctx.stroke();

    ctx.font = "40px sans-serif";
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    ctx.fillText(name, center-(textWidth/2), center);

    for (var i = 1; i < res.length; i++) {
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === false) {
            visualizedData.push(res[i]);
            calculateAngles(res[i]);

        }
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === true) {
            res[i].start = plasmidLength - res[i].start - res[i].featureLength;
            visualizedData.push(res[i]);
            calculateAngles(res[i]);
        }
    }


    function calculateAngles(properties) {
        var featureStart = properties.start;
        var featureLength = properties.featureLength;
        console.log(featureLength);
        var featureEnd = featureStart + featureLength;
        var percentageStart = featureStart/plasmidLength;
        var percentageEnd = featureEnd/plasmidLength;
        var firstLength = U*percentageStart;
        var secondLength = U*percentageEnd;
        var startAngle = firstLength/r+1.5*Math.PI;
        var endAngle = secondLength/r+1.5*Math.PI;

        if (featureLength>300 && properties.reversed === true) {
            drawArrow(startAngle, true);
            drawMap(startAngle+0.2, endAngle, properties);
        }

        else if (featureLength>200 && properties.reversed === false) {

            drawArrow(endAngle);
            drawMap(startAngle, endAngle-0.2, properties);
        } else {
            drawMap(startAngle, endAngle, properties);
        }

    }

    function drawMap(startAngle, endAngle, properties) {

        var space = endAngle - startAngle;
        if (properties.featureLength > 300) {
            ctx2.strokeStyle = "rgb(117, 200, 252)";
            ctx2.lineWidth = 35;
            ctx2.beginPath();
            ctx2.arc(center, center, r, startAngle, endAngle, false);
            ctx2.stroke();
            ctx2.fillTextCircle(properties.id, center, center, r-5, space, endAngle-0.12);
        }
        else if (properties.featureLength <= 300 && properties.featureLength >= 18) {
            ctx2.strokeStyle = "rgb(108, 240, 184)";
            ctx2.lineWidth = 35;
            ctx2.beginPath();
            ctx2.arc(center, center, r, startAngle, endAngle, false);
            ctx2.stroke();

            var x = center + (r + 30) * Math.cos(startAngle);
            var y = center + (r + 30) * Math.sin(startAngle + (space/2));

            ctx2.font = "20px sans-serif";
            ctx2.fillStyle = 'black';
            ctx2.fillText(properties.id, x, y);
        } else {
            var xOut = center + (r + 25) * Math.cos(startAngle);
            var yOut = center + (r + 25) * Math.sin(startAngle);

            var xIn = center + r * Math.cos(startAngle);
            var yIn = center + r * Math.sin(startAngle);

            var xText = center + (r + 35) * Math.cos(startAngle);
            var yText = center + (r + 35) * Math.sin(startAngle);

            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xIn, yIn);
            ctx.lineTo(xOut, yOut);
            ctx.stroke();

            ctx2.font = "10px sans-serif";
            var metrics = ctx.measureText(name);
            var textWidth = metrics.width;
            ctx2.fillStyle = 'black';
            ctx2.fillText(properties.id, xText, yText);

        }
    }

    function drawArrow(angle, reversed) {
        var x = center + r * Math.cos(angle);
        var y = center + r * Math.sin(angle);
        var xOut;
        var yOut;
        var xIn;
        var yIn;

        if (reversed === false) {
            xOut = center + (r + 25) * Math.cos(angle-0.25);
            yOut = center + (r + 25) * Math.sin(angle-0.25);

            xIn = center + (r - 25) * Math.cos(angle-0.25);
            yIn = center + (r - 25) * Math.sin(angle-0.25);
        }
        if (reversed === true) {
            xOut = center + (r + 25) * Math.cos(angle+0.25);
            yOut = center + (r + 25) * Math.sin(angle+0.25);

            xIn = center + (r - 25) * Math.cos(angle+0.25);
            yIn = center + (r - 25) * Math.sin(angle+0.25);
        }

        ctx2.strokeStyle = "rgb(117, 200, 252)";
        ctx2.fillStyle = "rgb(117, 200, 252)";
        ctx2.beginPath();
        ctx2.moveTo(x,y);
        ctx2.lineTo(xOut,yOut);
        ctx2.lineTo(xIn,yIn);
        ctx2.fill();
    }
    return visualizedData;
}

},{}]},{},[4]);
