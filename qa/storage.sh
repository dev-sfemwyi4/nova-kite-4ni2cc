#!/usr/bin/env bash
# usage: qa/storage.sh <origin e.g. http://127.0.0.1:8766>   (serve the repo root or a copy; use a throw-away origin)
# Seeds localStorage from a blank page on the same origin (so the game can't flush over the seed), loads the
# game, checks the loaded profile and that a battle starts. Prints one line per case: PASS/FAIL + details.
set -u
O=${1:?origin}
export AGENT_BROWSER_SESSION=${AGENT_BROWSER_SESSION:-qa-storage}
ab() { timeout 40 agent-browser "$@" 2>&1; }
# a known-good save produced by the game itself
ab open "$O/blank.html" >/dev/null; ab eval 'localStorage.clear(); 1' >/dev/null
ab open "$O/nova_keep_arena_r18.html?v=$RANDOM" >/dev/null; sleep 6
ab eval 'saveProfile(); localStorage.setItem("__good", localStorage.getItem("crCloneProfileV2")); 1' >/dev/null
# case: name | seed js (G0 = good save object) | expected trophies
CASES=(
  "null_primary|localStorage.setItem('crCloneProfileV2','null')|0"
  "array_primary|localStorage.setItem('crCloneProfileV2','[1,2]')|0"
  "empty_array|localStorage.setItem('crCloneProfileV2','[]')|0"
  "string_primary|localStorage.setItem('crCloneProfileV2','\"hi\"')|0"
  "number_primary|localStorage.setItem('crCloneProfileV2','42')|0"
  "empty_object|localStorage.setItem('crCloneProfileV2','{}')|0"
  "array_with_good_bak|localStorage.setItem('crCloneProfileV2','[1,2]'); localStorage.setItem('crCloneProfileV2_bak', JSON.stringify(Object.assign({},G0,{trophies:654})))|654"
  "null_with_good_bak|localStorage.setItem('crCloneProfileV2','null'); localStorage.setItem('crCloneProfileV2_bak', JSON.stringify(Object.assign({},G0,{trophies:321})))|321"
  "cards_array|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{cards:[1,2],trophies:222})))|222"
  "deck_array_of_junk|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{deck:[[1],{},7,null],trophies:333})))|333"
  "truncated_primary_good_bak|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{trophies:999})).slice(0,-40)); localStorage.setItem('crCloneProfileV2_bak', JSON.stringify(Object.assign({},G0,{trophies:555})))|555"
  "empty_object_good_bak|localStorage.setItem('crCloneProfileV2','{}'); localStorage.setItem('crCloneProfileV2_bak', JSON.stringify(Object.assign({},G0,{trophies:444})))|444"
  "both_corrupt|localStorage.setItem('crCloneProfileV2','{\"cards\":'); localStorage.setItem('crCloneProfileV2_bak','nul')|0"
  "scalar_cards_deck|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{cards:1,deck:'x',trophies:111})))|111"
  "card_entry_scalars|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{cards:Object.assign({},G0.cards,{knight:5,archers:'x',giant:true}),trophies:112})))|112"
  "junk_numbers|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{trophies:'abc',gold:null,gems:-5})))|any"
  "valid_untouched|localStorage.setItem('crCloneProfileV2', JSON.stringify(Object.assign({},G0,{trophies:1234,gold:4321})))|1234"
)
for c in "${CASES[@]}"; do
  IFS='|' read -r name seed want <<< "$c"
  ab open "$O/blank.html" >/dev/null
  ab eval "const G0=JSON.parse(localStorage.getItem('__good')); localStorage.removeItem('crCloneProfileV2'); localStorage.removeItem('crCloneProfileV2_bak'); $seed; 1" >/dev/null
  ab open "$O/nova_keep_arena_r18.html?v=$RANDOM" >/dev/null
  r=""
  for _ in 1 2 3 4 5 6; do
    sleep 3
    r=$(ab eval 'typeof STATE==="undefined"||typeof profile==="undefined"||!profile?"":(function(){var o={scr:STATE.screen, deck:profile.deck&&profile.deck.length, tr:profile.trophies, gold:profile.gold}; try{STATE.modal=null; STATE.screen="battle"; newBattle(false); G.introT=0; for(let i=0;i<90;i++){update(1/30); if(i%45==0) render();} o.battle=G.phase;}catch(e){o.crash=String(e.stack).slice(0,300)} try{o.pt=JSON.parse(localStorage.getItem("crCloneProfileV2")).trophies;o.bt=JSON.parse(localStorage.getItem("crCloneProfileV2_bak")).trophies;}catch(e){o.stor="unparseable";} o.trNum=typeof profile.trophies==="number"&&isFinite(profile.trophies); o.goldNum=typeof profile.gold==="number"&&isFinite(profile.gold); o.errs=[].concat((R3.errors||[]).slice(0,3),(R4.errors||[]).slice(0,3),R18.err?[R18.err]:[]); STATE.screen="home"; return JSON.stringify(o);})()')
    [ -n "$r" ] && [ "$r" != '""' ] && break
  done
  ok=FAIL
  pat="tr\\\\\":$want,"; [ "$want" = any ] && pat='tr'
  # what loaded must also be what is now stored, in both the primary and the backup slot
  [ "$want" != any ] && pat="$pat.*pt\\\\\":$want,\\\\\"bt\\\\\":$want,"
  echo "$r" | grep -q "$pat" && echo "$r" | grep -q 'trNum\\":true' && echo "$r" | grep -q 'goldNum\\":true' && echo "$r" | grep -q 'deck\\":8' && echo "$r" | grep -q 'battle\\":\\"playing' && echo "$r" | grep -q 'errs\\":\[\]' && ok=PASS
  echo "$ok $name want_tr=$want $r"
done
