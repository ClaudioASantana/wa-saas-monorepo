# 📊 Estado Atual do Projeto - WA SaaS

**Data:** 2026-07-15  
**Branch:** dev  
**Status:** ✅ Operacional (PostgreSQL Direto)

---

## 🎯 Resumo Executivo

### ✅ Migração Concluída: Supabase → PostgreSQL Direto

O projeto **não usa mais Supabase** para acesso ao banco de dados. A migração foi concluída com sucesso e o sistema agora opera com:

- **PostgreSQL puro** (driver `pg` nativo)
- **Autenticação JWT customizada** (bcrypt + jsonwebtoken)
- **Sistema de migrações SQL manual**
- **Multi-tenant implementado**

---

## 📋 Credenciais Necessárias para Iniciar

### 1. PostgreSQL

Você precisa de uma instância PostgreSQL rodando. Pode ser:

#### Opção A: PostgreSQL Local
```bash
# Instalar PostgreSQL
sudo apt install postgresql  # Ubuntu/WSL
# ou
brew install postgresql@14   # macOS

# Criar banco e usuário
sudo -u postgres psql
CREATE DATABASE wa_saas_dev;
CREATE USER wa_saas_user WITH PASSWORD 'sua-senha';
GRANT ALL PRIVILEGES ON DATABASE wa_saas_dev TO wa_saas_user;
```

#### Opção B: PostgreSQL via Docker
```bash
docker run -d \
  --name postgres-wa-saas \
  -e POSTGRES_DB=wa_saas_dev \
  -e POSTGRES_USER=wa_saas_user \
  -e POSTGRES_PASSWORD=sua-senha \
  -p 5432:5432 \
  postgres:14-alpine
```

#### Opção C: PostgreSQL Remoto (Neon, Railway, Supabase, etc.)
Use a URL de conexão fornecida pelo serviço.

---

### 2. Arquivo `.env` na Raiz do Projeto

Crie um arquivo `.env` com as seguintes variáveis:

```env
# ===== OBRIGATÓRIO =====
# PostgreSQL (substitua com suas credenciais)
DATABASE_URL=postgresql://wa_saas_user:sua-senha@localhost:5432/wa_saas_dev

# JWT Secret (gere um aleatório)
JWT_SECRET=$(openssl rand -base64 32)
# Ou manualmente:
# JWT_SECRET=meu-secret-super-seguro-aqui

# ===== OPCIONAL (tem defaults) =====
# API
API_PORT=4000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:3000
NUXT_PUBLIC_API_URL=http://localhost:4000
NUXT_PUBLIC_APP_URL=http://localhost:3000

# AWS S3 Local (para desenvolvimento)
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Email (Mailpit para desenvolvimento)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
```

---

## 🚀 Como Iniciar o Projeto

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Rodar Migrações do Banco
```bash
npm run db:migrate --workspace=apps/api
```

Isso criará todas as tabelas necessárias:
- `tenants` - Clientes do SaaS
- `agents` - Usuários/atendentes
- `contacts` - Contatos do WhatsApp
- `conversations` - Conversas
- `messages` - Mensagens
- `password_reset_tokens` - Tokens de recuperação

### Passo 3: (Opcional) Adicionar Dados de Teste
```bash
npm run db:seed --workspace=apps/api
```

### Passo 4: Iniciar Aplicação
```bash
# Opção 1: Tudo junto
npm run dev

# Opção 2: Separado
npm run dev:api  # Terminal 1
npm run dev:web  # Terminal 2
```

### Passo 5: Acessar no Navegador
- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000/health

---

## 🔐 Sistema de Autenticação

### Como Funciona

1. **Cadastro** (http://localhost:3000/cadastro)
   - Cria um novo tenant (empresa)
   - Cria um usuário admin com senha hasheada
   - Retorna token JWT válido por 7 dias

2. **Login** (http://localhost:3000/login)
   - Valida email/senha
   - Retorna token JWT

3. **Recuperação de Senha**
   - Gera token temporário (1 hora)
   - Envia email com link

### Endpoints da API

```bash
# Registro
POST /auth/register
Body: { email, password, name, tenantName, tenantSlug }

# Login
POST /auth/login
Body: { email, password }

# Obter usuário atual
GET /auth/me
Headers: { Authorization: "Bearer {token}" }

# Esqueci minha senha
POST /auth/forgot-password
Body: { email }

# Redefinir senha
POST /auth/reset-password
Body: { token, password }
```

---

## 📊 Arquitetura Atual

```
┌─────────────────┐
│   Browser       │
│  localhost:3000 │  ← Nuxt 3 (Frontend)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Backend   │
│  localhost:4000 │  ← Fastify + WebSocket
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Postgres│ │ Redis  │ │   S3   │ │ SMTP   │
│  :5432 │ │ :6379  │ │  Local │ │ :1025  │
└────────┘ └────────┘ └────────┘ └────────┘
```

### Serviços

1. **Frontend (apps/web)** - Nuxt 3 + Pinia + Nuxt UI
2. **API (apps/api)** - Fastify + PostgreSQL + JWT
3. **WhatsApp Engine (apps/whatsapp-engine)** - Baileys + BullMQ
4. **Shared (packages/shared)** - Tipos TypeScript compartilhados

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

```sql
-- Multi-tenant
tenants {
  id UUID PRIMARY KEY
  name TEXT
  slug TEXT UNIQUE
  plan TEXT (free, starter, pro, enterprise)
  status TEXT (active, suspended, cancelled)
}

-- Usuários/Atendentes
agents {
  id UUID PRIMARY KEY
  tenant_id UUID → tenants
  email TEXT UNIQUE
  password_hash TEXT
  name TEXT
  role TEXT (admin, supervisor, agent)
}

-- Contatos do WhatsApp
contacts {
  id UUID PRIMARY KEY
  tenant_id UUID → tenants
  phone TEXT
  name TEXT
}

-- Conversas
conversations {
  id UUID PRIMARY KEY
  tenant_id UUID → tenants
  contact_id UUID → contacts
  agent_id UUID → agents
  status TEXT (open, pending, resolved)
}

-- Mensagens
messages {
  id UUID PRIMARY KEY
  tenant_id UUID → tenants
  conversation_id UUID → conversations
  direction TEXT (inbound, outbound)
  type TEXT (text, image, audio, video)
  content TEXT
}
```

---

## ⚠️ Pontos Importantes

### 1. Não Use Supabase SDK

O projeto **não depende mais** de `@supabase/supabase-js` no backend API e frontend. Apenas o `whatsapp-engine` ainda tem essa dependência (legado).

### 2. Autenticação é JWT Customizada

Não use Supabase Auth. O sistema agora tem autenticação própria:
- JWT armazenado em cookie
- Senha hasheada com bcrypt
- Tokens de recuperação de senha

### 3. Multi-tenant Implementado

Todas as queries devem filtrar por `tenant_id` para garantir isolamento de dados entre clientes.

### 4. Migrações SQL Manuais

As migrações SQL estão em `apps/api/src/db/migrations/` e são executadas manualmente com:
```bash
npm run db:migrate --workspace=apps/api
```

---

## 🧪 Verificação Rápida

### 1. Testar Conexão PostgreSQL
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 2. Verificar Migrações Aplicadas
```bash
psql $DATABASE_URL -c "SELECT * FROM _migrations;"
```

### 3. Testar API Health
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

Se tudo retornar sucesso, o projeto está configurado corretamente! ✅

---

## 📚 Documentação Adicional

- [Guia de Configuração Completo](./setup-guide.md)
- [Status da Migração Supabase → PostgreSQL](./migration-status-supabase-to-postgres.md)
- [Análise do Projeto](./project_analysis.md)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique se o PostgreSQL está rodando
2. Verifique se o arquivo `.env` está configurado
3. Verifique se as migrações foram aplicadas
4. Consulte o [Guia de Configuração](./setup-guide.md)

---

**Documentação criada em:** 2026-07-15