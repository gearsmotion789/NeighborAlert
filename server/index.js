const Gpio = require('pigpio').Gpio;
const speaker = new Gpio(16, {mode: Gpio.OUTPUT});
speaker.digitalWrite(0);


var Player = require('player');

var localip = require('local-ip');
var iface = 'wlan0';
var localip;
localip(iface, function(err, res) {
  if (err) {
    throw new Error('I have no idea what my local ip is.');
  }
  //console.log('My local ip address on ' + iface + ' is ' + res);
  localip = res;
});

const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const port = 4000

app.use(bodyParser.json());

app.use(function(req, res, next) {
 res.header('Content-Type', 'application/json');
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
 next();
});

var enabled = true;

var alarm;
var player;
var timerId1;
var timerId2;
var blinkLedTimerId;
var lastState = true;

app.get('/enabled', (req, res) => {
  res.send({enabled: enabled});
});

app.post('/enabled', (req, res) => {
  if(req.body){
	enabled = req.body.enabled;
	console.log("Enabled is set to: " + enabled);
  }
  res.send();
});

app.post('/', (req, res) => {
  //console.log(req.body);
  if(req.body && enabled){
    console.log("Person Found!");

    clearInterval(timerId1);
    timerId1 = setInterval(function(){
      console.log("Stopping");
      clearInterval(blinkLedTimerId);
      speaker.digitalWrite(false);
      player.stop();      
      alarm = false;
      clearInterval(timerId1);
    }, 2000);


    if(!alarm){
      alarm = true;

      speaker.digitalWrite(true);

      blinkLedTimerId = setInterval(() => {
	speaker.digitalWrite(lastState);
	lastState = !lastState;
      }, 250);

      player = new Player('./siren.mp3');
      player.play(function(err, player){});

      clearInterval(timerId2);
      timerId2 = setInterval(function(){	// If request is made multiple times, eventually song tracks runs out, and this needs to be stopped
	console.log("Stopping 2");
	clearInterval(blinkLedTimerId);
	speaker.digitalWrite(false);     
	player.stop();        
        alarm = false;
	clearInterval(timerId2);
      }, 2 * 60 * 1000);      
    }
  }
  res.send()
})

app.listen(port, () => console.log(`App listening on http://${localip}:${port}`))
