FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build && \
    npm prune --production && \
    npm cache clean --force

RUN mkdir -p /var/ctf
COPY flag /var/ctf/

EXPOSE 5000
ENV PORT=5000 \
    NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -f http://localhost:${PORT}/ || exit 1

CMD ["node", "app.cjs"]
