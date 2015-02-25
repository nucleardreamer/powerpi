

var request = require('request'),
    async = require('async'),

    gpio = require('rpi-gpio'),
    buttonPin = 32,
    led0Pin = 36,
    led1Pin = 38,
    led2Pin = 40,
    ssrPin = 11,

    Mcp3008 = require('mcp3008.js'),
    adc = new Mcp3008(),
    adc0 = 0,
    adc1 = 1,

    Lcd = require('lcd'),
    lcd = new Lcd({
        rs:25, 
        e:24, 
        data:[23, 17, 27, 22], 
        cols:16, rows:2
    }),

    reduce = 0,
    ssrOn = 0,
    ssrOff = 0;

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
    fromButton: function(channelToRead, cb){
        gpio.read(channelToRead, function(err, value) {
            console.log('Button Read: ' + value);
            cb(value)
        });
    }
}

var write = {

    toLcd: function(message){
        // reset the LCD screen and print the new message
        lcd.setCursor(0, 0);
        lcd.print(message);
    },

    toLed: function(color, cb){
        switch(color){
            case 'red':
                    
                    break;
            case 'green':
                    
                    break;
            case 'blue':
                    
                    break;
            default:
                    
        }
    }
    
    toSSR: function(pulse){

    }

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

    // set a repeating anonymous function to run every second, this also keeps our script alive
    setInterval(function () {
        // we can read from the button and see if we want to change anything
        read.fromButton(buttonPin, function(buttonData){})
        // execute the data read
        read.fromTempSensor(adc0, function(valueFromSensor){

        // after its finished, lets print to the LCD and send to our server
        // both operations will just happen at the same time, we wont wait for either to finish before we read and send again
            write.toLcd(valueFromSensor);
            write.toServer(0, valueFromSensor);

        });

    }, 1000);
}


// we will use async, because we want to wait for both functions to be finished before we init
// basically, once the array of functions execute 'cb' (their callback), we will fire the next parameter, which is our init function
// this is also good, because if either of the functions fails, it will hault the script
async.series([
    function(cb){
        lcd.on('ready', cb)
    },
    function(cb){
        //setup gpio pin for button
        gpio.setup(buttonPin, gpio.DIR_IN, cb);
    },
    function(cb){
        //setup gpio pin for led0
        gpio.setup(led0Pin, gpio.DIR_OUT, cb);
    },
    function(cb){
        //setup gpio pin for led1
        gpio.setup(led1Pin, gpio.DIR_OUT, cb);
    },
    function(cb){
        //setup gpio pin for led2
        gpio.setup(led2Pin, gpio.DIR_OUT, cb);
    },
], init);







