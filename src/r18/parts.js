/* ============================================================================
   R18 · PARTS — a small modelling kit. Every troop in the roster is built
   from these archetypes and accessories, authored in rest-pose model space:
   feet on y = 0, nominal height ≈ 1, facing +Z, the troop's weapon hand on −X.
   ========================================================================== */

function Model() {
  this.parts = [];
  this.rig = {piv: [], armRestL: -0.22, armRestR: -0.34, armSpread: 0.07, twoHand: false};
  this.anim = 'hum';
  this.atk = 'chop';
  this.scale = 1;
}
function colTok(c) {
  if (c === 'T' || c === 'TD' || c === 'TL') return c;
  return hex3(c);
}
function rotM(r) { return r ? M4.chain(M4.RY(r[1] || 0), M4.RX(r[0] || 0), M4.RZ(r[2] || 0)) : null; }
// add a primitive: bone, mesh key, centre, size (diameters), colour, {m: material, r: [rx,ry,rz], f: frame, nl, ts}
Model.prototype.add = function (bone, mk, pos, scl, col, o) {
  o = o || {};
  const M = M4.chain(o.f || null, M4.T(pos[0], pos[1], pos[2]), rotM(o.r), M4.S(scl[0], scl[1], scl[2]));
  this.parts.push({bone: BI[bone] | 0, mesh: mk, M, c: colTok(col), mat: MAT[o.m || 'matte'] || 0, noLine: !!o.nl, twoSided: !!o.ts});
  return this;
};
// a limb/rod: frustum from A to B with radius ra (at A) — taper t = rb/ra
Model.prototype.seg = function (bone, A, B, ra, col, o) {
  o = o || {};
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], len = Math.hypot(d[0], d[1], d[2]) || 1e-6;
  const ux = d[0] / len, uy = d[1] / len, uz = d[2] / len;
  // rotation mapping +Y onto u (Rodrigues around axis y × u)
  let R = M4.id();
  const ax = uz, az = -ux, sinA = Math.hypot(ax, az), cosA = uy;
  if (sinA > 1e-6) {
    const kx = ax / sinA, kz = az / sinA, C1 = 1 - cosA;
    R = M4.id();
    // (explicit Rodrigues with k = (kx, 0, kz))
    R[0] = cosA + kx * kx * C1; R[1] = kz * sinA; R[2] = kx * kz * C1;
    R[4] = -kz * sinA; R[5] = cosA; R[6] = kx * sinA;
    R[8] = kx * kz * C1; R[9] = -kx * sinA; R[10] = cosA + kz * kz * C1;
  } else if (cosA < 0) R = M4.RX(Math.PI);
  const mk = o.mesh || ('C' + (o.segs || 10) + (o.t != null && o.t !== 1 ? 't' + o.t : ''));
  const M = M4.chain(o.f || null, M4.T((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), R, M4.RY(o.spin || 0), M4.S(ra * 2 * (o.sx || 1), len, ra * 2 * (o.sz || 1)));
  this.parts.push({bone: BI[bone] | 0, mesh: mk, M, c: colTok(col), mat: MAT[o.m || 'matte'] || 0, noLine: !!o.nl, twoSided: !!o.ts});
  return this;
};
Model.prototype.pivot = function (bone, p) { this.rig.piv[BI[bone]] = p; return this; };
Model.prototype.sym = function (fn) { fn(1); fn(-1); return this; };

// ---------------------------------------------------------------- humanoid
// o: leg torso headR bulk tw td skin top bot boot glove sleeve belt robe chest k x0 y0 z0 seated
function hum(m, o) {
  o = o || {};
  const k = o.k || 1, x0 = o.x0 || 0, y0 = o.y0 || 0, z0 = o.z0 || 0;
  const P = (x, y, z) => [x * k + x0, y * k + y0, z * k + z0];
  const bulk = o.bulk || 1;
  const leg = o.leg != null ? o.leg : 0.34, torso = o.torso || 0.30, R = o.headR || 0.15;
  const hipY = leg, shY = hipY + torso, headC = shY + (o.neck != null ? o.neck : 0.035) + R * 0.95;
  const tw = 0.30 * bulk * (o.tw || 1), td = 0.21 * bulk * (o.td || 1);
  const ar = 0.052 * bulk * (o.ar || 1), lw = 0.06 * bulk * (o.lw || 1);
  const shX = tw * 0.5 + ar * 0.55, hipX = Math.max(lw * 1.05, tw * 0.24);
  const armLen = o.arm || torso * 0.92 + 0.05;
  const skin = o.skin || '#f2c49b', top = o.top || '#8a6b4a', bot = o.bot || '#5a4632', boot = o.boot || '#3d2b1e';
  const sleeve = o.sleeve || top, glove = o.glove || skin;
  m.pivot('body', P(0, hipY, 0));
  m.pivot('head', P(0, shY + 0.02, 0));
  m.pivot('armL', P(shX, shY - 0.015, 0)); m.pivot('armR', P(-shX, shY - 0.015, 0));
  m.pivot('legL', P(hipX, hipY, 0)); m.pivot('legR', P(-hipX, hipY, 0));
  // legs
  if (o.seated) {
    m.sym(s => {
      m.seg('body', P(s * hipX, hipY, 0.02), P(s * (hipX + 0.16), hipY - 0.07, 0.10), lw * k, bot);
      m.seg('body', P(s * (hipX + 0.16), hipY - 0.07, 0.10), P(s * (hipX + 0.17), hipY - 0.24, 0.08), lw * 0.95 * k, bot);
      m.add('body', 'S', P(s * (hipX + 0.17), hipY - 0.26, 0.11), [lw * 2.1 * k, 0.085 * k, lw * 2.9 * k], boot, {m: 'gloss'});
    });
  } else if (leg > 0.02) {
    m.sym(s => {
      const b = s > 0 ? 'legL' : 'legR';
      m.seg(b, P(s * hipX, hipY + 0.02, 0), P(s * hipX, 0.07, 0.005), lw * k, bot, {t: o.legTaper || 0.85});
      m.add(b, 'S', P(s * hipX, 0.045, 0.025), [lw * 2.25 * k, 0.095 * k, lw * 3.0 * k], boot, {m: 'gloss'});
    });
  }
  // robe / skirt hides the legs
  if (o.robe) {
    const rb = (o.robeR || tw * 0.62), ht = hipY + 0.06 - (o.robeBot != null ? o.robeBot : 0.05);
    m.add('body', 'C16t' + (o.robeTaper || 0.62), P(0, (o.robeBot != null ? o.robeBot : 0.05) + ht / 2, 0), [rb * 2 * k, ht * k, rb * 1.75 * k], o.robe, {m: 'cloth'});
  }
  // hips + torso
  m.add('body', 'S', P(0, hipY + 0.01, 0), [tw * 0.96 * k, 0.13 * k, td * 0.98 * k], o.robe || bot);
  if (o.chest === 'V') m.add('body', 'C14t1.3', P(0, hipY + torso * 0.52, 0), [tw * 0.82 * k, torso * 1.02 * k, td * 0.95 * k], top, {m: o.topMat || 'cloth'});
  else if (o.chest === 'box') m.add('body', 'B', P(0, hipY + torso * 0.52, 0), [tw * 1.0 * k, torso * 1.0 * k, td * 1.0 * k], top, {m: o.topMat || 'metal'});
  else m.add('body', 'S', P(0, hipY + torso * 0.55, 0), [tw * k, torso * 1.18 * k, td * k], top, {m: o.topMat || 'cloth'});
  if (o.belt) {
    m.add('body', 'C16', P(0, hipY + 0.05, 0), [tw * 1.0 * k, 0.045 * k, td * 1.03 * k], o.belt);
    m.add('body', 'B', P(0, hipY + 0.05, td * 0.5), [0.05 * k, 0.04 * k, 0.02 * k], o.buckle || '#e8c25a', {m: 'metal'});
  }
  // neck + head
  m.add('head', 'C10', P(0, shY + 0.02, 0), [0.08 * bulk * k, 0.06 * k, 0.08 * bulk * k], skin, {m: 'skin'});
  m.add('head', 'S', P(0, headC, 0), [R * 2 * (o.hw || 1) * k, R * 2 * (o.hh || 1) * k, R * 2 * (o.hd || 1) * k], skin, {m: 'skin'});
  // arms
  m.sym(s => {
    const b = s > 0 ? 'armL' : 'armR';
    const sh = P(s * shX, shY - 0.015, 0), hd = P(s * shX, shY - armLen + 0.03, 0);
    m.seg(b, sh, hd, ar * k, sleeve, {t: 0.85});
    m.add(b, 'S', sh, [ar * 2.5 * k, ar * 2.5 * k, ar * 2.5 * k], sleeve);
    m.add(b, 'S', P(s * shX, shY - armLen, 0), [ar * 2.35 * k, ar * 2.35 * k, ar * 2.35 * k], glove, {m: o.glove ? 'cloth' : 'skin'});
  });
  const r = {k, P, hipY, shY, headC, R, tw, td, shX, hipX, ar, lw, armLen, skin, top, bot, bulk,
    handL: P(shX, shY - armLen, 0), handR: P(-shX, shY - armLen, 0),
    top_: P(0, headC + R * (o.hh || 1), 0)};
  r.frame = (side, tilt) => M4.chain(M4.T.apply(null, side === 'L' ? r.handL : r.handR), M4.RX(tilt != null ? tilt : -0.55), M4.S(k, k, k));
  return r;
}

// ---------------------------------------------------------------- faces
// o: eyes ('dot'|'big'|'glow'|'slit'|'none'), eyeC, brow, nose, mouth, beard, ears, cheeks
function face(m, r, o) {
  o = o || {};
  const {P, headC, R} = r, k = r.k;
  const zf = R * (r.hd || 1) * 0.9;
  const ey = headC + R * (o.eyeY != null ? o.eyeY : 0.12), ex = R * (o.eyeX || 0.36);
  const eyes = o.eyes || 'dot';
  if (eyes === 'big') {
    m.sym(s => {
      m.add('head', 'S', P(s * ex, ey, zf * 0.92), [R * 0.46 * k, R * 0.52 * k, R * 0.3 * k], '#ffffff', {m: 'gloss', nl: true});
      m.add('head', 'S', P(s * ex * 1.02, ey - R * 0.02, zf * 1.02), [R * 0.22 * k, R * 0.26 * k, R * 0.12 * k], o.eyeC || '#1b1420', {m: 'gloss', nl: true});
    });
  } else if (eyes === 'glow') {
    m.sym(s => m.add('head', 'S', P(s * ex, ey, zf * 0.95), [R * 0.3 * k, R * 0.2 * k, R * 0.16 * k], o.eyeC || '#7cf6ff', {m: 'glow', nl: true}));
  } else if (eyes === 'slit') {
    m.add('head', 'B', P(0, ey, zf * 0.98), [R * 1.1 * k, R * 0.12 * k, R * 0.1 * k], o.eyeC || '#ffd84a', {m: 'glow', nl: true});
  } else if (eyes === 'frog') {
    m.sym(s => {
      m.add('head', 'S', P(s * R * 0.52, headC + R * 0.62, R * 0.38), [R * 0.62 * k, R * 0.62 * k, R * 0.58 * k], o.lid || r.skin, {m: 'skin'});
      m.add('head', 'S', P(s * R * 0.56, headC + R * 0.68, R * 0.62), [R * 0.4 * k, R * 0.42 * k, R * 0.2 * k], '#fffbe8', {m: 'gloss', nl: true});
      m.add('head', 'S', P(s * R * 0.58, headC + R * 0.68, R * 0.72), [R * 0.12 * k, R * 0.3 * k, R * 0.06 * k], '#141018', {m: 'gloss', nl: true});
    });
  } else if (eyes !== 'none') {
    m.sym(s => {
      if (o.white !== false) m.add('head', 'S', P(s * ex, ey, zf * 0.93), [R * 0.3 * k, R * 0.34 * k, R * 0.16 * k], '#ffffff', {m: 'gloss', nl: true});
      m.add('head', 'S', P(s * ex, ey - R * 0.02, zf * 1.0), [R * 0.17 * k, R * 0.21 * k, R * 0.1 * k], o.eyeC || '#1d1626', {m: 'gloss', nl: true});
    });
  }
  if (o.brow) m.sym(s => m.add('head', 'B', P(s * ex, ey + R * 0.27, zf * 0.92), [R * 0.42 * k, R * 0.1 * k, R * 0.12 * k], o.brow, {r: [0, 0, s * (o.browTilt != null ? o.browTilt : 0.32)], nl: true}));
  if (o.nose) m.add('head', 'S', P(0, headC - R * 0.08, zf * 1.02), [R * (o.noseW || 0.3) * k, R * (o.noseH || 0.28) * k, R * (o.noseD || 0.34) * k], o.nose, {m: 'skin'});
  if (o.mouth) m.add('head', 'S', P(0, headC - R * 0.42, zf * 0.86), [R * (o.mouthW || 0.5) * k, R * 0.13 * k, R * 0.12 * k], o.mouth, {nl: true});
  if (o.tusks) m.sym(s => m.seg('head', P(s * R * 0.3, headC - R * 0.5, zf * 0.8), P(s * R * 0.38, headC - R * 0.12, zf * 0.98), R * 0.09 * k, o.tusks, {t: 0.2, m: 'gloss'}));
  if (o.beard) {
    const bl = o.beardL || 0.7;
    m.add('head', 'S', P(0, headC - R * (0.45 + bl * 0.25), zf * 0.6), [R * 1.35 * k, R * (0.7 + bl * 0.6) * k, R * 0.9 * k], o.beard, {m: 'cloth'});
  }
  if (o.stache) m.sym(s => m.add('head', 'S', P(s * R * 0.22, headC - R * 0.25, zf * 0.98), [R * 0.48 * k, R * 0.16 * k, R * 0.2 * k], o.stache, {r: [0, 0, s * -0.35], nl: true}));
  if (o.ears === 'elf') m.sym(s => m.seg('head', P(s * R * 0.85, headC, 0), P(s * R * 1.65, headC + R * 0.45, -R * 0.15), R * 0.2 * k, o.earC || r.skin, {t: 0.1, sz: 0.5, m: 'skin'}));
  if (o.ears === 'round') m.sym(s => m.add('head', 'S', P(s * R * 0.95, headC, 0), [R * 0.26 * k, R * 0.4 * k, R * 0.3 * k], o.earC || r.skin, {m: 'skin'}));
  if (o.ears === 'long') m.sym(s => m.seg('head', P(s * R * 0.8, headC + R * 0.1, 0), P(s * R * 2.2, headC + R * 0.2, -R * 0.1), R * 0.28 * k, o.earC || r.skin, {t: 0.15, sz: 0.4, m: 'skin'}));
  if (o.cheeks) m.sym(s => m.add('head', 'S', P(s * R * 0.55, headC - R * 0.12, zf * 0.78), [R * 0.3 * k, R * 0.18 * k, R * 0.1 * k], o.cheeks, {nl: true}));
}

// ---------------------------------------------------------------- headgear & hair
const HAT = {
  hair(m, r, c, style) {
    const {P, headC, R} = r, k = r.k;
    if (style === 'mohawk') { for (let i = 0; i < 5; i++) m.add('head', 'K6', P(0, headC + R * 0.95, R * (0.6 - i * 0.32)), [R * 0.3 * k, R * 0.65 * k, R * 0.35 * k], c, {r: [-0.3 + i * 0.25, 0, 0]}); return; }
    m.add('head', 'S', P(0, headC + R * 0.22, -R * 0.3), [R * 2.12 * k, R * 1.85 * k, R * 1.9 * k], c, {m: 'cloth'});
    if (style === 'ponytail') { m.seg('head', P(0, headC + R * 0.5, -R * 0.9), P(0, headC - R * 1.6, -R * 1.5), R * 0.35 * k, c, {t: 0.4, m: 'cloth'}); m.add('head', 'R0.25', P(0, headC + R * 0.3, -R * 0.98), [R * 0.6 * k, R * 0.6 * k, R * 0.6 * k], r.tie || 'T', {r: [1.2, 0, 0]}); }
    if (style === 'braids') m.sym(s => { m.seg('head', P(s * R * 0.8, headC - R * 0.1, -R * 0.3), P(s * R * 0.95, headC - R * 2.0, -R * 0.15), R * 0.24 * k, c, {t: 0.6, m: 'cloth'}); m.add('head', 'S', P(s * R * 0.95, headC - R * 2.05, -R * 0.15), [R * 0.32 * k, R * 0.32 * k, R * 0.32 * k], 'T'); });
    if (style === 'bun') m.add('head', 'S', P(0, headC + R * 0.95, -R * 0.55), [R * 0.85 * k, R * 0.8 * k, R * 0.85 * k], c, {m: 'cloth'});
    if (style === 'long') m.add('head', 'S', P(0, headC - R * 0.6, -R * 0.55), [R * 2.0 * k, R * 2.0 * k, R * 1.0 * k], c, {m: 'cloth'});
    if (style === 'spiky') for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; m.seg('head', P(Math.cos(a) * R * 0.5, headC + R * 0.6, Math.sin(a) * R * 0.5 - R * 0.2), P(Math.cos(a) * R * 1.25, headC + R * 1.15, Math.sin(a) * R * 1.1 - R * 0.3), R * 0.28 * k, c, {t: 0.05}); }
    if (style === 'fringe') m.add('head', 'S', P(0, headC + R * 0.6, R * 0.55), [R * 1.7 * k, R * 0.6 * k, R * 0.8 * k], c, {r: [0.4, 0, 0], m: 'cloth'});
  },
  antler(m, r, c, horn) {                                   // dome helm + branching antlers
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'H', P(0, headC + R * 0.05, 0), [R * 2.25 * k, R * 2.3 * k, R * 2.25 * k], c, {m: 'metal'});
    m.add('head', 'R0.18', P(0, headC + R * 0.08, 0), [R * 2.25 * k, R * 2.0 * k, R * 2.25 * k], '#c9a24a', {m: 'metal'});
    m.add('head', 'B', P(0, headC + R * 0.2, R * 1.0), [R * 0.22 * k, R * 0.8 * k, R * 0.25 * k], '#c9a24a', {m: 'metal'});
    m.sym(s => {
      const b = P(s * R * 0.8, headC + R * 0.85, 0), t = P(s * R * 1.9, headC + R * 2.0, -R * 0.2);
      m.seg('head', b, t, R * 0.16 * k, horn, {t: 0.5, m: 'gloss'});
      m.seg('head', P(s * R * 1.35, headC + R * 1.45, -R * 0.1), P(s * R * 1.25, headC + R * 2.2, R * 0.2), R * 0.1 * k, horn, {t: 0.3, m: 'gloss'});
      m.seg('head', P(s * R * 1.65, headC + R * 1.75, -R * 0.15), P(s * R * 2.4, headC + R * 2.05, -R * 0.1), R * 0.09 * k, horn, {t: 0.3, m: 'gloss'});
    });
  },
  hood(m, r, c, tip) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'S', P(0, headC + R * 0.12, -R * 0.15), [R * 2.35 * k, R * 2.3 * k, R * 2.35 * k], c, {m: 'cloth'});
    m.add('head', 'S', P(0, headC - R * 0.02, R * 0.05), [R * 1.75 * k, R * 1.8 * k, R * 1.95 * k], '#1b1520', {nl: true});
    if (tip !== false) m.seg('head', P(0, headC + R * 0.6, -R * 0.8), P(0, headC + R * 0.2, -R * 2.1), R * 0.55 * k, c, {t: 0.05, m: 'cloth'});
  },
  pointy(m, r, c, band, h) {                                // brimmed pointed hat
    const {P, headC, R} = r, k = r.k; h = h || 2.6;
    m.add('head', 'C20', P(0, headC + R * 0.62, 0), [R * 3.4 * k, R * 0.14 * k, R * 3.4 * k], c, {m: 'cloth'});
    m.seg('head', P(0, headC + R * 0.62, 0), P(R * 0.05, headC + R * (0.62 + h * 0.55), -R * 0.2), R * 0.95 * k, c, {t: 0.55, segs: 16, m: 'cloth'});
    m.seg('head', P(R * 0.05, headC + R * (0.62 + h * 0.55), -R * 0.2), P(R * 0.35, headC + R * (0.62 + h), -R * 0.8), R * 0.52 * k, c, {t: 0.05, segs: 12, m: 'cloth'});
    if (band) m.add('head', 'C20', P(0, headC + R * 0.78, 0), [R * 1.95 * k, R * 0.26 * k, R * 1.95 * k], band, {m: 'gloss'});
  },
  wrap(m, r, c, tail) {                                     // desert wrap / scarf mask
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'S', P(0, headC + R * 0.35, -R * 0.05), [R * 2.25 * k, R * 1.5 * k, R * 2.2 * k], c, {m: 'cloth'});
    m.add('head', 'R0.3', P(0, headC + R * 0.32, 0), [R * 2.1 * k, R * 1.6 * k, R * 2.1 * k], c, {m: 'cloth'});
    m.add('head', 'S', P(0, headC - R * 0.45, R * 0.2), [R * 1.95 * k, R * 0.95 * k, R * 1.85 * k], tail || c, {m: 'cloth'});
    m.seg('head', P(0, headC + R * 0.3, -R * 0.9), P(R * 0.35, headC - R * 1.2, -R * 1.5), R * 0.25 * k, tail || c, {t: 0.5, sz: 0.4, m: 'cloth'});
  },
  goggles(m, r, lens, strap) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'R0.14', P(0, headC + R * 0.45, 0), [R * 2.12 * k, R * 1.4 * k, R * 2.12 * k], strap || '#4a3020');
    m.sym(s => {
      m.add('head', 'C12', P(s * R * 0.4, headC + R * 0.5, R * 0.86), [R * 0.62 * k, R * 0.3 * k, R * 0.62 * k], '#b88a3a', {r: [Math.PI / 2 - 0.2, 0, 0], m: 'metal'});
      m.add('head', 'S', P(s * R * 0.4, headC + R * 0.52, R * 1.0), [R * 0.48 * k, R * 0.48 * k, R * 0.2 * k], lens || '#7fe3ff', {m: 'gloss', nl: true});
    });
  },
  crown(m, r, c, gem, h) {
    const {P, headC, R} = r, k = r.k; h = h || 1;
    const y = headC + R * 0.78;
    m.add('head', 'C16o', P(0, y, 0), [R * 1.5 * k, R * 0.45 * h * k, R * 1.5 * k], c, {m: 'metal', ts: true});
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; m.add('head', 'K6', P(Math.cos(a) * R * 0.72, y + R * 0.38 * h, Math.sin(a) * R * 0.72), [R * 0.3 * k, R * 0.45 * h * k, R * 0.3 * k], c, {m: 'metal'}); }
    if (gem) m.add('head', 'S', P(0, y, R * 0.76), [R * 0.3 * k, R * 0.3 * k, R * 0.18 * k], gem, {m: 'gloss'});
  },
  circlet(m, r, c, gem) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'R0.1', P(0, headC + R * 0.42, 0), [R * 2.1 * k, R * 1.4 * k, R * 2.1 * k], c, {m: 'metal', r: [-0.18, 0, 0]});
    m.add('head', 'S', P(0, headC + R * 0.6, R * 0.96), [R * 0.32 * k, R * 0.4 * k, R * 0.2 * k], gem || 'T', {m: 'gloss'});
  },
  straw(m, r, c) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'K24', P(0, headC + R * 0.95, 0), [R * 4.0 * k, R * 0.9 * k, R * 4.0 * k], c, {m: 'cloth'});
    m.add('head', 'C20', P(0, headC + R * 0.55, 0), [R * 4.0 * k, R * 0.06 * k, R * 4.0 * k], c, {m: 'cloth'});
  },
  greathelm(m, r, c, visor, plume) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'C16t0.92', P(0, headC + R * 0.1, 0), [R * 2.25 * k, R * 2.3 * k, R * 2.25 * k], c, {m: 'metal'});
    m.add('head', 'H', P(0, headC + R * 1.25, 0), [R * 2.07 * k, R * 0.9 * k, R * 2.07 * k], c, {m: 'metal'});
    m.add('head', 'B', P(0, headC + R * 0.25, R * 1.08), [R * 1.5 * k, R * 0.16 * k, R * 0.1 * k], visor || '#140f18', {m: visor ? 'glow' : 'matte', nl: true});
    m.add('head', 'B', P(0, headC - R * 0.2, R * 1.06), [R * 0.14 * k, R * 0.7 * k, R * 0.08 * k], '#140f18', {nl: true});
    if (plume) m.seg('head', P(0, headC + R * 1.6, R * 0.1), P(0, headC + R * 2.1, -R * 1.6), R * 0.38 * k, plume, {t: 0.25, sx: 0.6, m: 'cloth'});
  },
  horned(m, r, c, horn) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'H', P(0, headC + R * 0.1, 0), [R * 2.2 * k, R * 2.2 * k, R * 2.2 * k], c, {m: 'metal'});
    m.sym(s => {
      m.seg('head', P(s * R * 0.9, headC + R * 0.5, 0), P(s * R * 1.6, headC + R * 1.0, R * 0.2), R * 0.28 * k, horn || '#efe3c4', {t: 0.6, m: 'gloss'});
      m.seg('head', P(s * R * 1.6, headC + R * 1.0, R * 0.2), P(s * R * 1.65, headC + R * 1.9, R * 0.5), R * 0.17 * k, horn || '#efe3c4', {t: 0.1, m: 'gloss'});
    });
  },
  cap(m, r, c, feather) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'H', P(0, headC + R * 0.3, -R * 0.05), [R * 2.15 * k, R * 1.6 * k, R * 2.15 * k], c, {m: 'cloth'});
    m.add('head', 'S', P(0, headC + R * 0.38, R * 0.95), [R * 1.4 * k, R * 0.12 * k, R * 0.9 * k], c, {m: 'cloth'});
    if (feather) m.seg('head', P(R * 0.75, headC + R * 0.85, -R * 0.2), P(R * 1.25, headC + R * 2.2, -R * 1.0), R * 0.22 * k, feather, {t: 0.15, sz: 0.4, m: 'cloth'});
  },
  hardhat(m, r, c, lamp) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'H', P(0, headC + R * 0.32, 0), [R * 2.25 * k, R * 1.7 * k, R * 2.3 * k], c, {m: 'gloss'});
    m.add('head', 'C20', P(0, headC + R * 0.33, R * 0.15), [R * 2.75 * k, R * 0.1 * k, R * 2.85 * k], c, {m: 'gloss'});
    if (lamp) { m.add('head', 'C12', P(0, headC + R * 0.85, R * 0.92), [R * 0.5 * k, R * 0.45 * k, R * 0.5 * k], '#5a5a62', {r: [Math.PI / 2, 0, 0], m: 'metal'}); m.add('head', 'S', P(0, headC + R * 0.85, R * 1.16), [R * 0.4 * k, R * 0.4 * k, R * 0.12 * k], lamp, {m: 'glow', nl: true}); }
  },
  fur(m, r, c, tail) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'C16t0.9', P(0, headC + R * 0.75, 0), [R * 2.25 * k, R * 1.0 * k, R * 2.25 * k], c, {m: 'cloth'});
    m.add('head', 'S', P(0, headC + R * 1.2, 0), [R * 2.1 * k, R * 0.6 * k, R * 2.1 * k], c, {m: 'cloth'});
    if (tail) m.seg('head', P(0, headC + R * 0.9, -R * 0.9), P(R * 0.4, headC - R * 0.6, -R * 1.5), R * 0.32 * k, tail, {t: 0.3, m: 'cloth'});
  },
  tophat(m, r, c, band) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'C20', P(0, headC + R * 0.7, 0), [R * 2.8 * k, R * 0.12 * k, R * 2.8 * k], c, {m: 'cloth'});
    m.add('head', 'C20t1.1', P(0, headC + R * 1.45, 0), [R * 1.7 * k, R * 1.45 * k, R * 1.7 * k], c, {m: 'cloth'});
    if (band) m.add('head', 'C20', P(0, headC + R * 0.92, 0), [R * 1.75 * k, R * 0.25 * k, R * 1.75 * k], band, {m: 'gloss'});
  },
  candle(m, r, wax, flame) {                                 // a wax candle melted onto the skull
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'C12', P(R * 0.2, headC + R * 1.2, -R * 0.1), [R * 0.55 * k, R * 0.95 * k, R * 0.55 * k], wax || '#f3e6c4', {m: 'skin'});
    m.add('head', 'S', P(R * 0.2, headC + R * 0.85, -R * 0.1), [R * 0.95 * k, R * 0.35 * k, R * 0.95 * k], wax || '#f3e6c4', {m: 'skin'});
    m.add('head', 'S', P(R * 0.2, headC + R * 1.95, -R * 0.1), [R * 0.36 * k, R * 0.6 * k, R * 0.36 * k], flame || 'T', {m: 'glow', nl: true});
  },
  leaf(m, r, c, vein) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'S', P(0, headC + R * 0.85, -R * 0.1), [R * 2.7 * k, R * 0.35 * k, R * 2.4 * k], c, {r: [-0.25, 0, 0.15], m: 'cloth'});
    m.seg('head', P(0, headC + R * 0.95, -R * 0.2), P(R * 0.2, headC + R * 1.7, -R * 0.6), R * 0.09 * k, vein || '#5b3b22', {t: 0.6});
  },
  plume(m, r, c) {
    const {P, headC, R} = r, k = r.k;
    m.seg('head', P(0, headC + R * 1.0, 0), P(0, headC + R * 1.9, -R * 1.2), R * 0.4 * k, c, {t: 0.2, sx: 0.55, m: 'cloth'});
  },
  bandana(m, r, c) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'H', P(0, headC + R * 0.2, -R * 0.05), [R * 2.12 * k, R * 1.75 * k, R * 2.12 * k], c, {m: 'cloth'});
    m.sym(s => m.seg('head', P(s * R * 0.15, headC + R * 0.3, -R * 1.0), P(s * R * 0.55, headC - R * 0.4, -R * 1.45), R * 0.18 * k, c, {t: 0.5, sz: 0.4, m: 'cloth'}));
  },
  halo(m, r, c) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'R0.12', P(0, headC + R * 1.5, -R * 0.1), [R * 1.9 * k, R * 1.9 * k, R * 1.9 * k], c || '#ffe27a', {m: 'glow', nl: true, r: [0.25, 0, 0]});
  },
  veil(m, r, c) {
    const {P, headC, R} = r, k = r.k;
    m.add('head', 'S', P(0, headC + R * 0.15, -R * 0.1), [R * 2.3 * k, R * 2.25 * k, R * 2.3 * k], c, {m: 'cloth'});
    m.add('head', 'C16t1.6o', P(0, headC - R * 1.2, -R * 0.25), [R * 1.9 * k, R * 2.2 * k, R * 1.8 * k], c, {m: 'cloth', ts: true});
  }
};

// ---------------------------------------------------------------- weapons (authored in a hand frame; −Y runs down the weapon)
const WPN = {
  sword(m, r, side, o) {
    o = o || {}; const f = r.frame(side || 'R'), L = o.len || 0.42, w = o.w || 0.035;
    m.add(side === 'L' ? 'armL' : 'armR', 'C10', [0, 0.03, 0], [0.035, 0.11, 0.035], o.grip || '#4a2f1e', {f});
    m.add(side === 'L' ? 'armL' : 'armR', 'B', [0, -0.03, 0], [0.16, 0.025, 0.04], o.guard || '#d4ad4c', {f, m: 'metal'});
    m.add(side === 'L' ? 'armL' : 'armR', 'B', [0, -0.04 - L / 2, 0], [w * 2, L, 0.016], o.blade || '#dfe6ee', {f, m: 'metal'});
    m.add(side === 'L' ? 'armL' : 'armR', 'K4', [0, -0.04 - L - 0.03, 0], [w * 2.6, 0.07, 0.022], o.blade || '#dfe6ee', {f, m: 'metal', r: [Math.PI, Math.PI / 4, 0]});
  },
  mace(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.seg(b, [0, 0.05, 0], [0, -0.3, 0], 0.022, o.shaft || '#5a3b24', {f});
    m.add(b, 'S', [0, -0.34, 0], [0.12, 0.12, 0.12], o.head || '#9aa5b3', {f, m: 'metal'});
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; m.add(b, 'B', [Math.cos(a) * 0.06, -0.34, Math.sin(a) * 0.06], [0.035, 0.1, 0.035], o.flange || o.head || '#9aa5b3', {f, m: 'metal', r: [0, -a, 0]}); }
  },
  axe(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R'), L = o.len || 0.36;
    m.seg(b, [0, 0.06, 0], [0, -L, 0], 0.022, o.shaft || '#6a4528', {f});
    m.add(b, 'C16t1', [0, -L + 0.06, 0.07], [0.2, 0.02, 0.18], o.head || '#cfd6de', {f, m: 'metal', r: [0, 0, Math.PI / 2]});
    if (o.double) m.add(b, 'C16t1', [0, -L + 0.06, -0.07], [0.2, 0.02, 0.18], o.head || '#cfd6de', {f, m: 'metal', r: [0, 0, Math.PI / 2]});
  },
  hammer(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R'), L = o.len || 0.42, s = o.s || 1;
    m.seg(b, [0, 0.08, 0], [0, -L, 0], 0.025 * s, o.shaft || '#5a3b24', {f});
    m.add(b, 'B', [0, -L - 0.02 * s, 0], [0.26 * s, 0.16 * s, 0.16 * s], o.head || '#8f98a6', {f, m: 'metal'});
    m.add(b, 'B', [0, -L - 0.02 * s, 0], [0.28 * s, 0.05 * s, 0.18 * s], o.band || '#d0a74a', {f, m: 'metal'});
  },
  spear(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', o.tilt != null ? o.tilt : -1.25), L = o.len || 0.75;
    m.seg(b, [0, 0.25, 0], [0, -L, 0], o.rad || 0.017, o.shaft || '#8a6a3e', {f});
    m.add(b, 'K6', [0, -L - 0.07, 0], [0.065, 0.16, 0.03], o.tip || '#dfe6ee', {f, m: 'metal', r: [Math.PI, 0, 0]});
    if (o.flag) m.add(b, 'B', [0, -L + 0.12, 0.06], [0.01, 0.12, 0.1], o.flag, {f, m: 'cloth'});
  },
  glaive(m, r, side, o) {                                  // twin-bladed polearm held mid-shaft
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', -1.4);
    m.seg(b, [0, 0.36, 0], [0, -0.36, 0], 0.02, o.shaft || '#7a5636', {f});
    for (const s of [1, -1]) {
      m.add(b, 'S', [0, s * 0.42, 0.05], [0.025, 0.24, 0.14], o.blade || '#d9e1ea', {f, m: 'metal', r: [s * 0.3, 0, 0]});
      m.add(b, 'C10', [0, s * 0.34, 0], [0.05, 0.04, 0.05], o.band || 'T', {f});
    }
  },
  dagger(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.add(b, 'C8', [0, 0.02, 0], [0.03, 0.07, 0.03], o.grip || '#4a2f1e', {f});
    m.add(b, 'K4', [0, -0.11, 0], [0.05, 0.2, 0.014], o.blade || '#e3e8ee', {f, m: 'metal', r: [Math.PI, Math.PI / 4, 0]});
  },
  scimitar(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.add(b, 'C8', [0, 0.02, 0], [0.032, 0.09, 0.032], o.grip || '#3a2416', {f});
    m.add(b, 'B', [0, -0.025, 0], [0.12, 0.02, 0.03], o.guard || '#d4ad4c', {f, m: 'metal'});
    m.add(b, 'R0.07a0.28', [0, -0.05, 0.16], [0.42, 0.4, 0.42], o.blade || '#e2e8ee', {f, m: 'metal', r: [Math.PI / 2, -Math.PI / 2 + 0.05, 0], ts: true});
  },
  cleaver(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R'), s = o.s || 1;
    m.seg(b, [0, 0.05, 0], [0, -0.1, 0], 0.024 * s, o.grip || '#2d2a30', {f});
    m.add(b, 'B', [0, -0.1 - 0.17 * s, 0.035 * s], [0.03 * s, 0.34 * s, 0.17 * s], o.blade || '#c9d0d8', {f, m: 'metal'});
    m.add(b, 'B', [0, -0.1 - 0.17 * s, 0.12 * s], [0.032 * s, 0.34 * s, 0.02 * s], o.edge || '#f3f6f8', {f, m: 'metal'});
  },
  club(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R'), s = o.s || 1;
    m.seg(b, [0, 0.06, 0], [0, -0.42 * s, 0], 0.03 * s, o.c || '#7a5230', {t: 2.4, f});
    if (o.spikes) for (let i = 0; i < 5; i++) { const a = i * 1.3; m.add(b, 'K6', [Math.cos(a) * 0.06 * s, -0.33 * s + i * 0.025, Math.sin(a) * 0.06 * s], [0.03 * s, 0.06 * s, 0.03 * s], o.spikes, {f, r: [Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4], m: 'metal'}); }
  },
  pick(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.seg(b, [0, 0.06, 0], [0, -0.38, 0], 0.02, o.shaft || '#7a5636', {f});
    m.add(b, 'R0.08a0.35', [0, -0.38, 0], [0.38, 0.38, 0.38], o.head || '#a9b1bc', {f, m: 'metal', r: [0, 0, Math.PI / 2], ts: true});
  },
  drill(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', -1.4);
    m.add(b, 'C12', [0, -0.03, 0], [0.12, 0.12, 0.12], o.body || '#d08a2a', {f, m: 'gloss'});
    m.add(b, 'K10', [0, -0.18, 0], [0.11, 0.22, 0.11], o.bit || '#c3ccd6', {f, m: 'metal', r: [Math.PI, 0, 0]});
    for (let i = 0; i < 3; i++) m.add(b, 'R0.2', [0, -0.12 - i * 0.05, 0], [0.1 - i * 0.025, 0.1, 0.1 - i * 0.025], '#8a939e', {f, m: 'metal'});
  },
  wrench(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.seg(b, [0, 0.05, 0], [0, -0.34, 0], 0.025, o.c || '#9aa3ad', {f, m: 'metal'});
    m.add(b, 'R0.3a0.75', [0, -0.4, 0], [0.13, 0.13, 0.13], o.c || '#9aa3ad', {f, m: 'metal', r: [0, 0, Math.PI / 2], ts: true});
  },
  sickle(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.seg(b, [0, 0.05, 0], [0, -0.2, 0], 0.022, o.grip || '#3b2a20', {f});
    m.add(b, 'R0.06a0.55', [0, -0.3, 0.06], [0.3, 0.3, 0.3], o.blade || '#c9d2dc', {f, m: 'metal', r: [Math.PI / 2, 0, 0], ts: true});
  },
  lance(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', o.tilt != null ? o.tilt : -1.45), L = o.len || 0.95;
    m.add(b, 'C14t0.08', [0, -L * 0.55, 0], [0.12, L, 0.12], o.c || '#e6e0d0', {f, m: 'gloss'});
    m.add(b, 'C14t0.1', [0, -0.05, 0], [0.2, 0.16, 0.2], o.guard || 'T', {f, r: [Math.PI, 0, 0], m: 'metal'});
    for (let i = 1; i < 4; i++) m.add(b, 'R0.12', [0, -L * 0.18 * i - 0.05, 0], [0.12 * (1 - i * 0.22), 0.1, 0.12 * (1 - i * 0.22)], o.stripe || 'T', {f});
  },
  rapier(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.add(b, 'H', [0, -0.03, 0], [0.12, 0.06, 0.12], o.guard || '#d6b25a', {f, m: 'metal', r: [Math.PI, 0, 0]});
    m.seg(b, [0, -0.04, 0], [0, -0.5, 0], 0.008, o.blade || '#e8eef4', {f, m: 'metal', t: 0.3});
  },
  katana(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.seg(b, [0, 0.1, 0], [0, -0.04, 0], 0.02, o.grip || '#20202a', {f});
    m.add(b, 'C12', [0, -0.045, 0], [0.08, 0.015, 0.08], o.guard || '#c8a04a', {f, m: 'metal'});
    m.add(b, 'R0.03a0.14', [-1.6, -0.06, 0], [3.4, 3.4, 3.4], o.blade || '#eef2f6', {f, m: 'metal', r: [0, 0, Math.PI / 2], ts: true, nl: true});
  },
  staff(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = M4.chain(M4.T.apply(null, side === 'L' ? r.handL : r.handR), M4.S(r.k, r.k, r.k)), L = o.len || 0.85;
    m.seg(b, [0, -0.28, 0], [0, L - 0.28, 0], 0.02, o.shaft || '#6b4a2b', {f, t: 0.8});
    if (o.orb) m.add(b, 'S', [0, L - 0.2, 0], [0.11, 0.11, 0.11], o.orb, {f, m: 'glow', nl: true});
    if (o.ring) m.add(b, 'R0.1', [0, L - 0.2, 0], [0.2, 0.2, 0.2], o.ring, {f, m: 'metal', r: [Math.PI / 2, 0, 0]});
    if (o.star) { m.add(b, 'B', [0, L - 0.18, 0], [0.16, 0.16, 0.03], o.star, {f, m: 'glow', r: [0, 0, Math.PI / 4]}); m.add(b, 'B', [0, L - 0.18, 0], [0.16, 0.16, 0.03], o.star, {f, m: 'glow'}); }
    if (o.crook) m.add(b, 'R0.12a0.6', [0.05, L - 0.24, 0], [0.16, 0.16, 0.16], o.shaft || '#6b4a2b', {f, r: [Math.PI / 2, 0, 0], ts: true});
    if (o.lantern) { m.add(b, 'C8', [0.09, L - 0.38, 0], [0.09, 0.12, 0.09], '#3b3440', {f, m: 'metal'}); m.add(b, 'S', [0.09, L - 0.38, 0], [0.07, 0.08, 0.07], o.lantern, {f, m: 'glow', nl: true}); m.seg(b, [0, L - 0.3, 0], [0.09, L - 0.3, 0], 0.008, '#3b3440', {f}); }
  },
  wand(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', -1.0);
    m.seg(b, [0, 0.03, 0], [0, -0.22, 0], 0.012, o.c || '#3b2a20', {f, t: 0.6});
    m.add(b, 'S', [0, -0.24, 0], [0.05, 0.05, 0.05], o.tip || 'TL', {f, m: 'glow', nl: true});
  },
  torch(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = M4.chain(M4.T.apply(null, side === 'L' ? r.handL : r.handR), M4.S(r.k, r.k, r.k));
    m.seg(b, [0, -0.08, 0], [0, 0.22, 0], 0.02, '#5a3b24', {f});
    m.add(b, 'S', [0, 0.28, 0], [0.09, 0.15, 0.09], o.flame || '#ffb43a', {f, m: 'glow', nl: true});
  },
  bomb(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', 0);
    m.add(b, 'S', [0, -0.05, 0.04], [o.s || 0.16, o.s || 0.16, o.s || 0.16], o.c || '#25252d', {f, m: 'gloss'});
    m.add(b, 'C8', [0, 0.03 + (o.s || 0.16) * 0.3, 0.04], [0.04, 0.04, 0.04], '#8a7a5a', {f});
    m.add(b, 'S', [0, 0.07 + (o.s || 0.16) * 0.3, 0.04], [0.05, 0.05, 0.05], o.spark || '#ffd24a', {f, m: 'glow', nl: true});
  },
  shield(m, r, side, o) {                                   // disc / kite / tower shield in front of the off-hand
    o = o || {}; const b = side === 'R' ? 'armR' : 'armL', s = o.s || 1;
    const hp = side === 'R' ? r.handR : r.handL, k = r.k;
    const f = M4.chain(M4.T(hp[0] + (side === 'R' ? -0.01 : 0.01) * k, hp[1] + 0.09 * k, hp[2] + 0.07 * k), M4.RY(side === 'R' ? -0.25 : 0.25), M4.S(k, k, k));
    const shape = o.shape || 'round';
    if (shape === 'round') {
      m.add(b, 'C20', [0, 0, 0], [0.3 * s, 0.045, 0.3 * s], o.c || '#7a5230', {f, r: [Math.PI / 2, 0, 0]});
      m.add(b, 'R0.1', [0, 0, 0.018], [0.3 * s, 0.3 * s, 0.3 * s], o.rim || '#c9a24a', {f, r: [Math.PI / 2, 0, 0], m: 'metal'});
      m.add(b, 'H', [0, 0, 0.022], [0.1 * s, 0.07 * s, 0.1 * s], o.boss || '#d8dde3', {f, r: [Math.PI / 2, 0, 0], m: 'metal'});
      if (o.emblem) m.add(b, 'C16', [0, 0, 0.026], [0.17 * s, 0.01, 0.17 * s], o.emblem, {f, r: [Math.PI / 2, 0, 0], nl: true});
    } else if (shape === 'leaf') {
      m.add(b, 'S', [0, -0.02, 0], [0.26 * s, 0.38 * s, 0.05], o.c || '#4d8a3a', {f, m: 'gloss'});
      m.add(b, 'B', [0, -0.02, 0.026], [0.02 * s, 0.34 * s, 0.01], o.rim || '#2f5a26', {f, nl: true});
      for (const y of [0.06, -0.02, -0.1]) m.sym(q => m.add(b, 'B', [q * 0.05 * s, y * s, 0.026], [0.09 * s, 0.014, 0.01], o.rim || '#2f5a26', {f, r: [0, 0, q * 0.6], nl: true}));
    } else if (shape === 'tower') {
      m.add(b, 'B', [0, -0.02, 0], [0.26 * s, 0.42 * s, 0.045], o.c || '#8f98a6', {f, m: 'metal'});
      m.add(b, 'B', [0, -0.02, 0.025], [0.2 * s, 0.36 * s, 0.01], o.emblem || 'T', {f, nl: true});
      m.add(b, 'B', [0, 0.04, 0.032], [0.2 * s, 0.035 * s, 0.01], o.rim || '#d8c06a', {f, nl: true, m: 'metal'});
    } else if (shape === 'kite') {
      m.add(b, 'C3t0.2', [0, -0.05, 0], [0.34 * s, 0.4 * s, 0.05], o.c || 'T', {f, r: [0, Math.PI / 6, Math.PI]});
    }
  },
  bow(m, r, side, o) {                                      // limbs run along the hand-frame Z axis (vertical when aiming)
    o = o || {}; const b = side === 'R' ? 'armR' : 'armL', f = r.frame(side || 'L', 0), s = o.s || 1;
    m.add(b, 'R0.05a0.5', [0, 0.02, 0], [0.5 * s, 0.5 * s, 0.5 * s], o.c || '#7a4a26', {f, r: [0, Math.PI, Math.PI / 2], ts: true});
    m.seg(b, [0, 0.02, 0.25 * s], [0, 0.02, -0.25 * s], 0.004, o.string || '#f0ead8', {f, nl: true});
    if (o.gem) m.add(b, 'S', [0, -0.25 * s * 0 - 0.005, 0], [0.05, 0.05, 0.05], o.gem, {f, m: 'glow', nl: true});
  },
  crossbow(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', 0);
    m.add(b, 'B', [0, -0.12, 0], [0.05, 0.32, 0.06], o.stock || '#6a4528', {f});
    m.add(b, 'R0.06a0.5', [0, -0.25, 0], [0.32, 0.32, 0.32], o.limb || '#4a4a55', {f, r: [Math.PI / 2, 0, 0], m: 'metal', ts: true});
  },
  rifle(m, r, side, o) {                                     // long gun along the weapon arm
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', 0), L = o.len || 0.55;
    m.add(b, 'B', [0, 0.08, 0.02], [0.05, 0.18, 0.08], o.stock || '#6a4528', {f});
    m.seg(b, [0, 0.02, 0], [0, -L, 0], o.bore || 0.022, o.barrel || '#b98a3a', {f, m: 'metal', t: o.flare ? 1.8 : 1});
    if (o.flare) m.add(b, 'R0.25', [0, -L, 0], [0.09, 0.09, 0.09], o.barrel || '#b98a3a', {f, m: 'metal'});
    if (o.scope) m.seg(b, [0.035, -0.05, 0], [0.035, -0.22, 0], 0.016, '#2c2c34', {f, m: 'metal'});
  },
  handcannon(m, r, side, o) {                                // shoulder cannon
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', 0), s = o.s || 1;
    m.seg(b, [0, 0.1 * s, 0], [0, -0.42 * s, 0], 0.07 * s, o.c || '#3c3f48', {f, m: 'metal', t: 1.15});
    m.add(b, 'R0.3', [0, -0.42 * s, 0], [0.17 * s, 0.17 * s, 0.17 * s], o.band || '#d0a74a', {f, m: 'metal'});
    m.add(b, 'R0.3', [0, 0.02, 0], [0.16 * s, 0.16 * s, 0.16 * s], o.band || '#d0a74a', {f, m: 'metal'});
  },
  blowpipe(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', 0);
    m.seg(b, [0, 0.14, 0], [0, -0.42, 0], 0.014, o.c || '#9ab35a', {f});
    for (let i = 0; i < 3; i++) m.add(b, 'R0.3', [0, -0.05 - i * 0.12, 0], [0.034, 0.034, 0.034], o.band || '#5b3b22', {f});
  },
  sling(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', -1.2);
    m.seg(b, [0, 0.02, 0], [0, -0.12, 0], 0.014, '#6b4a2b', {f});
    m.sym(s => m.seg(b, [0, -0.12, 0], [s * 0.05, -0.22, 0], 0.012, '#6b4a2b', {f}));
    m.add(b, 'S', [0, -0.26, 0.03], [0.05, 0.05, 0.05], '#9a9aa2', {f});
  },
  harpoon(m, r, side, o) {
    WPN.spear(m, r, side, Object.assign({len: 0.62, shaft: '#7a5a3a', tip: '#cfd6de'}, o || {}));
    const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R', -1.25);
    m.sym(s => m.add(b, 'K4', [s * 0.035, -0.62, 0], [0.025, 0.07, 0.02], '#cfd6de', {f, m: 'metal', r: [0, 0, s * 0.7]}));
    m.add(b, 'R0.1', [0, 0.1, 0.08], [0.14, 0.14, 0.14], '#d8c79a', {f, r: [Math.PI / 2, 0, 0]});
  },
  saw(m, r, side, o) {
    o = o || {}; const b = side === 'L' ? 'armL' : 'armR', f = r.frame(side || 'R');
    m.seg(b, [0, 0.05, 0], [0, -0.3, 0], 0.024, '#6a4528', {f});
    m.add(b, 'C20', [0, -0.34, 0], [0.24, 0.02, 0.24], o.c || '#c9d0d8', {f, m: 'metal', r: [0, 0, Math.PI / 2]});
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; m.add(b, 'K4', [0, -0.34 + Math.cos(a) * 0.125, Math.sin(a) * 0.125], [0.015, 0.04, 0.03], o.c || '#c9d0d8', {f, m: 'metal', r: [-a, 0, 0]}); }
  },
  book(m, r, side, o) {
    o = o || {}; const b = side === 'R' ? 'armR' : 'armL', f = r.frame(side || 'L', -0.9);
    m.add(b, 'B', [0, -0.03, 0.05], [0.04, 0.16, 0.13], o.c || '#5a2a6a', {f});
    m.add(b, 'B', [0.005, -0.03, 0.05], [0.032, 0.15, 0.124], '#f3ead2', {f, nl: true});
  },
  lantern(m, r, side, o) {
    o = o || {}; const b = side === 'R' ? 'armR' : 'armL', hp = side === 'R' ? r.handR : r.handL, k = r.k;
    const f = M4.chain(M4.T(hp[0], hp[1], hp[2]), M4.S(k, k, k));
    m.seg(b, [0, 0, 0], [0, -0.07, 0], 0.006, '#3b3440', {f});
    m.add(b, 'C8', [0, -0.13, 0], [0.1, 0.12, 0.1], '#3b3440', {f, m: 'metal'});
    m.add(b, 'S', [0, -0.13, 0], [0.08, 0.1, 0.08], o.c || '#9dff8a', {f, m: 'glow', nl: true});
  }
};

// ---------------------------------------------------------------- body extras
const EXTRA = {
  cape(m, r, c, len) {
    const {P, shY, tw} = r, k = r.k; len = len || 0.5;
    m.add('body', 'C16t1.5o', P(0, shY - len * 0.5, -r.td * 0.55), [tw * 1.15 * k, len * k, r.td * 0.7 * k], c, {m: 'cloth', ts: true, r: [0.12, 0, 0]});
    m.add('body', 'S', P(0, shY + 0.01, -r.td * 0.1), [tw * 1.15 * k, 0.07 * k, r.td * 1.2 * k], c, {m: 'cloth'});
  },
  quiver(m, r, c, fl) {
    const {P, shY, hipY, td} = r, k = r.k;
    m.seg('body', P(-0.06, hipY + 0.08, -td * 0.6), P(0.08, shY + 0.06, -td * 0.7), 0.04 * k, c || '#6b4a2b');
    for (let i = 0; i < 3; i++) m.seg('body', P(0.06 + i * 0.015, shY + 0.03, -td * 0.7), P(0.08 + i * 0.03, shY + 0.13, -td * 0.72), 0.012 * k, fl || 'TL', {t: 2});
  },
  pack(m, r, c, strap) {
    const {P, shY, hipY, td} = r, k = r.k;
    m.add('body', 'B', P(0, (shY + hipY) / 2 + 0.03, -td * 0.75), [r.tw * 0.8 * k, (shY - hipY) * 0.8 * k, td * 0.55 * k], c || '#7a5a36', {m: 'cloth'});
    if (strap) m.add('body', 'B', P(0, (shY + hipY) / 2 + 0.1, -td * 1.03), [r.tw * 0.6 * k, 0.03 * k, 0.02 * k], strap, {nl: true});
  },
  coil(m, r, c, glow) {                                       // backpack tesla coil
    const {P, shY, hipY, td} = r, k = r.k;
    m.add('body', 'C12', P(0, (shY + hipY) / 2, -td * 0.85), [0.14 * k, (shY - hipY) * 0.95 * k, 0.14 * k], c || '#4a4f5a', {m: 'metal'});
    for (let i = 0; i < 3; i++) m.add('body', 'R0.25', P(0, hipY + 0.08 + i * 0.08, -td * 0.85), [0.18 * k, 0.18 * k, 0.18 * k], '#c8873a', {m: 'metal'});
    m.add('body', 'S', P(0, shY + 0.1, -td * 0.85), [0.12 * k, 0.12 * k, 0.12 * k], glow || '#7cf0ff', {m: 'glow', nl: true});
  },
  pauldrons(m, r, c, trim) {
    const {P, shY, shX, ar} = r, k = r.k;
    m.sym(s => {
      m.add(s > 0 ? 'armL' : 'armR', 'H', P(s * shX, shY - 0.02, 0), [ar * 4.0 * k, ar * 2.6 * k, ar * 3.6 * k], c, {m: 'metal', r: [0, 0, s * -0.35]});
      if (trim) m.add(s > 0 ? 'armL' : 'armR', 'R0.15', P(s * shX, shY - 0.02, 0), [ar * 3.8 * k, ar * 3.0 * k, ar * 3.4 * k], trim, {m: 'metal', r: [0, 0, s * -0.35]});
    });
  },
  tabard(m, r, c, trim) {
    const {P, hipY, td} = r, k = r.k;
    m.add('body', 'B', P(0, hipY - 0.03, td * 0.48), [r.tw * 0.55 * k, 0.2 * k, 0.02 * k], c, {m: 'cloth'});
    if (trim) m.add('body', 'B', P(0, hipY - 0.13, td * 0.49), [r.tw * 0.55 * k, 0.025 * k, 0.022 * k], trim, {nl: true});
  },
  sash(m, r, c) {
    const {P, hipY, shY, td, tw} = r, k = r.k;
    m.add('body', 'B', P(0, (hipY + shY) / 2 + 0.02, td * 0.08), [tw * 1.08 * k, 0.05 * k, td * 1.12 * k], c, {r: [0, 0, 0.75], m: 'cloth'});
  },
  skirt(m, r, c, len) {
    const {P, hipY, tw} = r, k = r.k; len = len || 0.14;
    m.add('body', 'C16t0.7o', P(0, hipY - len * 0.3, 0), [tw * 1.35 * k, len * k, r.td * 1.45 * k], c, {m: 'cloth', ts: true});
  },
  breastplate(m, r, c, trim) {
    const {P, hipY, shY, td, tw} = r, k = r.k;
    m.add('body', 'S', P(0, hipY + (shY - hipY) * 0.6, td * 0.1), [tw * 1.06 * k, (shY - hipY) * 1.0 * k, td * 1.0 * k], c, {m: 'metal'});
    if (trim) m.add('body', 'B', P(0, hipY + (shY - hipY) * 0.62, td * 0.58), [0.03 * k, (shY - hipY) * 0.6 * k, 0.02 * k], trim, {m: 'metal', nl: true});
  },
  logs(m, r, c) {
    const {P, shY, td} = r, k = r.k;
    for (let i = 0; i < 3; i++) m.add('body', 'C10', P((i - 1) * 0.07, shY + 0.03 + (i === 1 ? 0.06 : 0), -td * 0.9), [0.08 * k, 0.5 * k, 0.08 * k], c || '#8a5a32', {r: [0, 0, Math.PI / 2 + (i - 1) * 0.08]});
  },
  wings(m, r, c, membrane, span, y, z) {                     // two-bone flapping wings on the back
    const {P} = r, k = r.k; span = span || 0.5; y = y != null ? y : r.shY - 0.02; z = z != null ? z : -r.td * 0.4;
    m.pivot('wingL', P(0.05, y, z)); m.pivot('wingR', P(-0.05, y, z));
    m.sym(s => {
      const b = s > 0 ? 'wingL' : 'wingR';
      m.seg(b, P(s * 0.05, y, z), P(s * span * 0.55, y + 0.12, z - 0.05), 0.025 * k, c, {t: 0.7});
      m.seg(b, P(s * span * 0.55, y + 0.12, z - 0.05), P(s * span, y - 0.02, z - 0.08), 0.018 * k, c, {t: 0.4});
      m.add(b, 'S', P(s * span * 0.55, y - 0.04, z - 0.06), [span * 0.95 * k, 0.24 * k, 0.03 * k], membrane || c, {m: 'cloth'});
    });
  },
  tail(m, r, c, len, tip) {
    const {P, hipY, td} = r, k = r.k; len = len || 0.3;
    m.pivot('tail', P(0, hipY, -td * 0.4));
    m.seg('tail', P(0, hipY, -td * 0.4), P(0, hipY - 0.12, -td * 0.4 - len), 0.05 * k, c, {t: 0.25});
    if (tip) m.add('tail', 'K4', P(0, hipY - 0.13, -td * 0.4 - len - 0.03), [0.08 * k, 0.1 * k, 0.03 * k], tip, {r: [-1.6, 0, 0]});
  },
  aura(m, r, c, y) {                                          // glowing floor sigil (evo / hero)
    m.add('root', 'R0.06', [0, y || 0.01, 0], [0.7, 0.7, 0.7], c, {m: 'glow', nl: true});
  }
};

// ---------------------------------------------------------------- non-humanoid archetypes
// four-legged beast; returns {saddle:[x,y,z], head:[...]}; o: len h w c belly legC hoof headS snout horn ears tail
function beast(m, o) {
  o = o || {};
  const L = o.len || 0.7, H = o.h || 0.42, Wd = o.w || 0.34, c = o.c || '#8a6a4a', legC = o.legC || c;
  const by = H + (o.bodyH || 0.2) * 0.4;
  m.anim = m.anim === 'hum' ? 'quad' : m.anim;
  m.pivot('fl', [Wd * 0.32, H, L * 0.32]); m.pivot('fr', [-Wd * 0.32, H, L * 0.32]);
  m.pivot('bl', [Wd * 0.32, H, -L * 0.32]); m.pivot('br', [-Wd * 0.32, H, -L * 0.32]);
  const lr = o.legR || 0.05;
  for (const [b, x, z] of [['fl', 1, 1], ['fr', -1, 1], ['bl', 1, -1], ['br', -1, -1]]) {
    m.seg(b, [x * Wd * 0.32, H + 0.02, z * L * 0.32], [x * Wd * 0.33, 0.06, z * L * 0.32 + 0.02], lr, legC, {t: 0.75});
    m.add(b, 'S', [x * Wd * 0.33, 0.04, z * L * 0.32 + 0.03], [lr * 2.6, 0.08, lr * 3.0], o.hoof || '#2e2420', {m: 'gloss'});
  }
  m.add('root', 'S', [0, by, 0], [Wd, (o.bodyH || 0.2) * 1.6, L], c, {m: o.mat || 'skin'});
  if (o.belly) m.add('root', 'S', [0, by - 0.06, 0.02], [Wd * 0.8, (o.bodyH || 0.2) * 1.1, L * 0.82], o.belly, {m: 'skin'});
  if (o.shell) {
    m.add('root', 'H', [0, by + 0.02, 0], [Wd * 1.18, (o.bodyH || 0.2) * 2.3, L * 1.08], o.shell, {m: 'gloss'});
    for (let i = -1; i <= 1; i++) m.add('root', 'R0.06a0.5', [0, by + 0.03, i * L * 0.27], [Wd * 1.18, Wd * 1.0, Wd * 1.18], o.shellRib || '#2a2030', {r: [0, Math.PI / 2, 0], ts: true, nl: true});
  }
  // head on the mhead bone
  const hs = o.headS || 0.2, hz = L * 0.5 + hs * 0.35, hy = by + (o.headUp || 0.06);
  m.pivot('mhead', [0, by, L * 0.38]);
  m.add('mhead', 'S', [0, hy, hz], [hs * 1.05, hs, hs * 1.15], o.headC || c, {m: 'skin'});
  if (o.snout) m.add('mhead', 'S', [0, hy - hs * 0.15, hz + hs * 0.5], [hs * 0.7, hs * 0.55, hs * 0.6], o.snout, {m: 'skin'});
  if (o.nostril) m.sym(s => m.add('mhead', 'S', [s * hs * 0.13, hy - hs * 0.1, hz + hs * 0.8], [hs * 0.12, hs * 0.12, hs * 0.06], '#2a1a18', {nl: true}));
  m.sym(s => {
    m.add('mhead', 'S', [s * hs * 0.32, hy + hs * 0.18, hz + hs * 0.42], [hs * 0.2, hs * 0.24, hs * 0.12], o.eyeC || '#1a1420', {m: 'gloss', nl: true});
    if (o.ears) m.seg('mhead', [s * hs * 0.32, hy + hs * 0.35, hz - hs * 0.1], [s * hs * 0.6, hy + hs * 0.75, hz - hs * 0.35], hs * 0.15, o.ears, {t: 0.2, sz: 0.5});
    if (o.curl) m.add('mhead', 'R0.3', [s * hs * 0.5, hy + hs * 0.25, hz - hs * 0.05], [hs * 0.6, hs * 0.6, hs * 0.6], o.curl, {r: [0, 0, Math.PI / 2], m: 'gloss'});
    if (o.tusk) m.seg('mhead', [s * hs * 0.22, hy - hs * 0.25, hz + hs * 0.55], [s * hs * 0.38, hy + hs * 0.15, hz + hs * 0.8], hs * 0.07, o.tusk, {t: 0.15, m: 'gloss'});
  });
  if (o.horn) m.seg('mhead', [0, hy + hs * 0.25, hz + hs * 0.55], [0, hy + hs * 0.95, hz + hs * 0.75], hs * 0.18, o.horn, {t: 0.05, m: 'gloss'});
  if (o.mane) m.add('root', 'S', [0, by + 0.12, L * 0.3], [Wd * 0.55, 0.18, L * 0.32], o.mane, {m: 'cloth'});
  if (o.tailC !== false) {
    m.pivot('tail', [0, by, -L * 0.48]);
    m.seg('tail', [0, by + 0.02, -L * 0.48], [0, by - 0.12, -L * 0.62], 0.025, o.tailC || c, {t: 0.5});
  }
  return {saddle: [0, by + (o.bodyH || 0.2) * 0.75, -0.02], by, head: [0, hy, hz], hs};
}
function saddle(m, b, c, trim) {
  m.add('root', 'S', [0, b.saddle[1] - 0.02, b.saddle[2]], [0.3, 0.07, 0.28], c || '#7a3a22', {m: 'gloss'});
  if (trim) m.add('root', 'B', [0, b.saddle[1] - 0.08, b.saddle[2]], [0.37, 0.12, 0.22], trim, {m: 'cloth'});
}
// winged critter body (no legs on the ground); o: c belly headS bodyS wingC memb span
function critter(m, o) {
  o = o || {};
  m.anim = 'fly'; m.flapHz = o.hz || 14; m.flapAmp = o.amp || 0.6;
  const y = o.y || 0.55, bs = o.bodyS || 0.32, hs = o.headS || 0.26;
  m.pivot('body', [0, y, 0]); m.pivot('head', [0, y + bs * 0.35, 0]);
  m.add('body', 'S', [0, y, 0], [bs, bs * 1.1, bs * 0.9], o.c || '#7a7f8a', {m: o.mat || 'skin'});
  if (o.belly) m.add('body', 'S', [0, y - 0.02, bs * 0.18], [bs * 0.7, bs * 0.8, bs * 0.6], o.belly, {m: 'skin'});
  const hy = y + bs * 0.45 + hs * 0.35;
  m.add('head', 'S', [0, hy, bs * 0.08], [hs, hs * 0.95, hs * 0.95], o.headC || o.c || '#7a7f8a', {m: o.mat || 'skin'});
  const r = {P: (x, yy, z) => [x, yy, z], k: 1, headC: hy, R: hs / 2, hd: 1, skin: o.headC || o.c, shY: y + bs * 0.3, td: bs * 0.9, tw: bs, hipY: y - bs * 0.4,
    handL: [bs * 0.55, y - bs * 0.3, bs * 0.2], handR: [-bs * 0.55, y - bs * 0.3, bs * 0.2], shX: bs * 0.5, ar: 0.03};
  r.frame = (side, tilt) => M4.chain(M4.T.apply(null, side === 'L' ? r.handL : r.handR), M4.RX(tilt != null ? tilt : -0.55));
  // little arms + feet
  m.pivot('armL', [bs * 0.42, y + bs * 0.1, 0]); m.pivot('armR', [-bs * 0.42, y + bs * 0.1, 0]);
  m.sym(s => {
    const b = s > 0 ? 'armL' : 'armR';
    m.seg(b, [s * bs * 0.42, y + bs * 0.1, 0], [s * bs * 0.55, y - bs * 0.3, bs * 0.2], 0.03, o.c || '#7a7f8a', {t: 0.8});
    m.add(b, 'S', [s * bs * 0.55, y - bs * 0.3, bs * 0.2], [0.065, 0.065, 0.065], o.handC || o.c || '#7a7f8a');
    if (o.feet !== false) m.seg(s > 0 ? 'legL' : 'legR', [s * bs * 0.18, y - bs * 0.45, 0], [s * bs * 0.2, y - bs * 0.75, 0.04], 0.028, o.footC || o.c || '#7a7f8a', {t: 0.6});
  });
  m.pivot('legL', [bs * 0.18, y - bs * 0.4, 0]); m.pivot('legR', [-bs * 0.18, y - bs * 0.4, 0]);
  EXTRA.wings(m, r, o.wingC || o.c, o.memb, o.span || 0.55, y + bs * 0.2, -bs * 0.3);
  return r;
}
// chubby dragon: o: c belly wingC memb horn spikes snout
function drake(m, o) {
  o = o || {};
  m.anim = 'drake'; m.flapHz = o.hz || 8; m.flapAmp = 0.5; m.atk = 'breath';
  const y = o.y || 0.5, L = o.len || 0.5, c = o.c || '#3fae6a';
  m.pivot('body', [0, y, 0]);
  m.add('body', 'S', [0, y, 0], [0.42, 0.42, L], c, {m: 'skin'});
  if (o.belly) m.add('body', 'S', [0, y - 0.05, 0.06], [0.32, 0.32, L * 0.82], o.belly, {m: 'skin'});
  // neck + head on mhead
  m.pivot('mhead', [0, y + 0.08, L * 0.32]);
  m.seg('mhead', [0, y + 0.08, L * 0.32], [0, y + 0.26, L * 0.48], 0.09, c, {t: 0.85});
  const hy = y + 0.3, hz = L * 0.55;
  m.add('mhead', 'S', [0, hy, hz], [0.3, 0.26, 0.3], o.headC || c, {m: 'skin'});
  m.add('mhead', 'S', [0, hy - 0.04, hz + 0.14], [0.2, 0.15, 0.2], o.snout || o.headC || c, {m: 'skin'});
  m.sym(s => {
    m.add('mhead', 'S', [s * 0.08, hy + 0.06, hz + 0.12], [0.08, 0.09, 0.05], '#ffffff', {m: 'gloss', nl: true});
    m.add('mhead', 'S', [s * 0.085, hy + 0.055, hz + 0.145], [0.045, 0.06, 0.03], o.eyeC || '#1a1420', {m: 'gloss', nl: true});
    m.add('mhead', 'S', [s * 0.035, hy - 0.02, hz + 0.24], [0.03, 0.025, 0.02], '#2a1a18', {nl: true});
    if (o.horn) m.seg('mhead', [s * 0.07, hy + 0.1, hz - 0.06], [s * 0.12, hy + 0.24, hz - 0.18], 0.03, o.horn, {t: 0.15, m: 'gloss'});
    // stubby legs
    m.seg(s > 0 ? 'legL' : 'legR', [s * 0.12, y - 0.12, 0.08], [s * 0.14, y - 0.28, 0.1], 0.045, c, {t: 0.8});
    m.seg(s > 0 ? 'legL' : 'legR', [s * 0.12, y - 0.12, -0.12], [s * 0.14, y - 0.27, -0.12], 0.045, c, {t: 0.8});
  });
  m.pivot('legL', [0.12, y - 0.12, 0]); m.pivot('legR', [-0.12, y - 0.12, 0]);
  if (o.spikes) for (let i = 0; i < 4; i++) m.add('body', 'K4', [0, y + 0.2 - i * 0.02, L * 0.25 - i * 0.14], [0.06, 0.1, 0.08], o.spikes, {m: 'gloss'});
  m.pivot('tail', [0, y - 0.02, -L * 0.45]);
  m.seg('tail', [0, y - 0.02, -L * 0.45], [0, y - 0.12, -L * 0.95], 0.09, c, {t: 0.2});
  if (o.tailTip) m.add('tail', 'K4', [0, y - 0.13, -L * 1.0], [0.1, 0.12, 0.04], o.tailTip, {r: [-1.7, 0, 0], m: 'gloss'});
  const r = {P: (x, yy, z) => [x, yy, z], k: 1, shY: y + 0.12, td: 0.4, tw: 0.42, hipY: y - 0.1, head: [0, hy, hz]};
  EXTRA.wings(m, r, o.wingC || c, o.memb || o.belly, o.span || 0.62, y + 0.14, -0.02);
  return {y, hy, hz};
}
// boulder construct: o: c c2 core glow bulk
function golemBody(m, o) {
  o = o || {};
  const c = o.c || '#8a8378', c2 = o.c2 || '#6e675e', g = o.glow || '#9a6bff', bk = o.bulk || 1;
  m.atk = o.atk || 'slam';
  m.rig.armRestL = -0.1; m.rig.armRestR = -0.1; m.rig.armSpread = 0.22;
  const hipY = 0.3, shY = 0.72;
  m.pivot('body', [0, hipY, 0]); m.pivot('head', [0, shY, 0]);
  m.pivot('legL', [0.14 * bk, hipY, 0]); m.pivot('legR', [-0.14 * bk, hipY, 0]);
  m.pivot('armL', [0.3 * bk, shY - 0.04, 0]); m.pivot('armR', [-0.3 * bk, shY - 0.04, 0]);
  m.sym(s => {
    const lb = s > 0 ? 'legL' : 'legR', ab = s > 0 ? 'armL' : 'armR';
    m.add(lb, 'B', [s * 0.14 * bk, 0.17, 0], [0.17 * bk, 0.3, 0.2 * bk], c2, {r: [0, s * 0.2, 0]});
    m.add(lb, 'S', [s * 0.14 * bk, 0.06, 0.03], [0.22 * bk, 0.12, 0.27 * bk], c);
    m.add(ab, 'S', [s * 0.32 * bk, shY - 0.02, 0], [0.24 * bk, 0.22, 0.24 * bk], c, {r: [0.3, 0, 0.4]});
    m.add(ab, 'B', [s * 0.34 * bk, shY - 0.2, 0.02], [0.17 * bk, 0.22, 0.17 * bk], c2, {r: [0.2, 0.4, s * 0.1]});
    m.add(ab, 'S', [s * 0.35 * bk, shY - 0.4, 0.04], [0.25 * bk, 0.24, 0.25 * bk], c, {r: [0.5, 0.3, 0]});
  });
  m.add('body', 'S', [0, hipY + 0.06, 0], [0.42 * bk, 0.22, 0.32 * bk], c2);
  m.add('body', 'S', [0, hipY + 0.28, 0], [0.62 * bk, 0.48, 0.44 * bk], c, {r: [0.1, 0.2, 0.05]});
  m.add('body', 'B', [0.12 * bk, hipY + 0.4, -0.08], [0.24 * bk, 0.2, 0.24 * bk], c2, {r: [0.4, 0.5, 0.3]});
  m.add('body', 'B', [-0.14 * bk, hipY + 0.34, 0.02], [0.22 * bk, 0.18, 0.3 * bk], c2, {r: [-0.3, 0.4, 0.2]});
  if (o.core !== false) {
    m.add('body', 'S', [0, hipY + 0.3, 0.19 * bk], [0.17, 0.17, 0.1], g, {m: 'glow', nl: true});
    for (let i = 0; i < 3; i++) m.add('body', 'B', [Math.cos(i * 2.1) * 0.09, hipY + 0.3 + Math.sin(i * 2.1) * 0.09, 0.21 * bk], [0.02, 0.12, 0.02], g, {m: 'glow', nl: true, r: [0, 0, i * 2.1]});
  }
  // head: small boulder with glowing eyes, sunk between the shoulders
  const hy = shY + 0.06;
  m.add('head', 'S', [0, hy, 0.06], [0.26, 0.2, 0.24], c, {r: [0.1, 0, 0]});
  m.sym(s => m.add('head', 'S', [s * 0.06, hy + 0.01, 0.17], [0.05, 0.035, 0.03], g, {m: 'glow', nl: true}));
  m.add('head', 'B', [0, hy + 0.06, 0.13], [0.16, 0.035, 0.05], c2, {nl: true});
  return {P: (x, y, z) => [x, y, z], k: 1, headC: hy, R: 0.11, hd: 1, skin: c, shY, td: 0.44, tw: 0.62, hipY, shX: 0.32, ar: 0.06,
    handL: [0.35 * bk, shY - 0.4, 0.04], handR: [-0.35 * bk, shY - 0.4, 0.04], frame(side, t) { return M4.chain(M4.T.apply(null, side === 'L' ? this.handL : this.handR), M4.RX(t != null ? t : -0.55)); }};
}
// a floating elemental mote: o: c glow face kind
function mote(m, o) {
  o = o || {};
  m.anim = 'orb'; m.atk = 'cast';
  const y = 0.45, c = o.c || '#8ad8ff', g = o.glow || '#e8fbff';
  m.pivot('body', [0, y, 0]); m.pivot('head', [0, y, 0]); m.pivot('gear', [0, y, 0]);
  m.add('body', 'S', [0, y, 0], [0.42, 0.44, 0.4], c, {m: o.kind === 'ice' ? 'gloss' : 'glow'});
  m.add('body', 'S', [0.05, y + 0.06, 0.09], [0.24, 0.24, 0.2], g, {m: 'glow', nl: true});
  m.sym(s => {
    m.add('head', 'S', [s * 0.075, y + 0.05, 0.19], [0.07, 0.09, 0.04], '#ffffff', {m: 'gloss', nl: true});
    m.add('head', 'S', [s * 0.075, y + 0.045, 0.21], [0.035, 0.05, 0.02], o.eyeC || '#1a1420', {m: 'gloss', nl: true});
  });
  m.add('head', 'S', [0, y - 0.07, 0.195], [0.07, 0.03, 0.02], '#2a1a2a', {nl: true});
  const kind = o.kind || 'fire';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    if (kind === 'fire') m.add('gear', 'K8', [Math.cos(a) * 0.12, y + 0.22, Math.sin(a) * 0.12 - 0.02], [0.12, 0.24, 0.12], i % 2 ? c : g, {m: 'glow', r: [Math.sin(a) * -0.5, 0, Math.cos(a) * 0.5], nl: true});
    else if (kind === 'ice') m.add('gear', 'K4', [Math.cos(a) * 0.2, y + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.2], [0.07, 0.2, 0.07], g, {m: 'gloss', r: [Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5]});
    else if (kind === 'spark') m.add('gear', 'B', [Math.cos(a) * 0.27, y + (i % 2 ? 0.08 : -0.08), Math.sin(a) * 0.27], [0.03, 0.16, 0.03], g, {m: 'glow', r: [0, -a, i % 2 ? 0.6 : -0.6], nl: true});
    else if (kind === 'bloom') m.add('gear', 'S', [Math.cos(a) * 0.2, y + 0.14, Math.sin(a) * 0.2], [0.16, 0.05, 0.11], i % 2 ? g : '#ffd6f0', {r: [0, -a, 0.4], m: 'gloss'});
  }
  return {y};
}
// hovering sky barge / gondola: o: env c basket cargo
function barge(m, o) {
  o = o || {};
  m.anim = 'ship'; m.atk = 'bite';
  const ey = 0.95;
  m.pivot('body', [0, ey, 0]); m.pivot('prop', [0, 0.45, -0.32]);
  m.add('body', 'S', [0, ey, 0], [0.62, 0.48, 0.82], o.env || '#e9dcb8', {m: 'cloth'});
  for (let i = -1; i <= 1; i++) m.add('body', 'R0.03', [0, ey, i * 0.22], [0.64 - Math.abs(i) * 0.12, 0.5, 0.5 - Math.abs(i) * 0.09], o.band || 'T', {r: [Math.PI / 2, 0, 0], nl: true});
  m.sym(s => m.add('body', 'B', [s * 0.0, ey + 0.05, -0.42], [0.02, 0.22, 0.16], o.fin || 'T', {m: 'cloth'}));
  m.add('body', 'B', [0, ey, -0.43], [0.24, 0.02, 0.16], o.fin || 'T', {m: 'cloth'});
  m.sym(s => m.seg('body', [s * 0.16, ey - 0.2, 0.12], [s * 0.15, 0.5, 0.1], 0.006, '#4a3a2a', {nl: true}));
  m.sym(s => m.seg('body', [s * 0.16, ey - 0.2, -0.12], [s * 0.15, 0.5, -0.1], 0.006, '#4a3a2a', {nl: true}));
  m.add('body', 'B', [0, 0.42, 0], [0.32, 0.16, 0.3], o.basket || '#8a5a32');
  m.add('body', 'B', [0, 0.5, 0], [0.34, 0.03, 0.32], '#5a3a22', {nl: true});
  m.add('prop', 'B', [0, 0.45, -0.32], [0.28, 0.03, 0.05], '#c9d0d8', {m: 'metal'});
  m.add('body', 'C8', [0, 0.45, -0.24], [0.05, 0.12, 0.05], '#5a5a62', {r: [Math.PI / 2, 0, 0], m: 'metal'});
  return {cargo: [0, 0.32, 0]};
}
// wheeled cart; o: c wheelC wheels len
function cart(m, o) {
  o = o || {};
  m.anim = 'cart';
  const L = o.len || 0.6, Wd = o.w || 0.36, wr = o.wr || 0.13;
  m.pivot('wheel', [0, wr, 0]);
  m.add('root', 'B', [0, wr + 0.1, 0], [Wd, 0.14, L], o.c || '#8a5a32');
  m.add('root', 'B', [0, wr + 0.18, 0], [Wd + 0.03, 0.03, L + 0.03], o.trim || '#5a3a22', {nl: true});
  for (const z of [L * 0.33, -L * 0.33]) m.sym(s => {
    m.pivot('wheel', [0, wr, 0]);
    m.add('wheel', 'C16', [s * (Wd * 0.5 + 0.03), wr, z], [wr * 2, 0.05, wr * 2], o.wheelC || '#5a3a22', {r: [0, 0, Math.PI / 2]});
    m.add('wheel', 'B', [s * (Wd * 0.5 + 0.06), wr, z], [0.02, wr * 1.8, 0.03], o.hub || '#c9a24a', {m: 'metal', nl: true});
  });
  return {top: wr + 0.2};
}

// ---------------------------------------------------------------- variant dressing (evolution / hero)
function dressVariant(m, info, variant) {
  const top = info && info.top_ ? info.top_ : [0, 1.02, 0];
  if (variant === 'evo') {
    m.add('root', 'R0.05', [0, 0.012, 0], [0.82, 0.82, 0.82], '#c77dff', {m: 'glow', nl: true});
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      m.add('root', 'K4', [Math.cos(a) * 0.36, 0.2 + i * 0.05, Math.sin(a) * 0.36], [0.07, 0.16, 0.07], '#d9a6ff', {m: 'glow', nl: true});
    }
    m.add('head', 'S', [top[0], top[1] + 0.08, top[2]], [0.07, 0.1, 0.07], '#e7c4ff', {m: 'glow', nl: true});
  } else if (variant === 'hero') {
    m.add('root', 'R0.05', [0, 0.012, 0], [0.86, 0.86, 0.86], '#ffd34a', {m: 'glow', nl: true});
    const y = top[1] + 0.05;
    m.add('head', 'C16o', [top[0], y, top[2]], [0.15, 0.06, 0.15], '#ffcf3a', {m: 'metal', ts: true});
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; m.add('head', 'K4', [top[0] + Math.cos(a) * 0.07, y + 0.05, top[2] + Math.sin(a) * 0.07], [0.04, 0.06, 0.04], '#ffcf3a', {m: 'metal'}); }
  }
}
