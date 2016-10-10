var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

seqFeatures = [{
    start: 0.5*Math.PI,
    end: Math.PI
},
{
    start: 1.1*Math.PI,
    end: 1.7*Math.PI
}];

function drawMap(seqFeatures) {
    ctx.beginPath();
    ctx.arc(250, 250, 200, 0, 2*Math.PI, false);
    ctx.stroke();
    for(var i=0; i<seqFeatures.length; i++) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 10;

        ctx.beginPath();
        ctx.arc(250, 250, 200, seqFeatures[i].start, seqFeatures[i].end, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(50,50);
        ctx.lineTo(100, 100);
        ctx.stroke();
    }
}

drawMap(seqFeatures);
