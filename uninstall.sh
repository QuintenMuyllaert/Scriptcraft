#!bin/bash
#uninstall scriptcraft
docker rm -f $(docker ps -a -q)
docker volume rm public
docker rmi scriptcraft
#uninstall code-server
docker rmi lscr.io/linuxserver/code-server:latest
docker rmi linuxserver/code-server:latest

#done!
echo "done!" 
echo "If you want to fully uninstall scriptcraft you can delete the entire Git repository folder."