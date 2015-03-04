var request = require('request'),
    _ = require('lodash'),
    async = require('async'),

    nodeNumber = 0,

    reduction = 0,
    menuState = 1,
    localWind = 0;
    localBspt = 0;
    ipAddress = 'unknown',

    Gpio = require('onoff').Gpio,
    led0 = new Gpio(23, 'out'),
    led1 = new Gpio(24, 'out'),
    led2 = new Gpio(25, 'out'),
    button = new Gpio(22, 'in', 'both'),
    timeDuration = 300,  //300 seconds = 5 minutes
    reductionTime = 0,
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
        rs:17,
        e:5,
        data:[6, 13, 19, 26],
        cols:16,
        rows:2
    }),
    displayTop = 'top',
    displayBottom = 'bottom';

//clear prior led states
//changeLED(0);

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
    
    fromServer: function(){
        var serverUrl = "http://power-meter.herokuapp.com/api/getLastWindReading";
        // options needed in order to send
        var toRecieveOptions = {
            url: serverUrl,
            method: "GET",
            json: true
        }
        // the actual request, with our options
        request(toRecieveOptions, function(err, res, body){
            // show an error if it exists, otherwise do nothing
            if(err){
                console.error(err);
            } else {
		setReduction(body.wind, body.basePt);
                console.log('Data retrieved from server - ', 'gen: ' + body.wind, 'bspt: ' + body.basePt);
            }
        });
        
    }
}

var write = {
    // function that will deal with sending any data up to the "cloud"
    // we will be doing a fire and forget, so we dont need a callback
    toServer: function(nodeValue, dataValue){
        var serverUrl = "http://power-meter.herokuapp.com/api/node";

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

    //server communication loop *******************************************************************************
    setInterval(function () {
        read.fromTempSensor(adc0, function(valueFromSensor){
            write.toServer(process.env.POWERPI || nodeNumber, valueFromSensor);
        });
        read.fromServer();
    }, 1000);
    

    //realy loop **********************************************************************************************
    setInterval(function(){
    
    //update reduction time
    reductionTime = Math.round(timeDuration * reduction);
    
    //turns the relay on and off between the values offStart and offEnd
        if(relayCounter >= offStart && relayCounter <= offEnd && reduction > 0){
            relayState = 0;
            changeLED(1);
            //console.log('****turn relay off****');
            } else{
                relayState = 1;
                changeLED(2);
            }
        //main counter
        //makes new random interval for every 5 minute cycle
        if(relayCounter > timeDuration){
            relayCounter = 0;
            offStart = Math.round(Math.random() * (timeDuration - reductionTime));
            offEnd = offStart + reductionTime;
        } else{
            relayCounter++;
            //console.log(relayCounter + ', start = ' + offStart + ', stop = ' + offEnd);
        }
    }, 100);//change this to 1000 in final version
    
    lcd.on('ready', function(){
        setInterval(function(){
            //change the menu to be displayed on top and bottom of lcd
            switch(menuState){
            case 1:
                displayTop = 'Current:';
                adc.read(0, function(value){
                    displayBottom = value;
                });
                break;
            case 2:
                displayTop = 'Temperature:';
                    adc.read(1, function(value){
                        displayBottom = value / 10;
                    });
                break;
            case 3:
                displayTop = 'IP Address:';
                displayBottom = ipAddress;
                break;
            case 4:
                displayTop = 'Time: ' + relayCounter;
                displayBottom = 'Off: ' + offStart;
                break;
            case 5:
                displayTop = 'Reduction: ' + reduction;
                displayBottom = 'W: ' + localWind + '  B: ' + localBspt;
                break;
            default:
                displayTop = 'default';
                displayBottom = 'reached';
            }
            //update the displays on lcd
            lcd.clear(function(){
                lcd.setCursor(0, 0);
                lcd.print(displayTop, function(){
                    lcd.setCursor(0, 1);
                    lcd.print(displayBottom);
                });
            });
        }, 500);
    });
}

async.series([
    //I have no idea what I am doing
], init);

    
button.watch(function(err, state){
    if (state == 1){
        if(menuState > 4){
            menuState = 0;
        }
        menuState++;
        console.log(menuState);
    } else{
    //changeLED(menuState);  //for debugging menu
    }
});

var changeLED = function(state) {
    switch(state){
	case 0: //nothing
	    led0.writeSync(0);
            led1.writeSync(0);
            led2.writeSync(0);
            break;
        case 1: //red
            led0.writeSync(1);
            led1.writeSync(0);
            led2.writeSync(0);
            break;
        case 2: //blue
            led0.writeSync(0);
            led1.writeSync(1);
            led2.writeSync(0);
            break;
        case 3: //green
            led0.writeSync(0);
            led1.writeSync(0);
            led2.writeSync(1);
            break;
    }
};

var setReduction = function(wind, base){
	//sets local variables for LCD screen
	localWind = wind;
	localBspt = base;
	//updates reduction command
	if(wind > base){
		reduction = 0;
		console.log('reduction set to ' + reduction);//debug 
	} else{
		reduction = 0.2;
		console.log('reduction set to ' + reduction);//debug 
	}

};





