console.log("Starting Scriptcraft!");

import path from "path";
import fs from "fs";

import { spawn, fork } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

import file from "./modules/file.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

//remove old Minecraft world
fs.rmSync(path.join(__dirname, "minecraft", "world"), { recursive: true, force: true });

//copies clean Minecraft world
file.cp(path.join(__dirname, "minecraft", "world_clean"), path.join(__dirname, "minecraft", "world"));

const server = spawn("java", ["-jar", "-Xms2G", "-Xmx2G", "server.jar"], { cwd: "./minecraft" });

//hot reload
let scriptcraft;
const spawnScriptcraft = () => {
	scriptcraft = fork("./modules/scriptcraft.js");
	scriptcraft.alive = true;

	scriptcraft.on("message", (msg) => {
		server.stdin.write(msg);
	});

	scriptcraft.on("close", () => {
		scriptcraft.alive = false;
		scriptcraft.kill();
		spawnScriptcraft();
	});
};

spawnScriptcraft();

fs.watch("./modules", () => {
	scriptcraft.kill();
});

server.stdout.on("data", (buffer) => {
	if (scriptcraft.alive) {
		scriptcraft.send(buffer.toString());
	}
});
