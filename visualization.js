var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var r = 200;
var center = 250;




console.log(dataToViz);

ctx.beginPath();
ctx.arc(center, center, r, 0, 2*Math.PI, false);
ctx.stroke();
calculateAngles();

function calculateAngles() {
    var U = 2*r*Math.PI;
    var length = dataToViz.seqLength;


    for(var i=0; i<dataToViz.features.length; i++) {
        var feature = dataToViz.features[i];

        for(var j=0; j<feature.position.length; j++) {
            console.log(feature.featureId);
            var featureStart = feature.position[j];
            var featureLength = feature.featureLength;
            var featureEnd = featureStart + featureLength;
            console.log('start: '+featureStart+' end: '+featureEnd);
            var percentageStart = featureStart/length;
            var percentageEnd = featureEnd/length;
            //auf umfang bezogen
            var firstLength = U*percentageStart;
            var secondLength = U*percentageEnd;
            //winkel berechnen und kreis drehen
            var startAngle = firstLength/r+1.5*Math.PI;
            var endAngle = secondLength/r+1.5*Math.PI;
            drawMap(startAngle, endAngle);
        }
    }
}

function drawMap(startAngle, endAngle) {



    ctx.strokeStyle = "blue";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(center, center, r, startAngle, endAngle, false);
    ctx.stroke();

    var x = center + r * Math.cos(endAngle);
    var y = center + r * Math.sin(endAngle);

    var xOut = center + (r + 15) * Math.cos(endAngle-0.2);
    var yOut = center + (r + 15) * Math.sin(endAngle-0.2);
    console.log(xOut, yOut);

    var xIn = center + (r - 15) * Math.cos(endAngle-0.2);
    var yIn = center + (r - 15) * Math.sin(endAngle-0.2);
    console.log(xIn, yIn);

    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(xOut,yOut);
    ctx.lineTo(xIn,yIn);
    ctx.fill();
}
