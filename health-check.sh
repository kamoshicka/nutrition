#!/bin/bash
# Health check script for production monitoring
# Usage: ./health-check.sh [endpoint]

ENDPOINT=${1:-"http://localhost:3000/api/health"}
TIMEOUT=${2:-10}

echo "Checking health endpoint: $ENDPOINT"

response=$(curl -s -w "%{http_code}" -m $TIMEOUT "$ENDPOINT")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✅ Health check passed (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    exit 0
elif [ "$http_code" -eq 503 ]; then
    echo "❌ Service unhealthy (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    exit 1
else
    echo "⚠️  Unexpected response (HTTP $http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    exit 2
fi