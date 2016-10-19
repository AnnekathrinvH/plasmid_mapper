var restriction_emzymes = require('./restriction_emzymes.json');
var selection_markers = require('./selection_markers.json');
var features = require('./features.json');
var tags = require('./tags.json');
//handlebars
var templates = document.querySelectorAll('script[type="text/handlebars"]');

Handlebars.templates = Handlebars.templates || {};

Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var b = document.getElementById('button');
var results = $('#results');
var resultsForReversedTarget = $('#resultsForReversedTarget')

b.addEventListener('click', function(e) {
    var time_start = new Date().getTime();

    var generalFeaturesCbox = document.getElementById('cbox1').checked;
    var restriction_emzymesCbox = document.getElementById('cbox2').checked;
    var tagsCbox = document.getElementById('cbox3').checked;
    var selection_markersCbox = document.getElementById('cbox4').checked;

    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');
    var reversedTarget = getOppositeStrand(target);

    if (generalFeaturesCbox) {

        var featuresData = getData(features, target);
        var featuresDataReversedTarget = getData(features, reversedTarget, true);

    }



    for (var i = 0; i < featuresDataReversedTarget.length; i++) {
        featuresData.push(featuresDataReversedTarget[i]);
    }

    visualize(featuresData);

    results.html(Handlebars.templates.mapRes({
        featuresDescription: featuresData
    }));
    var elapse = (new Date().getTime() - time_start) / 1000.0;
    document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

});

function getData(features, target, reversed) {

    var featuresData = [];
    var f;
    for (var feature in features) {

        f = do_align(features[feature].seq, target);

        var end = f[1] + f[3];

        while (end <= target.length + f[1]) {

            featuresData.push({
                reversed: reversed,
                id: features[feature].id,
                fullLength: f[0],
                featureLength: f[1],
                cigar: f[2],
                start: f[3],
                score: f[4]
            });

            f = do_align(features[feature].seq, target.slice(end));

            if (f == null) {
                console.log('break')

                break;
            }

            f[3] += end;

            end = f[3] + f[1];
        }
    }
    return featuresData;
}

function do_align(query, target) {


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


    var length = target.length;
    var featureLength = query.length;
    var score = parseInt(rst[0] + '\n', 10);
    var start = parseInt(rst[1] + '\n', 10);
    var cigar = bsa_cigar2str(rst[2]) + '\n\n';

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
