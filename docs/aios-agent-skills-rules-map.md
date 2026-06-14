# AIOS - Agentes, Skills, Rules e Ferramentas

Mapa completo dos recursos disponíveis no projeto para consulta.

---

## 1. Regras de Framework (`.claude/rules/`)

Sempre carregadas automaticamente, ditam como o agente deve operar:

| Arquivo | O que fornece |
|---------|---------------|
| `agent-authority.md` | Quem pode fazer o que (ex: so @devops faz `git push`) |
| `agent-handoff.md` | Como compactar contexto ao trocar de agente |
| `agent-memory-imports.md` | Ciclo de vida de memoria e ownership de CLAUDE.md |
| `coderabbit-integration.md` | Code review automatizado pre-commit/PR |
| `ids-principles.md` | Principios do Incremental Development System |
| `mcp-usage.md` | Quais MCP servers usar e quando |
| `story-lifecycle.md` | Como stories sao criados, validados e concluidos |
| `tool-examples.md` | Exemplos de input para ferramentas |
| `tool-response-filtering.md` | Filtragem de respostas de ferramentas |
| `workflow-execution.md` | Fluxos de SDC, QA Loop, Spec Pipeline, Brownfield |

---

## 2. Agentes AIOS (`.aios-core/development/agents/`)

Ativados com `@nome` ou `/AIOS:agents:nome`:

| Agente | Persona | Quando usar |
|--------|---------|-------------|
| `@dev` | Dex | Implementar codigo, features, bug fixes |
| `@qa` | Quinn | Revisao de testes, QA gate |
| `@architect` | Aria | Decisoes de arquitetura, design tecnico |
| `@pm` | Morgan | Gestao de produto, epics, specs |
| `@po` | Pax | Validacao de stories, backlog |
| `@sm` | River | Criacao de stories |
| `@analyst` | Alex | Pesquisa e analise de mercado |
| `@data-engineer` | Dara | Schema, DDL, RLS, migracoes |
| `@ux-design-expert` | Uma | UX/UI design |
| `@devops` | Gage | CI/CD, push, deploy |
| `@aios-master` | - | Governanca do framework, override |
| `@squad-creator` | - | Criacao de squads |

---

## 3. Skills (`.claude/skills/`)

22 skills disponiveis. Os mais uteis para o projeto:

| Skill | Uso |
|-------|-----|
| `clean-code` | Ao escrever/refatorar codigo |
| `api-design-principles` | Ao criar endpoints |
| `frontend-design` | Ao criar componentes UI |
| `nodejs-backend-patterns` | Ao escrever backend Node.js |
| `architecture-patterns` | Padroes de arquitetura |
| `stripe-integration` | Integracao de pagamentos |
| `error-handling-patterns` | Padroes de tratamento de erro |
| `prompt-engineering-patterns` | Tecnicas avancadas de prompt |
| `deployment-pipeline-design` | Design de pipelines CI/CD |
| `schema-markup` | Schema markup para SEO |
| `programmatic-seo` | Paginas SEO-driven |
| `seo-audit` | Auditoria SEO |
| `ui-ux-pro-max` | UI/UX design intelligence |
| `vercel-react-best-practices` | Otimizacao React/Next.js |
| `web-design-guidelines` | Review de UI contra guidelines |
| `github-actions-templates` | Workflows GitHub Actions |
| `pdf` | Geracao/manipulacao de PDFs |
| `docx` | Geracao/manipulacao de DOCXs |
| `xlsx` | Geracao/manipulacao de planilhas |
| `pptx` | Geracao/manipulacao de apresentacoes |
| `aios-god-mode` | Modo supremo do AIOS |

---

## 4. Comandos Customizados (`.claude/commands/`)

| Comando | Proposito |
|---------|-----------|
| `AIOS` | Comandos do framework AIOS |
| `gsd` | Comandos do sistema Get Shit Done (GSD) |

---

## 5. Agentes GSD (`.claude/agents/`)

Sub-agentes especializados para o sistema GSD:

| Agente | Uso |
|--------|-----|
| `gsd-planner` | Criar planos de implementacao |
| `gsd-executor` | Executar planos com commits atomicos |
| `gsd-verifier` | Verificar se o codigo entregue bate com o planejado |
| `gsd-debugger` | Debugar problemas com metodo cientifico |
| `gsd-phase-researcher` | Pesquisar antes de planejar |
| `gsd-nyquist-auditor` | Preencher gaps de validacao |
| `gsd-roadmapper` | Criar roadmaps de projeto |
| `gsd-project-researcher` | Pesquisar ecossistema do dominio |
| `gsd-research-synthesizer` | Sintetizar outputs de pesquisa |
| `gsd-plan-checker` | Verificar qualidade do plano |
| `gsd-integration-checker` | Verificar integracao E2E |
| `gsd-codebase-mapper` | Mapear estrutura do codebase |

---

## 6. Hooks (`.claude/hooks/`)

| Hook | O que faz |
|------|-----------|
| `synapse-engine.cjs` | Motor de automacao interno |
| `gsd-statusline.js` | Status line para GSD |
| `gsd-context-monitor.js` | Monitora contexto durante GSD |
| `gsd-check-update.js` | Verifica updates do GSD |
| `precompact-session-digest.cjs` | Digest pre-compact de sessao |

---

## 7. Diretorio de Memoria (`.claude/agents/` vs `memory/`)

- `.claude/agents/` - Definicoes de agentes do sistema GSD
- `memory/` - Memoria persistente entre sessoes (conversas, decisoes, contexto)
- `.claude/get-shit-done/` - Estado do sistema GSD (fases, planos, execucoes)

---

## Resumo de Uso Pratico

| Pedido do Usuario | Agente/Ferramenta Acionado |
|-------------------|---------------------------|
| "Criar uma story" | `@sm` + `story-lifecycle.md` |
| "Implementar feature" | `@dev` + `clean-code` skill |
| "Verificar qualidade" | `@qa` ou `gsd-verifier` |
| "Fazer push" | `@devops` |
| "Decisao de arquitetura" | `@architect` + `architecture-patterns` |
| "Schema de banco" | `@data-engineer` |
| "Planejar fase" | `gsd-planner` |
| "Debugar bug" | `gsd-debugger` |

---

---

## 8. AIOS no GitHub / npm — Distribuição e Portabilidade

### Identidade do Pacote

| Info | Valor |
|------|-------|
| **npm package** | `@aios-fullstack/core` |
| **Versao atual** | 4.31.1 |
| **GitHub** | https://github.com/SynkraAI/aios-core.git |
| **Binario CLI** | `aios-core` |
| **Licenca** | MIT |

### Como o Projeto Atual Usa o AIOS

O AIOS **nao foi instalado via npm** — o repo foi copiado integralmente para dentro de `.aios-core/`.
O script `update-aios.sh` faz `git clone --sparse` do repo upstream direto para `.aios-core/`.

Os comandos `aios install` e `aios init` aparecem no help do CLI mas **nao foram implementados** (arquivos ausentes em `.aios-core/cli/commands/`).

### Como Levar para Outro Projeto

| Metodo | Pros | Contras |
|--------|------|---------|
| `npm install @aios-fullstack/core` | Limpo, versionado, update facil | Pode nao incluir tudo que `.aios-core/` tem |
| Copiar `.aios-core/` + `.claude/` manualmente | Traz tudo que funciona aqui | Sem versionamento, update manual |
| `bash .aios-core/scripts/update-aios.sh` | Sincroniza com upstream automaticamente | Requer projeto ja com `.aios-core/` inicializado |

### Oportunidade: Implementar `aios install`

O ideal seria implementar o comando `aios install` que clonaria o repo e provisionaria `.claude/` no projeto alvo. Arquivos a criar:
- `.aios-core/cli/commands/install.js`
- `.aios-core/cli/commands/init.js`

---

*Gerado em 2026-06-12*
