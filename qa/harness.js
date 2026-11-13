/* Nova Keep QA harness — inject into a loaded nova_keep_arena_r18.html page (agent-browser eval --stdin).
   Everything runs in chunks on setTimeout so the browser stays responsive; poll window.__qa.res.
   Never touches real profiles: run it in a throw-away browser profile / origin only. */
(function () {
  if (window.__qa) return;
  const QA = window.__qa = {res: null, errs: []};
  window.addEventListener('error', e => QA.errs.push('error: ' + (e.message || e.type) + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', e => QA.errs.push('rejection: ' + String(e.reason && e.reason.stack || e.reason).slice(0, 300)));
  const errSnap = () => ({
    page: QA.errs.slice(0, 8),
    r3: ((window.R3 || {}).errors || []).slice(0, 8),
    r4: ((window.R4 || {}).errors || []).slice(0, 8),
    r5: ((window.R5 || {}).errors || []).slice(0, 8),
    r18: window.R18 ? R18.err : 'R18 missing',
    fallbacks: window.R18 ? R18.stats.fallbacks : -1
  });
  QA.errSnap = errSnap;
  // resource counters for long-session growth checks
  QA.mem = function () {
    const pm = performance.memory || {};
    return {heapMB: pm.usedJSHeapSize ? +(pm.usedJSHeapSize / 1048576).toFixed(1) : null,
      cache: R18.cache.size, cachePx: R18.cacheStat ? R18.cacheStat.px : null, statics: R18.statics ? Object.keys(R18.statics).length : null,
      models: R18.models.size, meshes: R18.GL.meshes ? R18.GL.meshes.size : null, domNodes: document.getElementsByTagName('*').length,
      dying: G && G.dying ? G.dying.length : 0, fx: G && G.fx ? G.fx.length : 0, units: G && G.units ? G.units.length : 0};
  };
  // count endBattle calls per battle (rewards must be granted exactly once)
  if (typeof endBattle === 'function' && !endBattle.__qa) {
    const base = endBattle;
    endBattle = function () { QA.endCalls = (QA.endCalls || 0) + 1; return base.apply(this, arguments); };
    endBattle.__qa = true;
  }
  const pct = (a, p) => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * p))].toFixed(1) : 0;
  const prof = () => ({tr: profile.trophies, gold: profile.gold, battles: profile.battles, wins: profile.wins, gems: profile.gems});

  /* start: 'current' (battle already on screen) | 'normal' | 'chaos' | any R4.MODES / R4.MODES_X id
     opts: {deck, maxSec, dt, renderEvery, autopilot:true, force:'p'|'e'|null (kill towers at forceAt), forceAt} */
  QA.match = function (start, opts) {
    opts = Object.assign({maxSec: 420, dt: 1 / 30, renderEvery: 8, autopilot: true, force: null, forceAt: 20}, opts || {});
    const R = QA.res = {done: false, start};
    const t0 = performance.now();
    try {
      STATE.modal = null;
      if (opts.deck) profile.deck = opts.deck.slice();
      QA.endCalls = 0;
      const p0 = prof();
      if (start === 'current') { /* keep the battle the UI already started (e.g. Draft) */ }
      else if (start === 'normal') { STATE.screen = 'battle'; newBattle(false); }
      else if (start === 'chaos') { STATE.screen = 'battle'; newBattle(true); }
      else R4.startMode(start);
      if (!G || STATE.screen !== 'battle') { Object.assign(R, {done: true, crash: 'mode did not start', screen: STATE.screen, modal: STATE.modal && STATE.modal.type}); return 'nostart'; }
      let sim = 0, n = 0, dep = 0, maxU = 0, ot = false, ft = [], fu = [], picks = 0;
      const phases = new Set();
      const chunk = () => {
        try {
          for (let j = 0; j < 240 && G.phase !== 'ended' && sim < opts.maxSec; j++) {
            if (G.introT > 0) G.introT = 0;
            if (G.paused) G.paused = false;
            if (G.chaos && G.chaos.pick && typeof applyChaosOffer === 'function') { applyChaosOffer(0); picks++; }   // C.H.A.O.S. surge: take the first offer
            if (opts.autopilot && n % 15 === 0 && G.you && G.you.hand) {
              const h = G.you.hand;
              for (let i = 0; i < 4; i++) {
                const k = h[i]; if (!k || !CARDS[k]) continue;
                const cost = typeof chaosCostOf === 'function' ? chaosCostOf(CARDS[k], k) : CARDS[k].cost;
                if (G.you.elixir < cost) continue;
                G.selected = i;
                const b = G.you.elixir, sp = CARDS[k].spell;
                deployPlayer(2 + Math.random() * 14, sp ? 6 + Math.random() * 4 : 18 + Math.random() * 12);
                if (G.you.elixir < b) dep++;
                G.selected = -1; break;
              }
            }
            if (opts.force && sim >= opts.forceAt) {
              for (const t of G.towers) if (t.side !== opts.force && !t.dead) t.hp = 0;
            }
            update(opts.dt); sim += opts.dt; n++;
            if (G.slowmo) G.slowmo = 0;
            phases.add(G.phase); if (G.phase === 'overtime') ot = true;
            if (n % opts.renderEvery === 0) { const a = performance.now(); render(); ft.push(performance.now() - a); fu.push(G.units.length); }
            maxU = Math.max(maxU, G.units.length);
          }
          if (G.phase === 'ended' || sim >= opts.maxSec) {
            // let the end screen settle and render a few frames
            for (let k = 0; k < 90; k++) { update(1 / 30); if (k % 10 === 0) render(); }
            const perU = ft.map((t, i) => t / Math.max(1, fu[i])).sort((a, b) => a - b);
            const meanU = fu.reduce((a, b) => a + b, 0) / Math.max(1, fu.length);
            ft.sort((a, b) => a - b);
            Object.assign(R, {done: true, phase: G.phase, winner: G.winner, reason: G.endReason, sim: Math.round(sim), dep, maxU, picks,
              crowns: [G.you && G.you.crowns, G.ai && G.ai.crowns], overtime: ot, phases: [...phases],
              endCalls: QA.endCalls, prof0: p0, prof1: prof(), screen: STATE.screen, modal: STATE.modal && STATE.modal.type,
              renderMed: pct(ft, 0.5), msPerUnitMed: +(perU[perU.length >> 1] || 0).toFixed(2), meanUnits: +meanU.toFixed(1), mem: QA.mem(), renderP95: pct(ft, 0.95), renderMax: pct(ft, 1), frames: ft.length,
              wall: Math.round(performance.now() - t0), cache: R18.cache.size, stats: Object.assign({}, R18.stats), errs: errSnap()});
            return;
          }
          setTimeout(chunk, 0);
        } catch (e) { Object.assign(R, {done: true, crash: String(e && e.stack || e).slice(0, 800), sim: Math.round(sim), errs: errSnap()}); }
      };
      chunk();
      return 'started';
    } catch (e) { Object.assign(R, {done: true, crash: String(e && e.stack || e).slice(0, 800)}); return 'crash'; }
  };

  // every troop × side × variant through the 3D renderer; reports failures
  QA.renderAll = function () {
    const out = {ok: 0, fail: [], noModel: []};
    for (const k in CARDS) {
      const c = CARDS[k]; if (!c || c.building || c.spell) continue;
      for (const v of ['', 'evo', 'hero']) {
        if (v && !R18.modelFor(k, v)) continue;
        if (!R18.modelFor(k, v)) { out.noModel.push(k); continue; }
        for (const side of ['p', 'e']) {
          try {
            const fr = R18.renderFrame(R18.modelFor(k, v), {t: 0, walk: 1, wp: 1.57, atk: 0.5, kick: 0, aim: false, flash: 0}, side, 0.7, 96);
            if (!fr) out.fail.push(k + v + side); else out.ok++;
          } catch (e) { out.fail.push(k + '|' + v + '|' + side + ': ' + e.message); }
        }
      }
    }
    return out;
  };
  return 'qa ready';
})();
