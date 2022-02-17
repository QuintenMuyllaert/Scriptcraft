(async (a) => {
	process.send("say hello world! " + a);

	setInterval(() => {
		process.send("say hello world!" + a);
	}, 1000);
})(...process.argv.slice(2));
