var data_points = [];			//This holds the primary current values
var currentCalc = [];			//This holds the wattage values (sampled current * rated voltage)
var avgCurrent = 0;
var currentArray = [];			//This holds the average power over an entire sampling period
var runningTotal = 0;

					

//This initializes the ADC object, imports the ADC library, and also sets the channels that will be used on the ADC
var Mcp3008 = require('mcp3008.js'),
	adc = new Mcp3008(),
	channel0 = 0;
					
setInterval( function(){
	if (data_points.length < 5){
		adc.read(channel0, function(digReading){
			//console.log(Math.abs(digReading-530));
			primaryCurrent = Math.abs((digReading-530)*(5/1024)*(1/0.066));
			//console.log("Primary Current Sample: " + primaryCurrent.toFixed(2));
			data_points.push(primaryCurrent);
		});
		
	} else { 
		
		for (i = 0; i < 4; i++){
			currentCalc.push(Math.sqrt(data_points[i]*data_points[i]+data_points[i+1]*data_points[i+1])/Math.sqrt(2));
		}
	
		for (i = 0; i < 4; i++){
			runningTotal = runningTotal + currentCalc[i];
			//console.log("Running Total: " + runningTotal.toFixed(2));	
		}
		
		averageCurrent = runningTotal/4;
		//console.log("Average Current: " + (averageCurrent).toFixed(2) +"\n");
		currentArray.push((avgCurrent).toFixed(3));
		//console.log(currentArray);
		runningTotal = 0;
		currentCalc = [];
		data_points = [];
	}
	

}, 4.166);

setInterval( function(){
	console.log(averageCurrent);
}, 1000);



