console.log("Loaded");
process.on("message", (msg) => {
	//example chat message
	//[05:16:28] [Server thread/INFO]: <Computer_Q> hello world\n
	console.log(JSON.stringify(msg));

	const chatMessage = msg.match(/: <.+?> /);
	if (!chatMessage) {
		return;
	}

	const playerName = chatMessage[0].replace(": <", "").replace("> ", "");
	const playerMessage = msg.split(chatMessage[0])[1].replace("\n", "");

	process.send(`say ${playerName}-${playerMessage}\n`);
});
