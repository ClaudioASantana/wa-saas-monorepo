# 📊 Status da Migração: Supabase → PostgreSQL Direto

**Data:** 2026-07-15  
**Branch:** dev  
**Status:** ✅ **MIGRAÇÃO CONCLUÍDA COM SUCESSO**

---

## 🎯 Resumo Executivo

A migração do Supabase para PostgreSQL direto foi **concluída com sucesso** na branch `dev`. O projeto agora usa PostgreSQL puro com o driver nativo `pg` e não depende mais do SDK do Supabase para acesso ao banco de dados.

### ✅ O Que Foi Migrado

1. **Backend API (`apps/api`)**
   - ✅ Substituído `@supabase/supabase-js` pelo driver nativo `pg`
   - ✅ Configuração de pool de conexões PostgreSQL (`apps/api/src/config/db.ts`)
   - ✅ Sistema de migrações SQL (`apps/api/src/db/migrate.ts`)
   - ✅ Scripts de seed de dados (`apps/api/src/db/seed.ts`)
   - ✅ Autenticação própria com JWT e bcrypt
   - ✅ Sistema de recuperação de senha com tokens temporários

2. **Frontend Web (`apps/web`)**
   - ✅ Removido `@nuxtjs/supabase` das dependências
   - ✅ Autenticação via API backend (JWT em cookies)
   - ✅ Composables customizados (`useAuth.ts`)
   - ✅ Stores Pinia para gerenciamento de estado

3. **WhatsApp Engine (`apps/whatsapp-engine`)**
   - ⚠️ Ainda usa `@supabase/supabase-js` (dependência legada)
   - 📝 Pode ser migrado futuramente se necessário

---

## 🗄️ Arquitetura do Banco de Dados Atual

### Schema PostgreSQL (4 Migrações Aplicadas)

```
apps/api/src/db/migrations/
├── 001_create_tenants.sql          # Tabela de tenants (multi-tenant)
├── 002_create_base_tables.sql      # contacts, agents, conversations, messages
├── 005_auth_setup.sql              # Adiciona password_hash aos agents
└── 006_password_reset_tokens.sql   # Tokens de recuperação de senha
```

### Principais Tabelas

1. **tenants** - Clientes do SaaS (multi-tenant)
2. **agents** - Usuários/atendentes (com autenticação)
3. **contacts** - Contatos do WhatsApp
4. **conversations** - Conversas/atendimentos
5. **messages** - Mensagens trocadas
6. **password_reset_tokens** - Tokens de recuperação de senha

### Características do Schema

- ✅ **Multi-tenant:** Todas as tabelas têm `tenant_id`
- ✅ **Row Level Security (RLS):** Pronto para implementação futura
- ✅ **Índices otimizados:** Para consultas por tenant
- ✅ **Triggers:** Atualização automática de `updated_at`
- ✅ **Constraints:** Validação de dados no banco

---

## 🔐 Sistema de Autenticação

### Como Funciona Agora

1. **Registro de Usuário** (`POST /auth/register`)
   - Cria um novo tenant
   - Cria um agent admin com senha hasheada (bcrypt)
   - Retorna JWT válido por 7 dias

2. **Login** (`POST /auth/login`)
   - Valida email/senha usando bcrypt
   - Retorna JWT com `agentId`, `tenantId`, `email`, `role`

3. **Recuperação de Senha**
   - `POST /auth/forgot-password` - Gera token e envia email
   - `POST /auth/reset-password` - Valida token e atualiza senha

4. **Proteção de Rotas**
   - Middleware `authenticate` valida JWT
   - Frontend armazena token em cookie seguro

---

## 📋 Variáveis de Ambiente Necessárias

### Backend API (`apps/api/.env`)

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@localhost:5432/wa_saas_dev

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Configuration
API_PORT=4000
NODE_ENV=development

# Redis (para BullMQ)
REDIS_URL=redis://localhost:6379

# AWS S3 / LocalStack (para upload de mídias)
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=wa-saas-media

# Email (Mailpit para desenvolvimento)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@localhost
# Para produção:
# SMTP_USER=your-smtp-user
# SMTP_PASS=your-smtp-password

# Frontend URL (para links de recuperação de senha)
FRONTEND_URL=http://localhost:3000

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
```

### Frontend Web (`apps/web/.env`)

```env
# API Backend
NUXT_PUBLIC_API_URL=http://localhost:4000
NUXT_PUBLIC_APP_URL=http://localhost:3000

# WhatsApp Engine
WHATSAPP_ENGINE_URL=http://localhost:3001

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
```

### WhatsApp Engine (`apps/whatsapp-engine/.env`)

```env
# Port
PORT=3001

# Redis
REDIS_URL=redis://localhost:6379/1

# Supabase (dependência legada)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Instance name (opcional)
INSTANCE_NAME=default
```

---

## 🚀 Como Configurar o Ambiente

### Pré-requisitos

1. **PostgreSQL** (v14+)
2. **Redis** (para BullMQ)
3. **Node.js** (v20+)
4. **LocalStack/MinIO** (opcional, para S3 local)
5. **Mailpit** (opcional, para testar emails)

### Passo 1: Instalar PostgreSQL

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
Baixe o instalador oficial: https://www.postgresql.org/download/windows/

### Passo 2: Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar banco de dados
CREATE DATABASE wa_saas_dev;

# Criar usuário
CREATE USER wa_saas_user WITH PASSWORD 'sua-senha-aqui';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE wa_saas_dev TO wa_saas_user;

# Sair
\q
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env na raiz do projeto
cp .env.example .env

# Editar e adicionar credenciais do PostgreSQL
nano .env
```

Adicione:
```env
DATABASE_URL=postgresql://wa_saas_user:sua-senha-aqui@localhost:5432/wa_saas_dev
JWT_SECRET=$(openssl rand -base64 32)
```

### Passo 4: Instalar Dependências

```bash
npm install
```

### Passo 5: Rodar Migrações

```bash
# Aplicar todas as migrações SQL
npm run db:migrate --workspace=apps/api

# Adicionar dados de teste
npm run db:seed --workspace=apps/api
```

### Passo 6: Iniciar Serviços

#### Opção 1: Tudo junto
```bash
npm run dev
```

#### Opção 2: Serviços separados
```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Frontend
npm run dev:web
```

### Passo 7: Testar a Aplicação

- **Frontend:** http://localhost:3000
- **API Health Check:** http://localhost:4000/health
- **Criar conta:** http://localhost:3000/cadastro

---

## 🔍 Verificação de Migração

### Checklist de Verificação

- [x] **Banco de dados PostgreSQL configurado**
- [x] **Migrações aplicadas com sucesso**
- [x] **Autenticação JWT funcionando**
- [x] **Login/Registro funcionando**
- [x] **Recuperação de senha configurada**
- [x] **Frontend conectado à API**
- [x] **Middleware de autenticação ativo**
- [x] **Multi-tenant implementado**

### Como Verificar

```bash
# 1. Verificar conexão com PostgreSQL
npm run db:test-isolation --workspace=apps/api

# 2. Verificar se as migrações foram aplicadas
psql postgresql://wa_saas_user:senha@localhost:5432/wa_saas_dev -c "\dt"

# Deve mostrar:
# tenants
# agents
# contacts
# conversations
# messages
# password_reset_tokens
# _migrations

# 3. Testar autenticação
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "SenhaForte123!",
    "name": "Usuário Teste",
    "tenantName": "Empresa Teste",
    "tenantSlug": "empresa-teste"
  }'

# 4. Verificar health check
curl http://localhost:4000/health
```

---

## ⚠️ Pontos de Atenção

### 1. WhatsApp Engine Ainda Usa Supabase

O `apps/whatsapp-engine` ainda depende de `@supabase/supabase-js`. Isso é aceitável porque:
- É um microsserviço isolado
- Funciona independentemente da API principal
- Pode ser migrado futuramente se necessário

### 2. Migrations SQL vs Supabase Migrations

- **Antes:** Migrations em `supabase/migrations/` (gerenciadas pelo Supabase CLI)
- **Agora:** Migrations em `apps/api/src/db/migrations/` (gerenciadas manualmente)
- **Ação:** Não misturar os dois sistemas de migração

### 3. Autenticação Customizada

- **Antes:** Supabase Auth (com RLS automático)
- **Agora:** Autenticação JWT customizada com bcrypt
- **Vantagem:** Controle total sobre o fluxo de autenticação
- **Desvantagem:** Responsabilidade de segurança é 100% nossa

### 4. Row Level Security (RLS)

As migrações SQL têm scripts de RLS comentados para PostgreSQL puro:
```sql
-- apps/api/src/db/migrations/003_rls_policies.sql (se existir)
```

Para ativar RLS no PostgreSQL puro, você precisará:
1. Configurar roles do PostgreSQL
2. Aplicar as policies manualmente
3. Usar `SET ROLE` antes de cada query

**Recomendação atual:** Use validação de `tenant_id` no código da aplicação.

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [Fastify Documentation](https://fastify.dev/)
- [JWT (jsonwebtoken) Documentation](https://github.com/auth0/node-jsonwebtoken)

### Scripts Úteis

```bash
# Conectar ao banco de dados
psql $DATABASE_URL

# Ver todas as tabelas
\dt

# Ver estrutura de uma tabela
\d+ tenants

# Ver todas as migrações aplicadas
SELECT * FROM _migrations ORDER BY applied_at;

# Fazer backup do banco
pg_dump $DATABASE_URL > backup.sql

# Restaurar backup
psql $DATABASE_URL < backup.sql
```

---

## 🎉 Conclusão

A migração do Supabase para PostgreSQL direto foi **concluída com sucesso**. O projeto agora tem:

✅ Controle total sobre o banco de dados  
✅ Autenticação customizada com JWT  
✅ Sistema de migrações SQL manual  
✅ Multi-tenant implementado  
✅ Segurança com bcrypt e tokens temporários  
✅ Independência de serviços terceiros (Supabase Auth)  

O sistema está pronto para desenvolvimento local e pode ser facilmente migrado para produção com as credenciais corretas do PostgreSQL.

---

**Documentação criada em:** 2026-07-15  
**Última atualização:** 2026-07-15
"