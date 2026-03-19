FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

CMD ["./node_modules/.bin/ts-node", "-r", "tsconfig-paths/register", "src/main.ts"]
