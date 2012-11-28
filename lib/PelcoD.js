//------------------------------------------------------------
//------------------------------------------------------------
var Byte = require('./Byte')
  , SYNC = 0xff
  , isFn =function(o) { return !!(o && o.constructor && o.call && o.apply); }

;


//------------------------------------------------------------
function ifDef(x, def) {
    if ( typeof(x) === 'undefined' ) {
        return def;
    } else {
        return x;
    }
}


//------------------------------------------------------------
function updateChecksum(bytes) {
    var sum = 0x00;

    for (var pos = 1 ; pos < 6 ; pos++ ) {
        sum += bytes[pos]
    }
    sum = sum % 0xff;

    bytes[6] = sum;
    return bytes;
}


//------------------------------------------------------------
function PelcoD(addr, stream) {
    this.stream = stream;
    this.bytes = [
        SYNC
      , ifDef(addr, 0x01)
      , 0x00
      , 0x00
      , 0x00
      , 0x00
      , 0x00
    ];
    return this;
}

PelcoD.prototype.go = function(cb) {
    var dbl_write = true
      , dbl_intv = 30
      , self = this
    ;

    if (dbl_write) {
        self.go_once(function(){
            setTimeout(self.go_once.bind(self, cb), dbl_intv);
        });
    } else {
        self.go_once(cb);
    }
    return this;
}


PelcoD.prototype.go_once = function(cb) {
    var out = this.stream
      , self = this;
    ;

    if (!this.stream) {
        isFn(cb) && cb();
        return this;
    }

    var buf = this.get();

    var _cb = function(err, res) {
        return isFn(cb) && cb(err, res);
    }

    out.on('error', _cb.bind(_cb) )

    if ( out.write(buf) === false ) {
        out.once('drain', _cb.bind(_cb, null, buf) );
    } else {
        _cb(null, buf);
    }

    return this;
}

PelcoD.prototype.get = function() {
    var buf = new Buffer(7);
    updateChecksum(this.bytes);

    this.bytes.forEach(function(bit, pos){
        buf[pos] = bit;
    });
    return buf;
}

PelcoD.prototype.setPreset = function(nr) {
    if (nr < 0x01 || nr > 0x20)
      throw new Error('Preset number out of bounds [0x01..0x20]');

    this.bytes[2] = 0x00;
    this.bytes[3] = 0x03;
    this.bytes[4] = 0x00;
    this.bytes[5] = nr;

    return this;
}

PelcoD.prototype.gotoPreset = function(nr) {
    if (nr < 0x01 || nr > 0x20)
      throw new Error('Preset number out of bounds [0x01..0x20]');

    this.bytes[2] = 0x00;
    this.bytes[3] = 0x07;
    this.bytes[4] = 0x00;
    this.bytes[5] = nr;

    return this;
}
PelcoD.prototype.setTiltSpeed = function(speed) {
    if (speed < 0)      speed = 0x00;
    if (speed > 0x3f)   speed = 0x3f;

    this.bytes[5] = speed;
    return this;
}
PelcoD.prototype.setTiltDir = function(dir) {
    var cmd2 = new Byte(this.bytes[3]);

    // stop
    cmd2.off(3)  // up-bit;
    cmd2.off(4)  // down-bit;

    if (dir > 0) cmd2.on(3); // go up
    if (dir < 0) cmd2.on(4); // go down

    this.bytes[3] = cmd2.get();
    return this;
}
PelcoD.prototype.setPanSpeed = function(speed) {
    if (speed < 0)      speed = 0;
    if (speed > 0xff)   speed = 0xff;

    this.bytes[4] = speed;
    return this;
}
PelcoD.prototype.setPanDir = function(dir) {
    /*
     * < 0  ... left
     * > 0  ... right
     * 0 stop
     */
    var cmd2 = new Byte(this.bytes[3]);

    // stop
    cmd2.off(1)  // right-bit;
    cmd2.off(2)  // left-bit;

    if (dir > 0) cmd2.on(1); // go right
    if (dir < 0) cmd2.on(2); // go left

    this.bytes[3] = cmd2.get();
    return this;
}
PelcoD.prototype.stop = function() {
    for (var pos = 2 ; pos < 6 ; pos++ ) {
        this.bytes[pos] = 0x00;
    }
    return this;
}


module.exports = PelcoD;