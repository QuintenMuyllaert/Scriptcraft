FROM node:lts-alpine

# Create app directory
WORKDIR /root/scriptcraft

# Download openjdk 25
RUN apk add --no-cache openjdk25

# Make minecraft folder
RUN mkdir minecraft

# Download latest minecraft server jar to ./minecraft/server.jar ( 26.2 )
RUN wget -O minecraft/server.jar https://piston-data.mojang.com/v1/objects/823e2250d24b3ddac457a60c92a6a941943fcd6a/server.jar

# Install app dependencies
COPY package*.json ./

# Install dependencies ( Should be no dependencies in the current version )
RUN npm install

# Copy remaining files to ./
COPY . .

# Public folder needs to be mounted as a docker volume
VOLUME /root/scriptcraft/public

# custom-clean-world folder needs to be mounted as a docker volume
VOLUME /root/scriptcraft/custom-clean-world

# Expose port 25565
EXPOSE 25565

# Run the server
CMD ["node", "index.js"]
