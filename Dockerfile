FROM node:20-alpine

LABEL maintainer="WVI Engine <api@wvi.health>"
LABEL description="WVI — Wellness Vitality Index API Server (18 emotions, 64 activities, 10 metrics)"

WORKDIR /app

# Install deps first (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app
COPY server.js ./
COPY services/ ./services/
COPY swagger/ ./swagger/
COPY API-DOCUMENTATION.md ./
COPY .env.example ./

EXPOSE 8091

ENV PORT=8091
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8091/api/v1/health/server-status || exit 1

CMD ["node", "server.js"]
