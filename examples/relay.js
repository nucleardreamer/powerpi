var Gpio = require('onoff').Gpio,
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

//clear current led states
relay.writeSync(0);
led1.writeSync(0);
led2.writeSync(0);

//main loop that will occur every second
setInterval(function(){
	
	//turns the relay on and off between the values offStart and offEnd
	if(relayCounter >= offStart && relayCounter <= offEnd){
		relayState = 0;
		relay.writeSync(relayState);
		led1.writeSync(1);
		console.log('****turn relay off****');
	} else{
		relayState = 1;
		relay.writeSync(relayState);
		led1.writeSync(0);
	}
	
	//main counter
	//makes new random interval for every 5 minute cycle
	if(relayCounter > timeDuration){
		relayCounter = 0;
		offStart = Math.round(Math.random() * (timeDuration - reductionTime));
		offEnd = offStart + reductionTime;
	} else{
		relayCounter++;
		console.log(relayCounter + ', start = ' + offStart + ', stop = ' + offEnd);
	}
}, 100);