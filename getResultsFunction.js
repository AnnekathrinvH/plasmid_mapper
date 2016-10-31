var restriction_emzymes = require('./data/restriction_emzymes.json');
var selection_markers = require('./data/selection_markers.json');
var features = require('./data/features.json');
var tags = require('./data/tags.json');
var alignFun = require('./alignment.js');
var more_features = require('./data/featuresTwo.json');

onmessage = function(e) {

    var eD = e.data;



    var res = getResults(eD.generalFeaturesCbox, eD.single_cuttersCbox, eD.double_cuttersCbox, eD.selection_markersCbox, eD.tagsCbox, eD.target, [eD.ms, eD.mms], [eD.gapo, eD.gape], eD.customFeatFlag, eD.customFeature, eD.featuresTwo);

    postMessage(res);
}

function getResults(generalFeaturesCbox, single_cuttersCbox, double_cuttersCbox, selection_markersCbox, tagsCbox, target, [ms, mms], [gapo, gape], customFeatFlag, customFeature, featuresTwo) {

    var receivedFeatures = [generalFeaturesCbox, single_cuttersCbox, double_cuttersCbox, selection_markersCbox, tagsCbox, customFeatFlag, featuresTwo];

    if (customFeatFlag) {

        var customFeatureObj = {
            "1": {
                "id":"custom",
                "seq":customFeature
                }
        }
    }


    var reversedTarget = getOppositeStrand(target);
    var featuresData = [];

    if (generalFeaturesCbox) {

        var generalFeaturesData = getData(features, target, false, [ms, mms], [gapo, gape]);
        var generalFeaturesDataReversedTarget = getData(features, reversedTarget, true, [ms, mms], [gapo, gape]);

        pushDataToObjectThatIsUsedToViz(generalFeaturesData, generalFeaturesDataReversedTarget, featuresData);

    }
    if (featuresTwo) {

        var featuresTwoData = getData(more_features, target, false, [ms, mms], [gapo, gape]);
        var featuresTwoDataReversedTarget = getData(more_features, reversedTarget, true, [ms, mms], [gapo, gape]);

        pushDataToObjectThatIsUsedToViz(featuresTwoData, featuresTwoDataReversedTarget, featuresData);

    }

    if (single_cuttersCbox) {

        var single_cuttersData = getData(restriction_emzymes, target, false, [ms, mms], [gapo, gape], true);

        for (var i = 0; i < single_cuttersData.length; i++) {
            featuresData.push(single_cuttersData[i]);
        }
    }

    if (double_cuttersCbox) {

        var double_cuttersData = getData(restriction_emzymes, target, false, [ms, mms], [gapo, gape]);

        for (var i = 0; i < double_cuttersData.length; i++) {
            featuresData.push(double_cuttersData[i]);
        }
    }

    if (selection_markersCbox) {

        var selection_markersData = getData(selection_markers, target, false, [ms, mms], [gapo, gape]);
        var selection_markersDataReversedTarget = getData(selection_markers, reversedTarget, true, [ms, mms], [gapo, gape]);

        pushDataToObjectThatIsUsedToViz(selection_markersData, selection_markersDataReversedTarget, featuresData);

    }

    if (tagsCbox) {

        var tagsData = getData(tags, target, false, [ms, mms], [gapo, gape]);
        var tagsDataReversedTarget = getData(tags, reversedTarget, true, [ms, mms], [gapo, gape]);

        pushDataToObjectThatIsUsedToViz(tagsData, tagsDataReversedTarget, featuresData);

    }

    if (customFeatFlag) {

        var customFeatureData = getData(customFeatureObj, target, false, [ms, mms], [gapo, gape]);
        var customFeatureDataReversedTarget = getData(customFeatureObj, reversedTarget, true, [ms, mms], [gapo, gape]);

        pushDataToObjectThatIsUsedToViz(customFeatureData, customFeatureDataReversedTarget, featuresData);

    }

    return featuresData;

}

function getData(features, target, reversed, [ms, mms], [gapo, gape], tuple) {

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

            if (tuple) {
                var indexOfFeature = [];

                indexOfFeature.push(getIndices(target, features[feature].seq));

                if (indexOfFeature[0].length == 1) {

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
            } else {
                var indexOfFeature = [];

                indexOfFeature.push(getIndices(target, features[feature].seq));

                if (indexOfFeature[0].length == 2) {

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

	// var str = 'score: ' + rst[0] + '\n';
	// str += 'start: ' + rst[1] + '\n';
	// str += 'cigar: ' + alignFun.bsa_cigar2str(rst[2]) + '\n\n';
    // str += 'alignment:\n\n';
    //var fmt = alignFun.bsa_cigar2gaps(target, query, rst[1], rst[2]);
    // console.log('fmt is equal to ');
    // console.log(fmt)
    // var linelen = 100, n_lines = 10;
    // for (var l = 0; l < fmt[0].length; l += linelen) {
    //     str += fmt[0].substr(l, linelen) + '\n';
    //     str += fmt[1].substr(l, linelen) + '\n\n';
    //     n_lines += 3;
    // }
    // console.log('string')
    // console.log(str);


    var length = target.length;
    var featureLength = query.length;
    var score = parseInt(rst[0] + '\n', 10);
    var start = parseInt(rst[1] + '\n', 10);
    var cigar = alignFun.bsa_cigar2str(rst[2]) + '\n\n';
    // console.log('rst is :');
    // console.log(rst);
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

function pushDataToObjectThatIsUsedToViz(data, dataReversedTarget, featuresData) {

    for (var i = 0; i < data.length; i++) {
        featuresData.push(data[i]);
    }

    for (var i = 0; i < dataReversedTarget.length; i++) {
        featuresData.push(dataReversedTarget[i]);
    }

}
