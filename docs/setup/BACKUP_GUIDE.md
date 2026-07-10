# Guia de Backup do Supabase

Este guia explica como usar o sistema de backup automático do Supabase local.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Comandos Rápidos](#comandos-rápidos)
- [Backup Manual](#backup-manual)
- [Restauração de Backup](#restauração-de-backup)
- [Backups Automáticos (Cron)](#backups-automáticos-cron)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Políticas de Retenção](#políticas-de-retenção)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema de backup oferece:

- ✅ **3 tipos de backup**: Diário, Semanal e Mensal
- ✅ **Rotação automática**: Remove backups antigos baseado em políticas de retenção
- ✅ **Compressão**: Todos os backups são compactados com gzip
- ✅ **Backup de segurança**: Cria backup automático antes de restaurar
- ✅ **Agendamento via Cron**: Backups automáticos sem intervenção manual
- ✅ **Comandos NPM**: Interface simples via package.json

## ⚡ Comandos Rápidos

```bash
# Backup manual (diário)
npm run backup

# Backup semanal
npm run backup:weekly

# Backup mensal
npm run backup:monthly

# Listar backups disponíveis
npm run backup:restore

# Restaurar último backup
npm run backup:restore:latest

# Ver status dos backups automáticos
npm run backup:cron:status

# Instalar backups automáticos
npm run backup:cron:install

# Remover backups automáticos
npm run backup:cron:uninstall
```

## 💾 Backup Manual

### Criar Backup Diário

```bash
npm run backup
# ou
npm run backup:daily
# ou
./scripts/backup-supabase.sh daily
```

### Criar Backup Semanal

```bash
npm run backup:weekly
# ou
./scripts/backup-supabase.sh weekly
```

### Criar Backup Mensal

```bash
npm run backup:monthly
# ou
./scripts/backup-supabase.sh monthly
```

### O que acontece durante o backup?

1. 🔍 Verifica se o Supabase está rodando
2. 📦 Cria dump do banco de dados
3. 🗜️ Compacta o arquivo com gzip
4. 📁 Salva no diretório apropriado (daily/weekly/monthly)
5. 📋 Copia para `backups/last/` (sempre o mais recente)
6. 🧹 Remove backups antigos conforme política de retenção
7. ✅ Mostra estatísticas (tamanho, quantidade mantida, etc.)

## 🔄 Restauração de Backup

### Listar Backups Disponíveis

```bash
npm run backup:restore
# ou
./scripts/restore-supabase.sh
```

Isso mostrará:

- Último backup
- Backups diários (últimos 5)
- Backups semanais
- Backups mensais

### Restaurar Último Backup

```bash
npm run backup:restore:latest
# ou
./scripts/restore-supabase.sh latest
```

### Restaurar Backup Específico

```bash
./scripts/restore-supabase.sh supabase/backups/daily/backup_2026-07-08_102030.sql.gz
```

### ⚠️ Segurança na Restauração

O script de restore:

1. 📊 Mostra informações do backup selecionado
2. ⚠️ Pede confirmação (digite 'SIM')
3. 💾 Cria backup de segurança antes de restaurar
4. 🔄 Reseta o banco de dados
5. 📥 Aplica o backup selecionado
6. ✅ Confirma sucesso ou mostra erros

**IMPORTANTE**: A restauração SOBRESCREVE o banco atual! Sempre é criado um backup de segurança em `backups/last/pre-restore_*.sql.gz`.

## ⏰ Backups Automáticos (Cron)

### Instalar Backups Automáticos

```bash
npm run backup:cron:install
# ou
./scripts/setup-backup-cron.sh install
```

Isso configura os seguintes agendamentos:

- 🌙 **Backup Diário**: Todos os dias às 02:00
- 📅 **Backup Semanal**: Domingos às 03:00
- 📆 **Backup Mensal**: Dia 1 de cada mês às 04:00

### Verificar Status

```bash
npm run backup:cron:status
# ou
./scripts/setup-backup-cron.sh status
```

Mostra:

- Status (ativo/inativo)
- Agendamentos configurados
- Último backup realizado
- Últimas 5 linhas do log

### Ver Logs dos Backups Automáticos

```bash
tail -f supabase/backups/cron.log
```

### Desinstalar Backups Automáticos

```bash
npm run backup:cron:uninstall
# ou
./scripts/setup-backup-cron.sh uninstall
```

**NOTA**: Os backups existentes NÃO são removidos, apenas os agendamentos.

## 📁 Estrutura de Diretórios

```
supabase/backups/
├── daily/                    # Backups diários
│   ├── backup_2026-07-08_020000.sql.gz
│   ├── backup_2026-07-07_020000.sql.gz
│   └── ...
├── weekly/                   # Backups semanais
│   ├── backup_2026-07-07_030000.sql.gz
│   └── ...
├── monthly/                  # Backups mensais
│   ├── backup_2026-07-01_040000.sql.gz
│   └── ...
├── last/                     # Sempre o mais recente
│   ├── backup_latest.sql.gz
│   └── pre-restore_*.sql.gz  # Backups de segurança
└── cron.log                  # Log dos backups automáticos
```

## 📊 Políticas de Retenção

### Backup Diário

- **Frequência**: Todo dia às 02:00
- **Retenção**: 7 dias
- **Uso**: Proteção contra mudanças recentes

### Backup Semanal

- **Frequência**: Domingo às 03:00
- **Retenção**: 4 semanas
- **Uso**: Histórico de médio prazo

### Backup Mensal

- **Frequência**: Dia 1 às 04:00
- **Retenção**: 12 meses
- **Uso**: Arquivo de longo prazo

### Customizar Políticas

Edite as variáveis no `scripts/backup-supabase.sh`:

```bash
DAILY_RETENTION=7    # Dias
WEEKLY_RETENTION=4   # Semanas
MONTHLY_RETENTION=12 # Meses
```

## 🔧 Troubleshooting

### Problema: "npx supabase db dump" falha

**Solução**: Verifique se o Supabase está rodando:

```bash
npx supabase status
```

Se não estiver, inicie:

```bash
npx supabase start
```

### Problema: Permissão negada ao executar scripts

**Solução**: Torne os scripts executáveis:

```bash
chmod +x scripts/*.sh
```

### Problema: Cron não está executando

**Solução 1**: Verifique se o cron está rodando:

```bash
sudo service cron status
```

**Solução 2**: Verifique se os cron jobs estão instalados:

```bash
crontab -l | grep "Supabase Backup"
```

**Solução 3**: Verifique o log:

```bash
cat supabase/backups/cron.log
```

### Problema: Backup está muito grande

**Solução**: Os backups são compactados automaticamente. Se ainda assim estiverem grandes:

1. Verifique se há dados desnecessários no banco
2. Considere reduzir as políticas de retenção
3. Use backups diferenciais/incrementais (feature futura)

### Problema: Restauração falhou

**Solução**:

1. Verifique o log em `/tmp/supabase_restore.log`
2. O backup de segurança está em `supabase/backups/last/pre-restore_*.sql.gz`
3. Tente restaurar o backup de segurança se necessário

### Problema: Disco cheio

**Solução**:

1. Reduza as políticas de retenção
2. Remova backups antigos manualmente:

```bash
# Ver tamanho total
du -sh supabase/backups/

# Remover backups específicos
rm supabase/backups/daily/backup_2026-06-*.sql.gz
```

## 📝 Notas Importantes

1. ⚠️ **Sempre teste a restauração**: Periodicamente teste restaurar um backup para garantir que funciona
2. 🔒 **Segurança**: Os backups contêm dados sensíveis. Mantenha-os seguros
3. 📦 **Espaço em disco**: Monitore o uso do disco, especialmente em ambientes de produção
4. 🔄 **Automação**: Configure os backups automáticos para nunca esquecer de fazer backup
5. ☁️ **Backup externo**: Considere copiar backups importantes para armazenamento externo (S3, Google Drive, etc.)

## 🚀 Próximos Passos

Após configurar os backups, considere:

1. [ ] Testar a restauração de um backup
2. [ ] Instalar backups automáticos via cron
3. [ ] Configurar notificações de falha (via email/Slack)
4. [ ] Implementar backup para armazenamento externo
5. [ ] Documentar o procedimento de disaster recovery

## 📚 Recursos Adicionais

- [Documentação do Supabase CLI](https://supabase.com/docs/guides/cli)
- [Cron Tutorial](https://crontab.guru/)
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)
