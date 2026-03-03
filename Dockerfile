FROM node:20.19.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN DATABASE_URL="postgresql://fake:fake@localhost:5432/fake" npx prisma generate
RUN npm run build || (echo "BUILD FAILED" && cat /app/dist 2>/dev/null && exit 1)
RUN ls -la /app/dist/ || echo "DIST NOT FOUND"

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]