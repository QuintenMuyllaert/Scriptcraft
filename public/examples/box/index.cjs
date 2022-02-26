let p = require("./p.cjs");
const blocks = require("./blocks.cjs");

/* CURRENT METHODS */

// place a block using the new names
p = p.box("stone", 2, 3, 4);
p = p.fwd(5);

// place a block using the new names including minecraft prefix
p = p.box("minecraft:stone", 2, 3, 4);
p = p.fwd(5);

/* LEGACY METHODS */

// place a block using old item ID's ( Minecraft has discontinued these )
p = p.box(1, 2, 3, 4);
p = p.fwd(5);

// place a block using the old Scriptcraft "blocks" object, this uses old item ID's ( Minecraft has discontinued these )'
p = p.box(blocks.stone, 2, 3, 4);
p = p.fwd(5);
