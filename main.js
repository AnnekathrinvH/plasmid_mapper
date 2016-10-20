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

// var features =
//     {
//         "1": {"id":"gag","seq":"ATGGGCCCGGGCCAGACTGTTACCACTCCCTTAAGTTTGACCTTAGGTCACTGGAAAGATGTCGAGCGGATCGCTCACAACCAGTCGGTAGATGTCAAGAAGAGACGTTGGGTTACCTTCTGCTCTGCAGAATGGCCAACCTTTAACGTCGGATGGCCGCGAGACGGCACCTTTAACCGAGACCTCATCACCCAGGTTAAGATCAAGGTCTTTTCACCTGGCCCGCATGGACACCCAGACCAGGTCCCCTACATCGTGACCTGGGAAGCCTTGGCTTTTGACCCCCCTCCCTGGGTCAAGCCCTTTGTACACCCTAAGCCTCCGCCTCCTCTTCCTCCATCCGCCCCGTCTCTCCCCCTTGAACCTCCTCGTTCGACCCCGCCTCGATCCTCCCTTTATCCAGCCCTCACTCCTTCTCTAGGCGCCCCCATATGGCCATATGAGATCTTATATGGGGCACCCCCGCCCCTTGTAAACTTCCCTGACCCTGACATG"},
//         "2": {"id":"CMV","seq":"ACATTGATTATTGAGTAGTTATTAATAGTAATCAATTACGGGGTCATTAGTTCATAGCCCATATATGGAGTTCCGCGTTACATAACTTACGGTAAATGGCCCGCCTGGCTGACCGCCCAACGACCCCCGCCCATTGACGTCAATAATGACGTATGTTCCCATAGTAACGCCAATAGGGACTTTCCATTGACGTCAATGGGTGGAGTATTTACGGTAAACTGCCCACTTGGCAGTACATCAAGTGTATCATATGCCAAGTACGCCCCCTATTGACGTCAATGACGGTAAATGGCCCGCCTGGCATTATGCCCAGTACATGACCTTATGGGACTTTCCTACTTGGCAGTACATCTACGGTTAGTCATCGCTATTACCATAGTGATGCGGTTTTGGCAGTACATCAATGGGCGTGGATAGCGGTTTGACTCACGGGGATTTCCAAGTCTCCACCCCATTGACGTCAATGGGAGTTTGTTTTGGCACCAAAATCAACGGGACTTTCCAAAATGTCGTAACAACTCCGCCCCATTGACGCAAATGGGCGGTAGGCGTGTACGGTGGGAGGTCTATATAAGCAGAGCTTTCTGGCTAACTAGAGAACCCACTGCTTACTGGC"},
//         "3": {"id":"amp","seq":"ATGAGTATTCAACATTTCCGTGTCGCCCTTATTCCCTTTTTTGCGGCATTTTGCCTTCCTGTTTTTGCTCACCCAGAAACGCTGGTGAAAGTAAAAGATGCTGAAGATCAGTTGGGTGCACGAGTGGGTTACATCGAACTGGATCTCAACAGCGGTAAGATCCTTGAGAGTTTTCGCCCCGAAGAACGTTTTCCAATGATGAGCACTTTTAAAGTTCTGCTATGTGGCGCGGTATTATCCCGTGTTGACGCCGGGCAAGAGCAACTCGGTCGCCGCATACACTATTCTCAGAATGACTTGGTTGAGTACTCACCAGTCACAGAAAAGCATCTTACGGATGGCATGACAGTAAGAGAATTATGCAGTGCTGCCATAACCATGAGTGATAACACTGCGGCCAACTTACTTCTGACAACGATCGGAGGACCGAAGGAGCTAACCGCTTTTTTGCACAACATGGGGGATCATGTAACTCGCCTTGATCGTTGGGAACCGGAGCTGAATGAAGCCATACCAAACGACGAGCGTGACACCACGATGCCTGTAGCAATGGCAACAACGTTGCGCAAACTATTAACTGGCGAACTACTTACTCTAGCTTCCCGGCAACAATTAATAGACTGGATGGAGGCGGATAAAGTTGCAGGACCACTTCTGCGCTCGGCCCTTCCGGCTGGCTGGTTTATTGCTGATAAATCTGGAGCCGGTGAGCGTGGGTCTCGCGGTATCATTGCAGCACTGGGGCCAGATGGTAAGCCCTCCCGTATCGTAGTTATCTACACGACGGGGAGTCAGGCAACTATGGATGAACGAAATAGACAGATCGCTGAGATAGGTGCCTCACTGATTAAGCATTGGTAA"},
//         "4": {"id":"tet","seq":"ATGAAATCTAACAATGCGCTCATCGTCATCCTCGGCACCGTCACCCTGGATGCTGTAGGCATAGGCTTGGTTATGCCGGTACTGCCGGGCCTCTTGCGGGATATCGTCCATTCCGACAGCATCGCCAGTCACTATGGCGTGCTGCTAGCGCTATATGCGTTGATGCAATTTCTATGCGCACCCGTTCTCGGAGCACTGTCCGACCGCTTTGGCCGCCGCCCAGTCCTGCTCGCTTCGCTACTTGGAGCCACTATCGACTACGCGATCATGGCGACCACACCCGTCCTGTGGATTCTCTACGCCGGACGCATCGTGGCCGGCATCACCGGCGCCACAGGTGCGGTTGCTGGCGCCTATATCGCCGACATCACCGATGGGGAAGATCGGGCTCGCCACTTCGGGCTCATGAGCGCTTGTTTCGGCGTGGGTATGGTGGCAGGCCCCGTGGCCGGGGGACTGTTGGGCGCCATCTCCTTACATGCACCATTCCTTGCGGCGGCGGTGCTCAACGGCCTCAACCTACTACTGGGCTGCTTCCTAATGCAGGAGTCGCATAAGGGAGAGCGCCGACCCATGCCCTTGAGAGCCTTCAACCCAGTCAGCTCCTTCCGGTGGGCGCGGGGCATGACTATCGTCGCCGCACTTATGACTGTCTTCTTTATCATGCAACTCGTAGGACAGGTGCCGGCAGCGCTCTGGGTCATTTTCGGCGAGGACCGCTTTCGCTGGAGCGCGACGATGATCGGCCTGTCGCTTGCGGTATTCGGAATCTTGCACGCCCTCGCTCAAGCCTTCGTCACTGGTCCCGCCACCAAACGTTTCGGCGAGAAGCAGGCCATTATCGCCGGCATGGCGGCCGACGCGCTGGGCTACGTCTTGCTGGCGTTCGCGACGCGAGGCTGGATGGCCTTCCCCATTATGATTCTTCTCGCTTCCGGCGGCATCGGGATGCCCGCGTTGCAGGCCATGCTGTCCAGGCAGGTAGATGACGACCATCAGGGACAGCTTCAAGGATCGCTCGCGGCTCTTACCAGCCTAACTTCGATCATTGGACCGCTGATCGTCACGGCGATTTATGCCGCCTCGGCGAGCACATGGAACGGGTTGGCATGGATTGTAGGCGCCGCCCTATACCTTGTCTGCCTCCCCGCGTTGCGTCGCGGTGCATGGAGCCGGGCCACCTCGACCTGA"},
//         "5": {"id":"EcoRI","seq":"GAATTC"},
//         "6": {"id":"EcoRV","seq":"GATATC"},
//         "7": {"id":"HindIII","seq":"AAGCTT"},
//         "8": {"id":"AatII","seq":"GACGTC"},
//         "9": {"id": "neo", "seq":"ATGGGATCGGCCATTGAACAAGATGGATTGCACGCAGGTTCTCCGGCCGCTTGGGTGGAGAGGCTATTCGGCTATGACTGGGCACAACAGACAATCGGCTGCTCTGATGCCGCCGTGTTCCGGCTGTCAGCGCAGGGGCGCCCGGTTCTTTTTGTCAAGACCGACCTGTCCGGTGCCCTGAATGAACTGCAGGACGAGGCAGCGCGGCTATCGTGGCTGGCCACGACGGGCGTTCCTTGCGCAGCTGTGCTCGACGTTGTCACTGAAGCGGGAAGGGACTGGCTGCTATTGGGCGAAGTGCCGGGGCAGGATCTCCTGTCATCTCACCTTGCTCCTGCCGAGAAAGTATCCATCATGGCTGATGCAATGCGGCGGCTGCATACGCTTGATCCGGCTACCTGCCCATTCGACCACCAAGCGAAACATCGCATCGAGCGAGCACGTACTCGGATGGAAGCCGGTCTTGTCGATCAGGATGATCTGGACGAAGAGCATCAGGGGCTCGCGCCAGCCGAACTGTTCGCCAGGCTCAAGGCGCGCATGCCCGACGGCGATGATCTCGTCGTGACCCATGGCGATGCCTGCTTGCCGAATATCATGGTGGAAAATGGCCGCTTTTCTGGATTCATCGACTGTGGCCGGCTGGGTGTGGCGGACCGCTATCAGGACATAGCGTTGGCTACCCGTGATATTGCTGAAGAGCTTGGCGGCGAATGGGCTGACCGCTTCCTCGTGCTTTACGGTATCGCCGCTCCCGATTCGCAGCGCATCGCCTTCTATCGCCTTCTTGACGAGTTCTTC"},
//         //"10": {"id":"te","seq":"TCGAC"},
//         //"11": {"id":"mySeq", "seq":"CCGGGAGCTTGTATATCCATTTTCGGATCTGATCAAGAGACAGGATGAGGATCGTTTCGCATGATTGAACAAGATGGATTGCACGCAGGTTCTCCGGCCGCTTGGGTGGAGAGGCTATTCGGCTATGACTGGGCACAACAGACAATCGGCTGCTCTGATGCCGCCGTGTTCCGGCTGTCAGCGCAGGGGCGCCCGGTTCTTTTTGTCAAGACCGACCTGTCCGGTGCCCTGAATGAACTGCAGGACGAGGCAGCGCGGCTATCGTGGCTGGCCACGACGGGCGTTCCTTGCGCAGCTGTGCTCGACGTTGTCACTGAAGCGGGAAGGGACTGGCTGCTATTGGGCGAAGTGCCGGGGCAGGATCTCCTGTCATCTCACCTTGCTCCTGCCGAGAAAGTATCCATCATGGCTGATGCAATGCGGCGGCTGCATACGCTT"}
//
//     };

var b = document.getElementById('button');
var results = $('#results');
var resultsForReversedTarget = $('#resultsForReversedTarget');

// function wait() {
//     return $("#justamoment").css("visibility", "visible");
//
// }

b.addEventListener('click', function(e) {

    var time_start = new Date().getTime();

    var generalFeaturesCbox = document.getElementById('cbox1').checked;
    var restriction_emzymesCbox = document.getElementById('cbox2').checked;
    var tagsCbox = document.getElementById('cbox3').checked;
    var selection_markersCbox = document.getElementById('cbox4').checked;

    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');
    var reversedTarget = getOppositeStrand(target);
    var featuresData = [];



    if (generalFeaturesCbox) {

        var generalFeaturesData = getData(features, target);
        var generalFeaturesDataReversedTarget = getData(features, reversedTarget, true);

        for (var i = 0; i < generalFeaturesData.length; i++) {
            featuresData.push(generalFeaturesData[i]);
        }
        for (var i = 0; i < generalFeaturesDataReversedTarget.length; i++) {
            featuresData.push(generalFeaturesDataReversedTarget[i]);
        }
    }

    if (restriction_emzymesCbox) {

        var restriction_emzymesData = getData(restriction_emzymes, target);
        var restriction_emzymesDataReversedTarget = getData(restriction_emzymes, reversedTarget, true);

        for (var i = 0; i < restriction_emzymesData.length; i++) {
            featuresData.push(restriction_emzymesData[i]);
        }
        for (var i = 0; i < restriction_emzymesDataReversedTarget.length; i++) {
            featuresData.push(restriction_emzymesDataReversedTarget[i]);
        }

    }

    if (selection_markersCbox) {
        var selection_markersData = getData(selection_markers, target);
        var selection_markersDataReversedTarget = getData(selection_markers, reversedTarget, true);

        for (var i = 0; i < selection_markersData.length; i++) {
            featuresData.push(selection_markersData[i]);
        }
        for (var i = 0; i < selection_markersDataReversedTarget.length; i++) {
            featuresData.push(selection_markersDataReversedTarget[i]);
        }
    }

    if (tagsCbox) {
        var tagsData = getData(tags, target);
        var tagsDataReversedTarget = getData(tags, reversedTarget, true);

        for (var i = 0; i < tagsData.length; i++) {
            featuresData.push(tagsData[i]);
        }
        for (var i = 0; i < tagsDataReversedTarget.length; i++) {
            featuresData.push(tagsDataReversedTarget[i]);
        }
    }


    var visualized = visualize(featuresData);
    console.log(visualized)
    $("#visualizedText").css("visibility", "visible");
    results.html(Handlebars.templates.mapRes({
        featuresDescription: visualized
    }));

    var elapse = (new Date().getTime() - time_start) / 1000.0;
    document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

});

function getData(features, target, reversed) {

    var f;
    var tempData = []
    for (var feature in features) {

        if (features[feature].seq.length > 30) {



            f = do_align(features[feature].seq, target);

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

                f = do_align(features[feature].seq, target.slice(end));

                if (f == null) {

                    break;
                }

                f[3] += end;

                end = f[3] + f[1];
            }
        } else {

            var indexOfFeature = [];

            indexOfFeature.push(getIndices(target, features[feature].seq));

            if (indexOfFeature[0].length > 1) {

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
