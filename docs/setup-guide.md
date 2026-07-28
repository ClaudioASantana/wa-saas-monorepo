# 🚀 Guia de Configuração de Desenvolvimento - WA SaaS

**Última atualização:** 2026-07-15  
**Branch:** dev  
**Status:** PostgreSQL Direto (migrado do Supabase)

---

## 📋 Pré-requisitos

1. **Node.js** v20+
2. **PostgreSQL** v14+
3. **Redis** (para BullMQ)
4. **Docker** (opcional, para serviços locais)

---

## 🗄️ Configuração do PostgreSQL

### Opção 1: PostgreSQL Local

#### Ubuntu/WSL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Windows
Baixe o instalador: https://www.postgresql.org/download/windows/

### Criar Banco de Dados

```bash
# Conectar como superusuário
sudo -u postgres psql

# Criar banco
CREATE DATABASE wa_saas_dev;

# Criar usuário
CREATE USER wa_saas_user WITH PASSWORD 'sua-senha-forte';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE wa_saas_dev TO wa_saas_user;

# Sair
\q
```

### Opção 2: PostgreSQL via Docker

```bash
docker run -d \
  --name postgres-wa-saas \
  -e POSTGRES_DB=wa_saas_dev \
  -e POSTGRES_USER=wa_saas_user \
  -e POSTGRES_PASSWORD=sua-senha-forte \
  -p 5432:5432 \
  postgres:14-alpine
```

---

## ⚙️ Configuração de Variáveis de Ambiente

### Criar arquivo `.env` na raiz do projeto

```env
# PostgreSQL
DATABASE_URL=postgresql://wa_saas_user:sua-senha-forte@localhost:5432/wa_saas_dev

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# API
API_PORT=4000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3 Local (LocalStack/MinIO)
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=wa-saas-media

# Email (Mailpit para dev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost

# Frontend
FRONTEND_URL=http://localhost:3000
NUXT_PUBLIC_API_URL=http://localhost:4000
NUXT_PUBLIC_APP_URL=http://localhost:3000

# WhatsApp Engine
WHATSAPP_ENGINE_URL=http://localhost:3001
```

---

## 📦 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Rodar migrações do banco
npm run db:migrate --workspace=apps/api

# 3. Adicionar dados de teste (opcional)
npm run db:seed --workspace=apps/api
```

---

## 🚀 Iniciar Desenvolvimento

### Opção 1: Tudo junto
```bash
npm run dev
```

### Opção 2: Serviços separados
```bash
# Terminal 1 - API Backend
npm run dev:api

# Terminal 2 - Frontend Web
npm run dev:web
```

### Opção 3: Com Docker (infraestrutura completa)
```bash
# Iniciar Redis + PostgreSQL
docker-compose up -d

# Iniciar aplicações
npm run dev
```

---

## 🌐 Acessar Aplicação

- **Frontend:** http://localhost:3000
- **API Health Check:** http://localhost:4000/health
- **API Metrics:** http://localhost:4000/metrics

---

## 🧪 Testar Configuração

### 1. Verificar Conexão com PostgreSQL
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 2. Verificar Migrações
```bash
psql $DATABASE_URL -c "SELECT * FROM _migrations;"
```

### 3. Testar API Health Check
```bash
curl http://localhost:4000/health
```

### 4. Testar Registro de Usuário
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "SenhaForte123!",
    "name": "Usuário Teste",
    "tenantName": "Empresa Teste",
    "tenantSlug": "empresa-teste"
  }'
```

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # API + Web
npm run dev:api          # Apenas API
npm run dev:web          # Apenas Web

# Banco de Dados
npm run db:migrate --workspace=apps/api   # Rodar migrações
npm run db:seed --workspace=apps/api      # Seed de dados

# Build de Produção
npm run build

# Qualidade de Código
npm run lint
npm run typecheck

# Validações AIOS
npm run validate:structure
npm run validate:agents
```

---

## 🐳 Docker (Opcional)

### Iniciar Serviços de Infraestrutura
```bash
docker-compose up -d
```

Isso inicia:
- **Redis** (porta 6379)
- **PostgreSQL** (porta 5432)

---

## 🔐 Credenciais Padrão

### PostgreSQL Local
- **Host:** localhost
- **Port:** 5432
- **Database:** wa_saas_dev
- **User:** wa_saas_user
- **Password:** (definida por você)

### Redis Local
- **URL:** redis://localhost:6379

---

## 📚 Documentação Adicional

- [Status da Migração Supabase → PostgreSQL](./migration-status-supabase-to-postgres.md)
- [Análise do Projeto](./project_analysis.md)
- [PRD](./prd/whatsapp-saas-prd.md)

---

## ❓ Troubleshooting

### Erro: "DATABASE_URL não definida"
Certifique-se de ter criado o arquivo `.env` na raiz do projeto com a variável `DATABASE_URL`.

### Erro: "Connection refused" (PostgreSQL)
Verifique se o PostgreSQL está rodando:
```bash
# Ubuntu/WSL
sudo systemctl status postgresql

# macOS
brew services list

# Docker
docker ps | grep postgres
```

### Erro: "Redis connection failed"
Inicie o Redis:
```bash
# Ubuntu/WSL
sudo systemctl start redis

# macOS
brew services start redis

# Docker
docker-compose up -d redis
```

---

**Documentação criada em:** 2026-07-15