const features = require('./features.json');
const seq = require('./pcDNA3_1.json');

var oppStrand = getOppositeStrand(seq);

var data = createDataObjectWithFittedPosition(seq, oppStrand, features);

var dataToViz = {
    seqLength: seq.seq.length,
    features: data
}

console.log(dataToViz);

function getOppositeStrand(sequence) {
    var oppStrand = '';

    for (var i = 0; i < seq.seq.length; i++) {
        switch(seq.seq[i]) {
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
    return oppStrand;
}

function createDataObjectWithFittedPosition(sequence, oppSeq, features) {

    var indexOfFeature = [];
    var indexOfFeatureOppStrand = [];
    var data = [];

    for (var i in features) {

        indexOfFeature.push(getIndices(seq.seq, features[i].seq));
        indexOfFeatureOppStrand.push(getIndices(oppStrand, features[i].seq));

        var n = {
            featureId: features[i].id,
            featureLength: features[i].seq.length,
            position: indexOfFeature[i-1],
            oppPosition: indexOfFeatureOppStrand[i-1]

        }
        data.push(n);
    }
    return data;
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
