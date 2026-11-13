/* ============================================================================
   R18 · ENGINE — tiny WebGL mesh renderer for the battle troops.
   Real geometry (spheres, frustums, boxes, tori) with a depth buffer,
   toon shading, an inverted-hull outline pass and a bone/pivot rig.
   Frames are rendered into an off-screen GL canvas, then cached as 2D
   canvases keyed by (model, team, yaw, pose) so swarms stay cheap.
   ========================================================================== */

// ---------------------------------------------------------------- mat4 (column-major)
const M4 = {
  id() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
  mul(a, b, o) {
    o = o || new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      o[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return o;
  },
  T(x, y, z) { const m = M4.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
  S(x, y, z) { const m = M4.id(); m[0] = x; m[5] = y; m[10] = z; return m; },
  RX(a) { const m = M4.id(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; },
  RY(a) { const m = M4.id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; },
  RZ(a) { const m = M4.id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; },
  chain() { let m = M4.id(); for (let i = 0; i < arguments.length; i++) if (arguments[i]) m = M4.mul(m, arguments[i]); return m; },
  // inverse-transpose of the upper 3x3 (normal matrix), written into a Float32Array(9)
  nrm(m, o) {
    const a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
    const A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g;
    let det = a * A + b * B + c * Cc; det = det ? 1 / det : 0;
    o[0] = A * det; o[1] = B * det; o[2] = Cc * det;
    o[3] = -(b * i - c * h) * det; o[4] = (a * i - c * g) * det; o[5] = -(a * h - b * g) * det;
    o[6] = (b * f - c * e) * det; o[7] = -(a * f - c * d) * det; o[8] = (a * e - b * d) * det;
    return o;
  }
};

// ---------------------------------------------------------------- colours
function hex3(h) {
  if (Array.isArray(h)) return h;
  h = String(h).replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const TEAMS = {
  p: {T: hex3('#3f8cff'), TD: hex3('#1f4fae'), TL: hex3('#a9d0ff'), rim: hex3('#7fb6ff')},
  e: {T: hex3('#ff4b4b'), TD: hex3('#a8202a'), TL: hex3('#ffb4ae'), rim: hex3('#ff8f86')}
};
const MAT = {matte: 0, metal: 1, glow: 2, skin: 3, gloss: 4, cloth: 5};

// ---------------------------------------------------------------- mesh generators (unit sized, centred)
function genSphere(lat, lon, hemi) {
  const p = [], n = [], idx = [];
  const lat0 = hemi ? lat / 2 : 0;
  for (let i = lat0; i <= lat; i++) {
    const th = Math.PI * (1 - i / lat);              // 0 = bottom pole
    const y = -Math.cos(th) * 0.5, r = Math.sin(th) * 0.5;
    for (let j = 0; j <= lon; j++) {
      const ph = (j / lon) * Math.PI * 2;
      const x = Math.cos(ph) * r, z = Math.sin(ph) * r;
      p.push(x, y, z); n.push(x * 2, y * 2, z * 2);
    }
  }
  const rows = lat - lat0;
  for (let i = 0; i < rows; i++) for (let j = 0; j < lon; j++) {
    const a = i * (lon + 1) + j, b = a + lon + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  if (hemi) {                                            // flat cap at y = 0
    const c = p.length / 3; p.push(0, 0, 0); n.push(0, -1, 0);
    const s = p.length / 3;
    for (let j = 0; j <= lon; j++) { const ph = (j / lon) * Math.PI * 2; p.push(Math.cos(ph) * 0.5, 0, Math.sin(ph) * 0.5); n.push(0, -1, 0); }
    for (let j = 0; j < lon; j++) idx.push(c, s + j + 1, s + j);
  }
  return {p, n, idx};
}
function genCyl(segs, taper, capTop, capBot) {
  const p = [], n = [], idx = [];
  const r0 = 0.5, r1 = 0.5 * taper, slope = (r0 - r1);   // radius bottom → top over height 1
  for (let k = 0; k < 2; k++) {
    const y = k ? 0.5 : -0.5, r = k ? r1 : r0;
    for (let j = 0; j <= segs; j++) {
      const ph = (j / segs) * Math.PI * 2, cx = Math.cos(ph), cz = Math.sin(ph);
      const len = Math.hypot(1, slope);
      p.push(cx * r, y, cz * r); n.push(cx / len, slope / len, cz / len);
    }
  }
  for (let j = 0; j < segs; j++) { const a = j, b = j + segs + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const cap = (y, r, ny) => {
    if (r <= 0.0001) return;
    const c = p.length / 3; p.push(0, y, 0); n.push(0, ny, 0);
    const s = p.length / 3;
    for (let j = 0; j <= segs; j++) { const ph = (j / segs) * Math.PI * 2; p.push(Math.cos(ph) * r, y, Math.sin(ph) * r); n.push(0, ny, 0); }
    for (let j = 0; j < segs; j++) { if (ny > 0) idx.push(c, s + j + 1, s + j); else idx.push(c, s + j, s + j + 1); }
  };
  if (capTop) cap(0.5, r1, 1);
  if (capBot) cap(-0.5, r0, -1);
  return {p, n, idx};
}
function genBox() {
  const p = [], n = [], idx = [];
  const F = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const f of F) {
    const u = f[1] !== 0 ? [1, 0, 0] : [0, 1, 0];
    const v = [f[1] * u[2] - f[2] * u[1], f[2] * u[0] - f[0] * u[2], f[0] * u[1] - f[1] * u[0]];
    const s = p.length / 3;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      p.push((f[0] + u[0] * a + v[0] * b) * 0.5, (f[1] + u[1] * a + v[1] * b) * 0.5, (f[2] + u[2] * a + v[2] * b) * 0.5);
      n.push(f[0], f[1], f[2]);
    }
    idx.push(s, s + 1, s + 2, s, s + 2, s + 3);
  }
  return {p, n, idx};
}
function genTorus(seg, tube, thick, arc) {            // ring in the XZ plane, major radius .5
  const p = [], n = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2 * arc, ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j <= tube; j++) {
      const b = (j / tube) * Math.PI * 2, cb = Math.cos(b), sb = Math.sin(b);
      const r = 0.5 + thick * cb;
      p.push(ca * r, sb * thick, sa * r); n.push(ca * cb, sb, sa * cb);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < tube; j++) {
    const a = i * (tube + 1) + j, b = a + tube + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  return {p, n, idx};
}
// mesh keys: S sphere · H dome · B box · C<segs>t<taper> frustum · K<segs> cone · R<thick>a<arc> torus
function genByKey(key) {
  if (key === 'S') return genSphere(10, 14, false);
  if (key === 'Sl') return genSphere(6, 8, false);
  if (key === 'H') return genSphere(10, 14, true);
  if (key === 'B') return genBox();
  let m = /^C(\d+)?(?:t([\d.]+))?(o)?$/.exec(key);
  if (m) return genCyl(+(m[1] || 14), m[2] != null ? +m[2] : 1, !m[3], !m[3]);
  m = /^K(\d+)?$/.exec(key);
  if (m) return genCyl(+(m[1] || 14), 0, false, true);
  m = /^R([\d.]+)?(?:a([\d.]+))?$/.exec(key);
  if (m) return genTorus(m[2] && +m[2] < 1 ? 14 : 20, 7, +(m[1] || 0.12), +(m[2] || 1));
  return genSphere(10, 14, false);
}

// ---------------------------------------------------------------- GL state
const GL = {ok: false, failed: false, err: '', cv: null, gl: null, prog: null, meshes: new Map(), loc: null, SIZE: 256};
const VS = [
  'attribute vec3 aP;', 'attribute vec3 aN;',
  'uniform mat4 uM;', 'uniform mat3 uNM;', 'uniform mat4 uV;', 'uniform mat3 uVR;', 'uniform float uOut;',
  'varying vec3 vN;',
  'void main(){',
  '  vec3 nn = normalize(uVR * (uNM * aN));',
  '  vec4 c = uV * (uM * vec4(aP, 1.0));',
  '  c.xy += normalize(nn.xy + vec2(1e-5)) * uOut * length(nn.xy);',
  '  c.z += uOut * 0.6;',
  '  vN = nn; gl_Position = c;',
  '}'
].join('\n');
const FS = [
  'precision mediump float;',
  'uniform vec3 uC;', 'uniform float uMat;', 'uniform vec3 uRim;', 'uniform float uFlash;', 'uniform float uLine;',
  'varying vec3 vN;',
  'void main(){',
  '  if (uLine > 0.5) { gl_FragColor = vec4(mix(vec3(0.05,0.04,0.08), uC * 0.28, 0.35), 1.0); return; }',
  '  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;',
  '  vec3 L = normalize(vec3(-0.45, 0.78, 0.55));',
  '  float hl = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);',
  '  float toon = smoothstep(0.40, 0.56, hl) * 0.55 + hl * 0.45;',
  '  vec3 amb = mix(vec3(0.30, 0.25, 0.24), vec3(0.66, 0.74, 0.92), n.y * 0.5 + 0.5);',
  '  vec3 col = uC * (amb * 0.52 + toon * 0.78);',
  '  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));',
  '  float sp = pow(max(dot(n, H), 0.0), 26.0);',
  '  if (uMat > 0.5 && uMat < 1.5) { col = uC * (amb * 0.35 + smoothstep(0.35, 0.6, hl) * 0.95); col += vec3(1.0, 0.97, 0.9) * sp * 0.85; }',
  '  else if (uMat > 3.5 && uMat < 4.5) { col += vec3(1.0) * smoothstep(0.55, 0.9, sp) * 0.9; }',
  '  else if (uMat > 2.5 && uMat < 3.5) { col += uC * 0.08 + vec3(1.0, 0.85, 0.75) * sp * 0.12; }',
  '  else if (uMat > 4.5) { col *= 0.95 + 0.05 * hl; }',
  '  else { col += vec3(1.0) * sp * 0.10; }',
  '  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);',
  '  if (uMat > 1.5 && uMat < 2.5) col = uC * 1.08 + vec3(0.12) + uC * rim * 0.4;',
  '  else col += uRim * rim * 0.32;',
  '  col = mix(col, vec3(1.0), uFlash);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

function glInit() {
  if (GL.ok || GL.failed) return GL.ok;
  try {
    const cv = document.createElement('canvas');
    cv.width = cv.height = GL.SIZE;
    const gl = cv.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true, depth: true, stencil: false})
      || cv.getContext('experimental-webgl', {alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true, depth: true});
    if (!gl) throw new Error('WebGL unavailable');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const L = {};
    for (const a of ['aP', 'aN']) L[a] = gl.getAttribLocation(pr, a);
    for (const u of ['uM', 'uNM', 'uV', 'uVR', 'uOut', 'uC', 'uMat', 'uRim', 'uFlash', 'uLine']) L[u] = gl.getUniformLocation(pr, u);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE); gl.frontFace(gl.CW);
    gl.clearColor(0, 0, 0, 0);
    Object.assign(GL, {cv, gl, prog: pr, loc: L, ok: true});
    if (cv.addEventListener) {
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.ok = false; GL.failed = true; GL.err = 'context lost'; });
    }
    return true;
  } catch (e) {
    GL.failed = true; GL.err = String(e && e.message || e);
    return false;
  }
}
function mesh(key) {
  let m = GL.meshes.get(key);
  if (m) return m;
  const gl = GL.gl, d = genByKey(key);
  const inter = new Float32Array((d.p.length / 3) * 6);
  for (let i = 0, j = 0; i < d.p.length; i += 3, j += 6) {
    inter[j] = d.p[i]; inter[j + 1] = d.p[i + 1]; inter[j + 2] = d.p[i + 2];
    inter[j + 3] = d.n[i]; inter[j + 4] = d.n[i + 1]; inter[j + 5] = d.n[i + 2];
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, inter, gl.STATIC_DRAW);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(d.idx), gl.STATIC_DRAW);
  m = {vb, ib, n: d.idx.length};
  GL.meshes.set(key, m);
  return m;
}

// ---------------------------------------------------------------- rig
// Bones (index: parent). Every part is authored in absolute rest-pose model space
// (feet at y = 0, nominal height 1, facing +Z); a bone rotates around its pivot.
const BONES = ['root', 'body', 'head', 'armL', 'armR', 'legL', 'legR', 'wingL', 'wingR', 'tail', 'fl', 'fr', 'bl', 'br', 'mhead', 'prop', 'wheel', 'gear'];
const BI = {}; BONES.forEach((b, i) => { BI[b] = i; });
const PARENT = [-1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1];

function poseBones(model, st) {
  const R = model.rig, out = new Array(BONES.length);
  const rot = new Array(BONES.length);
  const W = st.walk, wp = st.wp, t = st.t;
  const sw = Math.sin(wp);
  const anim = model.anim || 'hum';
  const isFly = anim === 'fly' || anim === 'drake' || anim === 'ship' || anim === 'orb';
  // --- defaults
  let bob = 0, lean = 0, twist = 0, nod = 0, armL = R.armRestL, armR = R.armRestR, sprL = R.armSpread, sprR = -R.armSpread;
  let legL = 0, legR = 0, flap = 0, tail = 0, prop = t * 18, wheel = wp * 1.4, gear = t * 3;
  let fl = 0, fr = 0, bl = 0, br = 0, mhead = 0;
  // --- locomotion
  if (anim === 'quad' || anim === 'cart' || anim === 'beast') {
    const g = W * (st.charged ? 0.95 : 0.6);
    fl = Math.sin(wp) * g; br = Math.sin(wp) * g; fr = Math.sin(wp + Math.PI) * g; bl = Math.sin(wp + Math.PI) * g;
    bob = Math.abs(Math.cos(wp)) * 0.035 * W * (st.charged ? 1.6 : 1);
    mhead = Math.sin(wp * 2) * 0.06 * W;
    tail = Math.sin(wp * 2) * 0.3;
    lean = st.charged ? 0.10 : 0;
  } else if (!isFly) {
    legL = sw * 0.62 * W; legR = -sw * 0.62 * W;
    bob = Math.abs(Math.cos(wp)) * 0.028 * W;
    if (!R.twoHand) { armL += -sw * 0.45 * W; armR += sw * 0.40 * W; }
    twist = sw * 0.08 * W;
    tail = sw * 0.25;
  }
  if (isFly) {
    flap = Math.sin(t * (model.flapHz || 13)) * (model.flapAmp || 0.55);
    bob = Math.sin(t * 3 + (st.seed || 0)) * 0.025;
    legL = 0.25 + Math.sin(t * 4) * 0.1; legR = 0.25 - Math.sin(t * 4) * 0.1;
    tail = Math.sin(t * 3) * 0.35;
  }
  if (anim === 'orb') { bob = Math.sin(t * 4 + (st.seed || 0)) * 0.04; gear = t * 4; }
  if (anim === 'ghost') { bob = Math.sin(t * 3) * 0.03; legL = legR = 0; }
  // --- attacks
  const a = st.atk, k = st.kick, style = model.atk || 'chop';
  const ease = x => x * x * (3 - 2 * x);
  if (a >= 0) {
    if (style === 'chop' || style === 'two' || style === 'throw') {
      const up = 2.55, dn = -1.35;
      const v = a < 0.42 ? R.armRestR + (up - R.armRestR) * ease(a / 0.42) : up + (dn - up) * ease((a - 0.42) / 0.58);
      armR = v; if (style === 'two') armL = v;
      twist = a < 0.42 ? 0.25 * ease(a / 0.42) : 0.25 - 0.55 * ease((a - 0.42) / 0.58);
      lean = a < 0.42 ? -0.06 : 0.12 * Math.sin(((a - 0.42) / 0.58) * Math.PI);
      if (style === 'throw') armL = -0.9;
    } else if (style === 'thrust') {
      const f = Math.sin(a * Math.PI);
      armR = -0.4 - 1.25 * f; armL = -0.6 - 0.9 * f; lean = 0.16 * f; twist = -0.2 * f;
    } else if (style === 'punch') {
      const f = Math.sin(a * Math.PI), alt = (st.atkN || 0) % 2;
      if (alt) armL = -1.45 * f + R.armRestL * (1 - f); else armR = -1.45 * f + R.armRestR * (1 - f);
      lean = 0.12 * f; twist = (alt ? -0.25 : 0.25) * f;
    } else if (style === 'slam') {
      const v = a < 0.5 ? 2.6 * ease(a / 0.5) : 2.6 - 3.9 * ease((a - 0.5) / 0.5);
      armL = armR = v; lean = a < 0.5 ? -0.08 : 0.2 * Math.sin(((a - 0.5) / 0.5) * Math.PI);
    } else if (style === 'bite' || style === 'breath') {
      const f = Math.sin(a * Math.PI);
      mhead = 0.35 * f; nod = 0.3 * f; lean = 0.08 * f;
    } else if (style === 'cast') {
      const f = Math.sin(a * Math.PI);
      armR = -0.4 - 1.6 * f; armL = -0.3 - 0.8 * f; lean = 0.06 * f;
    }
  }
  if (st.aim && (style === 'aim' || style === 'bow' || style === 'cast')) {
    if (style === 'aim') { armR = -1.42; armL = -1.30; sprL = 0.35; sprR = 0.12; }
    if (style === 'bow') { armL = -1.5; armR = -1.35; sprL = 0.05; sprR = 0.45; }
    if (style === 'cast' && a < 0) { armR = -0.9; }
  }
  if (k > 0) {
    if (style === 'aim' || style === 'bow') { lean -= 0.09 * k; armR += 0.25 * k; armL += 0.18 * k; }
    else if (style === 'cast' || style === 'throw') { armR = -1.9 * k + armR * (1 - k); lean += 0.05 * k; }
    else if (style === 'breath' || style === 'bite') { mhead += 0.3 * k; nod += 0.25 * k; }
  }
  if (R.armLock) armL = R.armRestL;
  rot[0] = M4.chain(M4.T(0, bob, 0));
  rot[1] = M4.chain(M4.RX(lean), M4.RY(twist));
  rot[2] = M4.RX(nod);
  rot[3] = M4.chain(M4.RZ(sprL), M4.RX(armL));
  rot[4] = M4.chain(M4.RZ(sprR), M4.RX(armR));
  rot[5] = M4.RX(legL); rot[6] = M4.RX(legR);
  rot[7] = M4.RZ(-flap); rot[8] = M4.RZ(flap);
  rot[9] = M4.RY(tail);
  rot[10] = M4.RX(fl); rot[11] = M4.RX(fr); rot[12] = M4.RX(bl); rot[13] = M4.RX(br);
  rot[14] = M4.RX(mhead); rot[15] = M4.RY(prop); rot[16] = M4.RX(wheel); rot[17] = M4.RY(gear);
  for (let i = 0; i < BONES.length; i++) {
    const pv = R.piv[i] || [0, 0, 0];
    const local = M4.chain(M4.T(pv[0], pv[1], pv[2]), rot[i], M4.T(-pv[0], -pv[1], -pv[2]));
    out[i] = PARENT[i] < 0 ? local : M4.mul(out[PARENT[i]], local);
  }
  return out;
}

// ---------------------------------------------------------------- frame rendering
const TILT = 0.56;                                         // camera pitch (≈32°) looking down at the arena
const _nm = new Float32Array(9);
function viewMats(yaw, span, yBot, scale) {
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  // world → view: yaw about Y, then pitch so +z (toward the player) drops on screen
  const R = M4.mul(M4.RX(TILT), M4.RY(yaw));
  const sx = 2 / span, sy = 2 / span;
  const P = M4.id();
  P[0] = sx; P[5] = sy; P[10] = -0.25; P[13] = -1 - (yBot * sy) + 0; // y: [yBot, yBot+span] → [-1, 1]
  P[13] = -1 - yBot * sy;
  const V = M4.mul(P, M4.mul(R, M4.S(scale, scale, scale)));
  const VR = new Float32Array([R[0], R[1], R[2], R[4], R[5], R[6], R[8], R[9], R[10]]);
  return {V, VR, ct, st};
}
function drawModel(model, bones, team, yaw, span, yBot, flash, N, outlinePx) {
  const gl = GL.gl, L = GL.loc;
  const sc = model.scale || 1;
  const {V, VR} = viewMats(yaw, span, yBot, sc);
  gl.uniformMatrix4fv(L.uV, false, V);
  gl.uniformMatrix3fv(L.uVR, false, VR);
  gl.uniform3fv(L.uRim, team.rim);
  gl.uniform1f(L.uFlash, flash);
  const outW = outlinePx * 2 / N;
  const tmp = new Float32Array(16);
  let curMesh = null;
  for (let pass = 0; pass < 2; pass++) {
    const line = pass === 0;
    if (line && outW <= 0) continue;
    gl.cullFace(line ? gl.FRONT : gl.BACK);
    gl.uniform1f(L.uLine, line ? 1 : 0);
    gl.uniform1f(L.uOut, line ? outW : 0);
    for (const pt of model.parts) {
      if (line && pt.noLine) continue;
      const m = mesh(pt.mesh);
      if (m !== curMesh) {
        gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib);
        gl.vertexAttribPointer(L.aP, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(L.aN, 3, gl.FLOAT, false, 24, 12);
        curMesh = m;
      }
      M4.mul(bones[pt.bone], pt.M, tmp);
      gl.uniformMatrix4fv(L.uM, false, tmp);
      gl.uniformMatrix3fv(L.uNM, false, M4.nrm(tmp, _nm));
      const col = typeof pt.c === 'string' ? team[pt.c] : pt.c;
      gl.uniform3fv(L.uC, col);
      gl.uniform1f(L.uMat, pt.mat);
      if (pt.twoSided && !line) gl.disable(gl.CULL_FACE);
      gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
      if (pt.twoSided && !line) gl.enable(gl.CULL_FACE);
    }
  }
}
// render one frame of `model` into a fresh 2D canvas of N×N px
function renderFrame(model, st, side, yaw, N, opt) {
  if (!glInit()) return null;
  const gl = GL.gl, L = GL.loc;
  N = Math.max(16, Math.min(GL.SIZE, N | 0));
  opt = opt || {};
  const span = opt.span || FRAME.span, yBot = opt.yBot != null ? opt.yBot : FRAME.yBot;
  gl.viewport(0, 0, N, N);
  gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, N, N);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.SCISSOR_TEST);
  gl.useProgram(GL.prog);
  gl.enableVertexAttribArray(L.aP); gl.enableVertexAttribArray(L.aN);
  const bones = poseBones(model, st);
  const outlinePx = opt.outline != null ? opt.outline : (N < 70 ? 0.9 : N < 140 ? 1.25 : 1.6);
  drawModel(model, bones, TEAMS[side] || TEAMS.p, yaw, span, yBot, st.flash || 0, N, outlinePx);
  const out = opt.into || document.createElement('canvas');
  if (!opt.into) { out.width = N; out.height = N; }
  const g = out.getContext('2d');
  if (!opt.into) g.clearRect(0, 0, N, N);
  g.drawImage(GL.cv, 0, GL.SIZE - N, N, N, opt.dx || 0, opt.dy || 0, opt.dw || N, opt.dh || N);
  return out;
}
// on-screen frame: model space x ∈ [-span/2, span/2], y ∈ [yBot, yBot + span]
const FRAME = {span: 2.3, yBot: -0.55};

// ---------------------------------------------------------------- frame cache (LRU)
const CACHE = new Map();
const CACHE_MAX = 900;
function cacheGet(key) {
  const v = CACHE.get(key);
  if (v) { CACHE.delete(key); CACHE.set(key, v); }
  return v;
}
function cachePut(key, v) {
  CACHE.set(key, v);
  while (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
}
