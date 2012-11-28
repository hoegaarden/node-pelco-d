//------------------------------------------------------------
function Byte(bits) {
    this.word = bits | 0x00;
    return this;
}

//------------------------------------------------------------
Byte.prototype.on = function(pos) {
    this.word |= (0x01 << pos);
    return this;
}

//------------------------------------------------------------
Byte.prototype.off = function(pos) {
    var mask = ~(0x01 << pos);
    this.word &= mask;
    return this;
}

//------------------------------------------------------------
Byte.prototype.get = function() {
    return this.word;
}

module.exports = Byte;