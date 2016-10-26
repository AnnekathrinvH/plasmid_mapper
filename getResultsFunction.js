var restriction_emzymes = require('./restriction_emzymes.json');
var selection_markers = require('./selection_markers.json');
var features = require('./features.json');
var tags = require('./tags.json');
var alignFun = require('./alignment.js');

onmessage = function(e) {

    var eD = e.data;

    var res = getResults(eD.generalFeaturesCbox, eD.restriction_emzymesCbox, eD.selection_markersCbox, eD.tagsCbox, eD.target, [eD.ms, eD.mms], [eD.gapo, eD.gape]);
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
