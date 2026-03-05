# Product Requirements Document (PRD)

**Produto:** SaaS de Multiatendimento WhatsApp (Team Inbox & CRM)
**Versão:** 1.0
**Data:** 2026-03-05
**Status:** Aprovado

---

## 1. Visao Geral do Produto

O sistema e um SaaS (Software as a Service) B2B que transforma o WhatsApp em uma plataforma centralizada, colaborativa e escalavel para equipes de vendas e suporte. Diferente do WhatsApp Business App padrao, que restringe o uso a um unico aparelho, esta plataforma utilizara a WhatsApp Business API (Cloud) para permitir multiplos agentes simultaneos, roteamento inteligente e automacao.

---

## 2. Stack Tecnologica

| Camada | Tecnologia |
|--------|-----------|
| **IDE** | Google Antigravity |
| **Frontend / UI** | Nuxt.js (Vue) |
| **Backend** | Node.js — arquitetura orientada a eventos, processamento assíncrono |
| **Banco de Dados & Auth** | Supabase (PostgreSQL) com isolamento Multi-Tenant |
| **Cache & Filas** | Redis — controle de estado, filas de mensagens, idempotência |
| **Storage** | Amazon S3 — upload assíncrono de mídias |

---

## 3. Arquitetura e Infraestrutura (Requisitos Críticos)

### 3.1. Isolamento Multi-Tenant (Segurança de Dados)

- Modelo: **Shared Schema** (Tabelas Compartilhadas)
- **OBRIGATORIO:** Row-Level Security (RLS) do PostgreSQL em todas as tabelas
- Coluna `tenant_id` em todas as tabelas; contexto validado em todas as requisicoes
- Estrutura preparada para sharding futuro (Citus) usando `tenant_id` como chave de distribuicao

### 3.2. Idempotencia e Tratamento de Webhooks

- Provedores da API enviam webhooks duplicados (garantia at-least-once)
- **OBRIGATORIO:** Processar webhooks usando `SET NX` do Redis com hash da assinatura do payload
- Webhook duplicado descartado antes de entrar na fila de processamento

### 3.3. Comunicacao em Tempo Real

- **PROIBIDO:** Long Polling (HTTP)
- **OBRIGATORIO:** WebSockets persistentes entre Nuxt.js e Node.js
- Mensagens e atualizacoes de status devem chegar ao agente em milissegundos

### 3.4. Armazenamento de Midia Assíncrono

- Midias nao devem ser salvas no servidor local (bloqueia Event Loop)
- **OBRIGATORIO:** Upload de midias em background threads diretamente para bucket S3

---

## 4. Regras de Negocio Criticas (Compliance Meta)

### 4.1. A Janela de 24 Horas

- Quando um cliente envia mensagem, abre-se janela de **24 horas** de atendimento gratuito
- Dentro da janela: agentes/bots podem enviar texto livre e midias sem custo
- `window_expires_at` rastreado no banco; checado no momento do ENVIO (nao do enfileiramento)

### 4.2. Gestao de Templates e 72 Horas Gratuitas

- Janela de 24h expirada: bloquear campo de texto livre, obrigar uso de Template Pre-Aprovado
- Templates: Marketing, Utilidade, Autenticacao
- Anuncios Click-to-WhatsApp (CTWA): janela especial de **72 horas gratuitas**

### 4.3. Taxonomia de Erros (DLR)

- Mapear codigos de erro oficiais da Meta:
  - `1002`: Numero invalido
  - `470`: Formato de template invalido
  - `429`: Rate limit excedido (tratamento com Exponential Backoff)
- Arquivar para auditoria e retentativas

---

## 5. Epicos e Funcionalidades (UI/UX)

### Epic 0: Foundation & Infraestrutura (PRE-REQUISITO)

Bloqueante para todos os demais epicos. Ver: [EPIC-0](../epics/epic-0-foundation.md)

### Epic 1: A Caixa de Entrada Omnicanal (Team Inbox)

CRM Kanban interativo com colunas:
1. **Active Chats**: Triagem pelo Chatbot (IA)
2. **Requesting**: Aguardando atendimento humano
3. **Intervened**: Em atendimento com agente ao vivo
4. **History**: Conversas finalizadas e arquivadas

Funcionalidades: Chat Profile (Jornada do Cliente, Tags), Handoff (Take Over), transferencia entre departamentos.

### Epic 2: Roteamento Inteligente (Smart Routing)

- Regras logicas de distribuicao baseadas em Tags e Atributos
- Perfis: Live Chat Agents / Managers / Owners

### Epic 3: Sistema de Faturamento SaaS (Billing)

- Integracao Stripe
- Assinaturas (mensalidade por assentos/agentes)
- Top-up de creditos para custos Meta
- Bloqueio automatico por inadimplencia via webhooks Stripe

### Epic 4: Dashboards Analiticos

- Tempo medio de resposta e resolucao
- Volume de mensagens (pagas vs gratuitas)
- Taxa de conversoes, tickets abertos vs resolvidos

### Epic 5: Compliance Meta (Regras de Negocio)

- Engine de janela 24h/72h CTWA
- Gestao de Templates aprovados
- DLR error taxonomy + retentativas

### Epic 6: LGPD/GDPR

- Double Opt-in vinculado ao Perfil do Cliente
- Gerenciamento de Consentimento

---

## 6. Padronizacao Global

| Regra | Detalhe |
|-------|---------|
| **Fuso Horario** | UTC absoluto em todos os timestamps, logs e agendamentos |
| **LGPD/GDPR** | Double Opt-in vinculado ao Perfil do Cliente |
| **Codigo de Erros** | Taxonomia oficial Meta mapeada e arquivada |

---

## Mapa de Dependencias entre Epicos

```
EPIC-0 (Foundation)
  └── EPIC-1 (Team Inbox)
  └── EPIC-2 (Smart Routing)
  └── EPIC-3 (Billing)
  └── EPIC-4 (Analytics)
  └── EPIC-5 (Compliance Meta)  ← depende tambem de EPIC-1
  └── EPIC-6 (LGPD/GDPR)       ← depende tambem de EPIC-1
```

---

**Documento gerado por:** AIOS God Mode v3.0
**Aprovado por:** @pm (Morgan)
