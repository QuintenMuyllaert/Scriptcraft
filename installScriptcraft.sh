#!/bin/bash

# make a docker volume and bind it to the ./public folder on the host machine
docker volume create --name public -d local -o o=bind -o type=none -o device=$(pwd)/public

# remove old / unused containers
docker rm -f $(docker ps -a -q)

# build the image from the Dockerfile (name it ScriptCraft)
docker build -t scriptcraft .

# run the image as a container and mount the public volume to the container's public folder
docker run -d -p 25565:25565 -v public:/root/scriptcraft/public --restart always --name scriptcraft scriptcraft