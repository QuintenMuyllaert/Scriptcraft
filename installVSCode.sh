#!bin/bash
#linuxserver/code-server
#host vscode server with the "public" volume mounted to the project folder
docker run -d \
  --name=code-server \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Etc/UTC \
  -p 8443:8443 \
  -v public:/config/workspace \
  --restart always \
  lscr.io/linuxserver/code-server:latest


#make sure nodejs lts is installed in the container 
docker exec -it code-server bash -c "curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -"
docker exec -it code-server bash -c "apt-get install -y nodejs"
#check : http://localhost:8443/?folder=/config/workspace/MCUSERNAME
