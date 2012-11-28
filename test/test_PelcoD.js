var Pelco = require('../lib/PelcoD')
  , util = require('util')
  , events = require('events')
;

//--pseudo-write-stream---------------------------------------
function WS() {
    this._use_drain = ( Math.random() > 0.5 );
    this._data = new Buffer(0);

    this.writable = true;
    return this;
};
util.inherits(WS, events.EventEmitter);
WS.prototype.write = function(data) {
    var self = this;

    self._data = Buffer.concat([this._data, data]);

    if (self._use_drain) {
        setTimeout(function(){
            self.emit('drain');
        }, Math.random()*1000);
        return false;
    } else {
        return true;
    }
};
WS.prototype.getData = function() {
    return this._data;
};
//------------------------------------------------------------



module.exports = {
    'stop()' : function(test) {
        var ptz = new Pelco(0x02);

        var data = ptz.stop().get();

        test.deepEqual(
            data
          , new Buffer([0xff, 0x02, 0x00, 0x00, 0x00, 0x00, 0x02])
        );
        test.done();
    } ,

    'stop() with stream' : function(test) {
        var ws = new WS()
          , ptz = new Pelco(0x12, ws)
        ;

        /*
         * We do hardcoded (by now) double writes,
         * my hardware sadly needs this
         */
        ptz.stop().go(function(){
            test.deepEqual(
                ws.getData()
              , new Buffer([
                    0xff, 0x12, 0x00, 0x00, 0x00, 0x00, 0x12
                  , 0xff, 0x12, 0x00, 0x00, 0x00, 0x00, 0x12
                ])
            );
            test.done();
        });
    } ,

    'multiple actions with stream' : function(test) {
        var ws = new WS()
          , ptz = new Pelco(0x01, ws)
          , sleep = 300
        ;

        // start tilting
        ptz.setTiltSpeed(0x3f).setTiltDir(-1).go(function(){
            // should send: ff 01 00 10 00 3f 50
            setTimeout(function(){
                // after some time, start paning too
                ptz.setPanSpeed(0x01).setPanDir(1000).go(function(){
                    // should send: ff 01 00 12 01 3f 53
                    setTimeout(function(){
                        // after some time stop the whole thing
                        ptz.stop().go(function(){
                            // should send: ff 01 00 00 00 00 01

                            test.deepEqual(
                                ws.getData()
                              , new Buffer([
                                    0xff, 0x01, 0x00, 0x10, 0x00, 0x3f, 0x50
                                  , 0xff, 0x01, 0x00, 0x10, 0x00, 0x3f, 0x50
                                  , 0xff, 0x01, 0x00, 0x12, 0x01, 0x3f, 0x53
                                  , 0xff, 0x01, 0x00, 0x12, 0x01, 0x3f, 0x53
                                  , 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x01
                                  , 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x01
                                ])
                            );
                            test.done();

                        })
                    }, sleep);
                });
            }, sleep);
        });
    }
};