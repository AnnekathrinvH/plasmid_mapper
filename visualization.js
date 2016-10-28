var exports = module.exports = {};
exports.visualize = function(res) {
    var r = 250;
    var center = 500;
    var name = 'pcDNA3.1';
    console.log('res');
    console.log(res);
    var plasmidLength = res[0].fullLength;


    console.log(plasmidLength);
    var U = 2*r*Math.PI;
    var visualizedData = [];
    var restrictionEnzymePositionsArray = [];

    console.log('visualize');
    console.log(res);

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var canvas2 = document.getElementById("canvas2");
    var ctx2 = canvas2.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.clearRect(0, 0, canvas.width, canvas.height);


    CanvasRenderingContext2D.prototype.fillTextCircle = function(text, endAngle, startAngle){
        var space = endAngle - startAngle;
        var numRadsPerLetter = 0.06;
        var textLengthInRad = text.length * numRadsPerLetter;
        console.log(text);
        console.log(textLengthInRad);
        console.log(space);
        var textMiddle = textLengthInRad/2;
        var featureMiddle = endAngle - space/2;
        var startRotation = featureMiddle - textMiddle;

        this.save();
        this.translate(center, center);
        this.rotate(startAngle+0.5*Math.PI);

        for(var i=0;i<text.length;i++){
            this.save();
            this.rotate(i*numRadsPerLetter);
            this.font ="18px Courier";
            this.fillStyle = "black";
            this.fillText(text[i],0,-(r-5));
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



    for (var i = 0; i < res.length; i++) {
        if (res[i].reversed === false) {

            calculateAngles(res[i]);

        }
        else if (res[i].reversed === true) {
            res[i].start = plasmidLength - res[i].start - res[i].featureLength;
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

        else if (featureLength>300 && properties.reversed === false) {
            drawArrow(endAngle, false);
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
            ctx2.fillTextCircle(properties.id, endAngle, startAngle);
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
        var limit = 40;

        for (var i = 0; i < array.length; i++) {
            var lastArrayPosition = (array[i-1]) ? array[i-1].position : array[array.length-1].position - plasmidLength;
            var nextArrayPosition = (array[i+1]) ? array[i+1].position : plasmidLength + array[0].position;

            if ((array[i].position < (lastArrayPosition + limit)) && (array[i].position > (nextArrayPosition - limit))) {
                denseSites.push(array[i]);
            }
            else if (array[i].position > (nextArrayPosition - limit)) {
                denseSites.push(array[i]);
            }
            else if (array[i].position < (lastArrayPosition + limit)) {
                denseSites.push(array[i]);
                denseSitesArray.push(denseSites);
                denseSites = [];
            } else {
                denseSites.push(array[i]);
                denseSitesArray.push(denseSites);
                denseSites = [];
            }
        }
        modifyTooCloseX(denseSitesArray);
    }

    function modifyTooCloseX(array) {
        for (var i = 0; i < array.length; i++) {
            var lastArray = (array[i-1]) ? array[i-1] : array[array.length-1];
            var nextArray = (array[i+1]) ? array[i+1] : array[0];
            var index = array[i].length-1;
            var xCenter = (array[i][0].angle + array[i][index].angle)/2;
            var xText = center + (r + 60) * Math.cos(xCenter);
            var xTextLast = center + (r + 60) * Math.cos(lastArray[0].angle);
            var TextSpace = 40;
            var adjustment = 25;
            var featureAngle = array[i][0].angle;

            if ((1.5*Math.PI < featureAngle && featureAngle < 2*Math.PI) || (3*Math.PI < featureAngle && featureAngle < 3.5*Math.PI)) {
                if (xText - TextSpace < xTextLast) {
                    console.log('dense');
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText + adjustment;
                        array[i][j].xAdjusted = true;
                    }
                } else {
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText;
                        array[i][j].xAdjusted = false;
                    }
                }
            }
            else if ((2*Math.PI < featureAngle && featureAngle < 2.5*Math.PI) || (2.5*Math.PI < featureAngle && featureAngle < 3*Math.PI)) {
                if (xText + TextSpace > xTextLast) {
                    console.log('dense');
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText - adjustment;
                        array[i][j].xAdjusted = true;
                    }
                } else {
                    xText = center + (r + 60) * Math.cos(array[i][0].angle);
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText;
                        array[i][j].xAdjusted = false;
                    }
                }
            }

        }
        labelDenseSites(array);
    }

    function labelDenseSites(array) {
        console.log(array);
        for (var i = 0; i < array.length; i++) {
            var xText = array[i][0].xText;
            var index = array[i].length-1;
            var yCenter = (array[i][0].angle + array[i][index].angle)/2;
            var yText = center + (r + 60) * Math.sin(yCenter);
            var arrayMiddle = array[i].length/2;
            var heightPerLetter = 10;
            var yAdjustment = arrayMiddle*heightPerLetter;
            var adjustedY;

            if ((1.5*Math.PI < yCenter && yCenter < 2*Math.PI) || (3*Math.PI < yCenter && yCenter < 3.5*Math.PI)) {
                adjustedY = yText - yAdjustment;
            }
            else if ((2*Math.PI < yCenter && yCenter < 2.5*Math.PI) || (2.5*Math.PI < yCenter && yCenter < 3*Math.PI)) {
                adjustedY = yText;
            }

            for (var j = 0; j < array[i].length; j++) {
                ctx2.font = "10px sans-serif";
                ctx2.fillStyle = 'black';
                ctx2.fillText(array[i][j].id, xText-10, adjustedY);
                adjustedY += 10;
            }
        }
    }


    return visualizedData;
};
