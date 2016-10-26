var work = require('webworkify');
var viz = require('./visualization.js');

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

    var customFeature = customFeatureArea.val();

    if (customFeature.length > 0) {
        customFeatFlag = true;
    } else {
        customFeatFlag = false;
    }



    var featuresList = [generalFeaturesCbox, single_cuttersCbox, double_cuttersCbox, tagsCbox, selection_markersCbox, customFeatFlag];

    if (generalFeaturesCbox == false && single_cuttersCbox == false && double_cuttersCbox == false && tagsCbox == false && selection_markersCbox == false && customFeature.length == 0) {
        noSelection.html(Handlebars.templates.noSel({
            selectionError: 'choose features'
        }));
        $(".loader").css("visibility", "hidden");

        return;
    }

    $(".loader").css("visibility", "visible");

    var numberOfFeatures = 0;

    checkNumberofFeatures();

    var fullData = [];

    function saveDataFromWorkerAndCallVizFunction(data, callback) {
        fullData.push(data);
        callback(fullData);

    }

    function loopAndViz(data) {
        for (var i = 0; fullData[i]; i++) {
            console.log(fullData[i]);
            viz.visualize(fullData[i]);

            if (fullData.length == numberOfFeatures) {
                $(".loader").css("visibility", "hidden");
            }

            results.html(Handlebars.templates.mapRes({
                featuresDescription: fullData[i]
            }));

        }
        counter = fullData.length;
    }

    if (generalFeaturesCbox) {

        var message = {
            generalFeaturesCbox: generalFeaturesCbox,
            ms: ms,
            mms: mms,
            gapo: gapo,
            gape: gape,
            target: target
        };
        var worker1 = work(require('./getResultsFunction.js'));

        worker1.postMessage(message); // send the worker a message
        worker1.onmessage = function(e) {

            saveDataFromWorkerAndCallVizFunction(e.data, loopAndViz);

            $("#visualizedText").css("visibility", "visible");
            var elapse = (new Date().getTime() - time_start) / 1000.0;
            document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

        }
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
        var worker2 = work(require('./getResultsFunction.js'));

        worker2.postMessage(message); // send the worker a message
        worker2.onmessage = function(e) {

            saveDataFromWorkerAndCallVizFunction(e.data, loopAndViz);

            $("#visualizedText").css("visibility", "visible");
            var elapse = (new Date().getTime() - time_start) / 1000.0;
            document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

        }
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
        var worker3 = work(require('./getResultsFunction.js'));

        worker3.postMessage(message); // send the worker a message
        worker3.onmessage = function(e) {

            saveDataFromWorkerAndCallVizFunction(e.data, loopAndViz);

            $("#visualizedText").css("visibility", "visible");
            var elapse = (new Date().getTime() - time_start) / 1000.0;
            document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

        }
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

        var worker4 = work(require('./getResultsFunction.js'));

        worker4.postMessage(message); // send the worker a message
        worker4.onmessage = function(e) {

            saveDataFromWorkerAndCallVizFunction(e.data, loopAndViz);

            $("#visualizedText").css("visibility", "visible");

            var elapse = (new Date().getTime() - time_start) / 1000.0;
            document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

        }
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
        var worker5 = work(require('./getResultsFunction.js'));

        worker5.postMessage(message); // send the worker a message
        worker5.onmessage = function(e) {

            saveDataFromWorkerAndCallVizFunction(e.data, loopAndViz);

            $("#visualizedText").css("visibility", "visible");

            var elapse = (new Date().getTime() - time_start) / 1000.0;
            document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

        }
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
        var worker6 = work(require('./getResultsFunction.js'));

        worker6.postMessage(message); // send the worker a message
        worker6.onmessage = function(e) {

            saveDataFromWorkerAndCallVizFunction(e.data, loopAndViz);

            $("#visualizedText").css("visibility", "visible");

            var elapse = (new Date().getTime() - time_start) / 1000.0;
            document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

        }

    }

    function checkNumberofFeatures() {

        for (var i = 0; i < featuresList.length; i ++) {
            if (featuresList[i] == true) {
                numberOfFeatures++
            }
        }

    //     if (generalFeaturesCbox == true) {
    //         numberOfFeatures++
    //     }
    //     if (single_cuttersCbox == true) {
    //         numberOfFeatures++
    //     }
    //     if (double_cuttersCbox == true) {
    //         numberOfFeatures++
    //     }
    //     if (tagsCbox == true) {
    //         numberOfFeatures++
    //     }
    //     if (selection_markersCbox == true) {
    //         numberOfFeatures++
    //     }
    }
});
