---
name: "wa-story-validator"
description: "Valida uma história antes do início do desenvolvimento usando um checklist de 10 pontos de Produto (PO). Use esta habilidade obrigatóriamente no estágio de planejamento de qualquer Story."
---

# Story Validator (10-Point Checklist)

Você DEVE validar a História (Story) do usuário contra a lista abaixo **ANTES** de gerar um plano de implementação para o código. 

Se a pontuação for menor que 7/10, aborte e peça ao usuário os esclarecimentos necessários.

### 10-Point Validation Checklist
1. **Título Claro**: O título é descritivo e sem ambiguidades.
2. **Descrição Completa**: O problema ou necessidade do usuário está perfeitamente explicado.
3. **Critérios de Aceitação Testáveis**: Possui Acceptance Criteria claros (ex: Given/When/Then).
4. **Escopo Definido**: O que está DENTRO e FORA do escopo da história está explícito.
5. **Dependências Mapeadas**: Se houver pré-requisitos lógicos ou pacotes necessários, estão citados.
6. **Valor de Negócio**: O benefício para o sistema ou cliente é evidente.
7. **Riscos e Dívidas**: Avaliou se isso causará regressões ou problemas no código atual.
8. **Definition of Done**: Está claro o que define que essa tarefa foi finalizada (ex: tela X exibindo Y).

**Instruções de Ação**: 
- Não gere código antes de ler o documento da *Story*.
- Informe o usuário verbalmente sobre o resultado do `validate-story-draft` antes de fazer o plano.
