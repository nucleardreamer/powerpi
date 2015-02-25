var request = require('request'),
    _ = require('lodash'),
    async = require('async'),

    Gpio = require('onoff').Gpio,
    relay = new Gpio(21, 'out'),
    led1 = new Gpio(16, 'out'),
    led2 = new Gpio(20, 'out'),
    timeDuration = 300,
    reduction = 0.1,
    reductionTime = Math.round(timeDuration * reduction),
    offStart = 0,
    offEnd = 0,
    relayState = 1,
    relayCounter = 0;

    Mcp3008 = require('mcp3008.js'),
    adc = new Mcp3008(),
    adc0 = 0,
    adc1 = 1,

    Lcd = require('lcd'),
    lcd = new Lcd({
    rs:22,
    e:5,
    data:[6, 13, 19, 26],
    cols:16,
    rows:2
    });

var read = {
    // this function will hold all operations that read from any sensor
    // we will keep the variable scope localized to this closure, so that we can reuse it
    fromTempSensor: function(channelToRead, cb){
        // initiate the read
        adc.read(channelToRead, function (value) {
            // we were successful
            console.log('Data Read: ', value);
            cb(value);
        });
    },
    fromCurrentSensor: function(channelToRead, cb){
        // initiate the read
        adc.read(channelToRead, function (value) {
            // we were successful
            console.log('Data Read: ', value);
            cb(value);
        });
    },
}

var write = {
    // function that will deal with sending any data up to the "cloud"
    // we will be doing a fire and forget, so we dont need a callback
    toServer: function(nodeValue, dataValue){
        var serverUrl = "http://power-meter.herokuapp.com/node";

        // options needed in order to send
        var toSendOptions = {
            url: serverUrl,
            method: "PUT",
            // this is our payload that the server reads
            json: {
                nodeNumber: String(nodeValue),
                reading: {
                    time: new Date().getTime(),
                    data: dataValue
                }
            }
        }

        // the actual request, with our options
        request(toSendOptions, function(err){
            // show an error if it exists, otherwise do nothing
            if(err){
                console.error(err);
            } else {
                console.log('Data sent to server - ', 'Node: ' + nodeValue, 'Value: ' + dataValue);
            }
        });
    }
}

// main init function
var init = function(){

    // 1 second updates
    setInterval(function () {
        read.fromTempSensor(adc0, function(valueFromSensor){
            write.toServer(0, valueFromSensor);
        });
    }, 1000);
    
    
    
}


async.series([

], init);







