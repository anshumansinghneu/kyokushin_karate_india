#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  KKFI Database Backup Script
#  Creates a timestamped .sql dump of your Neon PostgreSQL DB
#
#  Usage:  ./backup-db.sh
#  Output: backups/kkfi_backup_YYYYMMDD_HHMMSS.sql
# ═══════════════════════════════════════════════════════════

set -e

# Add libpq to PATH if installed via Homebrew
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/kkfi_backup_$TIMESTAMP.sql"

# Load DIRECT_URL from backend/.env (non-pooled connection required for pg_dump)
ENV_FILE="$SCRIPT_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ backend/.env not found"
    exit 1
fi

DIRECT_URL=$(grep '^DIRECT_URL=' "$ENV_FILE" | sed 's/^DIRECT_URL=//' | tr -d '"')
if [ -z "$DIRECT_URL" ]; then
    echo "❌ DIRECT_URL not found in backend/.env"
    exit 1
fi

# Check pg_dump exists
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump not found. Install PostgreSQL client tools:"
    echo "   brew install libpq && brew link --force libpq"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "🔄 Backing up database..."
pg_dump "$DIRECT_URL" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --format=plain \
    > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup saved: $BACKUP_FILE ($SIZE)"
echo ""

# Keep only last 10 backups
cd "$BACKUP_DIR"
ls -t kkfi_backup_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
echo "📁 Backups in $BACKUP_DIR:"
ls -lh kkfi_backup_*.sql 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
