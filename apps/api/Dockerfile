FROM node:26.7.0-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production PORT=3001

# Prisma CLI is retained for migrations before startup and explicit seed commands.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/scripts/setup-auth.mjs ./scripts/setup-auth.mjs
COPY --from=build --chown=node:node /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

USER node
EXPOSE 3001
ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
