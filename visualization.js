var exports = module.exports = {};
exports.visualize = function(res) {
    var r = 350;
    var center = 500;
    var name = $('#seqInputName').val();
    var plasmidLength = res[0].fullLength;
    console.log(res);

    var U = 2*r*Math.PI;
    var restrictionEnzymePositionsArray = [];
    var featurePositionsArray = [];


    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var canvas2 = document.getElementById("canvas2");
    var ctx2 = canvas2.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.clearRect(0, 0, canvas.width, canvas.height);

    var numRadsPerLetter = 0.05;

    CanvasRenderingContext2D.prototype.fillTextCircle = function(properties){
        var text = properties.id;


        var textMiddle = properties.textLengthInRad/2;
        var featureMiddle = (properties.endAngle + properties.startAngle)/2;
        var startRotation = featureMiddle - textMiddle;

        this.save();
        this.translate(center, center);
        this.rotate(startRotation+0.5*Math.PI);

        for(var i=0;i<text.length;i++){
            this.save();
            this.rotate(i*numRadsPerLetter);
            this.font ="bold 18px 'Source Code Pro'";
            this.fillStyle = "black";
            this.fillText(text[i],0,-(properties.textRadius-5));
            this.restore();
        }
        this.restore();
    };

    function sortPositions(array) {
        array.sort(function (a, b) {
            if (a.position > b.position) {
            return 1;
            }
            if (a.position < b.position) {
            return -1;
            }
            return 0;
        });
        return array;
    }

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(center, center, r, 0, 2*Math.PI, false);
    ctx.stroke();

    ctx.font = "40px 'Open Sans'";
    var metrics = ctx.measureText(name);
    var textWidth = metrics.width;
    ctx.fillText(name, center-(textWidth/2), center);

    checkReversed(res);

    function checkReversed(res) {
        for (var i = 0; i < res.length; i++) {
            var response = Object.assign({}, res[i]);
            if (response.reversed === false) {
            }
            else if (response.reversed === true) {
                response.start = plasmidLength - response.start - response.featureLength;
            }
            calculateAngles(response);
        }
        checkOverlappingFeatures();
        checkDensity();

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
        var entry = {};

        if (featureLength>=18) {
            entry.id = properties.id;
            entry.position = properties.start;
            entry.startAngle = startAngle;
            entry.endAngle = endAngle;
            entry.featureLength = featureLength;
            featurePositionsArray.push(entry);
            entry.reversed = properties.reversed;
        } else {
            entry.id = properties.id;
            entry.position = properties.start;
            entry.angle = startAngle;
            entry.featureLength = featureLength;

            restrictionEnzymePositionsArray.push(entry);
            drawSmallFeatures(startAngle, endAngle, properties);

        }
    }

    function checkOverlappingFeatures() {
        var sortedArray = sortPositions(featurePositionsArray);
        for (var i = 0; i < sortedArray.length; i++) {
            var feature = sortedArray[i];
            var lastFeatureEndAngle = (sortedArray[i-1]) ? sortedArray[i-1].endAngle : sortedArray[sortedArray.length-1].endAngle - 2*Math.PI;
            feature.overlap = 0;
            if (feature.startAngle <= lastFeatureEndAngle) {
                feature.overlap = +1;
                console.log('overlap');
            }
        }
        calculateTextSpace(sortedArray);
    }

    function calculateTextSpace(array) {
        for (var i = 0; i < array.length; i++) {
            var properties = array[i];
            var factor = properties.overlap;
            var radius = r - 35*factor;
            properties.radius = radius;

            var space = properties.endAngle - properties.startAngle;
            var textLengthInRad = properties.id.length * numRadsPerLetter;
            properties.textLengthInRad = textLengthInRad;

            if (space <= textLengthInRad) {
                properties.textRadius = properties.radius - 35;
            } else {
                properties.textRadius = properties.radius;
            }
        }
        modifyRadiusToFitText(array);
    }

    function modifyRadiusToFitText(array) {
        for (var i = 0; i < array.length; i++) {
            var feature = array[i];
            var lastFeatureTextRadius = (array[i-1]) ? array[i-1].textRadius : array[array.length-1].textRadius;
            if (feature.overlap !== 0 && lastFeatureTextRadius >= feature.radius) {
                feature.radius = feature.radius -40;
                feature.textRadius = feature.textRadius-40;
            }
        }
        sortFeaturesForDisplay(array);

    }

    function sortFeaturesForDisplay(array) {
        console.log(array);
        for (var i = 0; i < array.length; i++) {
            var properties = array[i];

            if (properties.featureLength >= 350 && properties.reversed === false) {
                drawArrow(properties.endAngle, false, properties.radius);
                properties.endAngle = properties.endAngle - 0.2;
                drawLargeFeatures(properties);
            }
            else if (properties.featureLength < 350 && properties.featureLength > 18) {
                drawLargeFeatures(properties);

            }
            else if (properties.featureLength >= 18 && properties.reversed === true) {
                drawArrow(properties.startAngle, true, properties.radius);
                properties.startAngle = properties.startAngle + 0.2;
                drawLargeFeatures(properties);
            }
        }
    }

    function drawLargeFeatures(properties) {

        ctx2.strokeStyle = "rgb(117, 200, 252)";
        ctx2.lineWidth = 40;
        ctx2.beginPath();
        ctx2.arc(center, center, properties.radius, properties.startAngle, properties.endAngle, false);
        ctx2.stroke();
        ctx2.fillTextCircle(properties);
    }

    function drawSmallFeatures(startAngle, endAngle, properties) {
        var xIn = center + r * Math.cos(startAngle);
        var yIn = center + r * Math.sin(startAngle);

        var xOut = center + (r + 25) * Math.cos(startAngle);
        var yOut = center + (r + 25) * Math.sin(startAngle);

        var xAngle = center + (r + 45) * Math.cos(startAngle + 0.05);
        var yAngle = center + (r + 45) * Math.sin(startAngle + 0.05);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xIn, yIn);
        ctx.lineTo(xOut, yOut);
        ctx.stroke();
    }

    function drawArrow(angle, reversed, radius) {
        var x = center + radius * Math.cos(angle);
        var y = center + radius * Math.sin(angle);
        var xOut;
        var yOut;
        var xIn;
        var yIn;

        if (reversed === false) {
            xOut = center + (radius + 30) * Math.cos(angle-0.25);
            yOut = center + (radius + 30) * Math.sin(angle-0.25);

            xIn = center + (radius - 30) * Math.cos(angle-0.25);
            yIn = center + (radius - 30) * Math.sin(angle-0.25);
        }
        if (reversed === true) {
            xOut = center + (radius + 30) * Math.cos(angle+0.25);
            yOut = center + (radius + 30) * Math.sin(angle+0.25);

            xIn = center + (radius - 30) * Math.cos(angle+0.25);
            yIn = center + (radius - 30) * Math.sin(angle+0.25);
        }

        ctx2.strokeStyle = "rgb(117, 200, 252)";
        ctx2.fillStyle = "rgb(117, 200, 252)";
        ctx2.beginPath();
        ctx2.moveTo(x,y);
        ctx2.lineTo(xOut,yOut);
        ctx2.lineTo(xIn,yIn);
        ctx2.fill();
    }

    function checkDensity() {
        var sortedArray = sortPositions(restrictionEnzymePositionsArray);
        var denseSites = [];
        var denseSitesArray = [];
        var limit = 40;

        for (var i = 0; i < sortedArray.length; i++) {
            var lastArrayPosition = (sortedArray[i-1]) ? sortedArray[i-1].position : sortedArray[sortedArray.length-1].position - plasmidLength;
            var nextArrayPosition = (sortedArray[i+1]) ? sortedArray[i+1].position : plasmidLength + sortedArray[0].position;

            if ((sortedArray[i].position < (lastArrayPosition + limit)) && (sortedArray[i].position > (nextArrayPosition - limit))) {
                denseSites.push(sortedArray[i]);
            }
            else if (sortedArray[i].position > (nextArrayPosition - limit)) {
                denseSites.push(sortedArray[i]);
            }
            else if (sortedArray[i].position < (lastArrayPosition + limit)) {
                denseSites.push(sortedArray[i]);
                denseSitesArray.push(denseSites);
                denseSites = [];
            } else {
                denseSites.push(sortedArray[i]);
                denseSitesArray.push(denseSites);
                denseSites = [];
            }
        }
        modifyTooCloseX(denseSitesArray);
    }

    function modifyTooCloseX(array) {
        console.log(array);
        for (var i = 0; i < array.length; i++) {
            var lastArray = (array[i-1]) ? array[i-1] : array[array.length-1];
            var nextArray = (array[i+1]) ? array[i+1] : array[0];
            var index = array[i].length-1;
            var xCenter = array[i][index].angle;
            var xText = center + (r + 60) * Math.cos(xCenter);
            var xTextLast = center + (r + 60) * Math.cos(lastArray[0].angle);
            var TextSpace = 40;
            var adjustment = 25;
            var featureAngle = array[i][0].angle;

            if ((1.5*Math.PI < featureAngle && featureAngle < 2*Math.PI) || (3*Math.PI < featureAngle && featureAngle < 3.5*Math.PI)) {
                if (xText - TextSpace < xTextLast) {
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
                var text = array[i][j].id;
                ctx2.font = "600 12px 'Open Sans'";
                ctx2.fillStyle = 'black';
                ctx2.fillText(text, xText, adjustedY);
                adjustedY += 12;
            }
        }
    }
};
