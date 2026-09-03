let hasInit = false;

const args = JSON.parse(process.argv[2]);

const command = {
	owner: args.owner,
	user: args.player,
	name: args.script,
	isOp: args.isOp,
	isShadowbanned: args.isShadowbanned,
	antigrief: args.antigrief,
};

let antigriefing = command.antigrief ? true : command.isShadowbanned ? true : false; // set this to true to enable antigriefing and restrict block and command usage for everyone

const config = require(`../public/${command.owner}/${command.name}/config.json`);

const buildSpeed = config.buildDelay || 0;

let time = 0;
let pending = 0;
let finished = false;

let s = (data = "", conditionless = false) => {
	const payload = conditionless ? data : conditions + data;
	process.send(payload);
	console.log(JSON.stringify({ sc: payload }));
};

function finish() {
	if (finished) {
		if (process.connected) process.disconnect();
		process.exit(0);
		return;
	}
	// cleanup while IPC is still usable
	process.send(`kill @e[type=armor_stand,name="${module.exports.Drone.name}"]`);
	process.send(`kill @e[type=armor_stand,name="Start-${module.exports.Drone.name}"]`);
	process.send(`tellraw ${command.user} {"text":"Exited \\"${command.name}\\"","color":"green"}`);

	finished = true;

	if (process.connected) process.disconnect();
	process.exit(0);
}

let conditions = "";

let checkblock = (block = "air") => {
	if (!command.isOp) {
		const illegal = [
			"tnt",
			"lava",
			"water",
			"command_block",
			"repeating_command_block",
			"chain_command_block",
			"structure_block",
			"jigsaw",
			"spawn",
			"end_portal_frame",
			"end_gateway",
			"end_portal",
			"fire",
			"nether_portal",
			"flint_and_steel",
			"bedrock",
			"debug_stick",
			"arrow",
			"experience_bottle",
			"egg",
			"snowball",
			"potion",
			"bucket",
			"minecart",
			"trident",
			"dragon_egg",
			"light",
			"barrier",
			"structure_void",
		];
		for (const illi of illegal) {
			if (block.includes(illi)) {
				s(`say "${command.user}" attempted to spawn "${block}" using ${command.owner}/${command.name}`);
				if (!command.isShadowbanned) {
					s(`shadowban ${command.user}`, true);
					command.isShadowbanned = true;
					antigriefing = true;
				}
				return "air";
			}
		}
	}
	return block;
};

module.exports = {
	Drone: {
		owner: command.user,
		name: command.name + "-" + Math.random(),
		initLocation: [0, 0, 0],
		location: [0, 0, 0],
		rotation: 0,
	},
	init: function () {
		if (hasInit) {
			return this;
		}

		hasInit = true;
		s(`execute at @e[name=${this.Drone.owner}] run summon painting ~ ~ ~ {CustomName:"${this.Drone.owner}",Motive:"minecraft:plant"}`);

		s(
			`execute at @e[type=minecraft:painting,name=${this.Drone.owner}] run summon armor_stand ~ ~ ~0.5 {NoGravity:1b,Invulnerable:1b,Small:1b,Invisible:1b,NoBasePlate:1b,Rotation:[${
				(this.Drone.rotation + 2) * 90
			}F,0F],equipment:{${config.visualDrone ? 'head: {count: 1, id: "command_block"}' : ""}},CustomName:"${this.Drone.name}"}`,
		);

		s(
			`execute at @e[type=minecraft:painting,name=${this.Drone.owner}] run summon armor_stand ~ ~ ~0.5 {NoGravity:1b,Invulnerable:1b,Marker:1b,Invisible:1b,NoBasePlate:1b,Rotation:[${
				(this.Drone.rotation + 2) * 90
			}F,0F],equipment:{},CustomName:"Start-${this.Drone.name}"}`,
		);

		const os = s;
		s = function (data, conditionless) {
			pending++;
			setTimeout(() => {
				os(data, conditionless);
				pending--;
				if (pending === 0) finish();
			}, time * buildSpeed);
			time++;
		};

		conditions = `execute at @e[type=armor_stand,name="Start-${this.Drone.name}"] run `;

		s(`kill @e[type=painting,name=${this.Drone.owner}]`);
		return this;
	},
	echo: function (msg = "", color = "white") {
		msg = JSON.stringify(msg);
		s(`tellraw ${command.user} {"text":${msg},"color":"${color}","clickEvent":{"action":"copy_to_clipboard","value":${msg}}}`);
		return this;
	},
	points: {},
	chkpt: function (name = "") {
		this.points[name] = JSON.parse(JSON.stringify(this.Drone));
		return this;
	},
	move: function (name = "") {
		if (!this.points[name]) {
			return this;
		}

		this.Drone = JSON.parse(JSON.stringify(this.points[name]));
		s(`tp @e[type=armor_stand,name="${this.Drone.name}"] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		s(`data merge entity @e[type=armor_stand,name="${this.Drone.name}",sort=nearest,limit=1] {Rotation:[${((this.Drone.rotation + 2) % 4) * 90}F,0F]}`);
		return this;
	},
	door: function (door_type = "oak_door", dir = "") {
		if (dir == "") {
			switch (this.Drone.rotation) {
				case 0:
					dir = "north";
					break;
				case 1:
					dir = "east";
					break;
				case 2:
					dir = "south";
					break;
				case 3:
					dir = "west";
					break;
			}
		}
		const x = parseFloat(this.Drone.initLocation[0]) + parseFloat(this.Drone.location[0]);
		const y = parseFloat(this.Drone.initLocation[1]) + parseFloat(this.Drone.location[1]);
		const z = parseFloat(this.Drone.initLocation[2]) + parseFloat(this.Drone.location[2]);
		if (door_type.includes("door")) {
			s(
				`fill ~${Math.trunc(x)} ~${Math.trunc(y)} ~${Math.trunc(z)} ~${Math.trunc(x)} ~${Math.trunc(y)} ~${Math.trunc(z)} ${door_type + `[half=lower, facing=${dir}]`}`,
			);
			s(
				`fill ~${Math.trunc(x)} ~${Math.trunc(y + 1)} ~${Math.trunc(z)} ~${Math.trunc(x)} ~${Math.trunc(y + 1)} ~${Math.trunc(z)} ${door_type + `[half=upper, facing=${dir}]`}`,
			);
		}
		return this;
	},
	box: function (block = "air", rechts = 1, boven = 1, diepte = 1) {
		block = this.parseID(block);

		rechts = Math.round(rechts);
		boven = Math.round(boven);
		diepte = Math.round(diepte);

		if (rechts == 0 || boven == 0 || diepte == 0) {
			return this;
		}

		rechts = rechts > 0 ? rechts - 1 : rechts + 1;
		boven = boven > 0 ? boven - 1 : boven + 1;
		diepte = diepte > 0 ? diepte - 1 : diepte + 1;

		const x = parseFloat(this.Drone.initLocation[0]) + parseFloat(this.Drone.location[0]);
		const y = parseFloat(this.Drone.initLocation[1]) + parseFloat(this.Drone.location[1]);
		const z = parseFloat(this.Drone.initLocation[2]) + parseFloat(this.Drone.location[2]);

		let xs, zs;
		switch (this.Drone.rotation) {
			case 0:
				xs = rechts;
				zs = -diepte;
				break;
			case 1:
				xs = diepte;
				zs = rechts;
				break;
			case 2:
				xs = -rechts;
				zs = diepte;
				break;
			case 3:
				xs = -diepte;
				zs = -rechts;
				break;
		}

		if (antigriefing) {
			block = checkblock(block);
		}

		s(`fill ~${Math.trunc(x)} ~${Math.trunc(y)} ~${Math.trunc(z)} ~${Math.trunc(x + xs)} ~${Math.trunc(y + boven)} ~${Math.trunc(z + zs)} ${block}`);
		return this;
	},
	turn: function (amt = 1) {
		this.Drone.rotation = this.Drone.rotation + amt;
		this.Drone.rotation = this.Drone.rotation % 4;
		s(`data merge entity @e[type=armor_stand,name="${this.Drone.name}",sort=nearest,limit=1] {Rotation:[${((this.Drone.rotation + 2) % 4) * 90}F,0F]}`);
		return this;
	},
	fwd: function (amt = 1) {
		if (amt == null) {
			amt = 1;
		}
		switch (this.Drone.rotation) {
			case 0:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) - amt;
				break;
			case 1:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) + amt;
				break;
			case 2:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) + amt;
				break;
			case 3:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) - amt;
				break;
		}
		s(`tp @e[type=armor_stand,name="${this.Drone.name}"] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	back: function (amt = 1) {
		switch (this.Drone.rotation) {
			case 0:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) + amt;
				break;
			case 1:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) - amt;
				break;
			case 2:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) - amt;
				break;
			case 3:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) + amt;
				break;
		}
		s(`tp @e[type=armor_stand,name="${this.Drone.name}"] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	left: function (amt = 1) {
		switch (this.Drone.rotation) {
			case 0:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) - amt;
				break;
			case 1:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) - amt;
				break;
			case 2:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) + amt;
				break;
			case 3:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) + amt;
				break;
		}
		s(`tp @e[type=armor_stand,name=${this.Drone.name}] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	right: function (amt = 1) {
		switch (this.Drone.rotation) {
			case 0:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) + amt;
				break;
			case 1:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) + amt;
				break;
			case 2:
				this.Drone.location[0] = parseFloat(this.Drone.location[0]) - amt;
				break;
			case 3:
				this.Drone.location[2] = parseFloat(this.Drone.location[2]) - amt;
				break;
		}
		s(`tp @e[type=armor_stand,name=${this.Drone.name}] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	up: function (amt = 1) {
		this.Drone.location[1] = parseFloat(this.Drone.location[1]) + amt;
		s(`tp @e[type=armor_stand,name=${this.Drone.name}] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	down: function (amt = 1) {
		this.Drone.location[1] = parseFloat(this.Drone.location[1]) - amt;
		s(`tp @e[type=armor_stand,name=${this.Drone.name}] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	command: function (txt = "") {
		const illegal = [
			"op ",
			"gamemode ",
			"kick ",
			"ban ",
			"ban-ip ",
			"defaultgamemode ",
			"dialog ",
			"difficulty ",
			"pardon ",
			"pardon-ip ",
			"reload ",
			"save-all ",
			"save-off ",
			"save-on ",
			"spreadplayers ",
			"stop ",
			"tick ",
			"transfer ",
			"worldborder ",
			"whitelist ",
			"waypoint ",
		];
		for (const ill in illegal) {
			if (txt.includes(ill) && !command.isOp) {
				s(`say "${command.user}" attempted to use restricted command ${txt} using ${command.owner}/${command.name}`);
				if (!command.isShadowbanned) {
					s(`shadowban ${command.user}`, true);
					command.isShadowbanned = true;
					antigriefing = true;
				}
				return this;
			}
		}
		const barely_illegal = [
			"setblock ",
			"fill ",
			"summon ",
			"give ",
			"kill ",
			"damage ",
			"data ",
			"effect ",
			"gamerule ",
			"item ",
			"attribute ",
			"enchant ",
			"particle ",
			"place ",
			"playsound ",
			"recipe ",
			"advancement ",
			"ride ",
			"rotate ",
			"teleport ",
			"title ",
			"weather ",
			"time ",
		];
		for (const ill in barely_illegal) {
			if (txt.includes(ill) && antigriefing && !command.isOp) {
				s(`say "${command.user}" attempted to use restricted command ${txt} using ${command.owner}/${command.name}`);
				if (!command.isShadowbanned) {
					s(`shadowban ${command.user}`, true);
					command.isShadowbanned = true;
					antigriefing = true;
				}
				return this;
			}
		}

		s(`execute at @e[type=armor_stand,name=${this.Drone.name}] run ${txt}`);
		return this;
	},
	ID: (() => {
		const data = require("./items.json");
		const ID = {};
		for (let i = 0; i < data.length; i++) {
			let t = data[i].type + ":" + data[i].meta;
			ID[t] = data[i].name.toLowerCase().replace(/ /g, "_");
			if (data[i].meta == 0) {
				ID[data[i].type] = data[i].name.toLowerCase().replace(/ /g, "_");
			}
		}
		return ID;
	})(),
	parseID: function (id) {
		if (this.ID[id] == null) {
			return id;
		}
		return this.ID[id];
	},
};
module.exports.echo(`Starting "${command.name}"!`, "green");
module.exports.echo(`Config = buildDelay : "${config.buildDelay}", visualDrone : "${config.visualDrone}"`, "green");

module.exports.init();

//do something when app is closing
process.on("beforeExit", () => {
	if (pending === 0) finish();
});

//catches ctrl+c event
process.on("SIGINT", () => finish());

process.on("SIGTERM", () => finish());
process.on("SIGUSR1", () => finish());
process.on("SIGUSR2", () => finish());

//catches uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error(err);
	finish();
});
