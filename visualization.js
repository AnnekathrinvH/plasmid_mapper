function visualize(res) {
    var r = 250;
    var center = 300;
    var cigarArray = [];
    var name = 'pcDNA3.1';
    console.log(res);
    var plasmidLength = res[0].fullLength;

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    CanvasRenderingContext2D.prototype.fillTextCircle = function(text, x, y, radius, startRotation, space){
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
    };

    clear();

    ctx.beginPath();
    ctx.arc(center, center, r, 0, 2*Math.PI, false);
    ctx.stroke();

    ctx.font = "40px sans-serif";
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    ctx.fillText(name, center-(textWidth/2), center);

    for (var i = 1; i < res.length; i++) {
        if (res[i].score/res[i].featureLength > 0.98 && res[i].reversed === undefined) {
            parseCigar(res[i]);
        }
        if (res[i].score/res[i].featureLength > 0.9 && res[i].reversed === true) {
            res[i].start = plasmidLength - res[i].start;
            console.log(res[i]);
            parseCigar(res[i]);
        }
    }

    function parseCigar(properties) {
        var str = properties.cigar;
        var s = '';
        var letters = 'SMDI';
        for (var i = 0; i < str.length; i++) {
            if (letters.indexOf(str[i]) >= 0) {
                var entry = {
                    nucleotides: parseInt(s, 10),
                    type: str[i]
                };
                cigarArray.push(entry);
                s = '';
            }
            else if(letters.indexOf(str[i]) <= 0) {
                s += str[i];
            }
        }
        calculateAngles(cigarArray, properties);
    }


    function calculateAngles(cigarArray, properties) {
        var U = 2*r*Math.PI;
        var featureStart = properties.start;
        var featureLength = properties.featureLength;
        var featureEnd = featureStart + featureLength;

        for (var i = 0; i < cigarArray.length; i++) {
            var type = cigarArray[i].type;
            var subFeatureStart = (cigarArray[i-1] === undefined) ? featureStart : (subFeatureStart + cigarArray[i-1].nucleotides);
            var subFeatureEnd = subFeatureStart + cigarArray[i].nucleotides;
            var percentageStart = subFeatureStart/plasmidLength;
            var percentageEnd = subFeatureEnd/plasmidLength;
            var firstLength = U*percentageStart;
            var secondLength = U*percentageEnd;
            var startAngle = firstLength/r+1.5*Math.PI;
            var endAngle = secondLength/r+1.5*Math.PI;

            if (i === cigarArray.length -1 && featureLength>200) {
                drawArrow(endAngle);
                drawMap(startAngle, endAngle-0.2, type, properties);
            } else {
                drawMap(startAngle, endAngle, type, properties);
            }
        }
    }

    function drawMap(startAngle, endAngle, type, properties) {
        if (properties.featureLength>200) {
            if (type === 'M') {
                console.log('M');
                ctx.strokeStyle = "rgb(117, 200, 252)";
                ctx.lineWidth = 35;
                ctx.beginPath();
                ctx.arc(center, center, r, startAngle, endAngle, false);
                ctx.stroke();
                var space = endAngle - startAngle;
                ctx.fillTextCircle(properties.id, center, center, r, startAngle, space);

            }
            if (type === "D") {
                console.log('D');
                var xStart = center + r * Math.cos(startAngle);
                var yStart = center + r * Math.sin(startAngle);
                var xEnd = center + r * Math.cos(endAngle);
                var yEnd = center + r * Math.sin(endAngle);
                var middleAngle = (endAngle + startAngle)/2;
                var xMiddle = center + (r + 15) * Math.cos(middleAngle);
                var yMiddle = center + (r + 15) * Math.sin(middleAngle);
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(xStart,yStart);
                ctx.lineTo(xMiddle, yMiddle);
                ctx.lineTo(xEnd,yEnd);
                ctx.stroke();
            }
            if (type === "S") {
                var xSStart = center + (r + 15) * Math.cos(startAngle);
                var ySStart = center + (r + 15) * Math.sin(startAngle);
                var xSEnd = center + r * Math.cos(endAngle);
                var ySEnd = center + r * Math.sin(endAngle);

                ctx.strokeStyle = "blue";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(xSStart,ySStart);
                ctx.lineTo(xSEnd,ySEnd);
                ctx.stroke();
            }

        } else {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(center, center, r, startAngle, endAngle, false);
            ctx.stroke();
        }
        cigarArray = [];
    }

    function drawArrow(endAngle) {
        var x = center + r * Math.cos(endAngle);
        var y = center + r * Math.sin(endAngle);
        console.log(x, y);

        var xOut = center + (r + 25) * Math.cos(endAngle-0.25);
        var yOut = center + (r + 25) * Math.sin(endAngle-0.25);

        var xIn = center + (r - 25) * Math.cos(endAngle-0.25);
        var yIn = center + (r - 25) * Math.sin(endAngle-0.25);

        ctx.strokeStyle = "rgb(117, 200, 252)";
        ctx.fillStyle = "rgb(117, 200, 252)";
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(xOut,yOut);
        ctx.lineTo(xIn,yIn);
        ctx.fill();
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

}
