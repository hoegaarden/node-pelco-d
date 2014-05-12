
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyUSB0", {
    baudrate: 9600
  , buffersize: 4
});

var PTZ = require('../lib/PelcoD');
var cam = new PTZ(0x01, serialPort);

serialPort.on('open', function(){
    cam.setTiltSpeed(0x3f).setTiltDir(1).go(function(err, res){
        setTimeout(function(){
            cam.stop().go(function(err, res){
                console.log('stopped');
                process.exit();
            });
        }, 3000);
    });
});




