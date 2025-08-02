# frontend/Dockerfile

FROM node:20-alpine AS builder

# Instala dependências e compila o app
WORKDIR /app
COPY . .
RUN npm install --frozen-lockfile
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Copia os arquivos necessários do builder
COPY --from=builder /app /app

# Copia o .env gerado dinamicamente
COPY .env .env

# Expõe a porta padrão do Vite (5173)
EXPOSE 5173

CMD ["npm", "run", "dev"]
