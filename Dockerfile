FROM node:20-alpine3.18

RUN addgroup -g 1001 -S newuser && \
    adduser -u 1001 -S newuser -G newuser

WORKDIR /usr/src/app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci --ignore-scripts

COPY . .

EXPOSE 3000

USER newuser

CMD ["npm", "run", "start"]
