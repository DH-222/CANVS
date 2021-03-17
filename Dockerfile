FROM node:10

WORKDIR /canvs

COPY package.json .
RUN npm install; npm install -g nodemon; npm rebuild node-sass
#COPY . .

#ENV NODE_ENV dev
ENV PATH /canvs/node_modules/.bin:$PATH

CMD ["npm","start-dev"]

