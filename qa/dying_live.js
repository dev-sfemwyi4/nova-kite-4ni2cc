/* Live death-variant check: inject after qa/harness.js, then call __dyLive(opts) and poll __qa.res.
   Unlike qa/dying.js (which calls die() on hand-made units), this plays a real autopilot match against the AI with
   evo charges kept full, so evo / hero units are created by the game's own deploy, stamp and death paths.
   Every death record drawn is checked against the static render of the variant the unit had when it died. */
window.__dyLive = function (opts) {
  const L = window.__dyL = {deaths: {'': 0, evo: 0, hero: 0}, drawn: {'': 0, evo: 0, hero: 0}, bad: [], leak: 0, pending: new Set(), undrawn: {}};
  const want = new WeakMap();
  if (!die.__dyL) {
    const d0 = die;
    die = function (o) {
      const n = G && G.dying ? G.dying.length : 0;
      const r = d0.apply(this, arguments);
      if (o && !o.type && G && G.dying) for (let i = n; i < G.dying.length; i++) {
        const v = o.hero ? 'hero' : o.evo ? 'evo' : '';
        want.set(G.dying[i], v); L.deaths[v]++; L.pending.add(G.dying[i]);
      }
      return r;
    };
    die.__dyL = true;
    const dd = drawDying;
    drawDying = function (d) {
      const v = want.get(d);
      L.pending.delete(d);
      if (v == null || !R18.modelFor(d.key, v)) { if (v != null) L.noModel = (L.noModel || 0) + 1; return dd.apply(this, arguments); }
      const sk = spriteKey(d.key), prev = ART3D[sk];
      let seen = null; const ds = drawSprite;
      drawSprite = function (s) { if (!seen) seen = s; return ds.apply(this, arguments); };
      try { return dd.apply(this, arguments); }
      finally {
        drawSprite = ds;
        if (ART3D[sk] !== prev) L.leak++;
        if (!d.r18chk) {                            // judge each record once, on its first drawn frame
          d.r18chk = 1; L.drawn[v]++;
          const exp = R18.staticSprite(d.key, d.side === 'p' ? 'p' : 'e', v);
          if (seen !== exp && L.bad.length < 20) L.bad.push(d.key + '|' + d.side + '|' + (v || 'base') + (seen ? ':wrong' : ':none'));
        }
      }
    };
  }
  // keep evolutions charged on both sides so evo units appear on every eligible play
  if (!update.__dyL) {
    const u0 = update;
    update = function () {
      for (const pl of [G && G.you, G && G.ai]) if (pl && pl.evos) for (const k in pl.evos) pl.evos[k].charge = pl.evos[k].cyc;
      return u0.apply(this, arguments);
    };
    update.__dyL = true;
  }
  return __qa.match('normal', Object.assign({maxSec: 240, renderEvery: 2}, opts || {}));
};
window.__dyLiveRes = () => JSON.stringify({undrawn: [...(window.__dyL ? __dyL.pending : [])].filter(d => !G.dying.includes(d)).map(d => d.key + '|' + (d.r18v || 'base')).slice(0, 30), res: __qa.res && {done: __qa.res.done, sim: __qa.res.sim, winner: __qa.res.winner, crash: __qa.res.crash, errs: __qa.res.errs}, L: window.__dyL});
1;
