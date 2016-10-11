const features = require('./features.json');
const seq = require('./pcDNA3_1.json');

getIndices = function(sequence, feature) {

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

var indexOfFeature = [];
var data = [];

for (var i in features) {

    indexOfFeature.push(getIndices(seq.seq, features[i].seq));

}

for (var i in features) {

    var n = {
        featureId: features[i].id,
        featureLength: features[i].seq.length,
        position: indexOfFeature[i-1]

    }
    data.push(n);

}

var dataToViz = {
    seqLength: seq.seq.length,
    features: data
}

console.log(dataToViz)
