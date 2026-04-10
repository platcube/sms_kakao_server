FROM node:24-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
RUN npm run prisma:generate

FROM deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV TS_NODE_BASEURL=./dist
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci && npm run prisma:generate && npm cache clean --force
COPY --from=builder /app/dist ./dist

EXPOSE 5100

CMD ["node", "-r", "tsconfig-paths/register", "-r", "dotenv/config", "dist/server.js"]
