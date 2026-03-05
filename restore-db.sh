#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  KKFI Database Restore Script
#  Restores from a backup .sql file
#
#  Usage:  ./restore-db.sh backups/kkfi_backup_XXXXXXXX_XXXXXX.sql
# ═══════════════════════════════════════════════════════════

set -e

# Add libpq to PATH if installed via Homebrew
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore-db.sh <backup-file.sql>"
    echo ""
    echo "Available backups:"
    ls -lh "$SCRIPT_DIR/backups"/kkfi_backup_*.sql 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}' || echo "   No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    # Try with backups/ prefix
    if [ -f "$SCRIPT_DIR/backups/$BACKUP_FILE" ]; then
        BACKUP_FILE="$SCRIPT_DIR/backups/$BACKUP_FILE"
    else
        echo "❌ File not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Load DIRECT_URL from backend/.env
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

if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Install PostgreSQL client tools:"
    echo "   brew install libpq && brew link --force libpq"
    exit 1
fi

echo "⚠️  This will REPLACE all current data with the backup."
echo "   Backup: $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "🔄 Restoring database from backup..."
psql "$DIRECT_URL" < "$BACKUP_FILE" 2>&1 | tail -5

echo "✅ Database restored from: $BACKUP_FILE"
