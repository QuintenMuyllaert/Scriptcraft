let hasInit = false;

const args = JSON.parse(process.argv[2]);

const command = {
	user: args.player,
	name: args.script,
};

const slowBuilding = false;

let time = 0;
let timeouts = [];

let s = function (data) {
	process.send(conditions + data);
};

let conditions = "";

module.exports = {
	Drone: {
		owner: command.user,
		name: command.name,
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
			s = function (data) {
				timeouts[timeouts.length] = setTimeout(function () {
					process.send(data);
				}, time * buildSpeed);
				time++;
			};
		}

		conditions = `execute at @e[type=armor_stand,name="Start-${this.Drone.name}"] run `;

		s(`kill @e[type=painting,name=Quinten]`);
		return this;
	},
	echo: function (txt) {
		s(`tellraw ${command.user} "${txt}"`);
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
		s(txt);
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
module.exports.init();

function exitHandler(options, exitCode) {
	if (options.cleanup) {
		process.send(`kill @e[type=armor_stand,name="${module.exports.Drone.name}"]`);
		process.send(`kill @e[type=armor_stand,name="Start-${module.exports.Drone.name}"]`);
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
