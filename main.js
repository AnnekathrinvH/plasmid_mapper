var work = require('webworkify');
var viz = require('./visualization.js');

var templates = document.querySelectorAll('script[type="text/handlebars"]');
Handlebars.templates = Handlebars.templates || {};
Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
});

var $b = $('#button');
var results = $('#results');
var noSelection = $('#noSelection');

$b.on('click', function(){

    var time_start = new Date().getTime();
    var generalFeaturesCbox = document.getElementById('cbox1').checked;
    var restriction_emzymesCbox = document.getElementById('cbox2').checked;
    var tagsCbox = document.getElementById('cbox3').checked;
    var selection_markersCbox = document.getElementById('cbox4').checked;
    var ms   = parseInt(document.getElementById('match').value);
    var mms  = parseInt(document.getElementById('mismatch').value);
    var gapo = parseInt(document.getElementById('gapo').value);
    var gape = parseInt(document.getElementById('gape').value);
    var target = document.getElementById('target').value.replace(/[\s\n]+/g, '');

    if (generalFeaturesCbox == false && restriction_emzymesCbox == false && tagsCbox == false && selection_markersCbox == false) {
        noSelection.html(Handlebars.templates.noSel({
            selectionError: 'choose features'
        }));
        return;
    }

    var message = {
        generalFeaturesCbox: generalFeaturesCbox,
        restriction_emzymesCbox: restriction_emzymesCbox,
        tagsCbox: tagsCbox,
        selection_markersCbox: selection_markersCbox,
        ms: ms,
        mms: mms,
        gapo: gapo,
        gape: gape,
        target: target
    }

    var worker = work(require('./getResultsFunction.js'));
    $(".loader").css("visibility", "visible");
    worker.postMessage(message); // send the worker a message

    worker.onmessage = function(e) {

        var visualized = viz.visualize(e.data);

        $("#visualizedText").css("visibility", "visible");
        results.html(Handlebars.templates.mapRes({
            featuresDescription: visualized
        }));
        $(".loader").css("visibility", "hidden");
        var elapse = (new Date().getTime() - time_start) / 1000.0;
        document.getElementById('runtime').innerHTML = "in " + elapse.toFixed(3) + "s";

    }
});
