var nodeNumber = process.env.POWERPI || 0;

console.log('NODE NUMBER STARTED', nodeNumber);

// server connection
var path = require('path');
var Reporter = require(path.join(__dirname, 'lib', 'node_socket'));
var reporter = new Reporter(nodeNumber);
var io = reporter.io;

var request = require('request'),
    _ = require('lodash'),
    async = require('async');

var reduction = 0,
    menuState = 1,
    localWind = 0,
    localBspt = 0;

var ipAddress = null;
require('dns').lookup(require('os').hostname(), function (err, add) {
    ipAddress = add;
});

var Gpio = require('onoff').Gpio;

var led0 = new Gpio(23, 'out'),
    led1 = new Gpio(24, 'out'),
    led2 = new Gpio(25, 'out'),
    relay = new Gpio(21, 'out'),	
    button = new Gpio(22, 'in', 'both'),
    timeDuration = 300,  //300 seconds = 5 minutes
    reductionTime = 0,
    offStart = 0,
    offEnd = 0,
    relayState = 1,
    relayCounter = 0;

var Mcp3008 = require('mcp3008.js');

var adc = new Mcp3008(),
    adc0 = 0,
    adc1 = 1,
    data = [], // 4 cos sampling data points
    ampCount = 0,
    offset = 510, // 2.5V offset for the Hall Effect Sensor
    avgCurrent = 0
    avgWatts = 0;


var Lcd = require('lcd');
var lcd = new Lcd({
        rs:17,
        e:5,
        data:[6, 13, 19, 26],
        cols:16,
        rows:2
    }),
    displayTop = 'top',
    displayBottom = 'bottom';

var read = {
    // this function will hold all operations that read from any sensor
    // we will keep the variable scope localized to this closure, so that we can reuse it
    fromTempSensor: function(channelToRead, cb){
        // initiate the read
        adc.read(channelToRead, function (value) {
            // we were successful
            //console.log('Data Read: ', value);
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
};

var write = {
    // function that will deal with sending any data up to the "cloud"
    // we will be doing a fire and forget, so we dont need a callback
    toServer: function(nodeValue, dataValue, tempValue){
	console.log(arguments)
	        io.emit('putNodeData', {
	            nodeNumber: String(nodeValue),
	            reading: {
	                time: new Date().getTime(),
	                data: dataValue,
	                temp: tempValue
	            }
	        })
	
	    }
	};

// main init function
var init = function(){

    //server communication loop *******************************************************************************
    setInterval(function () {
        testCurrent();
        write.toServer(nodeNumber, avgWatts, adc1);
        read.fromServer();
    }, 1000);
    

	//relay loop******************************************
	
    setInterval(function(){
    
        //update reduction time
        reductionTime = Math.round(timeDuration * reduction);

        //turns the relay on and off between the values offStart and offEnd
        if(relayCounter >= offStart && relayCounter <= offEnd && reduction > 0){
            relayState = 0;
            changeLED(3);
            relay.writeSync(1);
            //console.log('****turn relay off****');
        } else{
                relayState = 1;
                changeLED(2);
                relay.writeSync(0);
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
                displayTop = 'Watts:';
                displayBottom = avgWatts;
                break;
            case 2:
                displayTop = 'Reduction:';
                    adc.read(1, function(value){
                        displayBottom = reduction;
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
                displayTop = 'Gen: ' + localWind;
                displayBottom = 'For: ' + localBspt;
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
        }, 1000);
    });
};

async.series([
    //I have no idea what I am doing
], init);

    
button.watch(function(err, state){
    if (state == 1){
        if(menuState > 4){
            menuState = 0;
        }
        menuState++;
        //console.log(menuState);
    } else{
    //changeLED(menuState);  //for debugging menu
    }
});

var testCurrent = function(){   

    if(ampCount){
        setTimeout(function(){
            adc.read(0, function(value){
                data.push((value-offset)*(5/1024)*(1/0.066));
            });
            ampCount--;
            testCurrent();
        }, 4.167);
    } else {
        //console.log('this is the data', data);
        avgCurrent = (Math.sqrt(Math.pow(data[0], 2)+Math.pow(data[1], 2))/Math.sqrt(2)+Math.sqrt(Math.pow(data[2], 2)+Math.pow(data[3], 2))/Math.sqrt(2))/2;
        //console.log('avgCurrent', avgCurrent);
	avgWatts = Math.round(avgCurrent)*120;
	//console.log('avgWatts', avgWatts);
        data = [];
        ampCount = 4;
    }
}

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
