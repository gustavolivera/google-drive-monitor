# api/Dockerfile

# Etapa de build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install --frozen-lockfile
RUN npm run build

# Etapa de produção
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY .env .env
CMD ["node", "dist/main"]
