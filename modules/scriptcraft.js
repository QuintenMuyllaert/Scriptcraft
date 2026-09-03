console.log("Loaded\n");

import fs from "fs";
import path from "path";

import { fork, spawn } from "child_process";
import file from "./file.js";

const prefix = "!sc ";
const player = {};

let settings = JSON.parse(fs.readFileSync("./settings.json"));

if (!fs.existsSync("./minecraft/shadowbanned.json")) {
	fs.writeFileSync("./minecraft/shadowbanned.json", "[]");
}
const shadowbanned = JSON.parse(fs.readFileSync("./minecraft/shadowbanned.json"));

const sendMessage = (playerName = "@a", msg = '""', color = "white", toCopy = "") => {
	msg = JSON.stringify(msg);

	if (toCopy === "") {
		process.send(`tellraw ${playerName} {"text":${msg},"color":"${color}"}`);
		return;
	}
	process.send(`tellraw ${playerName} {"text":${msg},"color":"${color}","click_event":{"action":"copy_to_clipboard","value":"${toCopy}"}}`);
};

process.on("message", (msg) => {
	//example chat message
	//[05:16:28] [Server thread/INFO]: <Computer_Q> hello world

	//Microsoft ruining it all..
	msg = msg.replace("[Server thread/INFO]: [Not Secure]", "[Server thread/INFO]:");

	console.log(msg);

	if (!fs.existsSync("./minecraft/ops.json")) {
		fs.writeFileSync("./minecraft/ops.json", "[]");
	}
	const ops = JSON.parse(fs.readFileSync("./minecraft/ops.json")).map((op) => op.name);

	const chatMessage = msg.match(/: [<\[][a-zA-Z0-9\_]{3,16}[>\]] |: \* [a-zA-Z0-9\_]{3,16} /);

	if (msg.endsWith(" joined the game") && !chatMessage) {
		const name = msg.split("]: ").pop().replace(" joined the game", "");
		sendMessage(name, "Welcome in ScriptCraft!", "green");
		sendMessage(name, `Use '${prefix}COMMANDNAME' to build.`, "green", `${prefix}COMMANDNAME`);
		sendMessage(name, `Use '${prefix}create js COMMANDNAME' to create a new project.`, "green", `${prefix}create js COMMANDNAME`);
		sendMessage(name, `Use '${prefix}help' to see all commands.`, "green", `${prefix}help`);
		if (shadowbanned.includes(name)) {
			process.send(`gamemode spectator ${name}`);
			sendMessage(name, "You are shadowbanned!", "red");
			return;
		}
		if (ops.length === 0) {
			process.send(`op ${name}`);
			sendMessage(name, "As there were no previous operators, you are now an operator!", "dark_blue");
			ops.push(name);
		}
	}
	if (!chatMessage) {
		return;
	}
	const playerName = chatMessage[0].replace(/[^a-zA-Z0-9\_]/g, "");
	const playerMessage = msg.split(chatMessage[0])[1];

	const isOp = ops.includes(playerName);
	const isShadowbanned = shadowbanned.includes(playerName);

	if (!playerMessage.startsWith(prefix)) {
		return;
	}

	const playerFullCommand = playerMessage.replace(prefix, "");

	const playerCommand = playerFullCommand.split(" --")[0];
	const playerArgs = playerFullCommand.split(" --").slice(1);

	const playerArgument = {};
	for (const arg of playerArgs) {
		const [name, value] = arg.split(" ");
		playerArgument[name] = value;
	}

	let folderName = playerName;
	file.mkDirKeep(path.join("./public/", playerName));
	if (playerArgument["in"]) {
		if (!isOp) {
			sendMessage(playerName, `You are not allowed to use the "--in" parameter!`, "red");
			return;
		}
		const folder = playerArgument["in"].match(/([a-zA-Z_\-0-9])\w+/);
		if (!folder) {
			sendMessage(playerName, `Illegal folder for "--in" parameter!`, "red");
			return;
		}
		folderName = folder[0];
	}

	if (!player[playerName]) {
		player[playerName] = {
			processes: [],
		};
	}

	if (/^help$/i.test(playerCommand)) {
		sendMessage(playerName, `Available commands:`, "green");
		sendMessage(playerName, `${prefix}help - Show this message`, "green", `${prefix}help`);
		sendMessage(playerName, `${prefix}kill - Kill all code instances for yourself`, "green", `${prefix}kill`);
		if (!isOp) {
			sendMessage(playerName, `${prefix}create TEMPLATE SCRIPTNAME - Create a new script based on a template`, "green", `${prefix}create js SCRIPTNAME`); //as there is only one template, this is the only valid command for now
			sendMessage(playerName, `${prefix}COMMANDNAME(ARGUMENTS) - Run a script`, "green", `${prefix}COMMANDNAME(ARGUMENTS)`);
			sendMessage(playerName, `${prefix}list - List all your scripts`, "green", `${prefix}list`);
		}
		if (isOp) {
			sendMessage(
				playerName,
				`${prefix}create TEMPLATE SCRIPTNAME --in FOLDERNAME - Create a new script based on a template`,
				"blue",
				`${prefix}create TEMPLATE SCRIPTNAME --in FOLDERNAME`,
			);
			sendMessage(playerName, `${prefix}COMMANDNAME(ARGUMENTS) --in FOLDERNAME - Run a script`, "blue", `${prefix}COMMANDNAME(ARGUMENTS) --in FOLDERNAME`);
			sendMessage(playerName, `${prefix}list --in FOLDERNAME - List all scripts in a folder`, "blue", `${prefix}list --in FOLDERNAME`);
			sendMessage(playerName, `${prefix}shadowban PLAYERNAME - shadowban a player.`, "blue", `${prefix}shadowban PLAYERNAME`);
			sendMessage(playerName, `${prefix}unshadowban PLAYERNAME - unshadowban a player.`, "blue", `${prefix}unshadowban PLAYERNAME`);
			sendMessage(playerName, `${prefix}kill all - kill all code instances.`, "blue", `${prefix}kill all`);
			sendMessage(playerName, `${prefix}grief - Toggle antigrief, disabling dangerous blocks and commands for non-ops.`, "blue", `${prefix}grief`);
			sendMessage(playerName, `Antigrief is currently set to ${settings.antigrief}`, "blue");
			sendMessage(playerName, `Replace_world is currently set to ${settings.replace_world}`, "blue");
			if (ops.length > 0) {
				if (ops.length === 1) {
					sendMessage(playerName, `Only you, ${ops[0]}, are an operator.`, "blue");
				} else {
					sendMessage(playerName, `Operators: ${ops.join(", ")}.`, "blue");
				}
			}
			if (shadowbanned.length > 0) {
				if (shadowbanned.length === 1) {
					sendMessage(playerName, `${shadowbanned[0]} is shadowbanned.`, "blue");
				} else {
					sendMessage(playerName, `Shadowbanned: ${shadowbanned.join(", ")}.`, "blue");
				}
			}
		}
		return;
	}

	if (/^kill$/i.test(playerCommand)) {
		for (let i in player[playerName].processes) {
			player[playerName].processes[i].kill("SIGINT");
		}
		sendMessage(playerName, "Killed code instances!", "green");
		return;
	}

	if (/^kill all$|^killall$|^kill-all$|^kill_all$/i.test(playerCommand)) {
		if (!isOp) {
			sendMessage(playerName, `You are not allowed to kill all code instances!`, "red");
			return;
		}
		for (const name of Object.keys(player)) {
			for (let i in player[name].processes) {
				player[name].processes[i].kill("SIGINT");
			}
		}
		sendMessage(playerName, "Killed all code instances!", "green");
		return;
	}
	if (/^grief$/i.test(playerCommand)) {
		if (!isOp) {
			sendMessage(playerName, `You are not allowed to toggle antigrief!`, "red");
			return;
		}
		settings.antigrief = !settings.antigrief;
		fs.writeFileSync("./settings.json", JSON.stringify(settings));
		sendMessage(playerName, `Toggled antigrief to ${settings.antigrief}`, "blue");
		return;
	}

	if (/^replace_world$|^replaceworld$|^replace-world$|^replace world$/i.test(playerCommand)) {
		if (!isOp) {
			sendMessage(playerName, `You are not allowed to toggle replace_world!`, "red");
			return;
		}
		settings.replace_world = !settings.replace_world;
		fs.writeFileSync("./settings.json", JSON.stringify(settings));
		sendMessage(playerName, `Toggled replace_world to ${settings.replace_world}`, "blue");
		return;
	}

	if (!fs.existsSync(path.join("./public/", folderName))) {
		sendMessage(playerName, `Folder "${folderName}" does not exist!`, "red");
		return;
	}

	const scripts = fs.readdirSync(path.join("./public/", folderName)).filter((f) => !f.startsWith(".")); // exclude .DS_Store and other hidden files
	const templates = fs.readdirSync(path.join("./templates/")).filter((f) => !f.startsWith(".")); // exclude .DS_Store and other hidden files

	if (/^list$/i.test(playerCommand)) {
		//list all scripts in user folder (should work with the --in flag)
		sendMessage(playerName, `Scripts in "${folderName}": ${scripts.join(", ")}`, "green");
		return;
	}

	const shadowban = function (playerName = "Server", playerCommand = "", isOp = false) {
		if (!isOp) {
			sendMessage(playerName, `You are not allowed to shadowban players!`, "red");
			return;
		}

		const shadowbanPlayerSelector = playerCommand.split(" ")[1];
		let shadowbanPlayer = shadowbanPlayerSelector;

		if (!shadowbanPlayerSelector) {
			sendMessage(playerName, `Please specify a player to shadowban!`, "red");
			return;
		}

		if (shadowbanPlayerSelector.includes("@")) {
			if (shadowbanPlayerSelector === "@s") {
				sendMessage(playerName, `You cannot shadowban yourself!`, "red");
				return;
			}
			if (shadowbanPlayerSelector === "@a" || shadowbanPlayerSelector === "@e") {
				for (const name of Object.keys(player)) {
					const previousLength = shadowbanned.length;
					if (!ops.includes(name)) {
						process.send(`gamemode spectator ${name}`);
						sendMessage(name, "You are shadowbanned!", "red");
						sendMessage(playerName, `Shadowbanned player "${name}"!`, "green");
						shadowbanned.push(name);
					}
				}
				if (shadowbanned.length === previousLength) {
					sendMessage(playerName, `No players were shadowbanned!`, "red");
					return;
				}
				fs.writeFileSync("./minecraft/shadowbanned.json", JSON.stringify(shadowbanned));
				return;
			}
			if (shadowbanPlayerSelector === "@p") {
				sendMessage(playerName, `@p is unsupported!`, "red");
				return;
			}
			if (shadowbanPlayerSelector === "@r") {
				shadowbanPlayer = Object.keys(player)[Math.floor(Math.random() * Object.keys(player).length)];
			}
		}

		if (shadowbanPlayer === playerName) {
			sendMessage(playerName, `You cannot shadowban yourself!`, "red");
			return;
		}

		if (shadowbanned.includes(shadowbanPlayer)) {
			sendMessage(playerName, `Player "${shadowbanPlayer}" is already shadowbanned!`, "red");
			return;
		}

		if (ops.includes(shadowbanPlayer)) {
			sendMessage(playerName, `Player "${shadowbanPlayer}" is an operator and cannot be shadowbanned!`, "red");
			return;
		}

		process.send(`gamemode spectator ${shadowbanPlayer}`);
		sendMessage(shadowbanPlayer, "You are shadowbanned!", "red");
		sendMessage(playerName, `Shadowbanned player "${shadowbanPlayer}"!`, "green");
		shadowbanned.push(shadowbanPlayer);
		fs.writeFileSync("./minecraft/shadowbanned.json", JSON.stringify(shadowbanned));
		return;
	};

	if (/^shadowban /i.test(playerCommand)) {
		shadowban(playerName, playerCommand, isOp);
		return;
	}

	if (/^unshadowban /i.test(playerCommand)) {
		const unshadowbanPlayerSelector = playerCommand.split(" ")[1];
		let unshadowbanPlayer = unshadowbanPlayerSelector;

		if (!isOp) {
			sendMessage(playerName, `You are not allowed to unshadowban players!`, "red");
			return;
		}

		if (!unshadowbanPlayerSelector) {
			sendMessage(playerName, `Please specify a player to unshadowban!`, "red");
			return;
		}

		if (unshadowbanPlayerSelector.includes("@")) {
			if (unshadowbanPlayerSelector === "@a" || unshadowbanPlayerSelector === "@e") {
				if (shadowbanned.length === 0) {
					sendMessage(playerName, `No players are shadowbanned!`, "red");
					return;
				}
				shadowbanned = [];
				process.send(`gamemode creative @a`);
				sendMessage(playerName, `Unshadowbanned all players!`, "green");
				fs.writeFileSync("./minecraft/shadowbanned.json", JSON.stringify(shadowbanned));
				return;
			}
			if (unshadowbanPlayerSelector === "@p") {
				sendMessage(playerName, `@p is unsupported!`, "red");
				return;
			}
			if (unshadowbanPlayerSelector === "@r") {
				unshadowbanPlayer = Object.keys(player)[Math.floor(Math.random() * Object.keys(player).length)];
			}
		}

		if (!shadowbanned.includes(unshadowbanPlayer)) {
			sendMessage(playerName, `Player "${unshadowbanPlayer}" is not shadowbanned!`, "red");
			return;
		}

		process.send(`gamemode creative ${unshadowbanPlayer}`);
		sendMessage(unshadowbanPlayer, "You are no longer shadowbanned!", "green");
		sendMessage(playerName, `Unshadowbanned player "${unshadowbanPlayer}"!`, "green");
		const index = shadowbanned.indexOf(unshadowbanPlayer);
		if (index > -1) {
			shadowbanned.splice(index, 1);
		}
		fs.writeFileSync("./minecraft/shadowbanned.json", JSON.stringify(shadowbanned));
		return;
	}

	if (!fs.existsSync(path.join("./public/", folderName))) {
		sendMessage(playerName, `Folder "${folderName}" does not exist!`, "red");
		return;
	}

	if (/^create /i.test(playerCommand)) {
		const createParts = playerCommand.split(" ");

		if (createParts.length !== 3) {
			sendMessage(playerName, `Create expected a template & name!`, "red");
			return;
		}

		const templateName = createParts[1];
		const createName = createParts[2];

		if (scripts.includes(createName)) {
			sendMessage(playerName, `You already have a script named "${createName}"!`, "red");
			return;
		}

		if (createName.startsWith(".")) {
			sendMessage(playerName, `Script name cannot start with a "."!`, "red");
			return;
		}

		if (!templates.includes(templateName)) {
			sendMessage(playerName, `"${templateName}" is not a valid template!`, "red");
			return;
		}

		sendMessage(playerName, process.cwd(), "green");

		file.cp(path.join("./templates/", templateName), path.join("./public/", folderName, createName));
		sendMessage(playerName, `Created new script in "./public/${folderName}/${createName}" based on "${templateName}"!`, "green");
		spawn("chmod", ["777", "-R", "../", "server.jar"], { cwd: "./minecraft" });
		return;
	}

	const playerFunction = playerCommand.split("(")[0];
	const playerArguments = JSON.parse("[" + (playerCommand.split("(")?.[1] || ")").replace(")", "]"));

	if (scripts.includes(playerFunction)) {
		const scriptcraftArguments = {
			owner: folderName,
			script: playerFunction,
			player: playerName,
			args: playerArguments,
			isOp: isOp,
			isShadowbanned: isShadowbanned,
			antigrief: settings.antigrief,
		};

		fs.writeFileSync(path.join("./public/", folderName, playerFunction, ".command.json"), JSON.stringify(scriptcraftArguments));

		const files = fs.readdirSync(path.join("./public", folderName, playerFunction));

		let script = "";
		let type = "";
		const programs = {
			js: "node",
			cjs: "node",
			py: "python",
			sh: "bash",
		};

		for (const file of files) {
			if (file.startsWith("start") || file.startsWith("index") || file.startsWith("main") || file.startsWith("app")) {
				script = file;
				type = programs[script.split(".").pop()];
			}
			if (file.startsWith("package.json")) {
				script = JSON.parse(fs.readFileSync(path.join("./public", folderName, playerFunction, file))).main;
				type = "node";
				break;
			}
		}
		/*
		console.log({
			folderName,
			playerFunction,
			script,
			scriptcraftArguments,
			playerArguments,
		});
		*/
		let proc;
		if (type == "node") {
			proc = fork(script, [JSON.stringify(scriptcraftArguments), ...playerArguments], {
				detached: true,
				silent: true,
				cwd: path.join("./public", folderName, playerFunction),
			});

			proc.on("message", (msg) => {
				if (/^shadowban /.test(msg)) {
					shadowban("Server", msg, true);
					return;
				} else {
					process.send(msg.toString());
				}
			});
		} else {
			proc = spawn(type, [script, JSON.stringify(scriptcraftArguments), ...playerArguments], {
				cwd: path.join("./public", folderName, playerFunction),
			});

			proc.stdout.on("data", (msg) => {
				const msgs = msg.toString().split("\n");
				for (const msg of msgs) {
					try {
						const obj = JSON.parse(msg);
						if (obj?.sc) {
							process.send(obj?.sc.toString());
						}
					} catch (e) {
						sendMessage(playerName, msg.toString().slice(0, -1), "white");
					}
				}
			});
		}

		proc.stderr.on("data", (err) => {
			sendMessage(playerName, err.toString(), "red");
		});
		player[playerName].processes.push(proc);
	} else {
		try {
			sendMessage(playerName, JSON.stringify(eval(playerCommand)), "green");
		} catch (err) {
			sendMessage(playerName, err.message, "red");
		}
	}
});
