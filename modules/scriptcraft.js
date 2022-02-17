console.log("Loaded");

import fs from "fs";
import path from "path";

import { fork } from "child_process";
import file from "./file.js";

const prefix = "!js ";
const player = {};

process.on("message", (msg) => {
	//example chat message
	//[05:16:28] [Server thread/INFO]: <Computer_Q> hello world\n
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
			player[playerName].processes[i].kill();
		}
		return;
	}

	if (playerCommand === "kill all") {
		for (const name of Object.keys(player)) {
			for (let i in player[name].processes) {
				player[name].processes[i].kill();
			}
		}
		return;
	}

	file.mkDirKeep(path.join("./public/", playerName));

	const scripts = fs.readdirSync(path.join("./public/", playerName));

	const playerFunction = playerCommand.split("(")[0];
	const playerArguments = JSON.parse("[" + (playerCommand.split("(")?.[1] || ")").replace(")", "]"));

	if (scripts.includes(playerFunction)) {
		const proc = fork(path.join("./public", playerName, playerFunction, "index.js"), playerArguments, { detached: true, silent: true });

		proc.on("message", (msg) => {
			process.send(msg);
		});

		proc.stderr.on("data", (err) => {
			err = err.toString().replace(/\"/g, '\\"');
			process.send(
				`tellraw ${playerName} {"text":${JSON.stringify(err)},"color":"red","clickEvent":{"action":"copy_to_clipboard","value":${JSON.stringify(err)}}}`,
			);
		});

		player[playerName].processes.push(proc);
	} else {
		try {
			const out = JSON.stringify(eval(playerCommand))?.replace(/\"/g, '\\"');
			process.send(`tellraw ${playerName} {"text":"${out}","color":"green","clickEvent":{"action":"copy_to_clipboard","value":"${out}"}}`);
		} catch (err) {
			err = JSON.stringify(err.toString())?.replace(/\"/g, '\\"');
			process.send(`tellraw ${playerName} {"text":${err},"color":"red","clickEvent":{"action":"copy_to_clipboard","value":${err}}}`);
		}
	}
});
