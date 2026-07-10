#!/bin/bash
# Script para restaurar backup do Supabase local
# Uso: ./scripts/restore-supabase.sh [caminho_do_backup.sql.gz]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_question() {
    echo -e "${BLUE}[?]${NC} $1"
}

# Verifica se foi passado um arquivo
BACKUP_FILE="$1"

# Se não foi passado, mostra os backups disponíveis
if [ -z "$BACKUP_FILE" ]; then
    log_info "Backups disponíveis:"
    echo ""
    echo "=== Último backup ==="
    if [ -f "supabase/backups/last/backup_latest.sql.gz" ]; then
        ls -lh supabase/backups/last/backup_latest.sql.gz | awk '{print $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
    else
        echo "Nenhum backup encontrado"
    fi
    
    echo ""
    echo "=== Backups diários (últimos 5) ==="
    ls -lht supabase/backups/daily/backup_*.sql.gz 2>/dev/null | head -5 | awk '{print $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' || echo "Nenhum backup encontrado"
    
    echo ""
    echo "=== Backups semanais ==="
    ls -lht supabase/backups/weekly/backup_*.sql.gz 2>/dev/null | awk '{print $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' || echo "Nenhum backup encontrado"
    
    echo ""
    echo "=== Backups mensais ==="
    ls -lht supabase/backups/monthly/backup_*.sql.gz 2>/dev/null | awk '{print $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' || echo "Nenhum backup encontrado"
    
    echo ""
    log_info "Para restaurar, execute:"
    log_info "./scripts/restore-supabase.sh <caminho_do_backup>"
    log_info ""
    log_info "Ou use 'latest' para restaurar o último backup:"
    log_info "./scripts/restore-supabase.sh latest"
    exit 0
fi

# Atalho para último backup
if [ "$BACKUP_FILE" = "latest" ]; then
    BACKUP_FILE="supabase/backups/last/backup_latest.sql.gz"
fi

# Verifica se o arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Arquivo não encontrado: $BACKUP_FILE"
    exit 1
fi

# Mostra informações do backup
log_info "Backup selecionado:"
ls -lh "$BACKUP_FILE" | awk '{print "  Arquivo: " $9 "\n  Tamanho: " $5 "\n  Data: " $6 " " $7 " " $8}'

# Confirmação
echo ""
log_warn "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco de dados atual!"
log_question "Deseja continuar? (digite 'SIM' para confirmar): "
read -r CONFIRMATION

if [ "$CONFIRMATION" != "SIM" ]; then
    log_info "Operação cancelada pelo usuário."
    exit 0
fi

# Cria backup de segurança antes do restore
log_info "Criando backup de segurança antes do restore..."
SAFETY_BACKUP="supabase/backups/last/pre-restore_$(date +%Y%m%d_%H%M%S).sql.gz"
npx supabase db dump -f "${SAFETY_BACKUP%.gz}" 2>&1 | grep -v "^$" || true
gzip "${SAFETY_BACKUP%.gz}" 2>/dev/null || true
log_info "Backup de segurança criado: $SAFETY_BACKUP"

# Descompacta o backup se necessário
TEMP_FILE="/tmp/supabase_restore_$$.sql"
log_info "Descompactando backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

# Executa o restore
log_info "Restaurando banco de dados..."
log_warn "Aguarde, esta operação pode levar alguns minutos..."

if npx supabase db reset 2>&1 | tee /tmp/supabase_restore.log; then
    log_info "Reset do banco concluído!"
    
    # Aplica o backup
    log_info "Aplicando backup..."
    if psql postgresql://postgres:postgres@localhost:54322/postgres -f "$TEMP_FILE" 2>&1 | tee -a /tmp/supabase_restore.log; then
        log_info "================================"
        log_info "✅ Restore concluído com sucesso!"
        log_info "================================"
        log_info "Backup restaurado: $BACKUP_FILE"
        log_info "Backup de segurança: $SAFETY_BACKUP"
        
        # Remove arquivo temporário
        rm -f "$TEMP_FILE"
        exit 0
    else
        log_error "Falha ao aplicar o backup!"
        log_error "Verifique o log em: /tmp/supabase_restore.log"
        log_warn "O backup de segurança está em: $SAFETY_BACKUP"
        rm -f "$TEMP_FILE"
        exit 1
    fi
else
    log_error "Falha ao resetar o banco de dados!"
    log_error "Verifique o log em: /tmp/supabase_restore.log"
    rm -f "$TEMP_FILE"
    exit 1
fi