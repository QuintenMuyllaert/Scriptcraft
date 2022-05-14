console.log("Loaded");

import fs from "fs";
import path from "path";

import { fork, spawn } from "child_process";
import file from "./file.js";

const prefix = "!sc ";
const player = {};

const sendMessage = (playerName = "@a", msg = '""', color = "white") => {
	msg = JSON.stringify(msg);
	process.send(`tellraw ${playerName} {"text":${msg},"color":"${color}","clickEvent":{"action":"copy_to_clipboard","value":${msg}}}`);
};

process.on("message", (msg) => {
	//example chat message
	//[05:16:28] [Server thread/INFO]: <Computer_Q> hello world

	if (msg.endsWith(" joined the game")) {
		const name = msg.split("]: ").pop().replace(" joined the game", "");
		sendMessage(name, "Welcome in ScriptCraft!", "green");
		sendMessage(name, `Use '${prefix}COMMANDNAME to build.'`, "green");
		sendMessage(name, `Use '${prefix}create js COMMANDNAME' to create a new project.`, "green");
	}

	const chatMessage = msg.match(/: <.+?> /);
	if (!chatMessage) {
		return;
	}

	const playerName = chatMessage[0].replace(": <", "").replace("> ", "");
	const playerMessage = msg.split(chatMessage[0])[1];

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
	if (playerArgument["in"]) {
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

	if (playerCommand === "kill") {
		for (let i in player[playerName].processes) {
			player[playerName].processes[i].kill("SIGINT");
		}
		sendMessage(playerName, "Killed code instances!", "green");
		return;
	}

	if (playerCommand === "kill all") {
		for (const name of Object.keys(player)) {
			for (let i in player[name].processes) {
				player[name].processes[i].kill("SIGINT");
			}
		}
		sendMessage(playerName, "Killed all code instances!", "green");
		return;
	}

	file.mkDirKeep(path.join("./public/", playerName));

	if (!fs.existsSync(path.join("./public/", folderName))) {
		sendMessage(playerName, `Folder "${folderName}" does not exist!`, "red");
		return;
	}

	const scripts = fs.readdirSync(path.join("./public/", folderName));
	const templates = fs.readdirSync(path.join("./templates/"));

	if (playerCommand.startsWith("create ")) {
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

		if (!templates.includes(templateName)) {
			sendMessage(playerName, `"${templateName}" is not a valid template!`, "red");
			return;
		}

		file.cp(path.join("./templates/", templateName), path.join("./public/", folderName, createName));
		sendMessage(playerName, `Created new script in "./public/${folderName}/${createName}" based on "${templateName}"!`, "green");
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
			if (file.startsWith("package")) {
				script = JSON.parse(fs.readFileSync(path.join("./public", folderName, playerFunction, file))).main;
				type = "node";
				break;
			}
		}

		let proc;
		if (type == "node") {
			proc = fork(path.join("./public", folderName, playerFunction, script), [JSON.stringify(scriptcraftArguments), ...playerArguments], {
				detached: true,
				silent: true,
			});

			proc.on("message", (msg) => {
				process.send(msg.toString());
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
			sendMessage(playerName, err, "red");
		}
	}
});

process.send("gamerule doDaylightCycle false");
process.send("gamerule doWeatherCycle false");
process.send("time set 6000");
process.send("gamerule keepInventory true");
process.send("gamerule commandBlockOutput false");
process.send("gamerule doMobSpawning false");
process.send("gamemode @a creative");
