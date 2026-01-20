FROM node:20-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Source code
COPY . .

# Prisma generate
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]