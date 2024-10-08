let hasInit = false;
let antigriefing = true;

const args = JSON.parse(process.argv[2]);

const command = {
	owner: args.owner,
	user: args.player,
	name: args.script,
};

const config = require(`../public/${command.owner}/${command.name}/config.json`);

const buildSpeed = config.buildDelay || 0;
const slowBuilding = buildSpeed > 0;

let time = 0;
let timeouts = [];

let s = (data) => {
	process.send(conditions + data);
	console.log(JSON.stringify({ sc: conditions + data }));
};

let conditions = "";

let checkblock = (block) => {
	return block; // comment this out if you want to check the block

	const illegal = ["tnt", "lava", "water", "command_block", "repeating_command_block", "chain_command_block", "structure_block", "structure_void"];
	for (const illi of illegal) {
		if (block.includes(illi)) {
			s(`say "${command.user}" attempted to spawn "${illi}" using ${command.owner}/${command.name}`);
			s(`kick ${command.user} Illegal block usage.`);
			process.exit(1);
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
		s(`execute at @e[name=${this.Drone.owner}] run summon painting ~ ~ ~ {CustomName:"{\\\"text\\\":\\\"Quinten\\\"}",Motive:"minecraft:plant"}`);

		s(
			`execute at @e[type=minecraft:painting,name=Quinten] run summon armor_stand ~ ~ ~0.5 {NoGravity:1b,Invulnerable:1b,Small:0b,Invisible:1b,NoBasePlate:1b,Rotation:[${
				(this.Drone.rotation + 2) * 90
			}F,0F],ArmorItems:[{},{},{},{}],CustomName:"{\\"text\\":\\"${this.Drone.name}\\"}"}`,
		);

		s(
			`execute at @e[type=minecraft:painting,name=Quinten] run summon armor_stand ~ ~ ~0.5 {NoGravity:1b,Invulnerable:1b,Small:0b,Invisible:1b,NoBasePlate:1b,Rotation:[${
				(this.Drone.rotation + 2) * 90
			}F,0F],ArmorItems:[{},{},{},{}],CustomName:"{\\"text\\":\\"Start-${this.Drone.name}\\"}"}`,
		);

		if (slowBuilding) {
			const os = s;
			s = function (data) {
				timeouts.push(
					setTimeout(() => {
						os(data);
					}, time * buildSpeed),
				);
				time++;
			};
		}

		conditions = `execute at @e[type=armor_stand,name="Start-${this.Drone.name}"] run `;

		s(`kill @e[type=painting,name=Quinten]`);
		return this;
	},
	echo: function (msg, color = "white") {
		msg = JSON.stringify(msg);
		s(`tellraw ${command.user} {"text":${msg},"color":"${color}","clickEvent":{"action":"copy_to_clipboard","value":${msg}}}`);
		return this;
	},
	points: {},
	chkpt: function (name) {
		this.points[name] = JSON.parse(JSON.stringify(this.Drone));
		return this;
	},
	move: function (name) {
		if (!this.points[name]) {
			return this;
		}

		this.Drone = JSON.parse(JSON.stringify(this.points[name]));
		s(`tp @e[type=armor_stand,name="${this.Drone.name}"] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		s(`data merge entity @e[type=armor_stand,name="${this.Drone.name}",sort=nearest,limit=1] {Rotation:[${((this.Drone.rotation + 2) % 4) * 90}F,0F]}`);
		return this;
	},
	box: function (block, rechts, boven, diepte) {
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
	turn: function (amt) {
		if (amt == null) {
			this.Drone.rotation = this.Drone.rotation + 1;
		} else {
			this.Drone.rotation = this.Drone.rotation + amt;
		}
		this.Drone.rotation = this.Drone.rotation % 4;
		s(`data merge entity @e[type=armor_stand,name="${this.Drone.name}",sort=nearest,limit=1] {Rotation:[${((this.Drone.rotation + 2) % 4) * 90}F,0F]}`);
		return this;
	},
	fwd: function (amt) {
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
	back: function (amt) {
		if (amt == null) {
			amt = 1;
		}
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
	left: function (amt) {
		if (amt == null) {
			amt = 1;
		}
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
	right: function (amt) {
		if (amt == null) {
			amt = 1;
		}
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
	up: function (amt) {
		if (amt == null) {
			amt = 1;
		}
		this.Drone.location[1] = parseFloat(this.Drone.location[1]) + amt;
		s(`tp @e[type=armor_stand,name=${this.Drone.name}] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	down: function (amt) {
		if (amt == null) {
			amt = 1;
		}
		this.Drone.location[1] = parseFloat(this.Drone.location[1]) - amt;
		s(`tp @e[type=armor_stand,name=${this.Drone.name}] ~${this.Drone.location[0]} ~${this.Drone.location[1]} ~${this.Drone.location[2]}`);
		return this;
	},
	command: function (txt) {
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

function exitHandler(options, exitCode) {
	if (options.cleanup) {
		process.send(`kill @e[type=armor_stand,name="${module.exports.Drone.name}"]`);
		process.send(`kill @e[type=armor_stand,name="Start-${module.exports.Drone.name}"]`);
		module.exports.echo(`Exited "${command.name}"!`, "green");
	}
	if (exitCode || exitCode === 0) console.log(exitCode);
	if (options.exit) process.exit();
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error(err);
	exitHandler.bind(null, { exit: true });
});
