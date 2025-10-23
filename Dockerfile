FROM node:20-alpine

WORKDIR /usr/src/app

COPY project/package*.json ./

RUN npm install

COPY project/ .

RUN npx prisma generate