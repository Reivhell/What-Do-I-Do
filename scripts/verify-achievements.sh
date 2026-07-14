#!/usr/bin/env bash
# scripts/verify-achievements.sh — run after backend is started
set -euo pipefail

BASE="http://localhost:3000"

echo "=== 1. Check achievements list ==="
curl -s "$BASE/api/achievements" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Total achievements: {len(data)}')
" 2>&1 || echo "FAILED"

echo "=== 2. Check unlocked ==="
curl -s "$BASE/api/achievements/unlocked" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Unlocked: {len(data)}')
"

echo "=== 3. Evaluate a fake event (manual trigger) ==="
curl -s -X POST "$BASE/api/achievements/evaluate" \
  -H 'Content-Type: application/json' \
  -d '{"eventType": "sessions_completed", "eventValue": 1}'

echo ""

echo "=== 4. Verify achievements list after event ==="
curl -s "$BASE/api/achievements" | python3 -c "
import sys, json
data = json.load(sys.stdin)
unlocked = [a for a in data if a['unlockedAt']]
locked_with_progress = [a for a in data if not a['unlockedAt'] and a['progress'] > 0]
locked_no_progress = [a for a in data if not a['unlockedAt'] and a['progress'] == 0]
print(f'Total: {len(data)}')
print(f'  Unlocked: {len(unlocked)}')
print(f'  Locked w/ progress: {len(locked_with_progress)}')
print(f'  Locked no progress: {len(locked_no_progress)}')
for a in unlocked:
    print(f'  ✓ {a[\"icon\"]} {a[\"title\"]}')
"

echo ""
echo "=== 5. Check single achievement ==="
FIRST_ID=$(curl -s "$BASE/api/achievements" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'])")
curl -s "$BASE/api/achievements/$FIRST_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Single: {d[\"icon\"]} {d[\"title\"]} — progress: {d[\"progress\"]}')
"
