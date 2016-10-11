const features = require('./features.json');
const seq = require('./pcDNA3_1.json');

console.log(seq.seq.length)


getIndices = function(sequence, feature) {

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
//it should br stored as an array of objects where 'key' is id and 'value' array or object of indexes
for (var i = 0; indexOfFeature[i]; i++) {
    console.log(indexOfFeature[i])
}
