
FROM ubuntu:22.04 AS base

WORKDIR /app

RUN apt-get update && apt-get install -y curl libpq-dev
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install nodejs -y
# RUN sudo chown -R $(whoami) ~/.npm

COPY package*.json ./
RUN npm install
# RUN npm ci --only-production

COPY ./dist .

# Start the server
CMD node ./server/index.js

