FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY . .

RUN npm run build
RUN npx prisma generate

CMD ["npm", "start"]