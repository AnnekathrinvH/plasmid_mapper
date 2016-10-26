var exports = module.exports = {};
exports.visualize = function(res) {

    var r = 250;
    var center = 500;
    var name = 'pcDNA3.1';

    var plasmidLength = res[0].fullLength;
    var U = 2*r*Math.PI;
    var visualizedData = [];
    var restrictionEnzymePositionsArray = [];


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
            var xIn = center + r * Math.cos(startAngle);
            var yIn = center + r * Math.sin(startAngle);

            var xOut = center + (r + 25) * Math.cos(startAngle);
            var yOut = center + (r + 25) * Math.sin(startAngle);

            var xAngle = center + (r + 45) * Math.cos(startAngle + 0.05);
            var yAngle = center + (r + 45) * Math.sin(startAngle + 0.05);


            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xIn, yIn);
            ctx.lineTo(xOut, yOut);
            ctx.stroke();

            var entry = {};
            entry.id = properties.id;
            entry.position = properties.start;
            entry.angle = startAngle;
            restrictionEnzymePositionsArray.push(entry);
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
    sortPositions();
    function sortPositions() {
        restrictionEnzymePositionsArray.sort(function (a, b) {
            if (a.position > b.position) {
            return 1;
            }
            if (a.position < b.position) {
            return -1;
            }
            return 0;
        });
        checkDensity(restrictionEnzymePositionsArray);
    }
    function checkDensity(array) {
        var denseSites = [];
        var denseSitesArray = [];
        var limit = 20;

        for (var i = 0; i < array.length; i++) {
            if (array[i-1] && array[i+1]) {
                if ((array[i].position < (array[i-1].position + limit)) && (array[i].position > (array[i+1].position - limit))) {
                    denseSites.push(array[i]);

                }
                else if (array[i].position > (array[i+1].position - limit)) {
                    denseSites.push(array[i]);
                    denseSites.push(array[i+1]);
                }
                else if (array[i].position < (array[i-1].position + limit)) {
                    denseSites.push(array[i]);
                    denseSitesArray.push(denseSites);
                    denseSites = [];

                } else {
                    //denseSitesArray.push(denseSites);
                    denseSites = [];

                    var xText = center + (r + 50) * Math.cos(array[i].angle);
                    var yText = center + (r + 50) * Math.sin(array[i].angle);

                    ctx2.font = "10px sans-serif";
                    var metrics = ctx.measureText(name);
                    var textWidth = metrics.width;
                    console.log(textWidth);
                    ctx2.fillStyle = 'black';
                    ctx2.fillText(array[i].id, xText, yText);
                }
            }
        }
        labelDenseSites(denseSitesArray);
    }
    function checkTooCloseX() {

    }

    function labelDenseSites(array) {
        console.log(array);
        for (var i = 0; i < array.length; i++) {
            var xText = center + (r + 60) * Math.cos(array[i][0].angle);
            var yText = center + (r + 60) * Math.sin(array[i][0].angle);

            for (var j = 0; j < array[i].length; j++) {
                ctx2.font = "10px sans-serif";
                ctx2.fillStyle = 'black';
                ctx2.fillText(array[i][j].id, xText, yText);
                yText += 10;
            }
        }
    }


    return visualizedData;
};
