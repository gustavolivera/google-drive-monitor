# frontend/Dockerfile

FROM node:20-alpine AS builder

# Instala dependências e compila o app
WORKDIR /app
COPY . .
RUN npm install --frozen-lockfile
RUN npm run build

# Etapa final: runtime do Electron
FROM node:20-alpine

# Instalar o Electron globalmente
RUN npm install -g electron

WORKDIR /app

# Copia os arquivos necessários do builder
COPY --from=builder /app /app

# Copia o .env gerado dinamicamente
COPY .env .env

# Comando para iniciar o Electron app
CMD ["electron", "."]
