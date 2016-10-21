getRes = require('./getResultsFunction.js')

//handlebars
var $b = $('#button');

$b.on('click', function(){

    $(".loader").css("visibility", "visible");

    setTimeout(getRes.getResults, 200);

});
