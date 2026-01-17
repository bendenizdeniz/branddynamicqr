# FROM node:20-alpine

# RUN apk add --no-cache openssl libc6-compat

# WORKDIR /usr/src/app

# COPY package*.json ./
# # Scriptleri atlayarak temiz kurulum yap
# RUN npm install --ignore-scripts

# COPY prisma ./prisma/

# # KRİTİK: Mevcut bir generated klasörü varsa sil ve temiz generate yap
# RUN rm -rf ./node_modules/.prisma && npx prisma generate

# COPY . .

# EXPOSE 3000
# CMD ["npm", "start"]

FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma/

# BUILD SIRASINDA KRİTİK ADIM:
ENV DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
RUN npx prisma generate

COPY . .
EXPOSE 3000
CMD ["npm", "start"]