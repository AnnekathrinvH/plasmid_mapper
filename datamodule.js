

var seq = "AAAABAAA";

var features = {
    "1": {
        'seq': "AB"
    }
};

var oppStrand = getOppositeStrand(seq);

var data = createDataObjectWithFittedPosition(seq, oppStrand, features);

var dataToViz = {
    seqLength: seq.length,
    features: data
}


function getOppositeStrand(sequence) {
    var oppStrand = '';

    for (var i = 0; i < seq.length; i++) {
        switch(seq[i]) {
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

        indexOfFeature.push(getIndices(seq, features[i].seq));
        indexOfFeatureOppStrand.push(getIndices(oppStrand, features[i].seq));

        var n = {
            featureId: features[i].id,
            featureLength: features[i].seq.length,
            position: indexOfFeature[i-1],
            oppPosition: indexOfFeatureOppStrand[i-1]

        }
        data.push(n);
    }
    console.log(indexOfFeature)
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
    console.log(indices)
    return indices;
}
