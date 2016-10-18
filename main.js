
//handlebars
var templates = document.querySelectorAll('script[type="text/handlebars"]');

Handlebars.templates = Handlebars.templates || {};

Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var features =
    {
        "5": {"id":"EcoRI","seq":"GAATTC"},
        //"6": {"id":"EcoRV","seq":"GATATC"},
        //"7": {"id":"HindIII","seq":"AAGCTT"},
        //"8": {"id":"AatII","seq":"GACGTC"},
        "9": {"id":"te","seq":"TCGAC"}
        //"10": {"id":"mySeq", "seq":"CCGGGAGCTTGTATATCCATTTTCGGATCTGATCAAGAGACAGGATGAGGATCGTTTCGCATGATTGAACAAGATGGATTGCACGCAGGTTCTCCGGCCGCTTGGGTGGAGAGGCTATTCGGCTATGACTGGGCACAACAGACAATCGGCTGCTCTGATGCCGCCGTGTTCCGGCTGTCAGCGCAGGGGCGCCCGGTTCTTTTTGTCAAGACCGACCTGTCCGGTGCCCTGAATGAACTGCAGGACGAGGCAGCGCGGCTATCGTGGCTGGCCACGACGGGCGTTCCTTGCGCAGCTGTGCTCGACGTTGTCACTGAAGCGGGAAGGGACTGGCTGCTATTGGGCGAAGTGCCGGGGCAGGATCTCCTGTCATCTCACCTTGCTCCTGCCGAGAAAGTATCCATCATGGCTGATGCAATGCGGCGGCTGCATACGCTT"}

    };

var b = document.getElementById('button');
var results = $('#results');


b.addEventListener('click', function(e) {
    var featuresData = [];

    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');

    var f;
    for (var feature in features) {

        f = do_align(features[feature].seq, target);

        var end = f[1] + f[3];

        while (end <= target.length + f[1]) {

            //[0 fullLength, 1 featureLength, 2 cigar, 3 start, 4 score]
            featuresData.push({
                id: features[feature].id,
                fullLength: f[0],
                featureLength: f[1],
                cigar: f[2],
                start: f[3],
                score: f[4]
            });


            f = do_align(features[feature].seq, target.slice(end));

            if (f == null) {
                console.log('braek')

                break;
            }

            f[3] += end;

            end = f[3] + f[1];
            console.log(f[3], f[1], target.length, end, f[0] + f[1])

            console.log(end <= f[0] + f[1], 'sss')

        }
    }

    visualize(featuresData);
    results.html(Handlebars.templates.mapRes({
        featuresDescription: featuresData
    }));
});

function do_align(query, target) {

	var time_start = new Date().getTime();

	var ms   = parseInt(document.getElementById('match').value);
	var mms  = parseInt(document.getElementById('mismatch').value);
	var gapo = parseInt(document.getElementById('gapo').value);
	var gape = parseInt(document.getElementById('gape').value);

	var is_local = true;

	var rst = bsa_align(is_local, target, query, [ms, mms], [gapo, gape]);
    if (!rst) {
        return rst;
    }

	var str = 'score: ' + rst[0] + '\n';
	str += 'start: ' + rst[1] + '\n';
	str += 'cigar: ' + bsa_cigar2str(rst[2]) + '\n\n';

	var elapse = (new Date().getTime() - time_start) / 1000.0;
	document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

    var length = target.length;
    var featureLength = query.length;
    var score = parseInt(rst[0] + '\n', 10);
    var start = parseInt(rst[1] + '\n', 10);
    var cigar = bsa_cigar2str(rst[2]) + '\n\n';

    return [length, featureLength, cigar, start, score];
}
