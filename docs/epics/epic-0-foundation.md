# EPIC-0: Foundation & Infraestrutura

**Status:** Planejamento
**Owner:** @architect (Aria) + @data-engineer (Dara)
**Criado:** 2026-03-05
**PRD:** [whatsapp-saas-prd.md](../prd/whatsapp-saas-prd.md)

---

## Objetivo

Estabelecer a fundacao arquitetural do SaaS WhatsApp: monorepo, banco de dados multi-tenant com RLS, idempotencia de webhooks via Redis, comunicacao em tempo real por WebSockets e upload assincrono de midias para S3.

**Este epic e bloqueante para TODOS os demais epicos.**

---

## Escopo

### In Scope

- Scaffold do monorepo (Nuxt.js + Node.js)
- Conexao e configuracao do Supabase (PostgreSQL)
- Schema base multi-tenant com `tenant_id` e RLS em todas as tabelas
- Integracao Redis (idempotencia SET NX + filas)
- Servidor WebSocket Node.js + cliente Nuxt.js
- Pipeline de upload assincrono de midias para Amazon S3
- Padrao UTC absoluto em todos os timestamps
- Estrutura de logging e observabilidade (base)

### Out of Scope

- Funcionalidades de negocio (chat, routing, billing)
- Interface de usuario (alem de conexao WebSocket no cliente)
- Integracao com WhatsApp Business API (Epic 1+)
- LGPD/Double Opt-in (Epic 6)

---

## Stories

| ID | Titulo | Pontos | Prioridade | Status |
|----|--------|--------|------------|--------|
| [0.1](../stories/0.1.story.md) | Monorepo Setup & Project Scaffold | 5 | Critico | Draft |
| [0.2](../stories/0.2.story.md) | Multi-Tenant Schema & Row-Level Security | 8 | Critico | Draft |
| [0.3](../stories/0.3.story.md) | Redis Integration & Webhook Idempotency | 5 | Critico | Draft |
| [0.4](../stories/0.4.story.md) | WebSocket Server Real-Time | 5 | Critico | Draft |
| [0.5](../stories/0.5.story.md) | S3 Async Media Upload Pipeline | 3 | Alto | Draft |
| [0.6](../stories/0.6.story.md) | Observabilidade, UTC Standards & Logging | 3 | Alto | Draft |

**Total de Pontos:** 29

---

## Sequencia de Implementacao

```
0.1 Scaffold
  └── 0.2 RLS (depende do DB estar configurado)
        └── 0.3 Redis (depende do scaffold)
        └── 0.4 WebSocket (depende do scaffold)
              └── 0.5 S3 (depende do scaffold)
                    └── 0.6 Observabilidade (depende de todos)
```

Sprint sugerido: **Sprint 1** (stories 0.1, 0.2, 0.3) | **Sprint 2** (0.4, 0.5, 0.6)

---

## Criterios de Sucesso

- [ ] Monorepo rodando localmente (Nuxt.js + Node.js)
- [ ] Supabase conectado com RLS ativo e testado (tenant A nao acessa dados do tenant B)
- [ ] Redis processando webhooks com SET NX sem duplicatas
- [ ] WebSocket estabelecido e mensagem de teste chegando ao frontend em < 100ms
- [ ] Upload de imagem de teste chegando ao S3 sem bloquear Event Loop
- [ ] Todos os timestamps no banco em UTC

---

## Requisitos Tecnicos (do PRD)

| Requisito | Secao PRD | Severidade |
|-----------|-----------|------------|
| RLS em todas as tabelas com `tenant_id` | 3.1 | OBRIGATORIO |
| Redis SET NX para idempotencia de webhooks | 3.2 | OBRIGATORIO |
| WebSockets (proibido Long Polling) | 3.3 | OBRIGATORIO |
| S3 upload em background threads | 3.4 | OBRIGATORIO |
| UTC absoluto em todos os timestamps | 6 | OBRIGATORIO |

---

## Riscos

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Configuracao RLS complexa no Supabase | Alto | @data-engineer lidera; revisar com @architect |
| WebSocket compatibilidade com Nuxt.js SSR | Medio | Testar com Nuxt.js 3 + socket.io ou ws nativo |
| Permissoes S3 e IAM roles | Medio | @devops configura IAM antes de 0.5 |

---

## Dependencias

**Depende de:** Nenhuma (epic inicial)
**Bloqueia:** EPIC-1, EPIC-2, EPIC-3, EPIC-4, EPIC-5, EPIC-6

---

## Progresso

```
[----------] 0%
```

---

**Gerado por:** AIOS God Mode v3.0 | 2026-03-05
