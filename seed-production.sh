#!/bin/bash

# Script to seed the production database with test accounts
# WARNING: This will create test accounts in your PRODUCTION database

echo "⚠️  WARNING: PRODUCTION DATABASE SEEDING"
echo "=========================================="
echo ""
echo "This will create test accounts in your PRODUCTION database."
echo "Only proceed if you want test data in production."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No changes made."
    exit 0
fi

echo ""
echo "🌱 Seeding production database..."
echo ""

# Get production DATABASE_URL from Render or environment
if [ -z "$PRODUCTION_DATABASE_URL" ]; then
    echo "❌ Error: PRODUCTION_DATABASE_URL environment variable not set"
    echo ""
    echo "Please set it first:"
    echo "  export PRODUCTION_DATABASE_URL='your-render-postgres-url'"
    echo ""
    echo "You can find this in:"
    echo "  1. Render Dashboard → Your Backend Service → Environment"
    echo "  2. Copy the DATABASE_URL value"
    exit 1
fi

# Temporarily override DATABASE_URL and run seed
cd backend
DATABASE_URL="$PRODUCTION_DATABASE_URL" npm run seed:test

echo ""
echo "✅ Production database seeded!"
echo ""
echo "You can now login at your production URL with:"
echo "  Email: admin@kyokushin.in"
echo "  Password: password123"
