# Guia de Configuração do Ambiente de Desenvolvimento

## 🎯 Visão Geral

Este guia cobre a configuração completa do ambiente de desenvolvimento para o wa-saas-monorepo, incluindo VSCode, extensões, MCP servers, e o framework AIOS.

## 📋 Pré-requisitos

### Obrigatórios

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**
- **VSCode** (recomendado)
- **Docker** & **Docker Compose** (para serviços)

### Recomendados

- **PostgreSQL** (ou usar Supabase cloud)
- **pnpm** ou **npm** (npm já configurado no projeto)

## 🚀 Setup Inicial

### 1. Clone e Instalação

```bash
# Clone o repositório
git clone https://github.com/ClaudioASantana/wa-saas-monorepo.git
cd wa-saas-monorepo

# Instale dependências de todo o monorepo
npm install
```

### 2. Configuração de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
# Principais variáveis:
# - DATABASE_URL (Supabase connection string)
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 3. VSCode Setup

O projeto já inclui configurações otimizadas em `.vscode/`:

- **settings.json**: Configurações do editor
- **extensions.json**: Extensões recomendadas
- **launch.json**: Configurações de debug

Ao abrir o projeto no VSCode, você verá uma notificação para instalar as extensões recomendadas. **Instale todas**.

### 4. Extensões VSCode Essenciais

#### Core Development

- **ESLint**: Linting
- **Prettier**: Formatação de código
- **Volar**: Vue/Nuxt support (desabilite Vetur se tiver)
- **TypeScript Vue Plugin**: Suporte TS em Vue

#### AI & Produtividade

- **Cline (Claude Dev)**: Assistente AI
- **GitHub Copilot**: Autocomplete AI (opcional, pago)

#### Quality & Testing

- **Error Lens**: Mostra erros inline
- **Pretty TS Errors**: Erros TS mais legíveis
- **Playwright**: E2E testing

#### Git & DevOps

- **GitLens**: Git superpowers
- **Docker**: Gerenciamento de containers

## 🤖 Configuração MCP (Model Context Protocol)

O projeto já tem `.mcp.json` configurado com servidores úteis.

### Servidores MCP Disponíveis

#### 1. nano-banana-pro

Análise de código e sugestões inteligentes.

```bash
# Necessita de GEMINI_API_KEY no .env
GEMINI_API_KEY=sua_chave_aqui
```

#### 2. context7 (Upstash)

Gerenciamento de contexto e memória para IAs.

```bash
# Auto-instalado via npx
```

#### 3. 21st-dev Magic

Ferramentas de desenvolvimento modernas.

```bash
# Auto-instalado via npx
```

#### 4. Obsidian

Integração com Obsidian para documentação.

```bash
# Configure no .env:
OBSIDIAN_API_KEY=sua_chave
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
```

### Usando MCP no Cline/Claude

1. Instale a extensão **Cline** no VSCode
2. Configure com sua API key da Anthropic
3. Os servidores MCP serão automaticamente carregados do `.mcp.json`
4. Use comandos como `/mcp` para interagir com os servidores

## 🏗️ Framework AIOS

O projeto está estruturado para usar o Synkra AIOS - um sistema de desenvolvimento orientado por agentes AI.

### Estrutura AIOS

```
.aios-core/
├── constitution.md           # Regras fundamentais do projeto
└── development/
    └── agents/
        ├── dev.md           # Agent Developer (@dev)
        ├── architect.md     # Agent Architect (@architect)
        ├── qa.md            # Agent QA (@qa)
        └── ...              # Outros agents
```

### Usando Agents

No Cline/Claude, você pode invocar agents especializados:

```
@dev - Desenvolvedor full-stack
@architect - Arquiteto de software
@qa - Quality Assurance
@pm - Product Manager
@po - Product Owner
@devops - DevOps Engineer
```

**Exemplo:**

```
@dev implemente a story 3.1 (WebSocket para chat em tempo real)
```

### Scripts AIOS

```bash
# Sincronizar configurações IDE
npm run sync:ide

# Validar estrutura AIOS
npm run validate:structure

# Validar agents
npm run validate:agents

# Sincronizar skills do Codex
npm run sync:skills:codex
```

**Nota:** Alguns scripts referenciam `.aios-core/infrastructure/scripts/` que ainda não estão implementados. Eles serão criados conforme o framework AIOS evoluir.

## 🎨 Workflow de Desenvolvimento

### Modo de Trabalho

1. **Sempre trabalhe baseado em stories**: `docs/stories/`
2. **Use quality gates**: lint, typecheck, test
3. **CLI First**: Priorize soluções via comando
4. **Commits pequenos e frequentes**

### Comandos Principais

```bash
# Desenvolvimento (todos os serviços)
npm run dev

# Desenvolvimento individual
npm run dev:api          # Backend API
npm run dev:web          # Web App (Dashboard)
npm run dev:marketing    # Site Marketing

# Quality Gates
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test             # Testes unitários
npm run test:e2e         # Testes E2E

# Build
npm run build            # Build de produção
```

### Debug no VSCode

Use as configurações de debug em `.vscode/launch.json`:

- **Debug API**: Debugar o backend
- **Attach to Nuxt (Web)**: Debugar o app web
- **Jest Current File**: Debugar testes
- **E2E Tests**: Debugar testes E2E
- **Full Stack Debug**: API + Web juntos

## 🗄️ Database Setup

### Opção 1: Supabase Cloud (Recomendado)

1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie as credenciais para `.env`
4. Execute migrations:

```bash
cd supabase
# Instale Supabase CLI se necessário
npx supabase db push
```

### Opção 2: PostgreSQL Local

```bash
# Via Docker
docker-compose up -d postgres

# Configure .env com connection string local
DATABASE_URL=postgresql://user:password@localhost:5432/wa_saas
```

## 🔧 Troubleshooting

### Problema: TypeScript não reconhece tipos

```bash
# Recarregar workspace TypeScript
Cmd/Ctrl + Shift + P -> "TypeScript: Reload Project"

# Ou reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: Volar conflitando com Vetur

1. Desabilite ou desinstale Vetur
2. Habilite "Volar Takeover Mode" nas configurações do VSCode
3. Reinicie o VSCode

### Problema: ESLint não funcionando

```bash
# Verifique que ESLint está instalado
npm list eslint

# Execute manualmente
npm run lint

# Reinicie ESLint server
Cmd/Ctrl + Shift + P -> "ESLint: Restart ESLint Server"
```

### Problema: MCP Servers não carregando

1. Verifique que Cline está instalado e configurado
2. Verifique que `.mcp.json` existe
3. Verifique logs de erro no Output do Cline
4. Reinstale servidores MCP se necessário

## 📚 Próximos Passos

1. ✅ Configure o ambiente seguindo este guia
2. 📖 Leia a [Constitution](.aios-core/constitution.md)
3. 📋 Revise as [Stories](../stories/) existentes
4. 🤖 Experimente invocar agents no Cline
5. 💻 Comece a desenvolver!

## 🆘 Suporte

- **Documentação**: `docs/`
- **Issues**: GitHub Issues
- **AI Assistants**: Use @dev, @architect, etc. no Cline

---

**Bem-vindo ao time! Happy coding! 🚀**
