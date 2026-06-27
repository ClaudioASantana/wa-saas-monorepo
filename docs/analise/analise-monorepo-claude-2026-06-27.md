# Análise do projeto monorepo

Data: 2026-06-27

## Visão geral

O projeto é um monorepo npm workspaces com a seguinte divisão principal:

- `apps/api`: backend principal em Fastify + TypeScript
- `apps/web`: aplicação principal do produto em Nuxt 3
- `apps/marketing`: site institucional em Nuxt 3
- `apps/e2e`: suíte de testes ponta a ponta
- `packages/shared`: pacote compartilhado para tipos e utilitários
- `supabase/`: migrações e estrutura de banco

## Estrutura e arquitetura

### Root do monorepo
O `package.json` da raiz define workspaces em `apps/*` e `packages/*`, o que indica uma arquitetura centralizada com compartilhamento de código entre os serviços.

### Backend
`apps/api` usa:
- Fastify
- PostgreSQL via `pg`
- Redis via `ioredis`
- BullMQ para filas
- Socket.IO para tempo real
- S3 via AWS SDK
- JWT para autenticação

Ele também expõe scripts de banco como `db:migrate`, `db:seed` e `db:test-isolation`, sugerindo que o backend tem papel forte de orquestração de dados e integrações.

### Frontend principal
`apps/web` usa:
- Nuxt 3
- Pinia
- `@nuxt/ui`
- Tailwind
- Supabase
- Socket.IO client
- Stripe
- Zod

O `nuxt.config.ts` mostra que o front conversa com o backend por variáveis públicas como `NUXT_PUBLIC_API_URL` e com a aplicação via `NUXT_PUBLIC_APP_URL`.

### Marketing
`apps/marketing` é um app Nuxt separado, com foco em site institucional e rodando em porta própria (`3001` no script de dev).

### Shared package
`packages/shared` é um pacote TypeScript comum, consumido pelo backend e provavelmente por outras partes do monorepo. Isso sugere que tipos, DTOs ou utilitários são centralizados ali.

### Banco de dados
A pasta `supabase/migrations` contém várias migrações organizadas por data, o que indica evolução incremental do schema e possível uso de Supabase como camada de infraestrutura de banco/ferramentas.

## Scripts principais

Na raiz existem scripts para:
- desenvolvimento concorrente de API, web e marketing
- build em sequência, começando pelo pacote compartilhado
- lint e typecheck
- validações ligadas ao ecossistema AIOS

## Observações

- Há uma camada de automação/documentação forte em `README.md` e `AGENTS.md`, com foco em stories, qualidade e agentes AIOS.
- O projeto parece ter uma separação clara entre aplicação principal, marketing e backend, com compartilhamento via workspace local.
- A presença de `apps/whatsapp-engine` indica um serviço especializado adicional, além do trio principal API/Web/Marketing.

## Resumo curto

É um monorepo estruturado para SaaS, com backend Fastify, frontend Nuxt 3, marketing separado, pacote compartilhado e banco gerenciado por migrações no Supabase. A arquitetura favorece desenvolvimento local integrado e compartilhamento de código entre as camadas.
