var Byte = require('../lib/Byte');

module.exports = {

    'flip some bits' : function(test) {
        var b = new Byte(0x02);

        b          // 00000010
        .on(0)     // 00000011
        .off(1)    // 00000001
        .on(2);    // 00000101

        test.equals(b.get(), 0x05);
        test.done();
    } ,

    'empty constructor' : function(test) {
        var b = new Byte();

        test.equals(b.get(), 0x00);
        test.done();
    }

};