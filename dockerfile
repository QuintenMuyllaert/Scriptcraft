FROM node:lts-alpine

# Create app directory
WORKDIR /root/scriptcraft

# Download openjdk 17
RUN apk add --no-cache openjdk17

# Make minecraft folder
RUN mkdir minecraft

# Download latest minecraft server jar to ./minecraft/server.jar ( 1.19.4 )
RUN wget -O minecraft/server.jar https://piston-data.mojang.com/v1/objects/8f3112a1049751cc472ec13e397eade5336ca7ae/server.jar

# Install app dependencies
COPY package*.json ./

# Install dependencies ( Should be no dependencies in the current version )
RUN npm install

# Copy remaining files to ./
COPY . .

# Public folder needs to be mounted as a docker volume
VOLUME /root/scriptcraft/public

# Expose port 25565
EXPOSE 25565

# Run the server
CMD ["node", "index.js"]