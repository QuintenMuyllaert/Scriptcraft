import { exec } from "child_process";
import fs from "fs";

let mayServerStart = false;

export const canServerStart = () => {
	return mayServerStart;
};

export const downloadLatest = () => {
	const text2 = fs.readFileSync(".latestmc").toString();
	if (fs.existsSync(".currentmc")) {
		const text = fs.readFileSync(".currentmc").toString();
		if (text == text2) {
			console.log("Already on last MC version, skipping download.");
			mayServerStart = true;
			return;
		}
	}

	console.log("Downloading latest MC server...");
	const downloader = exec(`wget -O ./minecraft/server.jar ${text2}`, (error, stdout, stderr) => {
		const out = stderr.toString();
		if (out.toString().includes("'./minecraft/server.jar' saved")) {
			console.log("Latest MC dowloaded!");
			fs.writeFileSync(".currentmc", text2);
			mayServerStart = true;
		}
	});
};

export default {
	downloadLatest,
	canServerStart,
};
