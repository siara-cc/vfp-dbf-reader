# Read Visual Foxpro databases

[![Node.js CI](https://github.com/siara-cc/vfp-dbf-reader/actions/workflows/node.js.yml/badge.svg)](https://github.com/siara-cc/vfp-dbf-reader/actions/workflows/node.js.yml)

Visual Foxpro database files can be read using this library.

# Getting started

This is a Node.js library, with no dependencies.  `vfp-dbf-reader.js` is all you will need to integrate with your application.

This library is available at `npm` at `https://www.npmjs.com/package/vfp-dbf-reader.siara.cc` and can be included in your Javascript projects with `npm i vfp-dbf-reader.siara.cc`. See below on how to include it in your code.

## Running Unit tests (using Jest)

To run unit tests, clone this repo and issue following commands, assuming `npm` is installed:

```sh
npm update
npm run test
```

## Using it in your application

To read Visual Foxpro dbfs in your application, import `vfp-dbf-reader.js`:

```Javascript
var VfpDbfReader = require("./vfp-dbf-reader.js");
var inst = new VfpDbfReader("filename.dbf");
console.log(inst.fieldCount); // has number of fields in the table + 1
console.log(inst.fields); // array of fields
var next_rec = inst.next();
while (next_rec != null) {
    console.log(next_rec);
    next_rec = inst.next();
}
inst.close();
```

Just next() function is used repeatedly to retrieve records from the table as shown above.  This library does not recognize indexes.

# Issues

In case of any issues, please email the Author (Arundale Ramanathan) at arun@siara.cc or create GitHub issue.
