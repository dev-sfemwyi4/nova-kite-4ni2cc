/* Death-animation variant check: inject after qa/harness.js, then call __dy(). Each troop x side x variant must draw
   its own static render while dying and leave ART3D untouched. G.dying is cleared per case (the game caps it at 36). */
window.__dy=function(){
  const out={ok:0,bad:[]};
  STATE.modal=null; STATE.screen='battle'; newBattle(false); G.introT=0;
  for(const k of ['knight','musketeer','valkyrie','wizard','giant','bowler','archers','barbarians','skarmy','skeletons','skeleton']){
    for(const side of ['p','e']) for(const v of ['','evo','hero']){
      if(v && !R18.modelFor(k,v)) continue;
      const n0=G.units.length; spawnUnit(k,side,9,side==='p'?22:10,1);
      const u=G.units[G.units.length-1]; if(!u||u.key!==k&&!G.units.slice(n0).length){out.bad.push(k+side+v+':nospawn');continue;}
      for(const w of G.units.slice(n0)){ w.evo=v==='evo'; w.hero=v==='hero'; }
      G.dying.length=0; const d0=0; for(const w of G.units.slice(n0)) die(w);
      const d=G.dying[d0]; if(!d){out.bad.push(k+side+v+':nodying');continue;}
      const want=R18.staticSprite(k,side==='p'?'p':'e',v), sk=spriteKey(d.key), prev=ART3D[sk];
      let seen=null; const ds=drawSprite; drawSprite=function(s){seen=s; return ds.apply(this,arguments);};
      try{ drawDying(d); } finally { drawSprite=ds; }
      const tagOk=(d.r18v||'')===v;
      if(seen===want && tagOk && ART3D[sk]===prev) out.ok++; else out.bad.push(k+side+v+(tagOk?'':':tag')+(seen===want?'':':sprite')+(ART3D[sk]===prev?'':':leak'));
    }
  }
  out.errs=__qa.errSnap(); return JSON.stringify(out);
};1
