# NotebookLM Manager — Design Spec
**Date:** 2026-06-16  
**Status:** Approved  

---

## 1. Objetivo

Criar um mini-app standalone dentro do mono-repo para gerenciar uma biblioteca pessoal de notebooks do Google NotebookLM. O app oferece uma Web UI local (React + Vite) para catalogar, buscar, organizar e consultar notebooks, integrando com a skill `notebooklm` já existente em `.agents/skills/notebooklm/`.

---

## 2. Escopo do MVP

**Incluído:**
- Cadastrar notebook (URL + nome manual + tags)
- Listar e buscar notebooks por nome/tag
- Fazer perguntas a um notebook via skill existente
- Histórico de perguntas por notebook
- Exportar biblioteca como JSON

**Excluído (pós-MVP):**
- Sync automático com conta Google
- Compartilhamento entre usuários
- Autenticação
- Deploy remoto

---

## 3. Arquitetura

```
packages/notebooklm-manager/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── notebooks.ts     # CRUD de notebooks
│   │   │   └── queries.ts       # Perguntas via skill
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── client.ts        # SQLite3 wrapper
│   │   └── server.ts            # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Library.tsx      # Lista de notebooks
│   │   │   └── NotebookDetail.tsx  # Detalhe + perguntas
│   │   └── components/
│   │       ├── NotebookCard.tsx
│   │       └── QueryBox.tsx
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 4. Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Banco | SQLite3 (arquivo local) |
| Integração | `python3 scripts/run.py` (skill notebooklm) |

---

## 5. Schema do Banco de Dados

```sql
CREATE TABLE notebooks (
  id         TEXT PRIMARY KEY,  -- UUID v4
  url        TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,      -- Fornecido manualmente pelo usuário no MVP
  description TEXT,
  tags       TEXT,               -- Comma-separated, ex: "IA,arquitetura"
  created_at TEXT NOT NULL,      -- ISO 8601, ex: "2026-06-16T14:00:00Z"
  last_queried_at TEXT           -- ISO 8601, nullable
);

CREATE TABLE queries (
  id          TEXT PRIMARY KEY,  -- UUID v4
  notebook_id TEXT NOT NULL REFERENCES notebooks(id),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TEXT NOT NULL      -- ISO 8601
);
```

> **Nota sobre nome do notebook:** No MVP o usuário fornece o nome manualmente ao cadastrar. Extração automática do título a partir da URL do NotebookLM requer browser automation e será avaliada pós-MVP.

---

## 6. API REST (Backend)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/notebooks` | Lista todos (com filtro opcional `?tag=X&q=Y`) |
| POST | `/api/notebooks` | Cria notebook |
| GET | `/api/notebooks/:id` | Detalhe + histórico de queries |
| DELETE | `/api/notebooks/:id` | Remove notebook e suas queries |
| POST | `/api/notebooks/:id/query` | Faz pergunta via skill notebooklm |
| GET | `/api/export` | Retorna JSON com toda a biblioteca |

---

## 7. Fluxo de Integração com a Skill

Ao chamar `POST /api/notebooks/:id/query`:

1. Backend busca a URL do notebook no SQLite
2. Executa `python3 scripts/run.py --url <url> --question "<question>"` como subprocess
3. Captura stdout como resposta
4. Persiste pergunta + resposta em `queries`
5. Retorna ao frontend

> A skill `notebooklm` em `.agents/skills/notebooklm/` precisa suportar esses argumentos de CLI. Será verificado/adaptado na fase de implementação.

---

## 8. UI — Telas Principais

### Library (/)
- Grid de cards com nome, tags, data de criação, botão "Perguntar"
- Barra de busca por texto livre + filtro por tag
- Botão "Adicionar Notebook" → modal com URL + nome + tags
- Botão "Exportar JSON"

### Notebook Detail (/notebooks/:id)
- Header: nome, URL, tags, data
- Caixa de texto para digitar pergunta + botão "Enviar"
- Histórico de perguntas/respostas em ordem cronológica inversa

---

## 9. Tratamento de Erros

- URL duplicada → HTTP 409 com mensagem clara
- Skill não disponível / timeout → HTTP 502, frontend exibe toast de erro
- Notebook não encontrado → HTTP 404
- Erros de banco → HTTP 500 com log no servidor

---

## 10. Verificação (como testar)

1. `cd packages/notebooklm-manager/backend && npm run dev` — servidor sobe na porta 3001
2. `cd packages/notebooklm-manager/frontend && npm run dev` — UI sobe na porta 5173
3. Adicionar um notebook via UI → verificar no SQLite
4. Fazer uma pergunta → verificar resposta e histórico
5. Exportar → verificar JSON completo
6. `npm run lint && npm run typecheck` no root

---
