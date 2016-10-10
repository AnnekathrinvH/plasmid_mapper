
const features = require('./features.json');
const seq = require('./pcDNA3_1.json');

function getIndices(sequence, feature) {
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
for (var i in features) {

    indexOfFeature.push(getIndices(seq.seq, features[i].seq));

}

console.log(indexOfFeature);
