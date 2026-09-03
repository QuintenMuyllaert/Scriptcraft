console.clear();
console.log("\nStarting Scriptcraft!");

import path from "path";
import fs from "fs";

import { spawn, fork } from "child_process";
import file from "./modules/file.js";

//check ram of the system
import os from "os";
const totalRam = os.totalmem();
//use at most 80% of the ram
const maxRam = Math.floor(totalRam * 0.8);
//prefer 40% of the ram
const midRam = Math.floor(totalRam * 0.4);
//use more than 20% of the ram
const minRam = Math.floor(totalRam * 0.2);
const maxRamInMegabytes = Math.floor(maxRam / 1024 / 1024);
const midRamInMegabytes = Math.floor(midRam / 1024 / 1024);
const minRamInMegabytes = Math.floor(minRam / 1024 / 1024);
console.log(`Using at most ${maxRamInMegabytes}MB of RAM`);

(async () => {
	const init = (d = false) => {
		if (!fs.existsSync("./settings.json")) {
			fs.writeFileSync("./settings.json", '{ "replace_world":true, "antigrief":true }');
		}
		let settings = JSON.parse(fs.readFileSync("./settings.json"));
		if (settings.replace_world) {
			//remove old Minecraft world
			fs.rmSync(path.join("./minecraft", "world"), { recursive: true, force: true });

			//copies clean Minecraft world
			let clean_world;
			if (fs.existsSync("./custom-clean-world") && fs.readdirSync(path.join("./custom-clean-world")).filter((f) => !f.includes(".")).length > 0 && !d) {
				clean_world = path.join("./custom-clean-world", fs.readdirSync(path.join("./custom-clean-world")).filter((f) => !f.includes("."))[0]);
				console.log(`replacing world with ${clean_world}`);
			} else {
				clean_world = path.join("./minecraft/world_clean");
				if (d) {
					console.clear();
					console.log(
						`The first directory "${path.join("./custom-clean-world", fs.readdirSync(path.join("./custom-clean-world")).filter((f) => !f.includes("."))[0])}" was not a minecraft world`,
					);
				}
			}
			file.cp(path.join(`${clean_world}`), path.join("./minecraft/world"));
		}

		const server = spawn("java", ["-jar", `-Xms${minRamInMegabytes}M`, `-Xmx${maxRamInMegabytes}M`, `-XX:SoftMaxHeapSize=${midRamInMegabytes}M`, "server.jar"], { cwd: "./minecraft" });

		//hot reload
		let scriptcraft;
		const spawnScriptcraft = () => {
			scriptcraft = fork("./modules/scriptcraft.js");
			scriptcraft.alive = true;

			scriptcraft.on("message", (msg) => {
				server.stdin.write(msg.toString() + "\n");
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
			const msg = buffer.toString().replace("\n", "");
			if (
				settings.replace_world &&
				msg.endsWith("/INFO]: No existing world data, creating new world") &&
				!/: [<\[][a-zA-Z0-9\_]{3,16}[>\]] |: \* [a-zA-Z0-9\_]{3,16} /.test(msg)
			) {
				console.log(buffer.toString().replace("\n", ""));
				scriptcraft.alive = false;
				scriptcraft.kill();
				server.kill();
				init(true);
			}
			if (scriptcraft.alive) {
				scriptcraft.send(msg);
			}
		});

		server.on("exit", (code, signal) => {
			console.log(`minecraft exited code=${code} signal=${signal}`);
			process.exit(code ?? 1);
		});

		process.on("SIGTERM", () => server.stdin.write("stop\n"));
		process.on("SIGINT", () => server.stdin.write("stop\n"));
	};
	init();
})();
