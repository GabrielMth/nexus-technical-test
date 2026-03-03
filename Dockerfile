FROM node:20.19.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]