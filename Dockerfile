# Multi-stage build para otimizar o tamanho da imagem final

# Stage 1: Base - Setup pnpm
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Stage 2: Production Dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Stage 3: Build - Instala todas dependências e gera Prisma Client
FROM base AS build
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run db:generate
COPY . .

# Stage 4: Production
FROM node:20-alpine AS production

# Instala openssl para Prisma
RUN apk add --no-cache openssl

# Habilita pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Define o diretório de trabalho
WORKDIR /app

# Cria um usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia dependências de produção e build
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/src ./src
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodejs:nodejs /app/package.json ./
COPY --from=build --chown=nodejs:nodejs /app/pnpm-lock.yaml ./
COPY --from=build --chown=nodejs:nodejs /app/tsconfig.json ./

# Cria o diretório public para anexos
RUN mkdir -p /app/public/anexos && \
    chown -R nodejs:nodejs /app/public

# Muda para o usuário não-root
USER nodejs

# Expõe a porta da aplicação
EXPOSE 3000

# Define variáveis de ambiente para produção
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["pnpm", "start"]
