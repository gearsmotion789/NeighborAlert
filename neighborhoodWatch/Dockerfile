FROM node

WORKDIR /usr/src/app
COPY . .
RUN npm install --production --silent
RUN npm run build
RUN npm install -g serve

EXPOSE 5000
CMD [ "serve", "-l", "5000", "-s", "build" ]
