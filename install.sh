#!/bin/bash

# pull latest version of the repository
git pull -f

# download minecraft server.jar (1.18.1)
wget -O ./minecraft/server.jar https://launcher.mojang.com/v1/objects/125e5adf40c659fd3bce3e66e67a16bb49ecc1b9/server.jar

# start node server
node .