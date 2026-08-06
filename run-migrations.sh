#!/bin/bash
# Script para rodar migrations via Docker
docker exec wa-postgres psql -U postgres -d flux-crm -c "\i /docker-entrypoint-initdb.d/run-migrations.sql"
