# API de Qatu (NestJS) para producción (008). Los secretos llegan por variables de entorno, nunca en la imagen.
FROM node:24-bookworm-slim AS base
WORKDIR /app

# Compila el servidor y los scripts operativos (migraciones, administrador, restauración, archivos).
FROM base AS construccion
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.produccion.json ./
COPY src ./src
COPY scripts ./scripts
RUN npx tsc -p tsconfig.produccion.json

# Solo dependencias de ejecución.
FROM base AS dependencias
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS final
ENV NODE_ENV=production PORT=3001 QATU_HOST=0.0.0.0
COPY --from=dependencias /app/node_modules ./node_modules
COPY --from=construccion /app/dist-produccion ./dist
COPY migrations ./migrations
COPY package.json ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Aplica las migraciones pendientes (con bloqueo, una sola vez aunque arranquen varias réplicas) y arranca la API.
CMD ["sh", "-c", "node dist/scripts/migrate.js && exec node dist/src/main.js"]
