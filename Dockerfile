FROM node:16-alpine

WORKDIR /usr/src/app

COPY package.json ./

COPY tsconfig.json ./

COPY src ./src

RUN npm install

RUN npm run build 

CMD [ "node", "./dist/index.js" ]