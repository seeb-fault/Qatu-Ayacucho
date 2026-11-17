# Web de Qatu (Next.js) para producción (008), con la salida «standalone» de Next.
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS construccion
# Las reescrituras de /api/v1 hacia la API se fijan al compilar: QATU_API_URL debe ser la dirección interna de la API.
ARG QATU_API_URL=http://api:3001
ENV QATU_API_URL=$QATU_API_URL QATU_NEXT_STANDALONE=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS final
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=construccion /app/public ./public
COPY --from=construccion --chown=node:node /app/.next/standalone ./
COPY --from=construccion --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/icon.svg').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
