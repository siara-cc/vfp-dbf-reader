const { run } = require('jest');
var VfpDbfReader = require('./vfp-dbf-reader');

test("Without memo", () => {
  var vdr_inst = new VfpDbfReader("./test.dbf");
  expect(vdr_inst.fieldCount).toBe(4);
  expect(vdr_inst.fields[0][0].substr(0, 6)).toBe("FIELD1");
  expect(vdr_inst.fields[1][0].substr(0, 6)).toBe("FIELD2");
  expect(vdr_inst.fields[2][0].substr(0, 6)).toBe("FIELD3");
  var next_rec = vdr_inst.next();
  expect(next_rec[1]).toBe(234);
  expect(next_rec[2]).toBe('Y');
  expect(next_rec[3]).toBe('Hello World');
  vdr_inst.close();
});

test("With memo", () => {
  var vdr_inst = new VfpDbfReader("./test_memo.dbf");
  expect(vdr_inst.fieldCount).toBe(4);
  expect(vdr_inst.fields[0][0].substr(0, 6)).toBe("FIELD1");
  expect(vdr_inst.fields[1][0].substr(0, 6)).toBe("FIELD2");
  expect(vdr_inst.fields[2][0].substr(0, 6)).toBe("FIELD3");
  var next_rec = vdr_inst.next();
  expect(next_rec[1]).toBe(4354);
  expect(next_rec[2]).toBe('How are you');
  expect(next_rec[3]).toBe('The quick brown fox jumped over the lazy dog');
  next_rec = vdr_inst.next();
  expect(next_rec[1]).toBe(344354354);
  expect(next_rec[2]).toBe('I\'m fine');
  expect(next_rec[3]).toBe('A stitch in time saves nine');
  vdr_inst.close();
});
