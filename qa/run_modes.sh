#!/usr/bin/env bash
# usage: qa/run_modes.sh <url> [mode ...]
# Plays one autopilot match per mode in a throw-away agent-browser session and prints one JSON line per mode.
# Modes: normal, chaos, or any R4.MODES / R4.MODES_X id (default: every mode the page defines).
set -u
URL=${1:?url}; shift
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-qa-modes}
DIR=$(cd "$(dirname "$0")" && pwd)
OPTS=${QA_OPTS:-'{"maxSec":420,"renderEvery":30}'}
agent-browser open "$URL" >/dev/null
sleep 8
agent-browser eval --stdin < "$DIR/harness.js" >/dev/null
MODES=("$@")
if [ ${#MODES[@]} -eq 0 ]; then
  mapfile -t MODES < <(agent-browser eval "['normal','chaos'].concat(Object.keys(R4.MODES),Object.keys(R4.MODES_X)).filter(m=>m!=='draft').join('\n')" | tr -d '"' | sed 's/\\n/\n/g')
fi
for m in "${MODES[@]}"; do
  agent-browser eval "__qa.match('$m', $OPTS)" >/dev/null
  r='{}'
  for _ in $(seq 1 120); do
    sleep 3
    r=$(timeout 8 agent-browser eval 'JSON.stringify(__qa.res||{})' 2>/dev/null)
    echo "$r" | grep -q 'done\\":true' && break
  done
  echo "$m $r"
  # back to the home screen between modes so state isolation is exercised too
  agent-browser eval 'STATE.modal=null; STATE.screen="home"; 1' >/dev/null
done
