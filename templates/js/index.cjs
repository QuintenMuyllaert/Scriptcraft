let p = require("./p.cjs");
const blocks = require("./blocks.cjs");

const checkPoint = Math.random();
p = p.chkpt(checkPoint);
//Start code.

p = p.box("diamond_block", 1, 1, 1);

//Stop code.
p = p.move(checkPoint);
