
var Mcp3008 = require('mcp3008.js'),
	adc = new Mcp3008();

var Lcd = require('lcd'),
	lcd = new Lcd({
		rs:22,
		e:5,
		data:[6, 13, 19, 26],
		cols:16,
		rows:2
	});

var ipAddress = 'unknown';

require('dns').lookup(require('os').hostname(), function(err, add, fam) {
	ipAddress = add;	
});

var GPIO = require('onoff').Gpio,
	led0 = new GPIO(16, 'out'),
	led1 = new GPIO(20, 'out'),
	led2 = new GPIO(21, 'out'),
	button = new GPIO(12, 'in', 'both'),
	menuState = 1,
	displayTop = 'top';
	displayBottom = 'bottom';
	counter = 0;


lcd.on('ready', function(){
    setInterval(function(){
        lcd.clear(function(){
            lcd.setCursor(0, 0);
            lcd.print(displayTop, function(){
                lcd.setCursor(0, 1);
                lcd.print(displayBottom);
            });
        });
    }, 500);
});

setInterval(function() {
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
	}
	counter++;
}, 1000);

button.watch(function(err, state){
	if (state == 1){
		if(menuState > 2){
			menuState = 0;
		}
		menuState++;
		console.log(menuState);
	} else{
		changeLED(menuState);
	}
});



var changeLED = function(state) {
	switch(state){
		case 1:
			led0.writeSync(1);
			led1.writeSync(0);
			led2.writeSync(0);
			break;
		case 2:
			led0.writeSync(0);
			led1.writeSync(1);
			led2.writeSync(0);
			break;
		case 3:
			led0.writeSync(0);
			led1.writeSync(0);
			led2.writeSync(1);	
			break;
	}
}

