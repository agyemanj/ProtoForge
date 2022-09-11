
FROM ubuntu:22.04 AS base

WORKDIR /app

RUN sudo apt install -y curl libpq
RUN sudo curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
RUN sudo apt install nodejs -y
RUN sudo chown -R $(whoami) ~/.npm

COPY package*.json ./
RUN npm install
# RUN npm ci --only-production

RUN npm run build
COPY ./dist .

# Run the server script and start the server
CMD node ./server.js
