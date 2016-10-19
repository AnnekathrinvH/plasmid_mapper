function visualize(res) {
    var r = 250;
    var center = 300;
    var name = 'pcDNA3.1';
    console.log(res);
    var plasmidLength = res[0].fullLength;

    var hasLabel;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    //ctx.globalCompositeOperation = "lighter";

    CanvasRenderingContext2D.prototype.fillTextCircle = function(text, x, y, radius, startRotation, space){
        console.log(hasLabel);
        if (hasLabel === false) {
            if (text.length < 5) {
                text = " "+ text + " ";
            }
            var numRadsPerLetter = space / text.length;

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
            hasLabel = true;
        }
    };


    ctx.beginPath();
    ctx.arc(center, center, r, 0, 2*Math.PI, false);
    ctx.stroke();

    ctx.font = "40px sans-serif";
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    ctx.fillText(name, center-(textWidth/2), center);

    for (var i = 1; i < res.length; i++) {
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === undefined) {
            hasLabel = false;
            calculateAngles(res[i]);

        }
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === true) {
            res[i].start = plasmidLength - res[i].start - res[i].featureLength;
            hasLabel = false;
            calculateAngles(res[i]);
        }
    }


    function calculateAngles(properties) {
        var U = 2*r*Math.PI;
        var featureStart = properties.start;
        var featureLength = properties.featureLength;
        var featureEnd = featureStart + featureLength;
        var percentageStart = featureStart/plasmidLength;
        var percentageEnd = featureEnd/plasmidLength;
        var firstLength = U*percentageStart;
        var secondLength = U*percentageEnd;
        var startAngle = firstLength/r+1.5*Math.PI;
        var endAngle = secondLength/r+1.5*Math.PI;

        if (featureLength>200 && properties.reversed === true) {
            drawArrow(startAngle, true);
            drawMap(startAngle+0.2, endAngle, properties);
        }
        else if (featureLength>200 && properties.reversed === undefined) {
            drawArrow(endAngle);
            drawMap(startAngle, endAngle-0.2, properties);
        } else {
            drawMap(startAngle, endAngle, properties);
        }

    }

    function drawMap(startAngle, endAngle, properties) {
        console.log(properties.id, properties.cigar);
        if (properties.featureLength>200) {
            ctx.strokeStyle = "rgb(117, 200, 252)";
            ctx.lineWidth = 35;
            ctx.beginPath();
            ctx.arc(center, center, r, startAngle, endAngle, false);
            ctx.stroke();
            var space = endAngle - startAngle;
            ctx.fillTextCircle(properties.id, center, center, r, startAngle, space);

        } else {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(center, center, r, startAngle, endAngle, false);
            ctx.stroke();
        }
    }

    function drawArrow(angle, reversed) {
        var x = center + r * Math.cos(angle);
        var y = center + r * Math.sin(angle);
        var xOut;
        var yOut;
        var xIn;
        var yIn;

        if (reversed === undefined) {
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

        ctx.strokeStyle = "rgb(117, 200, 252)";
        ctx.fillStyle = "rgb(117, 200, 252)";
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(xOut,yOut);
        ctx.lineTo(xIn,yIn);
        ctx.fill();
    }


}
