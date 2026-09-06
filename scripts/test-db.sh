#!/usr/bin/env bash
set -e

echo "🔍 Testing PostgreSQL & pgvector extension..."
docker exec -i fittersweat-postgres psql -U postgres -d fittersweat_dev -c "
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
"
echo "✅ pgvector is active and ready!"
