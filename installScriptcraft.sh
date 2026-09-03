#!/bin/bash

# make a docker volume and bind it to the ./public folder on the host machine
docker volume create --name public -d local -o o=bind -o type=none -o device=$(pwd)/public

# make a docker volume and bind it to the ./custom-clean-world folder on the host machine
docker volume create --name custom-clean-world -d local -o o=bind -o type=none -o device=$(pwd)/custom-clean-world

# remove old / unused containers
docker rm -f $(docker ps -a -q -f name=scriptcraft)

# build the image from the Dockerfile (name it ScriptCraft)
docker build -t scriptcraft .

# run the image as a container and mount the public volume to the container's public folder
docker run -d -p 25565:25565 -v public:/root/scriptcraft/public -v custom-clean-world:/root/scriptcraft/custom-clean-world --restart always --name scriptcraft scriptcraft
