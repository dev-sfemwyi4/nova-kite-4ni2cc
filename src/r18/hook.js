/* ============================================================================
   R18 · HOOK — wires the roster into the existing battle renderer.
   • every troop key gets a placeholder full-body sprite (a static render of its
     model) so the base draw path, dying animation and placement ghost keep working
   • drawSpriteRigged is intercepted for troops and replaced by a live 3D frame
     posed from the unit's own simulation state (walk phase, attack timer, recoil)
   • card portraits (ART / EVOART / HEROART) are rendered from the same models
   Gameplay code and card stats are never touched — only names/descriptions.
   ========================================================================== */

const R18 = window.R18 = {
  on: true, version: 'r18', supported: false,
  stats: {draws: 0, hits: 0, renders: 0, fallbacks: 0, portraits: 0},
  roster: ROSTER, models: new Map(), err: ''
};

function rosterKey(key) {
  if (!key) return null;
  if (ROSTER[key]) return key;
  if (ALIAS[key] && ROSTER[ALIAS[key]]) return ALIAS[key];
  const sk = typeof spriteKey === 'function' ? spriteKey(key) : key;
  if (ROSTER[sk]) return sk;
  return null;
}
function modelFor(key, variant) {
  const rk = rosterKey(key);
  if (!rk) return null;
  const id = rk + '|' + (variant || '');
  let m = R18.models.get(id);
  if (m) return m;
  m = new Model();
  try {
    const info = ROSTER[rk].b(m) || {};
    if (variant) dressVariant(m, info, variant);
  } catch (e) {
    R18.err = rk + ': ' + (e && e.message || e);
    m = null;
  }
  R18.models.set(id, m);
  return m;
}
const FLY_ANIMS = {fly: 1, drake: 1, ship: 1, orb: 1, ghost: 1};
function animState(u, m) {
  const st = {t: 0, walk: 0, wp: 0, atk: -1, kick: 0, aim: false, charged: !!u.charged, flash: 0, atkN: u.atkN || 0, seed: 0};
  const walk = clamp01(u.legW != null ? u.legW : (u.moving ? 1 : 0));
  st.walk = walk > 0.6 ? 1 : walk > 0.08 ? 0.5 : 0;
  const wp = u.wp != null ? u.wp : (u.phase || 0);
  st.wp = st.walk ? Math.round((((wp % 6.2832) + 6.2832) % 6.2832) / 6.2832 * 8) % 8 * (6.2832 / 8) : 0;
  if (u.atkT > 0) st.atk = Math.round(clamp01(1 - u.atkT / (u.atkDur || 0.34)) * 9) / 9;
  if (u.kickT > 0) st.kick = Math.round(clamp01(u.kickT / 0.28) * 3) / 3;
  st.aim = !!(u.tgt && u.c && u.c.proj);
  if (u.flash > 0) st.flash = 0.5;
  if (FLY_ANIMS[m.anim] || m.anim === 'cart' || m.rig.piv[BI.prop] || m.rig.piv[BI.gear]) {
    const hz = m.flapHz || 10, now = performance.now() / 1000 + (u.id || 0) * 0.37;
    st.t = Math.floor(now * hz / 6.2832 * 8) / 8 * 6.2832 / hz;
  }
  return st;
}
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function stKey(st) {
  return st.walk + ',' + st.wp.toFixed(2) + ',' + st.atk.toFixed(2) + ',' + st.kick.toFixed(2) + ',' + (st.aim ? 1 : 0) + ',' + (st.charged ? 1 : 0) + ',' + st.flash + ',' + (st.atkN & 1) + ',' + st.t.toFixed(3);
}
// smooth 360° facing from the unit's real motion / attack vector
function yawOf(u) {
  const now = performance.now();
  let want = null;
  const px = u.r18x, py = u.r18y;
  u.r18x = u.x; u.r18y = u.y;
  if (u.moving && px != null) { const dx = u.x - px, dy = u.y - py; if (dx * dx + dy * dy > 1e-7) want = Math.atan2(dx, dy); }
  if (want == null && (u.atkT > 0 || u.kickT > 0 || u.tgt) && u.atkDx != null) want = Math.atan2(u.atkDx, u.atkDy != null ? u.atkDy : (u.side === 'p' ? -1 : 1));
  if (u.r18yaw == null) u.r18yaw = want != null ? want : (u.side === 'p' ? Math.PI : 0);
  if (want != null) {
    let d = want - u.r18yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const dt = Math.min(0.1, Math.max(0, (now - (u.r18t || now)) / 1000));
    u.r18yaw += d * Math.min(1, dt * 12);
  }
  u.r18t = now;
  return u.r18yaw;
}
const YAW_STEPS = 32;
function drawTroop3D(u, h) {
  if (!R18.on || !u || !u.c || u.c.building || u.c.spell) return false;
  const variant = u.hero ? 'hero' : u.evo ? 'evo' : '';
  const m = modelFor(u.key, variant);
  if (!m || !glInit()) return false;
  const T = C.getTransform ? C.getTransform() : {a: 1, b: 0, c: 0, d: 1};
  const det = T.a * T.d - T.b * T.c, sc = Math.sqrt(Math.abs(det)) || 1;
  const span = FRAME.span, wpx = span * h;
  let N = Math.ceil(wpx * sc / 16) * 16;
  N = Math.max(32, Math.min(GL.SIZE, N));
  let yaw = yawOf(u);
  const yq = ((Math.round(yaw / (Math.PI * 2) * YAW_STEPS) % YAW_STEPS) + YAW_STEPS) % YAW_STEPS;
  yaw = yq / YAW_STEPS * Math.PI * 2;
  const st = animState(u, m);
  const side = u.side === 'p' ? 'p' : 'e';
  const key = u.key + '|' + variant + '|' + side + '|' + yq + '|' + N + '|' + stKey(st);
  let fr = cacheGet(key);
  if (!fr) {
    fr = renderFrame(m, st, side, yaw, N);
    if (!fr) return false;
    cachePut(key, fr);
    R18.stats.renders++;
  } else R18.stats.hits++;
  C.save();
  if (det < 0) C.scale(-1, 1);                    // the base renderer mirrors to "face" left — our yaw already does
  C.imageSmoothingEnabled = true;
  C.drawImage(fr, -wpx / 2, -(span + FRAME.yBot) * h, wpx, wpx);
  C.restore();
  R18.stats.draws++;
  return true;
}

// ---------------------------------------------------------------- static renders (sprites + card art)
const STATIC = {};                                   // key -> {p: canvas, e: canvas}
function staticSprite(key, side, variant) {
  const id = key + '|' + (variant || '');
  const s = STATIC[id] || (STATIC[id] = {});
  if (s[side]) return s[side];
  const m = modelFor(key, variant);
  if (!m || !glInit()) return null;
  const N = 192, st = {t: 0.4, walk: 0, wp: 0, atk: -1, kick: 0, aim: false, flash: 0};
  const fr = renderFrame(m, st, side, side === 'p' ? 0.45 : -0.45, N);
  if (!fr) return null;
  // crop to the sprite box the base renderer expects: full width × [feet .. top]
  const out = document.createElement('canvas');
  const top = (FRAME.span + FRAME.yBot) / FRAME.span;   // feet line as a fraction of the frame
  out.width = 140; out.height = 140;
  out.getContext('2d').drawImage(fr, 0, 0, N, N * top, 0, 0, 140, 140);
  out.r9 = out.r10 = out.r18 = true;
  s[side] = out;
  return out;
}
const RAR_BG = {
  common: ['#5b7fa8', '#2a3e5c'], rare: ['#e7a447', '#7a4012'], epic: ['#b36ae6', '#4a1f74'],
  legendary: ['#5fd0e8', '#7a2e86'], champion: ['#ffd76a', '#8a5a10']
};
function portrait(key, variant, rarity) {
  const m = modelFor(key, variant);
  if (!m || !glInit()) return null;
  const out = document.createElement('canvas');
  out.width = 180; out.height = 240;
  const g = out.getContext('2d');
  const bg = RAR_BG[rarity] || RAR_BG.common;
  const gr = g.createRadialGradient(90, 95, 10, 90, 120, 170);
  gr.addColorStop(0, variant === 'evo' ? '#c58cff' : variant === 'hero' ? '#ffe08a' : bg[0]);
  gr.addColorStop(1, variant === 'evo' ? '#3a1466' : variant === 'hero' ? '#6a4300' : bg[1]);
  g.fillStyle = gr; g.fillRect(0, 0, 180, 240);
  // soft rays for depth
  g.save(); g.globalAlpha = 0.12; g.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(90, 110); const a = i * Math.PI / 4 + 0.2; g.arc(90, 110, 220, a, a + 0.22); g.closePath(); g.fill(); }
  g.restore();
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(90, 214, 62, 14, 0, 0, Math.PI * 2); g.fill();
  const st = {t: 0.4, walk: 0, wp: 0, atk: -1, kick: 0, aim: false, flash: 0};
  const pf = ROSTER[rosterKey(key)] || {};
  const span = pf.cardSpan || 1.55, yBot = pf.cardBot != null ? pf.cardBot : -0.05;
  renderFrame(m, st, 'p', -0.42, 240, {span, yBot, into: out, dx: -30, dy: 0, dw: 240, dh: 240, outline: 2.2});
  R18.stats.portraits++;
  return out;
}

// ---------------------------------------------------------------- install
function troopKeys() {
  const out = [];
  if (typeof CARDS === 'undefined') return out;
  for (const k in CARDS) { const c = CARDS[k]; if (c && !c.building && !c.spell) out.push(k); }
  return out;
}
function rename() {
  for (const k of troopKeys()) {
    const rk = rosterKey(k), r = rk && ROSTER[rk];
    if (!r) continue;
    const c = CARDS[k];
    if (!c.r18name) { c.r18name = c.name; }
    c.name = (rk === k || !r.helper) ? r.n : r.n;
    if (r.d) c.desc = r.d;
  }
  for (const k in NAMES_EXTRA) if (CARDS[k]) CARDS[k].name = NAMES_EXTRA[k];
}
function installSprites() {
  if (typeof ART3D === 'undefined') return 0;
  let n = 0;
  for (const k of troopKeys().concat(Object.keys(ALIAS))) {
    const sk = typeof spriteKey === 'function' ? spriteKey(k) : k;
    if (!rosterKey(k)) continue;
    const im = staticSprite(k, 'p');
    if (!im) continue;
    ART3D[sk] = im; if (sk !== k) ART3D[k] = im;
    n++;
  }
  return n;
}
const PORTRAIT_DONE = new Set();
function installPortraits(budget) {
  if (typeof ART === 'undefined') return true;
  const keys = troopKeys();
  const EVOS_ = window.EVOART || null, HEROS_ = window.HEROART || null;
  let left = budget || 9999;
  for (const k of keys) {
    if (left <= 0) return false;
    if (PORTRAIT_DONE.has(k) || !rosterKey(k)) continue;
    const c = CARDS[k];
    const p = portrait(k, '', c.rarity);
    if (p) ART[k] = p;
    if (EVOS_ && window.EVO3D && (k in (window.EVO3D || {}) || (typeof EVOS !== 'undefined' && EVOS[k]))) { const q = portrait(k, 'evo', c.rarity); if (q) EVOS_[k] = q; }
    if (HEROS_ && (k in (window.HERO3D || {}) || HERO_KEYS.indexOf(k) >= 0)) { const q = portrait(k, 'hero', c.rarity); if (q) HEROS_[k] = q; }
    PORTRAIT_DONE.add(k); left--;
  }
  return true;
}
const HERO_KEYS = ['knight', 'giant', 'minipekka', 'musketeer', 'icegolem', 'wizard', 'goblins', 'megaminion', 'magicarcher', 'balloon', 'bowler', 'darkprince', 'berserker', 'valkyrie', 'ewiz', 'icewiz'];

if (typeof drawSpriteRigged === 'function' && typeof drawUnitB === 'function') {
  const baseRig = drawSpriteRigged;
  drawSpriteRigged = function (u, img, h, atkF, kickF) {
    if (R18.on && u && h > 0) {
      try { if (drawTroop3D(u, h)) return; } catch (e) { R18.err = String(e && e.message || e); R18.stats.fallbacks++; }
    }
    return baseRig.apply(this, arguments);
  };
  // the image-based passes (team tint, recolour, 8-dir bake) are redundant for real 3D troops
  const baseUnit = drawUnitB;
  drawUnitB = function (u) {
    if (!R18.on || !u || !u.c || u.c.building || !rosterKey(u.key)) return baseUnit.apply(this, arguments);
    const s8 = window.R8 && R8.tint, s9 = window.R9 && R9.on, s10 = window.R10 && R10.on;
    if (window.R8) R8.tint = false;
    if (window.R9) R9.on = false;
    if (window.R10) R10.on = false;
    try { return baseUnit.apply(this, arguments); }
    finally {
      if (window.R8) R8.tint = s8;
      if (window.R9) R9.on = s9;
      if (window.R10) R10.on = s10;
    }
  };
  if (typeof drawDying === 'function') {                // dying troops keep their team colours
    const baseDying = drawDying;
    drawDying = function (d) {
      const rk = d && rosterKey(d.key);
      if (!R18.on || !rk || d.side === 'p') return baseDying.apply(this, arguments);
      const sk = typeof spriteKey === 'function' ? spriteKey(d.key) : d.key, prev = ART3D[sk];
      const im = staticSprite(d.key, 'e');
      if (im) ART3D[sk] = im;
      try { return baseDying.apply(this, arguments); } finally { ART3D[sk] = prev; }
    };
  }
  R18.supported = glInit();
  if (R18.supported) {
    rename();
    installSprites();
    // portraits: a few per frame so the menu never hitches; re-assert in case a late loader overwrites them
    const step = () => {
      const done = installPortraits(6);
      if (!done && typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(step);
    };
    step();
    let checks = 0;
    const keep = setInterval(() => {
      installSprites(); rename();
      PORTRAIT_DONE.clear(); installPortraits(9999);
      if (++checks >= 3) clearInterval(keep);
    }, 1500);
  }
}
R18.modelFor = modelFor; R18.renderFrame = renderFrame; R18.portrait = portrait; R18.staticSprite = staticSprite;
R18.FRAME = FRAME; R18.cache = CACHE; R18.GL = GL;
