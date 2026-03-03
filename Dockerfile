FROM node:20.19.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://fake:fake@localhost:5432/fake" npx prisma generate

# força rebuild sem cache
ARG CACHEBUST=1
RUN rm -f tsconfig.build.tsbuildinfo && npm run build
RUN ls -la /app/dist/ && find /app/dist -name "*.js" | head -20

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]