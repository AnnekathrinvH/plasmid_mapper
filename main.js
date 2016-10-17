
//handlebars
var templates = document.querySelectorAll('script[type="text/handlebars"]');

Handlebars.templates = Handlebars.templates || {};

Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var features =
    {
        "5": {"id":"EcoRI","seq":"GAATTC"},
        "6": {"id":"EcoRV","seq":"GATATC"},
        "7": {"id":"HindIII","seq":"AAGCTT"},
        "8": {"id":"AatII","seq":"GACGTC"},
        "9": {"id":"te","seq":"TCGAC"},
        "10": {"id":"mySeq", "seq":"CCGGGAGCTTGTATATCCATTTTCGGATCTGATCAAGAGACAGGATGAGGATCGTTTCGCATGATTGAACAAGATGGATTGCACGCAGGTTCTCCGGCCGCTTGGGTGGAGAGGCTATTCGGCTATGACTGGGCACAACAGACAATCGGCTGCTCTGATGCCGCCGTGTTCCGGCTGTCAGCGCAGGGGCGCCCGGTTCTTTTTGTCAAGACCGACCTGTCCGGTGCCCTGAATGAACTGCAGGACGAGGCAGCGCGGCTATCGTGGCTGGCCACGACGGGCGTTCCTTGCGCAGCTGTGCTCGACGTTGTCACTGAAGCGGGAAGGGACTGGCTGCTATTGGGCGAAGTGCCGGGGCAGGATCTCCTGTCATCTCACCTTGCTCCTGCCGAGAAAGTATCCATCATGGCTGATGCAATGCGGCGGCTGCATACGCTT"}


    };

var b = document.getElementById('button');
var results = $('#results');


b.addEventListener('click', function(e) {
    var featuresData = [];
    var res = {};
    for (var feature in features) {
        do_align(features[feature].seq);
        res[feature] = do_align(features[feature].seq);

        featuresData.push({
            id: features[feature].id,
            length: res[feature][0],
            featureLength: res[feature][1],
            cigar: res[feature][2],
            start: res[feature][3],
            score: res[feature][4]
        });
    }
    visualize(featuresData);
    results.html(Handlebars.templates.mapRes({
        featuresDescription: featuresData
    }));
});

function do_align(query) {

	var time_start = new Date().getTime();

	var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');

	//var query  = document.getElementById('query').value.replace(/[\s\n]+/g, '');
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

	//document.getElementById('out').value = str;
	//document.getElementById('out').rows = n_lines;

	var elapse = (new Date().getTime() - time_start) / 1000.0;
	document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

    var length = target.length;
    var featureLength = query.length;
    var score = parseInt(rst[0] + '\n', 10);
    var start = parseInt(rst[1] + '\n', 10);
    var cigar = bsa_cigar2str(rst[2]) + '\n\n';

    return [length, featureLength, cigar, start, score];
    //visualize(length, featureLength, cigar, start);
}
