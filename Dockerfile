FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV TS_NODE_BASEURL=./dist
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 5100

CMD ["sh", "-c", "npx prisma migrate deploy && node -r tsconfig-paths/register -r dotenv/config dist/server.js"]
