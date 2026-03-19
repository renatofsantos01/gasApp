FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npx prisma generate
RUN ./node_modules/.bin/tsc -p tsconfig.build.json && ls -laR /app/dist/
RUN npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "echo '=== /app/dist contents ===' && ls -laR /app/dist/ && echo '=== starting app ===' && node dist/main"]
