console.log("Loaded");

import fs from "fs";
import path from "path";

import { fork } from "child_process";
import file from "./file.js";

const prefix = "!js ";
const player = {};

const sendMessage = (playerName = "@a", msg = "", color = "white") => {
	msg = JSON.stringify(msg);
	process.send(`tellraw ${playerName} {"text":${msg},"color":"${color}","clickEvent":{"action":"copy_to_clipboard","value":${msg}}}`);
};

process.on("message", (msg) => {
	//example chat message
	//[05:16:28] [Server thread/INFO]: <Computer_Q> hello world
	console.log(JSON.stringify(msg));

	const chatMessage = msg.match(/: <.+?> /);
	if (!chatMessage) {
		return;
	}

	const playerName = chatMessage[0].replace(": <", "").replace("> ", "");
	const playerMessage = msg.split(chatMessage[0])[1];

	if (!playerMessage.startsWith(prefix)) {
		return;
	}

	const playerCommand = playerMessage.replace(prefix, "");

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

	const scripts = fs.readdirSync(path.join("./public/", playerName));
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

		file.cp(path.join("./templates/", templateName), path.join("./public/", playerName, createName));
		sendMessage(playerName, `Created new script in "./public/${playerName}/${createName}" based on "${templateName}"!`, "green");
		return;
	}

	const playerFunction = playerCommand.split("(")[0];
	const playerArguments = JSON.parse("[" + (playerCommand.split("(")?.[1] || ")").replace(")", "]"));

	if (scripts.includes(playerFunction)) {
		const scriptcraftArguments = {
			owner: playerName,
			script: playerFunction,
			player: playerName,
			args: playerArguments,
		};

		fs.writeFileSync(path.join("./public/", playerName, playerFunction, ".command.json"), JSON.stringify(scriptcraftArguments));

		const proc = fork(path.join("./public", playerName, playerFunction, "index.cjs"), [JSON.stringify(scriptcraftArguments), ...playerArguments], {
			detached: true,
			silent: true,
		});

		proc.on("message", (msg) => {
			process.send(msg.toString());
		});

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
