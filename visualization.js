var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var r = 200;
var center = 250;

seqFeatures = [{
    start: 0.5*Math.PI,
    end: Math.PI
},
{
    start: 4.985570950262063,
    end: 5.698622193670801
}];

console.log(dataToViz);

ctx.beginPath();
ctx.arc(center, center, r, 0, 2*Math.PI, false);
ctx.stroke();

function calculateAngles() {

    for(var i=0; i<seqFeatures.length; i++) {
        var U = 2*r*Math.PI;
        var length = 5428;
        var featureStart = 236;
        var featureEnd = 852;
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

function drawMap(startAngle, endAngle) {

    var x = center + r * Math.cos(endAngle);
    var y = center + r * Math.sin(endAngle);

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(center, center, r, x, y, false);
    ctx.stroke();

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
