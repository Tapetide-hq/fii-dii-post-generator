FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY server.js template.html template-instagram.html shared.js ./

EXPOSE 3000

CMD ["node", "server.js"]
