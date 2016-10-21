var getRes = require('./getResultsFunction.js');

//var work = require('webworkify');


// w.addEventListener('message', function (ev) {
//     console.log(ev.data);
// });

var $b = $('#button');


// function worker_function() {
//     console.log('hi');
//     getRes.getResults();
//
//
// }

//var worker = new Worker(URL.createObjectURL(new Blob(["("+worker_function.toString()+")()"], {type: 'text/javascript'})));

//var worker = new Worker('./getResultsFunction.js');

$b.on('click', function(){
    //
    // var w = work(require('./worker.js'));
    //
    // w.postMessage('a'); // send the worker a message
    // console.log('message posted');
    //
    // w.onmessage = function(e) {
    //     //result.textContent = e.data;
    //     console.log('Message received from worker');
    // }

    $(".loader").css("visibility", "visible");
    //
    setTimeout(getRes.getResults, 200);

});
