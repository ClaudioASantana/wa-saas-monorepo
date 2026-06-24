# 🚀 WA SaaS Monorepo (Synkra AIOS)

**O ecossistema definitivo para construção do SaaS e do Synkra AIOS.**

Bem-vindo ao **wa-saas-monorepo**. Este projeto é a espinha dorsal da nossa plataforma de software as a service (SaaS), construído sob uma arquitetura de monorepo escalável e orquestrado pelas engrenagens do **Synkra AIOS (Codex CLI)**. O ambiente não é apenas código: é um time virtual operado por Agentes de IA especialistas em cada camada do desenvolvimento.

---

## ✨ Principais Funcionalidades e Estrutura

Adotamos a arquitetura de monorepo para garantir consistência de tipos, compartilhamento de pacotes (Shared Packages) e deploys sincronizados entre os serviços. 

### 🏗️ Estrutura do Monorepo
- **`apps/api`**: O cérebro do backend. Serviços REST/GraphQL e integrações.
- **`apps/web`**: A interface principal da aplicação (Dashboard/App).
- **`apps/marketing`**: O site institucional e de conversão, otimizado para SEO e performance.
- **`packages/shared`**: Tipagens compartilhadas, utilitários, e configurações globais que conectam frontend e backend.
- **`apps/e2e`**: Suíte de testes ponta-a-ponta garantindo a estabilidade das entregas.

### 🤖 Synkra AIOS & Codex CLI (Multiagentes)
Nosso monorepo é governado por regras rígidas e impulsionado por IA. Através da pasta `.aios-core/`, mantemos uma constituição e definimos as *roles* dos nossos agentes (ex.: `@architect`, `@dev`, `@qa`, `@pm`, `@ux-design-expert`).
- **Desenvolvimento Orientado a Histórias**: Todo o fluxo de trabalho dos agentes é baseado em *stories* localizadas em `docs/stories/`.
- **Validação de Agentes e Skills**: Scripts robustos mantêm a sincronia com o ambiente local e validam o comportamento estrutural do ecossistema AIOS.

### 🛡️ Qualidade & Observabilidade
- **Gatekeepers (Quality Gates)**: O código só avança com as validações de `lint`, `typecheck` e testes aprovados.
- **CLI First**: Priorização de automação em linha de comando, seguida pela observabilidade e, por fim, interfaces gráficas.

---

## 🚀 Setup e Execução

### Pré-requisitos
- Node.js e npm devidamente configurados.
- Familiaridade com a CLI do Codex/Synkra AIOS para interações avançadas.

### Instalação
Na raiz do projeto, instale todas as dependências do monorepo:
```bash
npm install
```

### Rodando o Projeto (Ambiente Local)
Levante todos os serviços essenciais (API, Web e Marketing) de uma só vez:
```bash
npm run dev
```
*(Ou execute individualmente: `npm run dev:api`, `npm run dev:web`, `npm run dev:marketing`)*

### Construção (Build)
Gere os pacotes otimizados para produção (compila dependências compartilhadas primeiro):
```bash
npm run build
```

---

## 🛠️ Comandos de Qualidade e AIOS

| Script | Descrição |
|--------|-----------|
| `npm run lint` | Roda o ESLint garantindo o padrão do código. |
| `npm run typecheck` | Checa a integridade estática das tipagens em toda a stack. |
| `npm run test:e2e` | Inicia a suíte de testes E2E. |
| `npm run sync:ide` | Sincroniza configurações do AIOS com a sua IDE. |
| `npm run sync:skills:codex` | Mantém os recursos locais da CLI Codex atualizados. |
| `npm run validate:structure` | Varredura de integridade da estrutura AIOS. |
| `npm run validate:agents` | Valida as definições e atalhos dos Agentes de IA. |

---

## 👥 Interação com os Agentes (Codex CLI)

Neste repositório, você nunca codifica sozinho. Invoque seu *squad* virtual pelo Codex CLI através de atalhos rápidos:
- **`@architect`**: Para deliberações de arquitetura de software e sistemas.
- **`@dev`** / **`@devops`**: Para codificação pesada e pipelines de entrega.
- **`@qa`**: Para auditar e quebrar a aplicação (de propósito).
- **`@pm`** / **`@po`**: Para alinhar o que está sendo construído com as *stories* do produto.
- E muitos outros: `@data-engineer`, `@ux-design-expert`, `@aios-master`.
