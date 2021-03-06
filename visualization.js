var exports = module.exports = {};
exports.visualize = function(res) {
    var templates = document.querySelectorAll('script[type="text/handlebars"]');
    Handlebars.templates = Handlebars.templates || {};
    Array.prototype.slice.call(templates).forEach(function(script) {
        Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
    });

    var results = $('#results');

    var r = 350;
    var center = 500;
    var name = $('#seqInputName').val();
    var plasmidLength = $("#target").val().length;
    var U = 2*r*Math.PI;
    var restrictionEnzymePositionsArray = [];
    var featurePositionsArray = [];
    var allFeatures = [];


    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");
    var canvas2 = document.getElementById('canvas2');
    var ctx2 = canvas2.getContext("2d");
    var canvas3 = document.getElementById('canvas3');
    var ctx3 = canvas3.getContext("2d");
    var canvasAll = document.getElementById('canvasAll');
    var ctxAll = canvasAll.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    ctx3.clearRect(0, 0, canvas.width, canvas.height);
    ctxAll.clearRect(0, 0, canvas.width, canvas.height);


    var numRadsPerLetter = 0.05;

    CanvasRenderingContext2D.prototype.fillTextCircle = function(properties){
        var text = properties.text;
        var position = properties.start+'-'+(properties.start+properties.featureLength);

        var textMiddle = properties.textLengthInRad/2;
        var featureMiddle = (properties.endAngle + properties.startAngle)/2;
        var startRotation = featureMiddle - textMiddle;
        if (properties.reversed === true) {
            startRotation = featureMiddle -textMiddle;
        }

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

    function drawOneCanvas() {
        ctxAll.drawImage(canvas, 0, 0);
        ctxAll.drawImage(canvas3, 0, 0);
        ctxAll.drawImage(canvas2, 0, 0);
    }

    function sortPositions(array) {
        array.sort(function (a, b) {
            if (a.start > b.start) {
            return 1;
            }
            if (a.start < b.start) {
            return -1;
            }
            if (a.start === b.start){
                var nameA = a.id.toUpperCase();
                var nameB = b.id.toUpperCase();
                if (nameA < nameB) {
                return -1;
                }
                if (nameA > nameB) {
                return 1;
                }
                return 0;
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
    var nameMetrics = ctx.measureText(name);
    var nameWidth = nameMetrics.width;
    var lengthLabel = plasmidLength + ' bp';
    var bpMetrics = ctx.measureText(lengthLabel);
    var bpWidth = bpMetrics.width;
    ctx.fillText(name, center-(nameWidth/2), center);
    var y;
    if (name === '') {
        y = center;
    } else {
        y = center + 50;
    }
    ctx.fillText(lengthLabel, center-(bpWidth/2), y);


    check(res);
    function check(res) {
        for (var i = 0; i < res.length; i++) {
            res[i].checked = 'checked';
            res[i].uniqueId = i;
        }
        copyResponse(res);
    }

    function copyResponse(res) {

        var copiedResponse = [];
        restrictionEnzymePositionsArray = [];
        featurePositionsArray = [];
        allFeatures = [];
        for (var i = 0; i < res.length; i++) {
            var element = Object.assign({}, res[i]);

            allFeatures.push(element);

            if (element.reversed === true) {
                element.start = plasmidLength - element.start - element.featureLength;
            }
            copiedResponse.push(element);
        }
        allFeatures = sortPositions(allFeatures);

        sortOutUnchecked(copiedResponse);
    }

    function sortOutUnchecked(copiedResponse) {
        function isChecked(value) {
            if (value.checked === 'checked') {
              return true;
            } else {
              return false;
            }
        }
        var filteredResponse = copiedResponse.filter(isChecked);
        for (var i = 0; i < filteredResponse.length; i++) {
            calculateAngles(filteredResponse[i]);
        }
        checkOverlappingFeatures();
        checkDensity();
    }

    function calculateAngles(element) {
        var featureStart = element.start;
        var featureLength = element.featureLength;
        var featureEnd = featureStart + featureLength;
        var percentageStart = featureStart/plasmidLength;
        var percentageEnd = featureEnd/plasmidLength;
        var firstLength = U*percentageStart;
        var secondLength = U*percentageEnd;
        var startAngle = firstLength/r+1.5*Math.PI;
        var endAngle = secondLength/r+1.5*Math.PI;
        var modifiedElement = {};
        modifiedElement.id = element.id;
        modifiedElement.start = element.start;
        modifiedElement.featureLength = featureLength;
        modifiedElement.startAngle = startAngle;
        modifiedElement.checked = element.checked;
        modifiedElement.uniqueId = element.uniqueId;

        if (featureLength>=18) {
            modifiedElement.endAngle = endAngle;
            modifiedElement.type = element.type;
            modifiedElement.reversed = element.reversed;
            featurePositionsArray.push(modifiedElement);
        }
        else {
            restrictionEnzymePositionsArray.push(modifiedElement);
            drawSmallFeatures(modifiedElement);
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
            var text = properties.id;

            var space = properties.endAngle - properties.startAngle;
            var textLengthInRad = text.length * numRadsPerLetter;
            properties.textLengthInRad = textLengthInRad;
            properties.text = text;

            if (space-0.1 <= textLengthInRad) {
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
        setUpColors(array);

    }

    function setUpColors(array) {
        for (var i = 0; i < array.length; i++) {
            var properties = array[i];
            if (properties.type === 'general') {
                properties.color = "rgb(117, 252, 200)";
            }
            else if (properties.type === 'prom') {
                properties.color = "rgb(117, 200, 252)";
            }
            else if (properties.type === 'ori') {
                properties.color = "rgb(63, 155, 164)";
            }
            else if (properties.type === 'terminator') {
                properties.color = "rgb(58, 189, 181)";
            }
            else if (properties.type === 'tag') {
                properties.color = "rgb(117, 228, 252)";
            }
            else if (properties.type === 'marker') {
                properties.color = "rgb(252, 117, 117)";
            } else {
                properties.color = "rgb(117, 200, 252)";
            }
        }
        sortFeaturesForDisplay(array);
    }

    function sortFeaturesForDisplay(array) {

        for (var i = 0; i < array.length; i++) {
            var properties = array[i];

            if (properties.featureLength >= 350 && properties.reversed === false) {
                drawArrow(properties.endAngle, false, properties);
                drawLargeFeatures(properties);
            }
            else if (properties.featureLength < 350 && properties.featureLength > 18) {
                drawLargeFeatures(properties);
            }
            else if (properties.featureLength >= 350 && properties.reversed === true) {
                drawArrow(properties.startAngle, true, properties);
                drawLargeFeatures(properties);
            }
        }
    }

    function drawLargeFeatures(properties) {
        var start = properties.startAngle;
        var end = properties.endAngle;

        if (properties.featureLength >= 350 && properties.reversed === false) {
            end -= 0.2;
        }
        else if (properties.featureLength >= 350 && properties.reversed ===true) {
            start += 0.2;
        }
        ctx2.strokeStyle = properties.color;
        ctx2.lineWidth = 40;
        ctx2.beginPath();
        ctx2.arc(center, center, properties.radius, start, end, false);
        ctx2.stroke();
        ctx2.fillTextCircle(properties);
    }

    function drawSmallFeatures(properties) {
        var startAngle = properties.startAngle;
        var xIn = center + r * Math.cos(startAngle);
        var yIn = center + r * Math.sin(startAngle);

        var xOut = center + (r + 25) * Math.cos(startAngle);
        var yOut = center + (r + 25) * Math.sin(startAngle);

        var xAngle = center + (r + 45) * Math.cos(startAngle + 0.05);
        var yAngle = center + (r + 45) * Math.sin(startAngle + 0.05);
        ctx2.strokeStyle = "black";
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.moveTo(xIn, yIn);
        ctx2.lineTo(xOut, yOut);
        ctx2.stroke();
    }

    function drawArrow(angle, reversed, properties) {
        var radius = properties.radius;

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

        ctx2.strokeStyle = properties.color;
        ctx2.fillStyle = properties.color;
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
            var lastArrayPosition = (sortedArray[i-1]) ? sortedArray[i-1].start : sortedArray[sortedArray.length-1].start - plasmidLength;
            var nextArrayPosition = (sortedArray[i+1]) ? sortedArray[i+1].start : plasmidLength + sortedArray[0].start;

            if ((sortedArray[i].start < (lastArrayPosition + limit)) && (sortedArray[i].start > (nextArrayPosition - limit))) {
                denseSites.push(sortedArray[i]);
            }
            else if (sortedArray[i].start > (nextArrayPosition - limit)) {
                denseSites.push(sortedArray[i]);
            }
            else if (sortedArray[i].start < (lastArrayPosition + limit)) {
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
        for (var i = 0; i < array.length; i++) {
            var lastArray = (array[i-1]) ? array[i-1] : array[array.length-1];
            var nextArray = (array[i+1]) ? array[i+1] : array[0];
            var index = array[i].length-1;
            var xCenter = array[i][index].startAngle;
            var xText = center + (r + 60) * Math.cos(xCenter);
            var xTextLast = center + (r + 60) * Math.cos(lastArray[0].startAngle);
            var TextSpace = 50;
            var adjustment = 25;
            var featureAngle = array[i][0].startAngle;

            if ((1.5*Math.PI < featureAngle && featureAngle < 2*Math.PI)) {
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
            else if ((3*Math.PI < featureAngle && featureAngle < 3.5*Math.PI)) {
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
            else if ((2*Math.PI < featureAngle && featureAngle < 2.5*Math.PI)) {
                if (xText + TextSpace > xTextLast) {
                    if (lastArray[0].xAdjusted) {
                        adjustment += adjustment;
                    }
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText - adjustment;
                        array[i][j].xAdjusted = true;
                    }
                } else {
                    xText = center + (r + 60) * Math.cos(array[i][0].startAngle);
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText;
                        array[i][j].xAdjusted = false;
                    }
                }
            }
            else if ((2.5*Math.PI < featureAngle && featureAngle < 3*Math.PI)) {
                if (xText + TextSpace > xTextLast) {
                    if (lastArray[0].xAdjusted) {
                        adjustment += adjustment;
                    }
                    for (var j = 0; j < array[i].length; j++) {
                        array[i][j].xText = xText - adjustment;
                        array[i][j].xAdjusted = true;
                    }
                } else {
                    xText = center + (r + 60) * Math.cos(array[i][0].startAngle);
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
            var yCenter = (array[i][0].startAngle + array[i][index].startAngle)/2;
            var yText = center + (r + 60) * Math.sin(yCenter);
            var arrayMiddle = array[i].length/2;
            var heightPerLetter = 10;
            var yAdjustment = arrayMiddle*heightPerLetter;
            var adjustedY;

            var heightOfArray = array[i].length*heightPerLetter;
            var lastArray = (array[i-1]) ? array[i-1] : array[array.length-1];
            var nextArray = (array[i+1]) ? array[i+1] : array[0];



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
                array[i][j].yPosition = adjustedY;
                adjustedY += 12;
            }
        }
        listenToEvents(array);
    }

    function listenToEvents(array) {
        var elem = document.getElementById('mirror'),
            elements = [];

            var left = elem.offsetLeft;
            var top = elem.offsetTop;

            var elemLeft = 0,
                elemTop = 0,
                parent = elem;

            var outer = document.getElementById('outer');
            var container = document.getElementById('containsEverything');

            while (parent) {
                elemLeft += parent.offsetLeft;
                elemTop += parent.offsetTop;
                parent = parent.offsetParent;
            }

        elem.addEventListener('mousemove', function(event) {
            var x = event.pageX - elemLeft,
                y = event.pageY - elemTop;
            x = event.layerX;
            y = event.layerY;
            ctx2.clearRect(0, 0, canvas.width, canvas.height);

            var highlightedElement;
            for (var i = 0; i < array.length; i++) {
                for (var j = 0; j < array[i].length; j++) {
                    var element = array[i][j];
                    drawSmallFeatures(element);
                    if (y > element.yPosition -12 && y < element.yPosition && x > element.xText && x < element.xText + 80) {
                        highlightedElement = element;
                    }
                    else {
                        ctx2.font = "600 12px 'Open Sans'";
                        ctx2.fillStyle = 'black';
                        ctx2.fillText(element.id, element.xText, element.yPosition);
                    }
                }
            }
            for (var k = 0; k < featurePositionsArray.length; k++) {
                var properties = featurePositionsArray[k];

                if (properties.featureLength >= 350 && properties.reversed === false) {
                    drawArrow(properties.endAngle, false, properties);
                    drawLargeFeatures(properties);
                }
                else if (properties.featureLength < 350 && properties.featureLength > 18) {
                    drawLargeFeatures(properties);
                }
                else if (properties.featureLength >= 350 && properties.reversed === true) {
                    drawArrow(properties.startAngle, true, properties);
                    drawLargeFeatures(properties);
                }
            }

            if (highlightedElement) {
                var text = highlightedElement.id+' ('+highlightedElement.start+')';
                ctx2.font = "bold 20px 'Open Sans'";
                var textMetrics = ctx2.measureText(text);
                var textWidth = textMetrics.width;
                ctx2.fillStyle = 'white';
                ctx2.fillRect(highlightedElement.xText, highlightedElement.yPosition-18, textWidth+3, 24);
                ctx2.fillStyle = 'black';
                ctx2.fillText(text, highlightedElement.xText, highlightedElement.yPosition);
            }
        }, false);

    }

    results.html(Handlebars.templates.mapRes({
        featuresDescription: allFeatures
    }));

    var listOfFeatures = $('.listOfFeatures');

    listOfFeatures.on('click', function (event) {
        var selectedFeature = event.target.id;
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        function isInArray(element) {
          return element.uniqueId == selectedFeature;
        }
        if (res.find(isInArray)) {
            var index = res.findIndex(isInArray);
            if (($('#'+ selectedFeature).prop('checked'))=== false) {
                res[index].checked = '';
            }
            else if ($('#'+ selectedFeature).prop('checked')) {
                res[index].checked = 'checked';
            }
        }

        copyResponse(res);
    });

    ctxAll.fillStyle = "white";
    ctxAll.fillRect(0, 0, 1000, 1000);
    drawOneCanvas();

    mirror.addEventListener('contextmenu', function (e) {
        var dataURL = canvasAll.toDataURL('image/png');
        mirror.src = dataURL;
    });

};
