var exports = module.exports = {};
exports.visualize = function(res) {
    var r = 250;
    var center = 500;
    var name = 'pcDNA3.1';
    console.log(res);
    var plasmidLength = res[0].fullLength;
    var U = 2*r*Math.PI;
    var visualizedData = [];


    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var canvas2 = document.getElementById("canvas2");
    var ctx2 = canvas2.getContext("2d");



    CanvasRenderingContext2D.prototype.fillTextCircle = function(text, x, y, radius, space, endAngle){
        var textMetrics = ctx.measureText(text);
        var textLength = textMetrics.width;
        var textLengthInRad = (2*Math.PI/U)*textLength;
        var textMiddle = textLengthInRad/2;
        var featureMiddle = endAngle - space/2;
        var startRotation =featureMiddle - textMiddle;

        console.log(space);
        var numRadsPerLetter = textLengthInRad / text.length;

        this.save();
        this.translate(x,y);
        this.rotate(startRotation-1.45*Math.PI);

        for(var i=0;i<text.length;i++){
            this.save();
            this.rotate(i*numRadsPerLetter);
            this.font ="20px sans-serif";
            this.fillStyle = "black";
            this.fillText(text[i],0,-radius);
            this.restore();
        }
        this.restore();
    };

    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    //ctx2.clearRect(0, 0, canvas.width, canvas.height);


    ctx.beginPath();

    ctx.arc(center, center, r, 0, 2*Math.PI, false);
    ctx.stroke();

    ctx.font = "40px sans-serif";
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    ctx.fillText(name, center-(textWidth/2), center);

    for (var i = 1; i < res.length; i++) {
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === false) {
            visualizedData.push(res[i]);
            calculateAngles(res[i]);

        }
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === true) {
            res[i].start = plasmidLength - res[i].start - res[i].featureLength;
            visualizedData.push(res[i]);
            calculateAngles(res[i]);
        }
    }


    function calculateAngles(properties) {
        var featureStart = properties.start;
        var featureLength = properties.featureLength;
        console.log(featureLength);
        var featureEnd = featureStart + featureLength;
        var percentageStart = featureStart/plasmidLength;
        var percentageEnd = featureEnd/plasmidLength;
        var firstLength = U*percentageStart;
        var secondLength = U*percentageEnd;
        var startAngle = firstLength/r+1.5*Math.PI;
        var endAngle = secondLength/r+1.5*Math.PI;

        if (featureLength>300 && properties.reversed === true) {
            drawArrow(startAngle, true);
            drawMap(startAngle+0.2, endAngle, properties);
        }

        else if (featureLength>200 && properties.reversed === false) {

            drawArrow(endAngle);
            drawMap(startAngle, endAngle-0.2, properties);
        } else {
            drawMap(startAngle, endAngle, properties);
        }

    }

    function drawMap(startAngle, endAngle, properties) {

        var space = endAngle - startAngle;
        if (properties.featureLength > 300) {
            ctx2.strokeStyle = "rgb(117, 200, 252)";
            ctx2.lineWidth = 35;
            ctx2.beginPath();
            ctx2.arc(center, center, r, startAngle, endAngle, false);
            ctx2.stroke();
            ctx2.fillTextCircle(properties.id, center, center, r-5, space, endAngle-0.12);
        }
        else if (properties.featureLength <= 300 && properties.featureLength >= 18) {
            ctx2.strokeStyle = "rgb(108, 240, 184)";
            ctx2.lineWidth = 35;
            ctx2.beginPath();
            ctx2.arc(center, center, r, startAngle, endAngle, false);
            ctx2.stroke();

            var x = center + (r + 30) * Math.cos(startAngle);
            var y = center + (r + 30) * Math.sin(startAngle + (space/2));

            ctx2.font = "20px sans-serif";
            ctx2.fillStyle = 'black';
            ctx2.fillText(properties.id, x, y);
        } else {
            var xOut = center + (r + 25) * Math.cos(startAngle);
            var yOut = center + (r + 25) * Math.sin(startAngle);

            var xIn = center + r * Math.cos(startAngle);
            var yIn = center + r * Math.sin(startAngle);

            var xText = center + (r + 35) * Math.cos(startAngle);
            var yText = center + (r + 35) * Math.sin(startAngle);

            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xIn, yIn);
            ctx.lineTo(xOut, yOut);
            ctx.stroke();

            ctx2.font = "10px sans-serif";
            var metrics = ctx.measureText(name);
            var textWidth = metrics.width;
            ctx2.fillStyle = 'black';
            ctx2.fillText(properties.id, xText, yText);

        }
    }

    function drawArrow(angle, reversed) {
        var x = center + r * Math.cos(angle);
        var y = center + r * Math.sin(angle);
        var xOut;
        var yOut;
        var xIn;
        var yIn;

        if (reversed === false) {
            xOut = center + (r + 25) * Math.cos(angle-0.25);
            yOut = center + (r + 25) * Math.sin(angle-0.25);

            xIn = center + (r - 25) * Math.cos(angle-0.25);
            yIn = center + (r - 25) * Math.sin(angle-0.25);
        }
        if (reversed === true) {
            xOut = center + (r + 25) * Math.cos(angle+0.25);
            yOut = center + (r + 25) * Math.sin(angle+0.25);

            xIn = center + (r - 25) * Math.cos(angle+0.25);
            yIn = center + (r - 25) * Math.sin(angle+0.25);
        }

        ctx2.strokeStyle = "rgb(117, 200, 252)";
        ctx2.fillStyle = "rgb(117, 200, 252)";
        ctx2.beginPath();
        ctx2.moveTo(x,y);
        ctx2.lineTo(xOut,yOut);
        ctx2.lineTo(xIn,yIn);
        ctx2.fill();
    }
    return visualizedData;
}
