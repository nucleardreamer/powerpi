var request = require('request');

var go = function(){
    var serverUrl = "http://power-meter.herokuapp.com/api/getLastWindReading";
    // options needed in order to send
    var toRecieveOptions = {
        url: serverUrl,
        method: "GET",
        json: true
    };
    // the actual request, with our options
    request(toRecieveOptions, function(err, res, body){
        // show an error if it exists, otherwise do nothing
        if(err){
            console.error(err);
        } else {
            console.log('Data retrieved from server - ', 'gen: ' + body.wind, 'bspt: ' + body.basePt);
        }
    });

}

go();