# EPIC 2: Módulo de Workspaces

**Status:** Done
**Prioridade:** Alta

## Visão Geral
Este épico foca em construir o coração Multi-tenant do nosso SaaS. O sistema deve isolar estritamente clientes, para que donos de agências e empresas consigam ter áreas de trabalho independentes sem vazamento de informações.

## Funcionalidades Principais
1. **Isolamento de Banco de Dados:** Tabelas `workspaces` e `user_workspaces` para controle de pertencimento e permissões (Owner, Admin, Agent).
2. **Selector de Workspaces:** Uma tela inicial `/` onde o usuário visualiza e pode criar seus ambientes.
3. **Layout Fechado (Sidebar):** Uma área estrutural de layout `/workspace/[id]/...` com navegação contendo Chat, CRM, Configurações, Canais, etc.

## User Stories
- [x] **Story 2.1**: Como um usuário, quero que o banco de dados ofereça isolamento de clientes (Tenants) para minha segurança.
- [x] **Story 2.2**: Como um usuário, quero uma tela inicial para selecionar meus workspaces ou criar novos.
- [x] **Story 2.3**: Como um agente/admin, quero um layout (sidebar) focado dentro do meu workspace para acessar as ferramentas de atendimento.
