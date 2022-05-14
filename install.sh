#!/bin/bash

# pull latest version of the repository
git pull -f

# download minecraft server.jar (1.18.1)
# wget -O ./minecraft/server.jar https://launcher.mojang.com/v1/objects/125e5adf40c659fd3bce3e66e67a16bb49ecc1b9/server.jar

# download minecraft server.jar (1.18.2)
wget -O ./minecraft/server.jar https://launcher.mojang.com/v1/objects/c8f83c5655308435b3dcf03c06d9fe8740a77469/server.jar

# start node server
node .