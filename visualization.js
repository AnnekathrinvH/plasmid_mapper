function visualize(res) {
    var r = 250;
    var center = 300;
    var cigarArray = [];
    var name = 'pcDNA3.1';
    console.log(res);
    var length = res[1].fullLength;
    console.log(length);

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    clear();

    ctx.beginPath();
    ctx.arc(center, center, r, 0, 2*Math.PI, false);
    ctx.stroke();

    ctx.font = "40px sans-serif";
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    console.log(textWidth);
    ctx.fillText(name, center-(textWidth/2), center);

    for (var i = 1; i < res.length; i++) {
        if (res[i].featureLength- res[i].score < 100) {
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
        console.log(cigarArray);
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
            var percentageStart = subFeatureStart/length;
            var percentageEnd = subFeatureEnd/length;
            var firstLength = U*percentageStart;
            var secondLength = U*percentageEnd;
            var startAngle = firstLength/r+1.5*Math.PI;
            var endAngle = secondLength/r+1.5*Math.PI;
            if (i === cigarArray.length -1 && featureLength>200) {
                drawArrow(endAngle);
                drawMap(startAngle, endAngle-0.2, type, featureLength);
            } else {
                drawMap(startAngle, endAngle, type, featureLength);

            }
        }
    }

    function drawMap(startAngle, endAngle, type, featureLength) {
        console.log(featureLength);
        if (featureLength>200) {
            if (type === 'M') {
                console.log('M');
                ctx.strokeStyle = "rgb(117, 200, 252)";
                ctx.lineWidth = 35;
                ctx.beginPath();
                ctx.arc(center, center, r, startAngle, endAngle, false);
                ctx.stroke();
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

        var xOut = center + (r + 25) * Math.cos(endAngle-0.2);
        var yOut = center + (r + 25) * Math.sin(endAngle-0.2);

        var xIn = center + (r - 25) * Math.cos(endAngle-0.2);
        var yIn = center + (r - 25) * Math.sin(endAngle-0.2);

        ctx.strokeStyle = "rgb(117, 200, 252)";
        ctx.fillStyle = "rgb(117, 200, 252)"
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
