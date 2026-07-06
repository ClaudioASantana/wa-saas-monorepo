# Como Usar Agents no Cline

## ⚠️ Importante: Atalhos @agent Ainda Não Funcionam

Os atalhos `@dev`, `@architect`, `@qa`, etc. mencionados no `AGENTS.md` e na documentação são parte do sistema **Synkra AIOS planejado**, mas **não estão implementados ainda**.

Eles NÃO funcionam nativamente no Cline. São uma feature futura que requer implementação dos scripts de sincronização.

## ✅ Como Usar Agents AGORA no Cline

### Método 1: Referenciar Diretamente (Recomendado)

Peça ao Cline para ler e assumir a persona do agent:

```
Leia o arquivo .aios-core/development/agents/dev.md e assuma essa persona para me ajudar a desenvolver a feature X.
```

Ou mais específico:

```
Assuma a persona do agent Developer definida em .aios-core/development/agents/dev.md.
Você é um desenvolvedor sênior full-stack especializado em TypeScript, Node.js e Nuxt/Vue.
Ajude-me a implementar a story 3.1.
```

### Método 2: Copiar e Colar no Prompt

1. Abra o arquivo do agent (ex: `.aios-core/development/agents/dev.md`)
2. Copie o conteúdo
3. Cole no início da sua conversa com o Cline
4. Adicione sua solicitação

Exemplo:

```
[Cole aqui o conteúdo de dev.md]

Agora, assumindo essa persona, me ajude a implementar a autenticação JWT.
```

### Método 3: Custom Instructions (Configuração Permanente)

Se você usa Cline com frequência, configure Custom Instructions:

1. Abra Cline Settings (ícone ⚙️)
2. Procure por "Custom Instructions" ou "System Prompt"
3. Adicione:

```markdown
# Agent System

Quando eu referenciar agents usando @ (como @dev, @architect, @qa), você deve:

1. Ler o arquivo correspondente em .aios-core/development/agents/
   - @dev → .aios-core/development/agents/dev.md
   - @architect → .aios-core/development/agents/architect.md
   - @qa → .aios-core/development/agents/qa.md
2. Assumir completamente a persona descrita no arquivo

3. Seguir as responsabilidades, workflow e padrões definidos

4. Manter essa persona até eu mencionar outro agent ou dizer "exit"

## Constitution

Sempre siga os princípios da Constitution em .aios-core/constitution.md:

- CLI First → Observability Second → UI Third
- Development Driven by Stories (docs/stories/)
- Quality Gates obrigatórios (lint, typecheck, test)
- TypeScript strict
- Monorepo consistency
```

## 🔮 Futuro: Atalhos Automáticos

Para que os atalhos `@dev`, `@architect` funcionem automaticamente, precisamos implementar:

### Scripts Necessários

```bash
# Sincronizar agents como skills do Cline
npm run sync:skills:codex

# Validar agents
npm run validate:agents
```

Esses scripts estão referenciados no `package.json` mas ainda não implementados em `.aios-core/infrastructure/scripts/`.

### Estrutura Planejada

```
.aios-core/
├── infrastructure/
│   └── scripts/
│       ├── codex-skills-sync/
│       │   └── index.js          # Sincroniza agents → Cline skills
│       └── validate-agents.js     # Valida definições dos agents
└── development/
    └── agents/
        ├── dev.md                 # ✅ Criado
        ├── architect.md           # 🔜 A criar
        ├── qa.md                  # 🔜 A criar
        └── ...
```

## 📋 Agents Disponíveis

### ✅ Implementados

- **@dev** - Developer (`.aios-core/development/agents/dev.md`)
  - Desenvolvedor sênior full-stack
  - TypeScript, Node.js, Nuxt/Vue
  - Quality gates, testes, documentação

### 🔜 A Implementar

- **@architect** - Software Architect
  - Decisões de arquitetura
  - Padrões e best practices
  - Escalabilidade e performance

- **@qa** - Quality Assurance
  - Testes e validação
  - Code review
  - Quality gates

- **@pm** - Product Manager
  - Gerenciamento de produto
  - Priorização de features
  - Alinhamento com negócio

- **@po** - Product Owner
  - Definição de requisitos
  - User stories
  - Aceitação de features

- **@devops** - DevOps Engineer
  - Deploy e infraestrutura
  - CI/CD
  - Monitoramento

- **@data-engineer** - Data Engineer
  - Pipeline de dados
  - ETL
  - Database optimization

- **@ux-design-expert** - UX Designer
  - Design de interfaces
  - Experiência do usuário
  - Prototipagem

## 💡 Exemplos de Uso

### Desenvolvimento de Feature

```
Leia .aios-core/development/agents/dev.md e assuma essa persona.

Implemente a story 3.1 (WebSocket para chat em tempo real).
Siga o workflow definido:
1. Análise da story
2. Setup do ambiente
3. Desenvolvimento iterativo
4. Verificação final com quality gates
```

### Revisão de Arquitetura

```
Preciso de uma revisão arquitetural.

Leia .aios-core/constitution.md para entender os princípios do projeto.

Então, atuando como um Software Architect sênior, revise a arquitetura
proposta para o módulo de billing e sugira melhorias considerando:
- Escalabilidade
- Segurança
- Manutenibilidade
```

### Code Review

```
Atuando como QA Engineer, revise o código no arquivo apps/api/src/services/auth.ts

Verifique:
- Type safety
- Error handling
- Testes unitários
- Seguimento da Constitution
- Quality gates
```

## 🎯 Workflow Recomendado

### 1. Sempre Comece com a Story

```
Leia a story docs/stories/3.1.story.md
```

### 2. Ative o Agent Apropriado

```
Leia .aios-core/development/agents/dev.md e assuma essa persona
```

### 3. Execute a Tarefa

```
Implemente a feature seguindo seu workflow definido
```

### 4. Valide com Quality Gates

```
Execute os quality gates:
- npm run lint
- npm run typecheck
- npm run test
```

## 🚫 O Que NÃO Fazer

❌ **Não use** `@dev` diretamente (não funciona ainda)
❌ **Não assume** que o Cline conhece os agents automaticamente
❌ **Não pule** a leitura da Constitution
❌ **Não ignore** os quality gates

## ✅ O Que Fazer

✅ **Referencie** os arquivos explicitamente
✅ **Siga** o workflow da Constitution
✅ **Execute** quality gates sempre
✅ **Atualize** checklists das stories
✅ **Documente** decisões importantes

## 🔧 Troubleshooting

### "O Cline não entende quando uso @dev"

**Solução:** Os atalhos @ ainda não estão implementados. Use o Método 1 ou 2 acima.

### "Como faço o Cline seguir a Constitution?"

**Solução:** Adicione nas Custom Instructions ou referencie no início de cada conversa:

```
Siga sempre a Constitution em .aios-core/constitution.md
```

### "Quero que o Cline seja sempre o @dev"

**Solução:** Adicione nas Custom Instructions permanentes:

```
Por padrão, você é o Developer Agent definido em .aios-core/development/agents/dev.md
```

## 📚 Leitura Recomendada

1. [Constitution](.aios-core/constitution.md) - Princípios fundamentais
2. [Agent @dev](.aios-core/development/agents/dev.md) - Developer persona
3. [Development Setup](./DEVELOPMENT_SETUP.md) - Setup completo
4. [Stories](../stories/) - Features e requisitos

---

**Resumo:** Por enquanto, referencie os agents manualmente no Cline. No futuro, com os scripts implementados, os atalhos @agent funcionarão automaticamente. 🚀

_Última atualização: 2026-07-06_
