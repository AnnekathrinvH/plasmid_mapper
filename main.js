var work = require('webworkify');
var viz = require('./visualization.js');

console.log('hello')

var templates = document.querySelectorAll('script[type="text/handlebars"]');
Handlebars.templates = Handlebars.templates || {};
Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var $b = $('#button');
var customButton = $('#customButton');
var customFeatureArea = $('#customFeatureArea');
var customFeatureText = $('#customFeatureText');
var results = $('#results');
var noSelection = $('#noSelection');
var targetTextAreaAndOptions = $('#textAreaAndOptions');


customButton.on('click', function () {
    customButton.css('visibility', 'hidden');
    customFeatureArea.css('visibility', 'visible');
    customFeatureText.css('visibility', 'visible');

});

$b.on('click', function(){

    var time_start = new Date().getTime();
    var generalFeaturesCbox = document.getElementById('cbox1').checked;
    var single_cuttersCbox = document.getElementById('cbox2').checked;
    var double_cuttersCbox = document.getElementById('cbox3').checked;
    var tagsCbox = document.getElementById('cbox4').checked;
    var selection_markersCbox = document.getElementById('cbox5').checked;

    var ms   = parseInt(document.getElementById('match').value);
    var mms  = parseInt(document.getElementById('mismatch').value);
    var gapo = parseInt(document.getElementById('gapo').value);
    var gape = parseInt(document.getElementById('gape').value);
    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');

    targetTextAreaAndOptions.css('display', 'none');
    $('#outer').css('visibility','visible');

    var customFeature = customFeatureArea.val();

    if (customFeature.length > 0) {
        customFeatFlag = true;
    } else {
        customFeatFlag = false;
    }

    if (generalFeaturesCbox) {
        var featuresTwo = true;
    } else {
        var featuresTwo = false;
    }

    var featuresList = [generalFeaturesCbox, single_cuttersCbox, double_cuttersCbox, tagsCbox, selection_markersCbox, customFeatFlag, featuresTwo];

    if (generalFeaturesCbox == false && single_cuttersCbox == false && double_cuttersCbox == false && tagsCbox == false && selection_markersCbox == false && customFeature.length == 0) {
        noSelection.html(Handlebars.templates.noSel({
            selectionError: 'choose features'
        }));
        $("#demo").css("display", "none");

        return;
    }

    $("#demo").css("display", "table");

    var numberOfFeatures = 0;
    var numberOfmessagesFromWorkers = 0;

    checkNumberofFeatures();

    var fullData = [];

    if (generalFeaturesCbox) {

        var message = {
            generalFeaturesCbox: generalFeaturesCbox,
            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };

        createWorkerAndMenageData(message);

        // var message1 = new Message('featuresTwo', featuresTwo);
        var message1 = {
            featuresTwo: featuresTwo,
            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };

        createWorkerAndMenageData(message1);

    }

    if (single_cuttersCbox) {

        var message = {

            single_cuttersCbox: single_cuttersCbox,

            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };

        createWorkerAndMenageData(message);

    }

    if (double_cuttersCbox) {

        var message = {

            double_cuttersCbox: double_cuttersCbox,

            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };

        createWorkerAndMenageData(message);

    }

    if (tagsCbox) {

        var message = {
            tagsCbox: tagsCbox,
            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };

        createWorkerAndMenageData(message);

    }

    if (selection_markersCbox) {

        var message = {

            selection_markersCbox: selection_markersCbox,
            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };

        createWorkerAndMenageData(message);

    }

    if (customFeature.length > 0) {

        var message = {

            customFeatFlag: customFeatFlag,
            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target,
            customFeature: customFeature

        };

        createWorkerAndMenageData(message);

    }

    function checkNumberofFeatures() {

        for (var i = 0; i < featuresList.length; i ++) {
            if (featuresList[i] == true) {
                numberOfFeatures++
            }
        }
    }

    function createWorkerAndMenageData(message) {

        var worker = work(require('./getResultsFunction.js'));

        worker.postMessage(message); // send the worker a message
        worker.onmessage = function(e) {
            numberOfmessagesFromWorkers++;

            var filteredDataBasedOnScore = e.data.filter(function (obj) {

                if (obj.score/obj.featureLength > 0.98) {

                    return obj;
                }
            });

            saveDataFromWorkerAndCallVizFunction(filteredDataBasedOnScore, loopThroughReceivedDataAndViz);
            if (numberOfmessagesFromWorkers == numberOfFeatures) {
                $("#demo").css("display", "none");

            }
            //showTimeTextForMatches();
        }
    }


    function saveDataFromWorkerAndCallVizFunction(data, callback) {

        for (var i = 0; data[i]; i++) {
            fullData.push(data[i]);
        }

        callback(fullData);
    }

    function loopThroughReceivedDataAndViz(data) {
        var numPrinted = 0;
        var vizData = [];
        // for (var i = 0; fullData[i]; i++) {

            viz.visualize(fullData);
        //     results.html(Handlebars.templates.mapRes({
        //         featuresDescription: vizData[i]
        //     }))
        //
        // }
        counter = fullData.length;
    }

    // function showTimeTextForMatches() {
    //
    //     $("#visualizedText").css("visibility", "visible");
    //     var elapse = (new Date().getTime() - time_start) / 1000.0;
    //     document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";
    //
    // }
});
