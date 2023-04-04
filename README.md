# Scriptcraft

Scriptcraft is a tool for coding JavaScript in Minecraft. It allows you to write JavaScript code that can be executed within the game. The p.cjs library inside modules provides a set of functions that allow you to interact with the game environment, including moving, building, and interacting with blocks.

## Installing the Server

The start script is smart and will generate all missing files.

prereqs :

- Linux or WSL or Git Bash
- Node LTS
- Git
- Bash
- Docker
- Minecraft Java Edition

### Clone the repository

```sh
git clone https://github.com/ComputerQ/Scriptcraft/
cd Scriptcraft
```

### Switch to dev branch

```sh
git checkout dev
```

### Install the server ( Scriptcraft + VSCode Server )

```sh
bash install.sh
```

### Optional: Install Scriptcraft without VSCode Server

```sh
bash installScriptcraft.sh
```

### Uninstall the server

```sh
bash uninstall.sh
```

## Running the Server

The install script will make the server run on startup.

### Troubleshooting

- Check if you have all dependencies installed listed above
- Do `docker ps` to see if the server is running
- BE PATIENT! The server can take a while to start up especially on slower machines
- Is any firewall blocking the server? Try disabling it or adding an exception TCP/UDP ( 25565 & 8443 )
- Try reinstalling the server with `bash install.sh`

## Updating the Server

```sh
#pull the latest changes
git pull

#update the server by running install.sh again
bash install.sh
```

## Connecting to the Server

Get the IP address of the server :
Windows : `ipconfig`
Linux : `ip a`

In Minecraft Java Edition, go to Multiplayer and click Add Server.
Enter the IP address of the server and click Done. Name it whatever you want.
Click on the server and click Join Server.

Using the VSCode Server
Go to your browser and enter the IP address of the server with port 8443.
http://IPADRESSOFSERVER:8443/?folder=/config/workspace/MCUSERNAME

## Using Scriptcraft

### Getting started

Inside of minecraft chat type `!sc 1+1` to test if the server is working. You should see 2 in the chat.

If all is working you can make a new Scriptcraft project by typing `!sc create js PROJECTNAME` in the chat.

Inside the VSCode Server, open the newly created project folder there should a file called `index.cjs` open it.
It should look like this :

```js
let p = require("./p.cjs");
const blocks = require("./blocks.cjs");

const checkPoint = Math.random();
p = p.chkpt(checkPoint);
//Start code.

p = p.box("diamond_block", 1, 1, 1);

//Stop code.
p = p.move(checkPoint);
```

You can now run the code by typing `!sc PROJECTNAME` in the chat.
Alternatively you can use any of the following commands :

- !sc PROJECTNAME
- !sc PROJECTNAME()
- !sc PROJECTNAME --in MINECRAFTNAME
- !sc PROJECTNAME() --in MINECRAFTNAME

### Using functions within the p.cjs library

Any function inside p.cjs will return itself. This allows you to chain functions together.
For example :

```js
let p = require("./p.cjs");
const blocks = require("./blocks.cjs");

const checkPoint = Math.random();
p = p.chkpt(checkPoint);

//Start code.
p = p.box("diamond_block", 1, 1, 1).fwd(1).box("gold_block", 1, 1, 1).fwd(1).box("emerald_block", 1, 1, 1);
//Stop code.

p = p.move(checkPoint);
```

### Building

You can use the box() method to build structures in the game. The method takes four parameters:

- block: The type of block to build
- width: The width of the structure
- height: The height of the structure
- depth: The depth of the structure

`p=p.box("stone", 10, 5, 10)`
This will build a structure made of stone blocks that is 10 blocks wide, 5 blocks high, and 10 blocks deep.

### Moving

You can use the `p=p.move()` method to move the drone in the game environment. The method takes one parameter:

name: The name of the checkpoint to move to

```js
p = p.move("checkpoint1");
```

This will move the drone to the checkpoint named "checkpoint1".

### Creating Checkpoints

You can use the `p=p.chkpt()` method to create checkpoints in the game environment. The method takes one parameter:

name: The name of the checkpoint to create

```js
p = p.chkpt("checkpoint1");
```

This will create a checkpoint named "checkpoint1".

### Movement functions

- `p=p.up()`: Moves the drone one block up.
- `p=p.down()`: Moves the drone one block down.
- `p=p.left()`: Moves the drone one block to the left.
- `p=p.right()`: Moves the drone one block to the right.
- `p=p.fwd()`: Moves the drone one block forward.
- `p=p.back()`: Moves the drone one block backward.
- `p=p.turn()`: Rotates the drone 90 degrees to the left. 1 = 90 degrees, 2 = 180 degrees, 3 = 270 degrees, 4 = 360 degrees,..

### Echoing ( "console.log" | "print" )

You can use the `p.echo()` method to display messages in the game environment. The method takes two parameters:

- msg: The message to display
- color: The color of the message (default is "white")

```js
p.echo("Hello, world!", "red");
```

This will display the message "Hello, world!" in red text.
