var work = require('webworkify');
var viz = require('./visualization.js');

var templates = document.querySelectorAll('script[type="text/handlebars"]');
Handlebars.templates = Handlebars.templates || {};
Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var $b = $('#button');
var customFeatureCheckbox = $('#custom');
var customFeatureArea = $('#customFeatureArea');
var customFeatureText = $('#customFeatureText');
var results = $('#results');
var noSelection = $('#noSelection');
var targetTextAreaAndOptions = $('#textAreaAndOptions');
var resEnzymes = $('#cbox6');
var resEnzymesContainer = $('#resEnzyme');
var advancedOptionsCheckbox = $('#advanced');
var advancedOptions = $('#advancedOptions');
var clearButton = $('#clearButton');
var orfs = $('#cbox7');
var orfOptions = $(".orfOptions");

orfs.on('click', function() {
    if(orfs.prop('checked')) {
        orfOptions.css('display', 'block');
    } else {
        orfOptions.css('display', 'none');
    }
});

resEnzymes.on('click', function() {
    if(resEnzymes.prop('checked')) {
        resEnzymesContainer.css('display', 'block');
    } else {
        resEnzymesContainer.css('display', 'none');
    }
});

customFeatureCheckbox.on('click', function () {
    if(customFeatureCheckbox.prop('checked')) {
        customFeatureText.css('display', 'block');
    } else {
        customFeatureText.css('display', 'none');
    }
});

advancedOptionsCheckbox.on('click', function () {
    if(advancedOptionsCheckbox.prop('checked')) {
        advancedOptions.css('display', 'block');
    } else {
        advancedOptions.css('display', 'none');
    }
});

clearButton.on('click', function() {
    $('#target').val('');
});

$b.on('click', function(){

    //var time_start = new Date().getTime();
    var generalFeaturesCbox = document.getElementById('cbox1').checked;
    var single_cuttersCbox = document.getElementById('cbox2').checked;
    var double_cuttersCbox = document.getElementById('cbox3').checked;
    var tagsCbox = document.getElementById('cbox4').checked;
    var selection_markersCbox = document.getElementById('cbox5').checked;
    var customFeatureName = $('#customFeatureName').val();
    var orfCBox = document.getElementById('cbox7').checked;

    var ms   = parseInt(document.getElementById('match').value);
    var mms  = parseInt(document.getElementById('mismatch').value);
    var gapo = parseInt(document.getElementById('gapo').value);
    var gape = parseInt(document.getElementById('gape').value);
    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '').toUpperCase();

    var orfMinLength = parseInt(document.getElementById('orfMinLength').value);
    var orfMaxLength = parseInt(document.getElementById('orfMaxLength').value);


    var fullData = [];
    var targetReversed = getOppositeStrand(target);

    if (orfCBox) {
        searchForORFSequence(target, false);
        searchForORFSequence(targetReversed, true);

    }

    function searchForORFSequence (target, reversed) {
        var counter = 0;
        var start = 0;
        var searchTarget = target;
        var seq;
        while(seq = searchForORFSequenceHELPER(searchTarget)) {
            counter++;
            seq[0] += start;
            seq[1] += start;
            start = seq[1];
            searchTarget = target.slice(start);
            var rev;
            if (reversed) {
                rev = 'rev'
            } else {
                rev = ''
            }
            fullData.push({
                reversed: reversed,
                type: 'ORF',
                id: 'ORF ' + counter + ' ' + rev,
                fullLength: target.length,
                featureLength: seq[1] - seq[0],
                cigar: '',
                start: seq[0],
                score: ''
            });
        }
    }

    function searchForORFSequenceHELPER(target) {
        var distance = 0;
        var start = target.indexOf('ATG');
        var subTar = target.slice(start + orfMinLength, start + orfMaxLength);
        var idx;
        idx = subTar.indexOf('TAA');
        distance += start + orfMinLength;
        while ((idx - start)%3!==0 && idx>0) {

            distance +=idx + 3;
            subTar = subTar.slice(idx + 3);

            idx = subTar.indexOf('TAA');

        }

        if (idx > 0) {
            return [start, distance + idx + 3];

        }
    }


    targetTextAreaAndOptions.css('display', 'none');
    $('#outer').css('display', 'inline-block');

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

    if (generalFeaturesCbox == false && single_cuttersCbox == false && double_cuttersCbox == false && tagsCbox == false && selection_markersCbox == false && customFeature.length == 0 && orfCBox == false) {
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
        console.log(customFeatureName)
        var message = {
            customFeatureName: customFeatureName,
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
//trzeba spróbować przerobić to na map ciekawe czy zadziała
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
            //tutaj możnaby spróbować zastosować reduce

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
        console.log('fulldata', fullData)
        callback(fullData);
    }

    function loopThroughReceivedDataAndViz(data) {
        var numPrinted = 0;
        var vizData = [];

            vizData.push(viz.visualize(fullData));


    }
    // function showTimeTextForMatches() {
    //
    //     $("#visualizedText").css("visibility", "visible");
    //     var elapse = (new Date().getTime() - time_start) / 1000.0;
    //     document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";
    //     console.log('elapse')
    //     console.log(elapse)
    // }
    function getOppositeStrand(sequence) {
        var oppStrand = '';

        for (var i = 0; i < sequence.length; i++) {
            switch(sequence[i]) {
                case 'C':
                oppStrand += 'G';
                break;
                case 'T':
                oppStrand += 'A';
                break;
                case 'A':
                oppStrand += 'T';
                break;
                case 'G':
                oppStrand += 'C';
                default:
                break;
            }
        }

        oppStrand = oppStrand.split('').reverse().join('');
        return oppStrand;
    }

});
