#!/bin/bash

# clear changes to core
git reset --hard

# pull latest version of the repository
git pull -f

# start node server
node .