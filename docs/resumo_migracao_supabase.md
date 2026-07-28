# Resumo do Projeto: Migração para API Independente (Saída do Supabase)

Este documento registra o histórico e as decisões arquiteturais tomadas durante a migração do ecossistema do WA SaaS (WhatsApp SaaS) para se tornar 100% independente do Supabase.

## Objetivo
O objetivo principal foi assumir o controle total dos dados e infraestrutura, movendo todas as funcionalidades que dependiam do backend-as-a-service (Supabase) para soluções open-source autogerenciadas (PostgreSQL nativo, Redis, BullMQ, AWS S3/MinIO e Fastify).

## Fases Executadas

### Fase 1 e 2: Infraestrutura Base e Autenticação
- **Remoção de Dependências:** Foram removidos os pacotes `@supabase/supabase-js` e `@nuxtjs/supabase` do frontend (`apps/web`).
- **Banco de Dados Nativo:** Substituímos o cliente do Supabase pelo driver nativo `pg`, adotando migrations e queries diretas via `Pool` (Node.js).
- **Nova Autenticação:** A autenticação baseada em sessão do Supabase foi substituída por um fluxo REST com emissão de **JWT** no Fastify (`apps/api`), utilizando cookies seguros para persistir o acesso no Nuxt (SSR e Client-side).

### Fase 3: Refatoração de Requisições REST e CRM
- **Migração das Rotas Frontend:** Todas as telas que chamavam dados pelo `supabase.from(...)` (Dashboard, Canais, Contatos e CRM) foram refatoradas para utilizar rotas `/api/*` da nova infraestrutura no Fastify.
- **Novas Tabelas e Migrations:** Criadas tabelas para o CRM (`crm_funnels`, `crm_stages`, `crm_cards`) em PostgreSQL nativo, gerenciadas pela pasta `apps/api/src/db`.

### Fase 4: Realtime e Chat (Socket.io)
- **Substituição do Supabase Realtime:** O motor de websocket fornecido pelo Supabase foi desligado e substituído pelo `Socket.io`.
- **Fastify WebSockets:** Configurado um servidor Socket.io embarcado no Fastify (`apps/api/src/realtime/websocket-server.ts`) com autenticação e autorização via JWT, isolando conexões por `tenant_id`.
- **Front-end do Chat:** A complexa tela `chat.vue` passou a consumir os novos endpoints REST (`/chat/conversations`, `/chat/messages`) criados no backend, e as notificações em tempo real foram interligadas no cliente `socket.io-client`.

### Fase 5: Limpeza de Código e Arquitetura do Storage
- **Worker e Storage:** Eliminados antigos `plugins` e `utils` que rodavam de forma legada e perigosa diretamente no servidor do Nuxt. As filas de envio de arquivo (Mídia e Webhooks) agora são gerenciadas exclusivamente pelo **BullMQ** dentro do `apps/api`.
- **Upload de Mídia (S3):** O armazenamento agora aponta para buckets S3 (que pode ser configurado para AWS ou MinIO), abstraído via pacote `@aws-sdk/client-s3`.

### Fase 6: Microserviço WhatsApp Engine (Baileys)
- O serviço encarregado da conexão direta com o WhatsApp Web foi reescrito.
- Em vez de enviar o state de autenticação (chaves criptográficas) para o Supabase via HTTP, implementamos o **`usePostgresAuthState`**.
- O estado de conexão agora é gravado diretamente no PostgreSQL da infraestrutura usando um pool de conexão nativo do driver `pg`, o que acelera drasticamente a leitura e escrita de tokens essenciais exigidos pela Meta.

## Tecnologias Atualizadas no Monorepo
- **Backend:** Node.js, Fastify, `pg` (PostgreSQL), Redis, BullMQ, Socket.io
- **Frontend:** Nuxt 3, `$fetch`, `socket.io-client`, JWT
- **Microserviço (WhatsApp):** Node.js, Fastify, Baileys (`@whiskeysockets/baileys`), `pg`
- **Infra (Docker):** Postgres, Redis (disponibilizados via docker-compose)

---
*Documento gerado automaticamente ao finalizar a esteira de migração e consolidação do backend.*
