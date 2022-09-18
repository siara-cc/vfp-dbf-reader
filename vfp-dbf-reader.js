var fs = require("fs");

class VfpDbfReader {
    constructor(filename) {
        this.fd = fs.openSync(filename);
        this.fdMemo = null;
        this.memoBlockSize = 0;
        var buf = new Uint8Array(32);
        if (32 != fs.readSync(this.fd, buf, 0, 32, 0))
            throw "Error reading header";
        this.fileTypeCode = buf[0];
        this.lastUpdated = "" + (buf[1]+2000) + "/-" + buf[2] + "-" + buf[3];
        this.recordCount = buf[4] + buf[5] * 256 + buf[6] * 65536 + buf[7] * 16777216;
        this.firstRecPos = buf[8] + buf[9] * 256;
        this.recLen = buf[10] + buf[11] * 256;
        this.flags = buf[28]; // 0x01 - has CDX, 0x02 - has Memo, 0x04 - is a .dbc
        if (this.flags & 0x02) {
            var memoFileName = filename.substring(0, filename.length - 1) + "t";
            if (filename.endsWith(".dbf") || filename.endsWith(".DBF")) {
                memoFileName = filename.substring(0, filename.length - 3) + "fpt";
                if (!fs.existsSync(memoFileName))
                  memoFileName = filename.substring(0, filename.length - 3) + "FPT";
            }

            this.fdMemo = fs.openSync(memoFileName);
            if (8 != fs.readSync(this.fdMemo, buf, 0, 8, 0)) {
                try { fs.closeSync(this.fdMemo); } catch (e) { }
                this.fdMemo = null;
            } else
                this.memoBlockSize = buf[6] * 256 + buf[7];
        }
        this.cp = buf[29];
        this.fieldCount = (this.firstRecPos - 296)/32;
        this.fields = new Array();
        for (var i = 1; i <= this.fieldCount; i++) {
            if (32 != fs.readSync(this.fd, buf, 0, 32, i * 32))
                throw "Error reading field " + i;
            var field = new Array();
            this.fields[i - 1] = field;
            field[0] = String.fromCharCode.apply(null, buf.slice(0, 11)).trim(); // Name
            field[1] = buf[11]; // Type
            // Displacement
            field[2] = buf[12] + buf[13] * 256 + buf[14] * 65536 + buf[15] * 16777216;
            field[3] = buf[16]; // Field Length
            field[4] = buf[17]; // Decimal if any
            field[5] = buf[18] == 0x01 ? "System" : (buf[18] == 0x02 ? "Nullable" : 
                        (buf[18] == 0x04 ? "Binary" : (buf[18] == 0x06 ? "NullableBinary" :
                        (buf[18] == 0x0C ? "AutoInc" : "")))); // Field Flags
            // Auto Increment next value
            field[6] = buf[19] + buf[20] * 256 + buf[21] * 65536 + buf[22] * 16777216;
            field[7] = buf[23]; // AutoInc Step
        }
        this.recNum = 0;
    }
    next() {
        var buf = new Uint8Array(this.recLen);
        if (this.recLen != fs.readSync(this.fd, buf, 0, this.recLen, this.recNum * this.recLen + this.firstRecPos))
            return null;
        this.recNum++;
        var recArr = new Array();
        var recPos = 0;
        recArr[0] = buf[recPos++];
        for (var i = 1; i <= this.fieldCount; i++) {
            var field = this.fields[i - 1];
            switch (String.fromCharCode(field[1])) {
                case 'C':
                case 'Q':
                    recArr[i] = String.fromCharCode.apply(null, buf.slice(recPos, recPos + field[3]));
                    break;
                case 'V':
                    var lastByte = buf[recPos + field[3] - 1];
                    if (lastByte < field[3] && String.fromCharCode.apply(null, 
                            buf.slice(recPos + lastByte, recPos + field[3] - 1)).trim() == "")
                        recArr[i] = String.fromCharCode.apply(null, buf.slice(recPos, recPos + lastByte));
                    else
                        recArr[i] = String.fromCharCode.apply(null, buf.slice(recPos, recPos + field[3]));
                    break;
                case 'Y': 
                    recArr[i] = (buf[recPos] + buf[recPos + 1] * 256) / 10000;
                    recPos += 2;
                    recArr[i] += (buf[recPos] * 0x10000 + buf[recPos + 1] * 0x1000000 +
                                 buf[recPos + 2] * 0x100000000 + buf[recPos + 3] * 0x10000000000 +
                                 buf[recPos + 4] * 0x1000000000000) / 10000;
                                 // + buf[recPos + 3] * 0x10000000000000000; // Ignore last byte 'cause JS limitation?
                    recPos -= 2;
                    break;
                case 'D':
                    recArr[i] = new Date(parseInt(String.fromCharCode.apply(null, buf.slice(recPos, recPos + 4)), 10),
                                         parseInt(String.fromCharCode.apply(null, buf.slice(recPos + 4, recPos + 6)), 10),
                                         parseInt(String.fromCharCode.apply(null, buf.slice(recPos + 6, recPos + 8)), 10));
                    break;
                case 'T':
                    var ms = buf[recPos] + buf[recPos + 1] * 0x100 +
                                 buf[recPos + 2] * 0x10000 + buf[recPos + 3] * 0x1000000;
                    recPos += 4;
                    ms -= 2440587.5;
                    ms *= 86400000;
                    ms += buf[recPos] + buf[recPos + 1] * 0x100 +
                            buf[recPos + 2] * 0x10000 + buf[recPos + 3] * 0x1000000;
                    ms -= 86400000;
                    recArr[i] = new Date(ms);
                    recPos -= 4;
                    break;
                case 'B':
                    var buffer = new ArrayBuffer(8);
                    var dv = new DataView(buffer);
                    for (var j = 0; j < 8; j++)
                      dv.setUint8(j, buf[recPos + (7 - j)]);
                    recArr[i] = dv.getFloat64(0, false);
                    break;
                case 'F':
                case 'N':
                    recArr[i] = parseFloat(String.fromCharCode.apply(null, buf.slice(recPos, recPos + field[3])));
                    break;
                case 'G':
                    recArr[i] = "";
                    break;
                case 'I':
                    recArr[i] = buf[recPos] + buf[recPos + 1] * 0x100 +
                                    buf[recPos + 2] * 0x10000 + buf[recPos + 3] * 0x1000000;
                    break;
                case 'L':
                    recArr[i] = String.fromCharCode(buf[recPos]) == 'T';
                    break;
                case 'M':
                    recArr[i] = this.getMemoValue(buf[recPos] + buf[recPos + 1] * 0x100 +
                        buf[recPos + 2] * 0x10000 + buf[recPos + 3] * 0x1000000);
                    break;
            }
            recPos += field[3];
        }
        return recArr;
    }
    getMemoValue(block) {
        if (this.fdMemo == null)
            return "";
        var buf = new Uint8Array(this.memoBlockSize);
        if (this.memoBlockSize != fs.readSync(this.fdMemo, buf, 0, this.memoBlockSize, block * this.memoBlockSize))
            return "";
        var memoLen = buf[4] * 0x1000000 + buf[5] * 0x10000 + buf[6] * 0x100 + buf[7];
        var remaining = this.memoBlockSize - 8;
        var ret = String.fromCharCode.apply(null, buf.slice(8, 8 + (memoLen > remaining ? remaining : memoLen)));
        memoLen -= remaining;
        while (memoLen > 0) {
            block++;
            if (fs.readSync(this.fdMemo, buf, 0, this.memoBlockSize, block * this.memoBlockSize) == 0)
                return ret;
            if (memoLen > this.memoBlockSize)
                ret += String.fromCharCode.apply(null, buf);
            else
                ret += String.fromCharCode.apply(null, buf.slice(0, memoLen));
            memoLen -= this.memoBlockSize;
        }
        return ret;
    }
    close() {
        fs.closeSync(this.fd);
        if (this.fdMemo != null)
            fs.closeSync(this.fdMemo);
    }

}

module.exports = VfpDbfReader;
