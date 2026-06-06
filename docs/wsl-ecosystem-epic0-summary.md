# Relatório de Implementação e Setup WSL (Epic 0: Foundation)

Este documento centraliza o progresso de desenvolvimento e as diretrizes de configuração do ambiente local (WSL/Ubuntu) estabelecidas durante o encerramento da **Epic 0 (Foundation)** do repositório `wa-saas-monorepo`. 

O objetivo é garantir que qualquer novo desenvolvedor (ou máquina) consiga replicar e compreender as fundações arquiteturais que foram erguidas.

---

## 1. Conclusão da Epic 0 (Fundação)
Foram finalizadas com sucesso as fundações de base do sistema, englobando as quatro últimas histórias estruturais:

### Story 0.5: Pipeline Assíncrono de S3 (Media Upload)
- **O que foi feito:** Configurado o cliente do `aws-sdk/client-s3` com suporte obrigatório a **AWS Local** (como MinIO ou LocalStack rodando no WSL), utilizando a opção `forcePathStyle: true` para ignorar DNS complexos de bucket.
- **Background Jobs:** Integrado o **BullMQ** com *Redis* local para o processamento de mídias pesadas fora do Event Loop da API, atualizando o status no Supabase via WebSocket.

### Story 0.6: Observabilidade e UTC Standards
- **O que foi feito:** Padronização global de datas para a zona UTC via utilitários `utcNow()`, evitando falhas críticas na janela de 24h da API oficial do Meta.
- **Ferramentas:** Instalação do **Pino Logger** (JSON estruturado de alta performance) e aplicação de um middleware inteligente de requests.
- **Regras:** Criação de regras restritas de *ESLint* para impedir programadores de usar `new Date()` e `Date.now()` livremente.

### Story 0.7: Orquestração Docker e CI/CD
- **O que foi feito:** Criação de *Dockerfiles* otimizados em Multi-stage (separando os ambientes de `builder` pesados dos de `runner` enxutos em Alpine). 
- **Ferramentas:** Um novo `docker-compose.yml` centralizando os nós `api`, `web`, `redis` e o engine do Whatsapp, garantindo paridade de testes de rede entre o WSL e a nuvem. Adicionada esteira de *GitHub Actions* para validação de `typecheck` a cada PR.

### Story 0.8: Pinia Cache Global (Frontend)
- **O que foi feito:** Carga inteligente de sessão. O frontend Vue/Nuxt parou de depender de _fetches_ isolados, e agora hidrata _Stores_ no boot inicial via *Pinia* (dados de perfil, workspace e lista de agentes do time). O método de `logout` possui `$reset()` compulsório para proteção de vazamento de dados.

---

## 2. Ferramentas e Configurações Essenciais no WSL

Para que este ecossistema rode perfeitamente no **Windows Subsystem for Linux (WSL)**, algumas ferramentas e variáveis foram instaladas/configuradas e são consideradas dependências de ambiente:

### 2.1 Emulador S3 (LocalStack / MinIO)
O projeto não utiliza a AWS da nuvem em ambiente de desenvolvimento local. A API aguarda que você possua os serviços subidos no docker-compose e referenciados no seu `.env`:
```env
AWS_ENDPOINT=http://localhost:4566 # (Exemplo LocalStack/MinIO)
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket-local
```

### 2.2 Redis Local
Utilizado ativamente como broker das filas do BullMQ para mídias pesadas.
- O Node no WSL acessará via `redis://127.0.0.1:6379`.
- A inicialização é simplificada rodando `docker-compose up redis -d`.

### 2.3 CodeRabbit CLI (Automação de QA de IA)
Para validações de segurança e vulnerabilidade antes do *push*, instalamos globalmente no Ubuntu/WSL o cliente oficial do `coderabbit`.
- **Dependências instaladas:** `unzip` e `curl`.
- **Como configurar do zero:** 
  `curl -fsSL https://cli.coderabbit.ai/install.sh | sh` seguido de `coderabbit auth login`.

### 2.4 Antigravity Skills (Superpoderes Locais)
Foram extraídas antigas regras de *frameworks* de IA que existiam no repositório (como o antigo *.codex* e *.superpowers*) e migradas para plugins nativos no nosso diretório `.gemini/plugins/wa-saas/skills/`. As Skills ativas agora no workspace WSL são:
1. **wa-story-validator**: Valida novas histórias forçando Checklist de PO com 10 pontos.
2. **wa-qa-gate**: Força as IAs locais a rodarem as 7 baterias de testes (Código, Unitário, Regressão, Segurança, etc) antes de subirem PRs.
3. **wa-ids-principles**: Força os agentes de IA a priorizarem exaustivamente a regra `REUSE > ADAPT > CREATE` no código fonte, para não sujar o repositório com código desnecessário.
