var Mcp3008 = require('mcp3008.js');

var adc = new Mcp3008(),
    adc0 = 0,
    adc1 = 1,
    data = [], // 4 cos sampling data points
    ampCount = 0,
    offset = 510, // 2.5V offset for the Hall Effect Sensor
    avgCurrent = 0
    avgWatts = 0;

setInterval(function () {
        testCurrent();
	console.log(avgWatts);
}, 1000);

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
        console.log('avgCurrent', avgCurrent);
	avgWatts = avgCurrent.toFixed(3)*120;
	console.log('avgWatts', avgWatts);
        data = [];
        ampCount = 4;
    }
}