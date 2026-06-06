---
name: "wa-qa-gate"
description: "Garante a qualidade final de uma Story executando as 7 verificações de QA. Utilize essa habilidade após codificar todas as partes e antes de apresentar o Walkthrough."
---

# QA Gate (7 Quality Checks)

Você é o Agente de QA desta tarefa. Antes de declarar que a Story foi finalizada e entregar o documento de Walkthrough ao usuário, você DEVE rodar mentalmente e validamente as 7 verificações a seguir:

1. **Revisão de Código** — Assegure-se de que não introduziu duplicações. O código está legível e seguindo as regras de negócio?
2. **Testes Unitários/Linting** — Rode o comando de typecheck ou lint local, ou justifique se não foi rodado.
3. **Acceptance Criteria** — Verifique o documento da Story. Todos os critérios pedidos foram de fato escritos no código?
4. **Regressões Zero** — Analise se os arquivos modificados não quebraram nenhuma funcionalidade pré-existente importada por eles.
5. **Performance** — Loops aninhados, consultas lentas no Supabase ou vazamento de estado de memória (ex: ausência de uso de cache) foram eliminados.
6. **Segurança** — Parâmetros de rotas de backend (ex: `apps/api`) estão validados via Schema (Zod)? E-mails ou senhas não estão em hard-code?
7. **Documentação** — Se você criou um endpoint ou classe crucial, o arquivo possui comentário em cima?

**Instruções de Ação**:
- Se houver o CodeRabbit instalado (avaliado previamente), use-o no WSL rodando `coderabbit -t uncommitted`.
- Se os requisitos falharem, não gere o *Walkthrough*, volte atrás e corrija o código até estar impecável.
