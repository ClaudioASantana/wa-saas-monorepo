#!/bin/bash
# Script para backup do Supabase local

# Define data/hora para o nome do arquivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="supabase/backups"

# Cria a pasta caso não exista
mkdir -p "$BACKUP_DIR"

echo "Iniciando o backup do banco de dados local do Supabase..."
npx supabase db dump -f "$BACKUP_DIR/backup_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
  echo "✅ Backup concluído com sucesso! Arquivo gerado: $BACKUP_DIR/backup_$TIMESTAMP.sql"
else
  echo "❌ Falha ao realizar o backup do banco de dados."
  exit 1
fi
