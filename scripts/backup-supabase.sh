#!/bin/bash
# Script para backup automático do Supabase local com rotação
# Uso: ./scripts/backup-supabase.sh [daily|weekly|monthly]

set -e

# Configurações
BACKUP_ROOT="supabase/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Define tipo de backup (padrão: daily)
BACKUP_TYPE="${1:-daily}"

# Define diretórios por tipo
DAILY_DIR="$BACKUP_ROOT/daily"
WEEKLY_DIR="$BACKUP_ROOT/weekly"
MONTHLY_DIR="$BACKUP_ROOT/monthly"
LAST_DIR="$BACKUP_ROOT/last"

# Políticas de retenção
DAILY_RETENTION=7    # Mantém últimos 7 dias
WEEKLY_RETENTION=4   # Mantém últimas 4 semanas
MONTHLY_RETENTION=12 # Mantém últimos 12 meses

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Cria estrutura de diretórios
mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR" "$LAST_DIR"

# Define diretório de destino baseado no tipo
case $BACKUP_TYPE in
    daily)
        BACKUP_DIR="$DAILY_DIR"
        RETENTION=$DAILY_RETENTION
        ;;
    weekly)
        BACKUP_DIR="$WEEKLY_DIR"
        RETENTION=$WEEKLY_RETENTION
        ;;
    monthly)
        BACKUP_DIR="$MONTHLY_DIR"
        RETENTION=$MONTHLY_RETENTION
        ;;
    *)
        log_error "Tipo de backup inválido: $BACKUP_TYPE"
        log_info "Uso: $0 [daily|weekly|monthly]"
        exit 1
        ;;
esac

log_info "Iniciando backup $BACKUP_TYPE do Supabase..."

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/backup_${DATE}_${TIMESTAMP}.sql"

# Executa o backup
log_info "Gerando dump do banco de dados..."
if npx supabase db dump -f "$BACKUP_FILE" 2>&1 | tee /tmp/supabase_backup.log; then
    log_info "Dump concluído com sucesso!"
    
    # Compacta o backup
    log_info "Compactando backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Copia para o diretório "last" (sempre o mais recente)
    cp "$BACKUP_FILE" "$LAST_DIR/backup_latest.sql.gz"
    
    # Calcula tamanho do backup
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup concluído: $BACKUP_FILE (${SIZE})"
    
    # Limpeza de backups antigos
    log_info "Limpando backups antigos (mantendo últimos $RETENTION)..."
    
    # Lista arquivos por data de modificação e remove os mais antigos
    cd "$BACKUP_DIR"
    ls -t backup_*.sql.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | while read old_backup; do
        log_warn "Removendo backup antigo: $old_backup"
        rm -f "$old_backup"
    done
    
    # Estatísticas finais
    log_info "================================"
    log_info "Backup $BACKUP_TYPE concluído!"
    log_info "Arquivo: $BACKUP_FILE"
    log_info "Tamanho: $SIZE"
    log_info "Backups $BACKUP_TYPE mantidos: $(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)"
    log_info "================================"
    
    exit 0
else
    log_error "Falha ao realizar o backup do banco de dados!"
    log_error "Verifique o log em: /tmp/supabase_backup.log"
    exit 1
fi