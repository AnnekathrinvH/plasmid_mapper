    var b = document.getElementById('button');

    b.addEventListener('click', function(e) {

        do_align();
    });

    function do_align()
    {
    	var time_start = new Date().getTime();

    	var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');
    	var query  = document.getElementById('query').value .replace(/[\s\n]+/g, '');
    	var ms   = parseInt(document.getElementById('match').value);
    	var mms  = parseInt(document.getElementById('mismatch').value);
    	var gapo = parseInt(document.getElementById('gapo').value);
    	var gape = parseInt(document.getElementById('gape').value);
    	//hardcode locality;
    	var is_local = true;
    	//var is_local = document.getElementById('is_local').checked;

    	var rst = bsa_align(is_local, target, query, [ms, mms], [gapo, gape]);
    	var str = 'score: ' + rst[0] + '\n';
    	str += 'start: ' + rst[1] + '\n';
    	str += 'cigar: ' + bsa_cigar2str(rst[2]) + '\n\n';

    	//str += 'alignment:\n\n';
    	// var fmt = bsa_cigar2gaps(target, query, rst[1], rst[2]);
    	// console.log(fmt)
    	//
    	// var linelen = 100, n_lines = 10;
    	// for (var l = 0; l < fmt[0].length; l += linelen) {
    	// 	str += fmt[0].substr(l, linelen) + '\n';
    	// 	str += fmt[1].substr(l, linelen) + '\n\n';
    	// 	n_lines += 3;
    	// }

    	document.getElementById('out').value = str;
    	//document.getElementById('out').rows = n_lines;

    	var elapse = (new Date().getTime() - time_start) / 1000.0;
    	document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";
    }
