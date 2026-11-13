#!/usr/bin/env bash
# usage: qa/soak.sh <url> <wall-seconds> [contender-url]
# Repeated seeded-deck autopilot matches in ONE page for <wall-seconds> of real time. After each match prints:
# real elapsed seconds, accelerated game seconds played so far, render median/p95, ms per unit, and resources
# (JS heap after a forced GC via CDP, frame cache entries/pixels, statics, models, meshes, DOM nodes).
# With [contender-url], a second tab with the game idling on its home screen stays open the whole time, to
# measure CPU contention (its requestAnimationFrame loop keeps rendering).
set -u
URL=${1:?url}; WALL=${2:?seconds}; CONT=${3:-}
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-qa-soak}
DIR=$(cd "$(dirname "$0")" && pwd)
ab() { timeout 30 agent-browser "$@" 2>/dev/null; }
ab open "$URL" >/dev/null; sleep 8
if [ -n "$CONT" ]; then ab tab new "$CONT" >/dev/null; sleep 6; ab tab 0 >/dev/null; fi
ab eval --stdin < "$DIR/harness.js" >/dev/null
CDP=$(ab get cdp-url | tr -d '"')
T0=$(date +%s); GAME=0; N=0
while [ $(( $(date +%s) - T0 )) -lt "$WALL" ]; do
  ab eval "__qa.match('normal', {maxSec: 180, renderEvery: 2, deck: ['knight','giant','archers','musketeer','minipekka','skarmy','babydragon','fireball']})" >/dev/null
  r='{}'
  for _ in $(seq 1 100); do sleep 3; r=$(ab eval 'JSON.stringify(__qa.res||{})'); echo "$r" | grep -q 'done\\":true' && break; done
  N=$((N+1))
  heap=$(timeout 30 node "$DIR/heap_after_gc.mjs" "$CDP" 2>/dev/null | awk '{print $NF}')
  line=$(python3 -c '
import json,sys
o=json.loads(json.loads(sys.argv[1])); m=o.get("mem",{}); e={k:v for k,v in o.get("errs",{}).items() if v}
print("sim=%s med=%s p95=%s perU=%s maxU=%s cache=%s cachePx=%s statics=%s models=%s meshes=%s dom=%s errs=%s" % (o.get("sim"),o.get("renderMed"),o.get("renderP95"),o.get("msPerUnitMed"),o.get("maxU"),m.get("cache"),m.get("cachePx"),m.get("statics"),m.get("models"),m.get("meshes"),m.get("domNodes"),e or "none"))
' "$r" 2>/dev/null || echo "parse-fail ${r:0:200}")
  GAME=$((GAME + $(echo "$line" | sed -n 's/^sim=\([0-9]*\).*/\1/p' | sed 's/^$/0/')))
  echo "match=$N real_s=$(( $(date +%s) - T0 )) game_s_total=$GAME heapGC_MB=${heap:-?} $line"
  ab eval 'STATE.modal=null; STATE.screen="home"; 1' >/dev/null
done
