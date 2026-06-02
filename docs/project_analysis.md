# Análise do Projeto: wa-saas-monorepo

*Data da Análise: 02 de Junho de 2026*

---

## 1. Estrutura e Dependências do Monorepo

Trata-se de um **monorepo Node.js** (gerenciado com NPM Workspaces) para um SaaS de CRM focado no WhatsApp (`wa-saas-monorepo`). A arquitetura do projeto está dividida entre aplicativos principais (`apps/`) e pacotes compartilhados (`packages/`).

### Frontend (`apps/web`)
Aplicação frontend construída com foco em performance e reatividade.
*   **Framework:** Nuxt 3 (Vue.js) com TypeScript.
*   **Estilização e UI:** Nuxt UI e TailwindCSS.
*   **Gerenciamento de Estado:** Pinia.
*   **Backend as a Service (BaaS):** Integração forte com Supabase (`@nuxtjs/supabase`).
*   **Tempo Real e Filas:** Usa `socket.io-client` para WebSockets e `bullmq`/`ioredis` no lado do servidor para processamento.
*   **Pagamentos:** Integração com a API do Stripe (`stripe`).

### Backend API (`apps/api`)
Serviço de API principal do SaaS.
*   **Framework:** Fastify com TypeScript.
*   **Banco de Dados:** Utiliza o cliente do Supabase (`@supabase/supabase-js`) e o driver nativo Postgres (`pg`). Possui scripts de migração e seed (ex: `db:migrate`).
*   **Propósito:** Provavelmente orquestra as regras de negócios, gerencia instâncias, clientes e se comunica com o Supabase de forma privilegiada.

### Motor do WhatsApp (`apps/whatsapp-engine`)
Microsserviço dedicado à comunicação com o WhatsApp.
*   **Biblioteca Core:** `@whiskeysockets/baileys` (usado para conectar ao WhatsApp Web de forma não-oficial e gerenciar sessões).
*   **Framework & Fila:** Fastify para expor endpoints internos/webhooks, e `bullmq` com `ioredis` para processamento assíncrono de envio/recebimento de mensagens em massa de forma resiliente.
*   **QR Code:** `qrcode-terminal` para exibir o código de pareamento no console durante o desenvolvimento.

### Pacotes Compartilhados (`packages/shared`)
*   Um pacote puramente TypeScript, utilizado para compartilhar utilitários, constantes e tipagens (interfaces, Zod schemas, etc) entre os três apps (`api`, `web`, e `whatsapp-engine`), garantindo consistência em toda a base de código.

### Infraestrutura e Ferramentas
*   **Supabase:** A presença da pasta raiz `supabase/` indica a utilização do Supabase CLI para gerenciar o banco de dados local, edge functions e as migrações/tipagens do banco em desenvolvimento.
*   **Docker:** Os arquivos `docker-compose.yml`, `docker-compose.evolution.yml` e a pasta `Docker/` gerenciam o ambiente, possivelmente levantando instâncias do Redis (necessário para o BullMQ) e o próprio Supabase local.
*   **Concorrência:** O comando `npm run dev` utiliza a biblioteca `concurrently` para rodar o frontend e o backend simultaneamente.

### Integração com IA (Synkra AIOS / Codex CLI)
A raiz contém artefatos específicos (`.aios-core/`, `.agents/`, `squads/`, `AGENTS.md`). Isso aponta que o repositório é governado por um sistema de agentes de IA (Synkra AIOS). O desenvolvimento segue diretrizes rígidas (Constitution), preferência por CLI, e tem "Quality Gates" automáticos definidos.

---

## 2. Visão Geral do Produto (Baseado no PRD)

O documento `whatsapp-saas-prd.md` descreve a construção de um **SaaS de Multiatendimento para WhatsApp com CRM integrado**, focado em equipes (Team Inbox) e multi-tenant (vários clientes/Workspaces no mesmo sistema).

### Regras de Ouro e Arquitetura:
*   **Isolamento Multi-tenant:** Uso de schema compartilhado no PostgreSQL (Supabase) onde cada registro deve ter a coluna `tenant_id` para evitar vazamento de dados.
*   **Componentização Extrema:** Há uma diretriz estrita para criar componentes modulares e atômicos (ex: `BaseInput`, `BaseButton`) no frontend (Nuxt/Vue).
*   **Segurança (Supabase):** Regras críticas ou manipulação de banco ignorando RLS devem ocorrer isoladas em rotas backend (`server/api` do Nuxt ou na API Node) utilizando a `Service Key`.
*   **Assincronicidade e Idempotência:** Para não travar a aplicação, os webhooks do WhatsApp e envio de mídias para a nuvem (Cloudflare R2) devem ser feitos em threads separadas. O Redis é exigido para impedir o processamento de mensagens duplicadas (idempotência com `SET NX`).

### Evolução da Stack:
O PRD cita o uso de **Pusher** para WebSockets e **Z-API** para o WhatsApp. No entanto, analisando as dependências reais da base de código, a equipe optou por usar **Socket.io** e desenvolveu um motor próprio de WhatsApp baseado em **Baileys** (`whatsapp-engine`), mostrando uma evolução para reduzir custos com APIs de terceiros.

---

## 3. Épicos e Funcionalidades (Roadmap)

O projeto está estruturado em 7 épicos principais:
1.  **Fundação & Auth:** Login, registro e permissões.
2.  **Workspaces:** Sistema de clientes isolados e navegação restrita.
3.  **Caixa de Entrada:** Atendimento em tempo real, suporte multimídia e transferência de chats entre atendentes.
4.  **CRM Kanban:** Gestão visual de leads que interagem no WhatsApp.
5.  **Roteamento:** Distribuição lógica/automática (Round-Robin) de conversas novas.
6.  **Billing:** Assinaturas modulares com Stripe (bloqueio automático de inadimplentes).
7.  **Dashboards:** Métricas (Tempo de Resposta, Resolução, Conversões).

---

## 4. Análise das Stories (`docs/stories/`)

A pasta de histórias reflete diretamente os Épicos e serve como um rastreador de tarefas (Issue Tracker) para o time e para agentes de IA.

*   **Série `0.x` (Infraestrutura):** Arquivos maiores e detalhados. A `0.1.story.md`, por exemplo, documenta a configuração inicial do Monorepo e decisões arquiteturais.
*   **Série `1.x` ao `7.x` (Features):** Seguem um formato ágil. A `1.1.story.md` (Atribuição de Conversas) detalha a implementação tanto na UI quanto no código (endpoints na API e eventos via `Socket.io`).

**Conclusão:**
O projeto possui um planejamento técnico de alto nível, preparado para escalar. A utilização de arquivos `story` em conjunto com a pasta `.aios-core/` e os agentes (`AGENTS.md`) evidencia uma abordagem robusta de **Desenvolvimento Guiado por IA (AI-Driven Development)** altamente metodológica.
