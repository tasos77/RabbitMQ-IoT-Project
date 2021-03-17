FROM node:latest
WORKDIR /app
COPY package.json /app
RUN npm install
COPY consumer.js /app
CMD ["node","consumer.js"]