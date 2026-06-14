# OpenClaude Plugins & Skills Summary

Este documento lista as 5 ferramentas/plugins ativos no ambiente OpenClaude, suas finalidades reais e como ativá-las corretamente.

> **Regra de deduplicação:** Quando houver sobreposição entre estas 5 ferramentas e os agentes nativos do AIOX (`@dev`, `@qa`, `@architect`, etc.), **estas 5 ferramentas têm precedência** para review, pesquisa e orquestração. Não adicionar uma 6ª ferramenta que duplique qualquer uma das 5 abaixo.

---

## 1. Superpowers (`superpowers@claude-plugins-official`)

**O que é:** Conjunto de skills estruturadas que impõem fluxos de trabalho disciplinados ao agente — brainstorming, TDD, code review, uso de git worktrees, etc.

**Uso e Benefícios:** Cada skill define um protocolo passo-a-passo. Garante que o agente não pule etapas críticas (ex: brainstorm antes de entrar no modo plano, testes antes de fechar uma branch).

**Ativação:** Via Skill tool com o nome específico da skill. Exemplos:
- `superpowers:brainstorming`
- `superpowers:test-driven-development`
- `superpowers:systematic-debugging`
- `superpowers:requesting-code-review`
- `superpowers:finishing-a-development-branch`

> ⚠️ Não diz "use seus superpoderes" — isso não ativa nada. Use sempre o nome específico da skill.

---

## 2. ECC — External Cognitive Control (`ecc@ecc`)

**O que é:** O maior pacote instalado. Centenas de skills nomeadas e dezenas de subagents especializados por linguagem, domínio e tarefa.

**Uso e Benefícios:** Cobre praticamente qualquer tipo de revisão, análise ou geração de código. Evita decisões cegas com fluxos de pesquisa-primeiro (research-first) e checklists de qualidade.

**Ativação:**
- Skills via Skill tool: `ecc:typescript-reviewer`, `ecc:security-reviewer`, `ecc:code-review`, `ecc:plan`, `ecc:tdd-guide`, etc.
- Subagents via Agent tool: `ecc:code-reviewer`, `ecc:security-reviewer`, `ecc:architect`, `ecc:planner`, etc.

**Principais subagents:**

| Subagent | Finalidade |
|----------|-----------|
| `ecc:typescript-reviewer` | Review TypeScript/JavaScript |
| `ecc:security-reviewer` | Varredura de vulnerabilidades |
| `ecc:database-reviewer` | Queries, migrações, RLS (Supabase) |
| `ecc:code-architect` | Blueprint de implementação |
| `ecc:e2e-runner` | Testes end-to-end (Playwright) |
| `ecc:planner` | Planejamento de features complexas |

---

## 3. Open Design (`open-design@open-design`)

**O que é:** Máquina de design local-first para o terminal. Inclui design systems (Atomic Design, tokens, padrões de componentes) e exportações para HTML, PPTX, PDF e mais.

**Uso e Benefícios:** Ideal para gerar protótipos UI/UX (telas em Svelte/React/Tailwind), documentações ricas e sistemas de design. Acionado automaticamente em requisições visuais.

**Ativação:**
- Automática em contextos de design visual.
- Via Skill tool: `design-system`, `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`.
- Via Agent tool: `brad-frost`, `dan-mall`, `dave-malouf`, `design-chief`.

---

## 4. Ruflo (`ruflo-core@ruflo`)

**O que é:** Framework de orquestração multi-agente (swarms) sobre o Claude Code. Adiciona memória vetorial aprofundada e agentes especialistas coordenados.

**Uso e Benefícios:** Útil para tarefas que exigem múltiplos especialistas em paralelo — o Ruflo coordena Coder, Researcher e Reviewer de forma autônoma com memória compartilhada entre as execuções.

**Ativação:**
- Subagents via Agent tool: `ruflo-core:coder`, `ruflo-core:researcher`, `ruflo-core:reviewer`.
- Skills via Skill tool: `ruflo-core:ruflo-status`, `ruflo-core:witness`, `ruflo-core:init-project`.

---

## 5. Regras de Karpathy (`andrej-karpathy-skills@karpathy-skills`)

**O que é:** Diretrizes de comportamento inspiradas nas práticas de Andrej Karpathy para agentes LLM — funcionam como padrão de qualidade basal.

**Uso e Benefícios:** Injetadas automaticamente como instrução basal. Impõem:
1. **Sem suposições silenciosas** — o agente pergunta em caso de ambiguidade.
2. **Simplicidade em primeiro lugar** — a solução mais simples que funciona.
3. **Sem mudanças ortogonais** — foco estrito nos arquivos necessários.
4. **Verifique seu trabalho** — testar e validar antes de confirmar.

**Ativação:** Automática (injetada como instrução basal). Skill disponível: `andrej-karpathy-skills:karpathy-guidelines`.

---

## Notas operacionais

- **Reinicie a sessão** do terminal sempre que instalar, atualizar ou remover um plugin para que o servidor MCP seja recarregado.
- **Sobreposição com AIOX:** Os agentes nativos do AIOX (`@dev`, `@qa`, `@architect`, etc.) continuam disponíveis para o fluxo story-driven (SDC). Para review, pesquisa e orquestração avançada, use as ferramentas acima.
