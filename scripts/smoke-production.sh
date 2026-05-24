#!/usr/bin/env bash
# Production API smoke tests.
#   export API_HOST=https://your-render-service.onrender.com
#   export SMOKE_EMAIL=demo1@bizsawa.com
#   export SMOKE_PASSWORD=password123
#   ./scripts/smoke-production.sh

set -euo pipefail

API_HOST="${API_HOST:-}"
SMOKE_EMAIL="${SMOKE_EMAIL:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"

if [[ -z "$API_HOST" ]]; then
  echo "Set API_HOST to your Render base URL (no trailing slash)" >&2
  exit 1
fi

API_HOST="${API_HOST%/}"
PASSED=0
FAILED=0

check() {
  local name="$1"
  local expected="$2"
  shift 2
  local code
  code=$(curl -s -o /tmp/smoke-body.txt -w "%{http_code}" "$@" || true)
  if echo "$expected" | grep -q "$code"; then
    echo "[PASS] $name -> $code"
    PASSED=$((PASSED + 1))
  else
    echo "[FAIL] $name -> $code (expected $expected)"
    head -c 300 /tmp/smoke-body.txt 2>/dev/null || true
    echo ""
    FAILED=$((FAILED + 1))
  fi
}

echo "Smoke testing $API_HOST"
echo ""

check "GET /api/public/health" "200" -m GET "$API_HOST/api/public/health" --max-time 120
check "GET /health" "200" -m GET "$API_HOST/health" --max-time 120
check "POST /api/auth/login empty" "400" -m POST "$API_HOST/api/auth/login" \
  -H "Content-Type: application/json" -d '{}' --max-time 120

if [[ -n "$SMOKE_EMAIL" && -n "$SMOKE_PASSWORD" ]]; then
  check "POST /api/auth/login credentials" "200" -m POST "$API_HOST/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"$SMOKE_PASSWORD\"}" --max-time 120
else
  echo "[SKIP] POST /api/auth/login credentials (set SMOKE_EMAIL and SMOKE_PASSWORD)"
fi

echo ""
echo "Result: $PASSED passed, $FAILED failed"
[[ "$FAILED" -eq 0 ]]
