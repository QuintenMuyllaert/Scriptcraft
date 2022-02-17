import fs from "fs";
import path from "path";

export const cp = (source, target) => {
	const file = fs.statSync(source);
	if (file.isDirectory()) {
		fs.mkdirSync(target);
		fs.readdirSync(source).forEach((file) => {
			cp(path.join(source, file), path.join(target, file));
		});
	} else {
		fs.cpSync(source, target);
	}
};

export const mkDirKeep = (folderPath) => {
	if (fs.existsSync(folderPath)) {
		return;
	}
	fs.mkdirSync(folderPath);
};

export default {
	cp: cp,
	mkDirKeep: mkDirKeep,
};
