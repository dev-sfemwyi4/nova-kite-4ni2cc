/* Input edge cases — inject after harness.js, then: JSON.stringify(__qaInput())
   Synthetic PointerEvents / KeyboardEvents on the real canvas & window listeners (not trusted OS input). */
(function () {
  const W_ = () => CV.width / (window.DPR || 1);
  function client(x, y) {                       // canvas logical coords -> client px
    const r = CV.getBoundingClientRect(), w = typeof W !== 'undefined' ? W : W_(), h = typeof H !== 'undefined' ? H : r.height;
    return {x: r.left + x * (r.width / w), y: r.top + y * (r.height / h)};
  }
  function ptr(type, x, y, o) {
    const c = client(x, y);
    const ev = new PointerEvent(type, Object.assign({bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: type === 'pointerup' ? 0 : 1}, o || {}));
    (o && o.target || CV).dispatchEvent(ev);
  }
  function key(k) {
    window.dispatchEvent(new KeyboardEvent('keydown', {key: k, bubbles: true, cancelable: true}));
  }
  const tileToCanvas = (tx, ty) => ({x: X(tx), y: Y(ty)});
  function fresh(deck) {
    STATE.modal = null; if (deck) profile.deck = deck.slice();
    STATE.screen = 'battle'; newBattle(false); G.introT = 0; G.paused = false;
    for (let i = 0; i < 5; i++) update(1 / 30);
    G.you.elixir = 10;
    render();                                   // lays out G.hotCards
  }
  const troopSlot = () => { for (let i = 0; i < 4; i++) { const k = G.you.hand[i]; if (k && CARDS[k] && !CARDS[k].spell && !CARDS[k].building) return i; } return 0; };
  function cardCenter(i) { const r = G.hotCards[i]; return {x: r.x + r.w / 2, y: r.y + r.h / 2}; }
  function snap() { return {el: +G.you.elixir.toFixed(2), units: G.units.filter(u => u.side === 'p').length, sel: G.selected, paused: !!G.paused}; }

  window.__qaInput = function () {
    const out = {}, deck = ['knight', 'archers', 'giant', 'musketeer', 'minipekka', 'valkyrie', 'babydragon', 'wizard'];
    const own = tileToCanvas(9, 25), enemy = tileToCanvas(9, 6);
    const caseRun = (name, fn, expect) => {
      try { fresh(deck); const a = snap(); fn(); const b = snap(); out[name] = Object.assign({ok: expect(a, b)}, {a, b}); }
      catch (e) { out[name] = {ok: false, crash: String(e && e.stack || e).slice(0, 300)}; }
    };
    // drag a card into the arena and release: deploys (control)
    caseRun('drag_release_in_arena', () => { const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointermove', own.x, own.y); ptr('pointerup', own.x, own.y); },
      (a, b) => b.units > a.units && b.el < a.el);
    // drag then the OS cancels the gesture (incoming call, scroll takeover) and a stray pointerup lands in the arena
    caseRun('drag_cancel_then_up', () => { const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointermove', own.x, own.y); ptr('pointercancel', own.x, own.y); ptr('pointerup', own.x, own.y); },
      (a, b) => b.units === a.units && b.el === a.el);
    // drag and release outside the canvas
    caseRun('drag_release_outside', () => { const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointermove', own.x, own.y); ptr('pointerup', -50, -50, {target: document.body}); ptr('pointerup', own.x, own.y, {pointerType: 'mouse'}); },
      (a, b) => b.units === a.units && b.el === a.el);
    // drag back onto the hand: no deploy, nothing spent
    caseRun('drag_back_to_hand', () => { const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointermove', own.x, own.y); ptr('pointermove', c.x, c.y); ptr('pointerup', c.x, c.y); },
      (a, b) => b.units === a.units && b.el === a.el);
    // release a troop on the enemy half: illegal, nothing spent
    caseRun('drag_illegal_enemy_half', () => { const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointermove', enemy.x, enemy.y); ptr('pointerup', enemy.x, enemy.y); },
      (a, b) => b.units === a.units && b.el === a.el);
    // tap-select then tap-deploy (control) and tap-select then tap empty UI to cancel
    caseRun('tap_select_tap_deploy', () => { const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointerup', c.x, c.y); ptr('pointerdown', own.x, own.y); ptr('pointerup', own.x, own.y); },
      (a, b) => b.units > a.units && b.el < a.el && b.sel === -1);
    caseRun('not_enough_elixir', () => { G.you.elixir = 0.5; const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointerup', c.x, c.y); ptr('pointerdown', own.x, own.y); ptr('pointerup', own.x, own.y); },
      (a, b) => b.units === a.units);
    // rapid double tap on a card toggles selection back off
    caseRun('double_tap_card_toggles', () => { const c = cardCenter(troopSlot()); for (let k = 0; k < 2; k++) { ptr('pointerdown', c.x, c.y); ptr('pointerup', c.x, c.y); } },
      (a, b) => b.sel === -1 && b.units === a.units);
    // keyboard: 1-4 select, same key deselects, Escape clears selection
    caseRun('keys_1_to_4', () => { key('2'); out._k2 = G.selected; key('2'); out._k2b = G.selected; key('3'); out._k3 = G.selected; key('Escape'); },
      (a, b) => out._k2 === 1 && out._k2b === -1 && out._k3 === 2 && b.sel === -1);
    // P pauses, P resumes; no deploy while paused
    caseRun('key_p_pause', () => { key('p'); out._p1 = !!G.paused; const i = troopSlot(), c = cardCenter(i); ptr('pointerdown', c.x, c.y); ptr('pointerup', c.x, c.y); ptr('pointerdown', own.x, own.y); ptr('pointerup', own.x, own.y); out._pu = G.units.filter(u => u.side === 'p').length; key('p'); out._p2 = !!G.paused; },
      (a, b) => out._p1 === true && out._p2 === false && out._pu === a.units);
    // blur auto-pauses a live battle
    caseRun('blur_autopause', () => { window.dispatchEvent(new Event('blur')); },
      (a, b) => b.paused === true);
    // Q / W heroes and E champion never throw, even with no hero / champion in the deck
    caseRun('keys_q_w_e_safe', () => { key('q'); key('w'); key('e'); for (let i = 0; i < 10; i++) update(1 / 30); },
      () => true);
    out.errs = __qa.errSnap();
    return out;
  };
})();
