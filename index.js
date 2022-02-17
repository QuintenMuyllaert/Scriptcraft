console.log("Starting Scriptcraft!");

import { spawn } from "child_process";

const server = spawn("java", ["-jar", "-Xms2G", "-Xmx2G", "server.jar"], { cwd: "./minecraft" });

server.stdout.on("data", (buffer) => {
	console.log(buffer.toString());
});
