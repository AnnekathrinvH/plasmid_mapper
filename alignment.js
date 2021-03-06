
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
		// console.log('s')
		// console.log(s);


	return s;
}

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
	// console.log('m[n-1]');
	// console.log(m);
	for (var j = 0; j < n; ++j) m[n-1][j] = 0;
	// console.log('m resturned:')
	// console.log(m)
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
	// console.log('_s');
	// console.log(_s);
	var s = typeof _s == 'string'? bsg_enc_seq(_s, table) : _s;
	var qp = [], matrix;
	if (_m.length >= 2 && typeof _m[0] == 'number' && typeof _m[1] == 'number') { // match/mismatch score
		if (table == null) return null;
		// console.log('strange expression')
		// //console.log(table[table.length-1]+5)
		// console.log(table[table.length-1] + 1)
		var n = typeof table == 'number'? table : table[table.length-1] + 1;
		// console.log('n is:');
		// console.log(n)


		matrix = bsa_gen_score_matrix(n, _m[0], _m[1]);
		// console.log('matrix is:');
		// console.log(matrix);
	} else matrix = _m; // _m is already a matrix; FIXME: check if it is really a square matrix!
	for (var j = 0; j < matrix.length; ++j) {
		var qpj, mj = matrix[j];
		qpj = qp[j] = [];
		for (var i = 0; i < s.length; ++i)
			qpj[i] = mj[s[i]];
	}
	// console.log('query profile');
	// console.log(qp)
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
	// console.log('t is: ');
	// console.log(t);

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
	}


	// the DP loop
	for (var i = 0; i < t.length; ++i) {
		var h1 = 0, f = 0, m = 0, mj = -1;
		var zi, qpi = qp[t[i]];

		zi = z[i] = [];
		var beg = i > w? i - w : 0;

		var end = i + w + 1 < qlen? i + w + 1 : qlen; // only loop through [beg,end) of the query sequence

		for (var j = beg; j < end; ++j) {
			// At the beginning of the loop: h=H[j]=H(i-1,j-1), e=E[j]=E(i,j), f=F(i,j) and h1=H(i,j-1)
			// If we only want to compute the max score, delete all lines involving direction "d".
			var e = E[j], h = H[j], d;
			H[j] = h1;           // set H(i,j-1) for the next row
			h += qpi[j];         // h = H(i-1,j-1) + S(i,j)
//			d = h > e? 0 : 1;
			h = h > e? h : e;
//			d = h > f? d : 2;
			h = h > f? h : f;    // h = H(i,j) = max{H(i-1,j-1)+S(i,j), E(i,j), F(i,j)}
//			d = !is_local || h > 0? d : 1<<6;
			h1 = h;              // save H(i,j) to h1 for the next column
			mj = m > h? mj : j;
			m = m > h? m : h;    // update the max score in this row
			h -= gapoe;
			h = !is_local || h > 0? h : 0;
			e -= gape;
//			d |= e > h? 1<<2 : 0;
			e = e > h? e : h;    // e = E(i+1,j)
			E[j] = e;            // save E(i+1,j) for the next row
			f -= gape;
//			d |= f > h? 2<<4 : 0;
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
	}
	//else i = t.length - 1, k = (i + w + 1 < qlen? i + w + 1 : qlen) - 1; // (i,k) points to the last cell
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
	}

	for (var i = 0; i < cigar.length>>1; ++i) // reverse CIGAR
		tmp = cigar[i], cigar[i] = cigar[cigar.length-1-i], cigar[cigar.length-1-i] = tmp;
	return [score, start_i, cigar];
}

exports.bsa_cigar2gaps = function(target, query, start, cigar)
{
	var oq = '', ot = '', lq = 0, lt = start;
	for (var k = 0; k < cigar.length; ++k) {
		var op = cigar[k]&0xf, len = cigar[k]>>4;
		if (op == 0) { // match
			oq += query.substr(lq, len);
			ot += target.substr(lt, len);
			lq += len, lt += len;
		} else if (op == 1) { // insertion
			oq += query.substr(lq, len);
			ot += Array(len+1).join("-");
			lq += len;
		} else if (op == 2) { // deletion
			oq += Array(len+1).join("-");
			ot += target.substr(lt, len);
			lt += len;
		} else if (op == 4) { // soft clip
			lq += len;
		}
	}

	return [ot, oq];
}

exports.bsa_cigar2str = function(cigar)
{
	var s = [];
	for (var k = 0; k < cigar.length; ++k)
		s.push((cigar[k]>>4).toString() + "MIDNSHP=XB".charAt(cigar[k]&0xf));
	return s.join("");
}
