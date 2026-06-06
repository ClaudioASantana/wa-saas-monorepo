---
name: "wa-ids-principles"
description: "Aplica os princípios de Componentização Inteligente e Reuso (REUSE > ADAPT > CREATE). Use essa habilidade ao planejar a arquitetura de uma solução."
---

# IDS Principles (Incremental Development System)

Sempre que o usuário pedir para criar um componente Vue, rota Fastify, middleware ou qualquer arquivo no projeto, o fluxo de pensamento OBRIGATÓRIO deve seguir a hierarquia:
**REUSE > ADAPT > CREATE**

### 1. REUSE (Reutilização Direta)
- Verifique se a pasta `packages/shared/`, os `composables` ou os utilitários já possuem a função.
- Importe o artefato existente diretamente. Nunca duplique.

### 2. ADAPT (Adaptação)
- Se a função ou componente existente faz 80% do que você precisa, adicione os 20% restantes por meio de Props ou Opções novas.
- **Regra**: A mudança não deve exceder 30% do tamanho do arquivo original e **NUNCA** deve quebrar os locais que já usavam essa função (faça adaptações com tipagem opcional ou retrocompatível).

### 3. CREATE (Criação Nova)
- Apenas crie um novo arquivo ou serviço se justificar que os existentes não podem ser modificados para o seu caso sem violar o padrão de projeto.
- Crie focado no futuro, ou seja, genérico o suficiente para ser reutilizado por próximas funcionalidades.

**Instruções de Ação**:
- Na fase de "Implementation Plan" de qualquer conversa com o usuário, explicite como você usou os Princípios IDS para não gerar código desnecessário.
