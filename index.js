console.log("Starting Scriptcraft!");

import path from "path";
import fs from "fs";

import { spawn } from "child_process";
import { dirname } from "path";
import { fileURLToPath } from "url";

import file from "./modules/file.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

//remove old Minecraft world
fs.rmSync(path.join(__dirname, "minecraft", "world"), { recursive: true, force: true });

//copies clean Minecraft world
file.cp(path.join(__dirname, "minecraft", "world_clean"), path.join(__dirname, "minecraft", "world"));

const server = spawn("java", ["-jar", "-Xms2G", "-Xmx2G", "server.jar"], { cwd: "./minecraft" });

server.stdout.on("data", (buffer) => {
	console.log(buffer.toString());
});
