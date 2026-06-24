# Synkra AIOS Rules

## Core Methodology
- **Story-Driven**: All work starts in `docs/stories/`. Update checkboxes `[ ]` to `[x]` and maintain the File List section.
- **Layers**: NEVER modify L1/L2 (`.aios-core/core/`, `bin/`). L3/L4 (projects, stories, packages) are mutable.
- **Rules**: Contextual rules load automatically from `.claude/rules/`. Adhere to them strictly.
- **Quality**: Run `npm test`, `npm run lint`, and `npm run typecheck` before finishing tasks.

## Agent System
- **Activation**: Use `@agent-name` or `/AIOS:agents:agent-name`.
- **Agents**: `@dev`, `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst`, `@data-engineer`, `@ux-design-expert`, `@devops` (exclusive for git push), `@aios-master`.
- **Commands**: `*help` (list all), `*create-story` (new story), `*task {name}` (execute), `*workflow {name}`, `*exit`.

## AIOS Tooling & Debugging
- **Graph Dashboard**: `aios graph --deps` (ascii/json/mermaid/html), `aios graph --stats`.
- **Code Intel**: Checked via `isCodeIntelAvailable()`.
- **Debugging**: `export AIOS_DEBUG=true`, `tail -f .aios/logs/agent.log`, `npm run trace -- {workflow}`.

## Claude Code Specifics
- **File & Search**: Use specific tools (like exact search) instead of `grep` or `rg` in bash. Batch file operations.
- **Execution**: Prevent loops! If a bash command fails 3 times, pause and diagnose instead of retrying endlessly.
