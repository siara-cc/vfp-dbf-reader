var VfpDbfReader = require('./vfp-dbf-reader');

var vdr_inst = new VfpDbfReader("./test.dbf");

console.log(vdr_inst.fieldCount);
console.log(vdr_inst.fields);
var next_rec = vdr_inst.next();
while (next_rec != null) {
    console.log(next_rec);
    next_rec = vdr_inst.next();
}
vdr_inst.close();

vdr_inst = new VfpDbfReader("./test_memo.dbf");

console.log(vdr_inst.fieldCount);
console.log(vdr_inst.fields);
var next_rec = vdr_inst.next();
while (next_rec != null) {
    console.log(next_rec);
    next_rec = vdr_inst.next();
}
vdr_inst.close();
