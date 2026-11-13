window.__draft=function(){
  const tapId=id=>{render(); const h=POLISH.hits.slice().reverse().find(h=>h.id===id); if(!h) return false;
    const r=CV.getBoundingClientRect(),s=r.width/W,cx=r.left+(h.x+h.w/2)*s,cy=r.top+(h.y+h.h/2)*s;
    for(const t of ['pointerdown','pointerup']) CV.dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,pointerId:3,pointerType:'touch',isPrimary:true}));
    return true;};
  STATE.screen='home'; STATE.modal=null; R4.startMode('draft');
  const out={modal:STATE.modal&&STATE.modal.type, taps:[]};
  for(let i=0;i<8;i++) out.taps.push(tapId('r4draft_'+(i%2)));
  const m=STATE.modal; out.picks=m&&m.picks.slice(); out.pass=m&&m.pass.slice();
  out.uniq=m&&new Set(m.picks).size;
  out.go=tapId('r4draft_go');
  out.screen=STATE.screen; out.deckP=G&&G.you&&G.you.deck&&G.you.deck.slice(); out.deckE=G&&G.ai&&G.ai.deck&&G.ai.deck.slice();
  out.mode=G&&G.r4mode&&G.r4mode.id;
  return out;
};1
