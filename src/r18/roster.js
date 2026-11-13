/* ============================================================================
   R18 · ROSTER — original Nova Keep troop designs. One entry per troop key:
   n = display name, d = card text, b(m) = model builder. Keys (and therefore
   every stat, behaviour and targeting rule) are unchanged from the source game.
   ========================================================================== */

// ---- family builders --------------------------------------------------------
// Bone Mites: tiny candle-skulled bone folk
function mite(m, o) {
  o = o || {};
  const bone = o.bone || '#ece3cc';
  const r = hum(m, {leg: 0.3, torso: 0.24, headR: 0.2, bulk: 0.72, skin: bone, top: o.top || bone, bot: bone, boot: bone, lw: 0.55, ar: 0.6, tw: 0.9});
  m.add('body', 'B', r.P(0, r.hipY + 0.12, r.td * 0.3), [0.12, 0.02, 0.02], '#8a8070', {nl: true});
  m.add('body', 'B', r.P(0, r.hipY + 0.17, r.td * 0.3), [0.14, 0.02, 0.02], '#8a8070', {nl: true});
  face(m, r, {eyes: 'glow', eyeC: o.eye || 'T', mouth: '#3a3028', mouthW: 0.7});
  if (o.hat === 'helm') HAT.horned(m, r, '#6d7580', '#d8cfb6');
  else if (o.hat === 'plume') { HAT.greathelm(m, r, '#7a8290', null, 'T'); }
  else if (o.hat !== false) HAT.candle(m, r, o.wax, o.flame);
  return r;
}
// Mudlarks: frog-folk skirmishers
function frog(m, o) {
  o = o || {};
  const skin = o.skin || '#7cc35a';
  const r = hum(m, {leg: 0.26, torso: 0.25, headR: 0.2, bulk: 0.85, skin, top: o.top || '#a8743e', bot: o.bot || '#6a4a2a', boot: o.feet || '#5c9a44', hw: 1.25, hh: 0.85, lw: 0.9, ar: 0.85, glove: skin, belt: '#4a3020'});
  face(m, r, {eyes: 'frog', lid: skin, mouth: '#3a2a20', mouthW: 1.2});
  m.add('head', 'S', r.P(0, r.headC - r.R * 0.35, r.R * 0.4), [r.R * 1.9, r.R * 0.7, r.R * 1.3], o.belly || '#d9e8a8', {m: 'skin'});
  if (o.hat === 'leaf') HAT.leaf(m, r, '#4c9a3c');
  else if (o.hat === 'band') HAT.bandana(m, r, 'T');
  else if (o.hat === 'goggles') HAT.goggles(m, r, '#ffd36a');
  else if (o.hat === 'cap') HAT.cap(m, r, 'T', '#ffe27a');
  else if (o.hat === 'hood') HAT.hood(m, r, '#3f5a2a', false);
  EXTRA.sash(m, r, 'T');
  return r;
}
// Dune Raiders: wrapped desert fighters
function raider(m, o) {
  o = o || {};
  const r = hum(m, {leg: 0.35, torso: 0.3, headR: 0.14, bulk: o.bulk || 1.1, skin: '#c98a5a', top: o.top || '#e6c89a', bot: '#8a5a36', boot: '#5a3a22', belt: '#7a3a22', chest: 'V'});
  face(m, r, {eyes: 'dot', brow: '#3a2418', nose: '#b87a4a'});
  HAT.wrap(m, r, o.wrap || '#e9dcc0', 'T');
  EXTRA.sash(m, r, 'T');
  return r;
}
// Ogres: big tusked brutes
function ogre(m, o) {
  o = o || {};
  const skin = o.skin || '#8fa36a';
  const r = hum(m, {leg: 0.3, torso: 0.36, headR: 0.13, bulk: 1.55, tw: 1.1, skin, top: o.top || '#7a5a3a', bot: o.bot || '#5a4630', boot: '#3a2a1e', ar: 1.25, lw: 1.2, neck: 0, belt: '#3a2a1e', arm: 0.4});
  m.rig.armRestL = -0.15; m.rig.armRestR = -0.2; m.rig.armSpread = 0.18;
  face(m, r, {eyes: 'dot', brow: '#3a3020', nose: skin, noseW: 0.45, tusks: '#f3ead2', mouth: '#2a2018'});
  m.atk = 'punch';
  return r;
}
// mages: robed casters
function mage(m, o) {
  o = o || {};
  const r = hum(m, {leg: 0.32, torso: 0.3, headR: 0.15, skin: o.skin || '#f0c8a0', top: o.top, bot: o.robe, robe: o.robe, robeTaper: 0.6, belt: o.belt || '#d9b44a', sleeve: o.top});
  face(m, r, Object.assign({eyes: 'dot', nose: o.skin || '#e8b890'}, o.face || {}));
  m.atk = o.atk || 'cast';
  return r;
}
function knightBody(m, o) {
  o = o || {};
  const r = hum(m, Object.assign({leg: 0.33, torso: 0.31, headR: 0.14, bulk: 1.15, top: o.plate || '#8f98a6', bot: o.legs || '#5a6270', boot: '#3a3e48', topMat: 'metal', sleeve: o.plate || '#8f98a6', glove: '#5a6270', belt: '#5a3a22'}, o.h || {}));
  EXTRA.pauldrons(m, r, o.plate || '#8f98a6', o.trim || '#d4ad4c');
  EXTRA.tabard(m, r, 'T', o.trim || '#d4ad4c');
  return r;
}
function rider(m, b, o) {
  const r = hum(m, Object.assign({seated: true, y0: b.saddle[1] - 0.26, z0: b.saddle[2], k: 0.8, leg: 0.26}, o));
  m.pivot('body', r.P(0, r.hipY, 0));
  return r;
}
const DONE = r => r;

// ---- roster -----------------------------------------------------------------
const ROSTER = {
  knight: {n: 'Bramble Warden', d: 'Moss-plated guardian with a leaf shield and flanged mace. Holds the line.', b(m) {
    const r = knightBody(m, {plate: '#6f8a5a', legs: '#4a5a3a', trim: '#c9a24a'});
    face(m, r, {eyes: 'dot', stache: '#7a4a2a', nose: '#e8b890'});
    HAT.antler(m, r, '#5d7a4a', '#d9c7a0');
    WPN.mace(m, r, 'R'); WPN.shield(m, r, 'L', {shape: 'leaf'});
    return r;
  }},
  archers: {n: 'Reed Twins', d: 'Twin hooded archers who loose reed arrows from behind the front line.', b(m) {
    const r = hum(m, {leg: 0.34, torso: 0.28, headR: 0.14, bulk: 0.9, skin: '#f0c8a0', top: '#2f8a86', bot: '#3a4a3a', boot: '#5a3a22', belt: '#6b4a2b'});
    m.atk = 'bow'; m.rig.armRestL = -0.6;
    face(m, r, {eyes: 'dot', cheeks: '#f2a08a'});
    HAT.hood(m, r, '#2a6f6c'); EXTRA.quiver(m, r); EXTRA.skirt(m, r, '#2f8a86', 0.12);
    WPN.bow(m, r, 'L');
    return r;
  }},
  skeleton: {n: 'Bone Mite', d: 'Brittle little bone folk with candles melted onto their skulls.', b(m) { const r = mite(m); WPN.dagger(m, r, 'R'); return r; }},
  skeletons: {n: 'Bone Mites', d: 'Three brittle bone folk that swarm a single target.', b(m) { const r = mite(m); WPN.dagger(m, r, 'R'); return r; }},
  skarmy: {n: 'Mite Legion', d: 'A whole candle-lit procession of Bone Mites.', b(m) { const r = mite(m, {flame: '#ffb43a'}); WPN.dagger(m, r, 'R'); return r; }},
  goblins: {n: 'Mudlarks', d: 'Quick frog-folk cutpurses with bone knives.', b(m) { const r = frog(m, {hat: 'leaf'}); WPN.dagger(m, r, 'R'); return r; }},
  speargobs: {n: 'Mudlark Lancers', d: 'Frog-folk that hurl reed javelins from range.', b(m) { const r = frog(m, {hat: 'band', skin: '#8fbf5a'}); m.atk = 'throw'; WPN.spear(m, r, 'R', {len: 0.5, shaft: '#b8a060'}); return r; }},
  minions: {n: 'Slate Gargoyles', d: 'Small stone-winged imps that dive at anything.', b(m) {
    const r = critter(m, {c: '#7a8494', belly: '#a3adbb', headS: 0.3, bodyS: 0.3, wingC: '#5a6474', memb: '#8a7aa8'});
    face(m, r, {eyes: 'glow', eyeC: 'T', mouth: '#2a2a34'});
    m.sym(s => m.seg('head', [s * 0.08, r.headC + 0.1, 0.02], [s * 0.15, r.headC + 0.22, -0.06], 0.025, '#d8d0bc', {t: 0.1}));
    m.atk = 'punch'; return r;
  }},
  bats: {n: 'Paper Kites', d: 'Folded-paper birds with razor creases. Fast, fragile, everywhere.', b(m) {
    m.anim = 'fly'; m.flapHz = 16; m.flapAmp = 0.7; m.atk = 'bite';
    m.pivot('body', [0, 0.55, 0]); m.pivot('wingL', [0.03, 0.56, 0]); m.pivot('wingR', [-0.03, 0.56, 0]); m.pivot('mhead', [0, 0.56, 0.1]);
    m.add('body', 'K4', [0, 0.55, 0], [0.16, 0.5, 0.16], '#f4efe2', {r: [Math.PI / 2, Math.PI / 4, 0]});
    m.add('mhead', 'K4', [0, 0.58, 0.3], [0.1, 0.16, 0.1], 'T', {r: [Math.PI / 2, Math.PI / 4, 0]});
    m.sym(s => m.add(s > 0 ? 'wingL' : 'wingR', 'B', [s * 0.24, 0.56, 0], [0.44, 0.01, 0.26], s > 0 ? '#f4efe2' : '#e8e0cc', {r: [0, s * 0.35, 0], ts: true}));
    m.sym(s => m.add('body', 'S', [s * 0.04, 0.6, 0.2], [0.035, 0.035, 0.02], '#1a1420', {nl: true}));
    m.add('tail', 'B', [0, 0.55, -0.3], [0.2, 0.01, 0.12], 'T', {ts: true}); m.pivot('tail', [0, 0.55, -0.22]);
    return {top_: [0, 0.65, 0]};
  }},
  barbarians: {n: 'Dune Raiders', d: 'Scarf-masked desert fighters with curved blades.', b(m) { const r = raider(m); WPN.scimitar(m, r, 'R'); return r; }},
  giant: {n: 'Mossback Ogre', d: 'A slow, patient ogre who carries a log bundle and only cares about buildings.', b(m) {
    const r = ogre(m, {top: '#6a7a4a'}); EXTRA.logs(m, r); HAT.hair(m, r, '#4a3a22', 'fringe');
    m.add('body', 'B', r.P(0, r.hipY + 0.16, r.td * 0.48), [0.18, 0.18, 0.03], '#8a6a3a', {nl: true});
    return r;
  }},
  musketeer: {n: 'Spark Gunner', d: 'Goggled sharpshooter with a long brass rifle.', b(m) {
    const r = hum(m, {leg: 0.34, torso: 0.3, headR: 0.14, skin: '#e6b48a', top: '#5a4a7a', bot: '#3a3448', boot: '#2a2430', belt: '#b98a3a'});
    m.atk = 'aim'; m.rig.twoHand = true; face(m, r, {eyes: 'dot', nose: '#d8a07a'});
    HAT.hair(m, r, '#c8542a', 'bun'); HAT.goggles(m, r); EXTRA.sash(m, r, 'T');
    WPN.rifle(m, r, 'R', {len: 0.6, scope: true});
    return r;
  }},
  minipekka: {n: 'Clank Squire', d: 'A round little automaton with an oversized cleaver.', b(m) {
    const r = hum(m, {leg: 0.26, torso: 0.28, headR: 0.2, bulk: 1.2, skin: '#5d6878', top: '#4a5462', bot: '#3a424e', boot: '#2a2f38', topMat: 'metal', glove: '#3a424e', sleeve: '#4a5462'});
    m.add('head', 'S', r.P(0, r.headC, 0), [0.42, 0.4, 0.42], '#5d6878', {m: 'metal'});
    face(m, r, {eyes: 'slit', eyeC: 'T'});
    m.add('head', 'C8', r.P(0, r.headC + 0.22, 0), [0.02, 0.1, 0.02], '#3a424e'); m.add('head', 'S', r.P(0, r.headC + 0.28, 0), [0.05, 0.05, 0.05], 'T', {m: 'glow'});
    WPN.cleaver(m, r, 'R', {s: 1.3});
    return r;
  }},
  valkyrie: {n: 'Whirl Dancer', d: 'Spins her twin-bladed glaive through everything around her.', b(m) {
    const r = hum(m, {leg: 0.34, torso: 0.3, headR: 0.14, bulk: 1.05, skin: '#e0a070', top: '#c8642a', bot: '#7a3a1e', boot: '#4a2a1a', belt: '#e2b14a'});
    face(m, r, {eyes: 'dot', brow: '#5a2a12', nose: '#d0905e'});
    HAT.hair(m, r, '#f0d27a', 'braids'); HAT.circlet(m, r, '#d4ad4c'); EXTRA.skirt(m, r, 'T', 0.15);
    WPN.glaive(m, r, 'R');
    return r;
  }},
  hog: {n: 'Beetle Rider', d: 'Charges straight for buildings on an armoured rhino beetle; vaults the river.', b(m) {
    m.atk = 'slam';
    const b = beast(m, {len: 0.72, h: 0.2, w: 0.42, c: '#2a3a5a', shell: '#3a4f7a', legC: '#1a2030', headS: 0.18, horn: '#d8c79a', bodyH: 0.18, tailC: false, legR: 0.035});
    saddle(m, b, '#7a3a22', 'T');
    const r = rider(m, b, {skin: '#c98a5a', top: '#e0c070', bot: '#6a4a2a', boot: '#3a2a1e'});
    face(m, r, {eyes: 'dot', brow: '#2a1a10', beard: '#3a2418', beardL: 0.3});
    HAT.hair(m, r, '#2a1a10', 'mohawk'); WPN.hammer(m, r, 'R', {s: 0.9});
    return r;
  }},
  bomber: {n: 'Fuse Gnome', d: 'A gnome tinker who lobs lit bombs over the line.', b(m) {
    const r = hum(m, {leg: 0.26, torso: 0.26, headR: 0.18, bulk: 0.9, skin: '#f0c090', top: '#7a5a3a', bot: '#4a3a2a', boot: '#2a2020', belt: '#3a2a1e'});
    m.atk = 'throw'; face(m, r, {eyes: 'dot', nose: '#e0a070', noseW: 0.4, beard: '#f0f0f0', beardL: 1});
    HAT.pointy(m, r, 'T', '#3a2a1e', 1.6); EXTRA.pack(m, r, '#6a5a4a');
    WPN.bomb(m, r, 'R');
    return r;
  }},
  wizard: {n: 'Starweaver', d: 'Astronomer-mage who throws bursting starfire.', b(m) {
    const r = mage(m, {top: '#2a3a7a', robe: '#22306a', belt: '#e6c45a'});
    face(m, r, {eyes: 'dot', beard: '#d8d8e0', beardL: 1.1, brow: '#d8d8e0', nose: '#e8b890'});
    HAT.pointy(m, r, '#22306a', '#e6c45a'); WPN.staff(m, r, 'R', {star: '#ffe680'});
    return r;
  }},
  prince: {n: 'Comet Lancer', d: 'A lancer on a mountain goat; builds up speed, then hits with a crushing charge.', b(m) {
    m.atk = 'thrust';
    const b = beast(m, {len: 0.66, h: 0.34, w: 0.3, c: '#e8e0d0', headS: 0.2, curl: '#8a6a4a', snout: '#d8d0c0', mane: '#f8f4ea', legC: '#d8d0c0', hoof: '#4a3a2a'});
    saddle(m, b, '#2a3a6a', 'T');
    const r = rider(m, b, {skin: '#f0c8a0', top: '#d8dde6', bot: '#4a5270', boot: '#2a2a3a', topMat: 'metal', sleeve: '#d8dde6'});
    face(m, r, {eyes: 'dot'}); HAT.greathelm(m, r, '#d8dde6', null, 'T');
    WPN.lance(m, r, 'R');
    return r;
  }},
  witch: {n: 'Grave Florist', d: 'Tends a lantern of green fire and keeps calling up Bone Mites.', b(m) {
    const r = mage(m, {top: '#3a2a4a', robe: '#2e2240', skin: '#d8e0c8', belt: '#7ad06a'});
    face(m, r, {eyes: 'dot', eyeC: '#3a8a3a', nose: '#c8d0b8', cheeks: '#c8a0b0'});
    HAT.hair(m, r, '#6a3a8a', 'long'); HAT.leaf(m, r, '#5a8a4a');
    WPN.staff(m, r, 'R', {lantern: '#8aff7a', crook: true});
    return r;
  }},
  babydragon: {n: 'Puffwyrm', d: 'A chubby flying salamander that puffs splash fire.', b(m) { drake(m, {c: '#e0864a', belly: '#f6d08a', horn: '#f3ead2', spikes: '#b8502a', memb: '#f0b070'}); return {top_: [0, 0.95, 0.3]}; }},
  balloon: {n: 'Sky Barge', d: 'A patched dirigible that drifts to buildings and drops its cargo.', b(m) {
    barge(m, {env: '#e9dcb8'});
    m.add('body', 'S', [0, 0.28, 0], [0.18, 0.18, 0.18], '#25252d', {m: 'gloss'});
    m.add('body', 'S', [0, 0.6, 0.0], [0.12, 0.14, 0.12], '#d8b090', {m: 'skin'});
    HAT.goggles(m, {P: (x, y, z) => [x, y, z], k: 1, headC: 0.6, R: 0.06}, '#9fe8ff');
    return {top_: [0, 1.25, 0]};
  }},
  giantskel: {n: 'Ossuary Titan', d: 'A towering skeleton that carries a caged bomb in its ribs.', b(m) {
    const r = hum(m, {leg: 0.36, torso: 0.32, headR: 0.15, bulk: 1.3, skin: '#ece3cc', top: '#ece3cc', bot: '#d8cfb6', boot: '#d8cfb6', lw: 0.55, ar: 0.65, tw: 0.9});
    for (let i = 0; i < 3; i++) m.add('body', 'R0.08', r.P(0, r.hipY + 0.12 + i * 0.07, 0), [0.32, 0.2, 0.24], '#d8cfb6');
    m.add('body', 'S', r.P(0, r.hipY + 0.16, 0), [0.14, 0.14, 0.14], '#25252d', {m: 'gloss'});
    face(m, r, {eyes: 'glow', eyeC: 'T', mouth: '#3a3028'}); HAT.horned(m, r, '#5a6270');
    m.atk = 'punch';
    return r;
  }},
  golem: {n: 'Quarry Heart', d: 'A slow stone construct around a violet crystal heart; bursts into two Quarry Shards.', b(m) { return golemBody(m, {c: '#9a8f7e', c2: '#766d60', glow: '#b07aff', bulk: 1.15}); }},
  golemite: {n: 'Quarry Shard', d: 'A fragment of a Quarry Heart.', b(m) { return golemBody(m, {c: '#a69a88', c2: '#7d7466', glow: '#c99aff'}); }},
  princess: {n: 'Comet Archer', d: 'Fires burning comet arrows from extreme range.', b(m) {
    const r = hum(m, {leg: 0.34, torso: 0.28, headR: 0.15, bulk: 0.85, skin: '#f4d0b0', top: '#8ad0f0', bot: '#5a8ab0', boot: '#3a4a6a', robe: '#6aaee0', robeTaper: 0.55, belt: '#e6c45a'});
    m.atk = 'bow'; face(m, r, {eyes: 'dot', cheeks: '#f2a08a'}); HAT.hair(m, r, '#3a2a5a', 'ponytail'); HAT.circlet(m, r, '#e6c45a', '#ffe680');
    WPN.bow(m, r, 'L', {c: '#e6c45a', gem: '#ff9a3a', s: 1.15});
    return r;
  }},
  mirror: {n: 'Echo Glass', d: 'A floating hand mirror that echoes your last card.', b(m) {
    m.anim = 'orb'; m.pivot('body', [0, 0.5, 0]);
    m.add('body', 'C20', [0, 0.6, 0], [0.42, 0.04, 0.5], '#d4ad4c', {r: [Math.PI / 2, 0, 0], m: 'metal'});
    m.add('body', 'C20', [0, 0.6, 0.02], [0.36, 0.02, 0.44], '#bfe8ff', {r: [Math.PI / 2, 0, 0], m: 'gloss'});
    m.seg('body', [0, 0.35, 0], [0, 0.15, 0], 0.03, '#d4ad4c', {m: 'metal'});
    return {top_: [0, 0.9, 0]};
  }},
  brawler: {n: 'Mudlark Brawler', d: 'A frog-folk prizefighter with wrapped fists.', b(m) { const r = frog(m, {hat: 'band', top: '#c84a3a'}); m.atk = 'punch'; return r; }},
  souldier: {n: 'Mite Guard', d: 'A Bone Mite with a shield and a short spear.', b(m) { const r = mite(m, {hat: 'helm'}); WPN.spear(m, r, 'R', {len: 0.45}); WPN.shield(m, r, 'L', {s: 0.7, c: '#6d7580'}); return r; }},
  skelgeneral: {n: 'Mite Marshal', d: 'Commands the Mite Legion with a sabre and a plumed helm.', b(m) { const r = mite(m, {hat: 'plume'}); WPN.sword(m, r, 'R', {len: 0.3}); EXTRA.cape(m, r, 'T', 0.35); return r; }},
  shadowskel: {n: 'Shade Mite', d: 'A Bone Mite steeped in violet shadow.', b(m) { const r = mite(m, {bone: '#6a5a8a', flame: '#c77dff', wax: '#3a2a4a'}); WPN.dagger(m, r, 'R'); return r; }},
  tombqueen: {n: 'Crypt Matron', d: 'A tall bone lady in a mourning veil.', b(m) { const r = hum(m, {leg: 0.36, torso: 0.32, headR: 0.15, bulk: 1.1, skin: '#ece3cc', top: '#3a2a4a', bot: '#2a2036', robe: '#2a2036', boot: '#2a2036'}); face(m, r, {eyes: 'glow', eyeC: 'T'}); HAT.veil(m, r, '#4a3a5a'); HAT.crown(m, r, '#9aa0ae'); WPN.staff(m, r, 'R', {orb: 'T'}); return r; }},
  skeletrooper: {n: 'Mite Trooper', d: 'A Bone Mite with a helmet and a stubby musket.', b(m) { const r = mite(m, {hat: 'helm'}); m.atk = 'aim'; WPN.rifle(m, r, 'R', {len: 0.35}); return r; }},
  rhino: {n: 'Iron Rhino', d: 'An armoured rhino that tramples in a straight line.', b(m) { m.atk = 'bite'; beast(m, {len: 0.8, h: 0.3, w: 0.44, c: '#7a7f8a', headS: 0.26, horn: '#e8dcc0', snout: '#8a8f9a', bodyH: 0.24, ears: '#6a6f7a'}); m.add('root', 'H', [0, 0.6, 0], [0.5, 0.3, 0.6], 'T', {m: 'metal'}); return {top_: [0, 0.8, 0]}; }},
  runner: {n: 'Powder Runner', d: 'A frog-folk sprinter carrying a powder keg.', b(m) { const r = frog(m, {hat: 'goggles'}); WPN.bomb(m, r, 'R', {s: 0.22}); return r; }},
  ljghost: {n: 'Timber Wisp', d: 'The ghostly echo of a Timber Brute.', b(m) { const r = ROSTER.lumberjack.b(m); m.parts.forEach(p => { if (typeof p.c !== 'string') p.c = [p.c[0] * 0.5 + 0.35, p.c[1] * 0.5 + 0.45, p.c[2] * 0.5 + 0.5]; }); return r; }},
  decoygob: {n: 'Straw Mudlark', d: 'A straw dummy that draws fire.', b(m) { const r = frog(m, {skin: '#d8c07a', top: '#a88a4a', feet: '#c8a85a'}); return r; }},
  madecoy: {n: 'Scarecrow Decoy', d: 'A painted scarecrow that pulls aggro.', b(m) { const r = hum(m, {leg: 0.34, torso: 0.3, skin: '#d8c07a', top: '#8a6a9a', bot: '#5a4a3a'}); face(m, r, {eyes: 'dot', mouth: '#3a2a20'}); HAT.straw(m, r, '#c8a85a'); return r; }},
  royalgiant: {n: 'Cannon Ogre', d: 'An ogre with a shoulder cannon that shells buildings from range.', b(m) { const r = ogre(m, {skin: '#c8906a', top: '#5a4a7a'}); m.atk = 'aim'; m.rig.twoHand = true; HAT.hair(m, r, '#e0b050', 'spiky'); WPN.handcannon(m, r, 'R', {s: 1.2}); return r; }},
  firecracker: {n: 'Rocket Juggler', d: 'Launches bursting rockets; the recoil skips her backwards.', b(m) { const r = hum(m, {leg: 0.34, torso: 0.28, headR: 0.15, bulk: 0.9, skin: '#f0c8a0', top: '#e0503a', bot: '#3a2a4a', boot: '#2a2030', belt: '#f0d050'}); m.atk = 'aim'; m.rig.twoHand = true; face(m, r, {eyes: 'dot', cheeks: '#f2a08a'}); HAT.hair(m, r, '#2a2a3a', 'bun'); HAT.goggles(m, r, '#ffe680'); WPN.handcannon(m, r, 'R', {c: '#e0503a', band: '#f0d050', s: 0.85}); return r; }},
  recruits: {n: 'Tower Pikes', d: 'Six pike-squires behind tall tower shields.', b(m) { const r = knightBody(m, {plate: '#a8b0bc', trim: '#d8c06a'}); face(m, r, {eyes: 'dot'}); HAT.cap(m, r, 'T'); WPN.spear(m, r, 'R'); WPN.shield(m, r, 'L', {shape: 'tower'}); return r; }},
  royalrecruit: {n: 'Tower Pike', d: 'A pike-squire behind a tall tower shield.', b(m) { return ROSTER.recruits.b(m); }},
  icespirit: {n: 'Frost Mote', d: 'A hopping mote of frost that freezes what it touches.', b(m) { mote(m, {c: '#9fe0ff', glow: '#ffffff', kind: 'ice'}); return {top_: [0, 0.75, 0]}; }},
  firespirit: {n: 'Ember Mote', d: 'A bounding ember that bursts in splash fire.', b(m) { mote(m, {c: '#ff7a2a', glow: '#ffe08a', kind: 'fire'}); return {top_: [0, 0.8, 0]}; }},
  electrospirit: {n: 'Spark Mote', d: 'A crackling mote whose zap chains between targets.', b(m) { mote(m, {c: '#5ab8ff', glow: '#e8fbff', kind: 'spark'}); return {top_: [0, 0.75, 0]}; }},
  healspirit: {n: 'Bloom Mote', d: 'A petal mote that bursts into healing pollen.', b(m) { mote(m, {c: '#ffd04a', glow: '#fff6c0', kind: 'bloom'}); return {top_: [0, 0.75, 0]}; }},
  berserker: {n: 'Frenzy Hatchet', d: 'A wild-haired fighter who chops very fast.', b(m) { const r = hum(m, {leg: 0.34, torso: 0.3, headR: 0.14, skin: '#e8b080', top: '#5a7a3a', bot: '#4a3a2a', boot: '#3a2a1e', belt: '#7a4a2a'}); face(m, r, {eyes: 'dot', brow: '#8a2a1a', mouth: '#3a1a14'}); HAT.hair(m, r, '#e05a2a', 'spiky'); EXTRA.sash(m, r, 'T'); WPN.axe(m, r, 'R', {len: 0.3}); WPN.axe(m, r, 'L', {len: 0.3}); return r; }},
  skelbarrel: {n: 'Mite Kite', d: 'A box kite that drops a crate of Bone Mites on buildings.', b(m) { barge(m, {env: '#d8c0e8', band: 'T'}); m.add('body', 'B', [0, 0.32, 0], [0.22, 0.22, 0.22], '#8a5a32'); return {top_: [0, 1.25, 0]}; }},
  elitebarbs: {n: 'Dune Champions', d: 'Two veteran raiders with twin blades and gilded wraps.', b(m) { const r = raider(m, {bulk: 1.2, top: '#e0b050', wrap: '#f8f0d8'}); WPN.scimitar(m, r, 'R', {blade: '#f0e0a0'}); WPN.scimitar(m, r, 'L', {blade: '#f0e0a0'}); return r; }},
  icegolem: {n: 'Glacier Lump', d: 'A lump of living ice that soaks hits and chills when it breaks.', b(m) { return golemBody(m, {c: '#b8e4f4', c2: '#8ac8e0', glow: '#ffffff', bulk: 0.95}); }},
  megaminion: {n: 'Iron Gargoyle', d: 'A heavy, armour-plated gargoyle.', b(m) { const r = critter(m, {c: '#5a6474', belly: '#8a94a4', headS: 0.3, bodyS: 0.38, wingC: '#3a4454', memb: '#6a5a8a', hz: 10}); face(m, r, {eyes: 'glow', eyeC: 'T'}); m.add('head', 'H', [0, r.headC + 0.03, 0.03], [0.32, 0.22, 0.32], '#8f98a6', {m: 'metal'}); m.atk = 'punch'; return r; }},
  dartgoblin: {n: 'Blowpipe Mudlark', d: 'A frog-folk sniper with a long blowpipe.', b(m) { const r = frog(m, {hat: 'hood', skin: '#6aa84a'}); m.atk = 'aim'; m.rig.twoHand = true; WPN.blowpipe(m, r, 'R'); return r; }},
  furnace: {n: 'Kiln Walker', d: 'A walking clay kiln that belches fire.', b(m) { const r = hum(m, {leg: 0.3, torso: 0.4, headR: 0.12, bulk: 1.4, skin: '#b8603a', top: '#a8583a', bot: '#5a3a2a', boot: '#3a2a1e', chest: 'box'}); m.add('body', 'S', r.P(0, r.hipY + 0.2, r.td * 0.5), [0.16, 0.12, 0.04], '#ffb43a', {m: 'glow'}); face(m, r, {eyes: 'glow', eyeC: '#ffb43a'}); m.atk = 'cast'; return r; }},
  battleram: {n: 'Log Bearers', d: 'Two raiders charging with a capped battering log.', b(m) {
    m.atk = 'thrust'; m.rig.twoHand = true;
    const r = raider(m, {bulk: 0.95});
    m.add('armR', 'C14', [0, 0.45, 0.35], [0.2, 0.9, 0.2], '#8a5a32', {r: [Math.PI / 2, 0, 0]});
    m.add('armR', 'C14t0.7', [0, 0.45, 0.82], [0.24, 0.1, 0.24], '#8f98a6', {r: [Math.PI / 2, 0, 0], m: 'metal'});
    return r;
  }},
  royalhogs: {n: 'Shield Boars', d: 'Four armoured boars that rush buildings.', b(m) { m.atk = 'bite'; beast(m, {len: 0.6, h: 0.22, w: 0.34, c: '#c88a7a', headS: 0.22, snout: '#e0a090', nostril: true, tusk: '#f3ead2', ears: '#b07a6a', bodyH: 0.2}); m.add('root', 'H', [0, 0.42, 0], [0.4, 0.22, 0.46], 'T', {m: 'metal'}); return {top_: [0, 0.62, 0]}; }},
  pekka: {n: 'Iron Sentinel', d: 'A towering suit of black armour with a greatblade. Slow and devastating.', b(m) {
    const r = knightBody(m, {plate: '#3a3f4e', legs: '#2a2e3a', trim: '#7a5aff', h: {bulk: 1.35, headR: 0.13, leg: 0.36}});
    HAT.greathelm(m, r, '#3a3f4e', '#9a7aff'); m.sym(s => m.seg('head', r.P(s * 0.1, r.headC + 0.1, 0), r.P(s * 0.22, r.headC + 0.24, -0.06), 0.03, '#9a7aff', {t: 0.1, m: 'glow'}));
    m.atk = 'two'; m.rig.twoHand = true; WPN.sword(m, r, 'R', {len: 0.6, w: 0.06, blade: '#c8ccd8', guard: '#7a5aff'});
    return r;
  }},
  goblingiant: {n: 'Bog Titan', d: 'A giant swamp frog carrying two Mudlark Lancers in its backpack.', b(m) { const r = frog(m, {skin: '#5a9a4a', top: '#7a5a3a'}); m.scale = 1; m.atk = 'punch'; EXTRA.pack(m, r, '#8a6a3a', 'T'); m.sym(s => m.add('body', 'S', r.P(s * 0.08, r.shY + 0.1, -r.td * 0.9), [0.12, 0.1, 0.1], '#8fbf5a')); return r; }},
  edragon: {n: 'Storm Wyrm', d: 'A blue drake whose lightning chains between three targets.', b(m) { drake(m, {c: '#3a6ad0', belly: '#9ad0ff', horn: '#ffe680', spikes: '#ffe680', memb: '#6a9ae0', tailTip: '#ffe680'}); return {top_: [0, 0.95, 0.3]}; }},
  executioner: {n: 'Reaper Thrower', d: 'A masked brute who throws a returning crescent blade.', b(m) { const r = hum(m, {leg: 0.33, torso: 0.33, headR: 0.14, bulk: 1.35, skin: '#c89070', top: '#3a2a2a', bot: '#2a2020', boot: '#1a1414', belt: '#7a3a22'}); m.atk = 'throw'; HAT.hood(m, r, '#2a2028', false); face(m, r, {eyes: 'glow', eyeC: 'T'}); WPN.sickle(m, r, 'R'); return r; }},
  hunter: {n: 'Boomstick Ranger', d: 'A burly trapper with a wide-flared blunderbuss.', b(m) { const r = hum(m, {leg: 0.33, torso: 0.32, headR: 0.14, bulk: 1.3, skin: '#e0a880', top: '#6a4a2a', bot: '#3a4a3a', boot: '#2a2020', belt: '#3a2a1e'}); m.atk = 'aim'; m.rig.twoHand = true; face(m, r, {eyes: 'dot', beard: '#a05a2a', beardL: 0.9, nose: '#d0906a'}); HAT.fur(m, r, '#8a6a4a', '#6a4a2a'); WPN.rifle(m, r, 'R', {len: 0.4, bore: 0.035, flare: true, barrel: '#5a5a62'}); return r; }},
  bowler: {n: 'Boulder Roller', d: 'A stone-skinned bruiser who bowls boulders through the lane.', b(m) { const r = hum(m, {leg: 0.3, torso: 0.36, headR: 0.13, bulk: 1.5, skin: '#7a8aa8', top: '#5a4a7a', bot: '#3a3a5a', boot: '#2a2a3a'}); m.atk = 'throw'; face(m, r, {eyes: 'dot', brow: '#3a4a6a'}); WPN.bomb(m, r, 'R', {s: 0.28, c: '#9a8f7e'}); return r; }},
  darkprince: {n: 'Basilisk Rider', d: 'A spiked knight on a scaly basilisk; charges and sweeps a splash mace.', b(m) {
    const b = beast(m, {len: 0.76, h: 0.24, w: 0.36, c: '#3a5a4a', belly: '#8aa86a', headS: 0.22, snout: '#4a6a5a', legC: '#2a4a3a', bodyH: 0.2});
    saddle(m, b, '#2a2030', 'T');
    const r = rider(m, b, {skin: '#c8a080', top: '#2a2a34', bot: '#1a1a24', boot: '#1a1a24', topMat: 'metal', sleeve: '#2a2a34'});
    HAT.horned(m, r, '#2a2a34', '#c8c0a8'); m.add('head', 'B', r.P(0, r.headC, r.R * 1.0), [0.1, 0.02, 0.02], 'T', {m: 'glow'});
    WPN.mace(m, r, 'R', {head: '#4a4a56'});
    return r;
  }},
  wallbreakers: {n: 'Powder Runners', d: 'Two frog-folk sprinters that blow up against buildings.', b(m) { return ROSTER.runner.b(m); }},
  egiant: {n: 'Coil Colossus', d: 'A giant with a tesla backpack that zaps anyone who hits it.', b(m) { const r = ogre(m, {skin: '#a0b8d0', top: '#3a4a6a'}); EXTRA.coil(m, r); HAT.goggles(m, r, '#7cf0ff'); return r; }},
  megaknight: {n: 'Anvil Lord', d: 'A massive armoured lord who leaps in with an anvil hammer.', b(m) { const r = knightBody(m, {plate: '#4a4f5e', legs: '#2a2e3a', trim: '#c88a3a', h: {bulk: 1.5, headR: 0.13}}); HAT.horned(m, r, '#4a4f5e', '#c88a3a'); m.add('head', 'B', r.P(0, r.headC, r.R), [0.16, 0.03, 0.02], 'T', {m: 'glow'}); m.atk = 'slam'; WPN.hammer(m, r, 'R', {s: 1.4}); return r; }},
  lumberjack: {n: 'Timber Brute', d: 'A bearded woodsman with a saw-wheel axe; drops a rage tonic.', b(m) { const r = hum(m, {leg: 0.33, torso: 0.31, headR: 0.15, bulk: 1.15, skin: '#f0b890', top: '#c83a3a', bot: '#3a4a6a', boot: '#3a2a1e', belt: '#3a2a1e'}); face(m, r, {eyes: 'dot', beard: '#e8e4d8', beardL: 1.1, nose: '#e0a080', noseW: 0.45}); HAT.cap(m, r, '#3a3a3a'); WPN.saw(m, r, 'R'); return r; }},
  infernodragon: {n: 'Cinder Wyrm', d: 'A soot-black drake whose beam grows hotter the longer it burns.', b(m) { drake(m, {c: '#3a2a2a', belly: '#ff8a3a', horn: '#d8c0a0', spikes: '#ff6a2a', memb: '#7a2a1a', tailTip: '#ff6a2a', eyeC: '#ff6a2a'}); return {top_: [0, 0.95, 0.3]}; }},
  royalghost: {n: 'Veil Duelist', d: 'A phantom fencer who turns invisible between strikes.', b(m) { m.anim = 'ghost'; const r = hum(m, {leg: 0.02, torso: 0.36, headR: 0.15, skin: '#d8f0ff', top: '#b8d8f0', bot: '#a8c8e8', robe: '#a8c8e8', robeTaper: 1.6, robeBot: 0.12, robeR: 0.16}); face(m, r, {eyes: 'glow', eyeC: '#2a4a8a'}); HAT.tophat(m, r, '#2a3a5a', 'T'); WPN.rapier(m, r, 'R'); m.atk = 'thrust'; return r; }},
  magicarcher: {n: 'Prism Archer', d: 'Her prism arrows pierce through everything in a line.', b(m) { const r = hum(m, {leg: 0.35, torso: 0.29, headR: 0.14, skin: '#e8c0a0', top: '#3a8a5a', bot: '#2a4a3a', boot: '#3a2a1e', belt: '#d4ad4c'}); m.atk = 'bow'; face(m, r, {eyes: 'dot', ears: 'elf'}); HAT.hair(m, r, '#f0f0f8', 'ponytail'); EXTRA.cape(m, r, 'T', 0.4); WPN.bow(m, r, 'L', {c: '#9ad0ff', gem: '#c8f0ff', s: 1.2}); return r; }},
  gangspear: {n: 'Mudlark Lancer', d: 'A frog-folk javelin thrower.', b(m) { return ROSTER.speargobs.b(m); }},
  rascalgirl: {n: 'Slingshot Kid', d: 'A scrappy kid with a slingshot.', b(m) { const r = hum(m, {leg: 0.32, torso: 0.27, headR: 0.17, bulk: 0.85, skin: '#f0c8a0', top: '#e0a03a', bot: '#3a5a8a', boot: '#3a2a1e'}); m.atk = 'aim'; face(m, r, {eyes: 'dot', cheeks: '#f2a08a'}); HAT.hair(m, r, '#7a3a1a', 'braids'); WPN.sling(m, r, 'R'); return r; }},
  egolemite: {n: 'Syrup Shard', d: 'A sticky chunk of a Syrup Colossus.', b(m) { return golemBody(m, {c: '#e06ad0', c2: '#b04aa8', glow: '#ffd0ff', bulk: 0.9}); }},
  eblob: {n: 'Syrup Drop', d: 'A wobbling drop of living syrup.', b(m) { mote(m, {c: '#e06ad0', glow: '#ffd0ff', kind: 'bloom'}); m.anim = 'ghost'; return {top_: [0, 0.75, 0]}; }},
  demolisher2: {n: 'Fuse Frog', d: 'A frog-folk with a lit keg who runs at the nearest building.', b(m) { const r = frog(m, {hat: 'goggles', top: '#c84a3a'}); WPN.bomb(m, r, 'R', {s: 0.26}); return r; }},
  bushgob: {n: 'Bush Mudlark', d: 'A frog-folk who was hiding in the shrub.', b(m) { const r = frog(m, {hat: 'leaf', skin: '#5a9a4a'}); WPN.dagger(m, r, 'R'); return r; }},
  lavapup: {n: 'Magma Pup', d: 'A little flying ember hound.', b(m) { const r = critter(m, {c: '#5a3a3a', belly: '#ff8a3a', headS: 0.3, bodyS: 0.3, wingC: '#3a2a2a', memb: '#ff6a2a'}); face(m, r, {eyes: 'glow', eyeC: '#ffd04a'}); return r; }},
  cursedhog: {n: 'Hex Boarlet', d: 'A cursed little boar that runs at buildings.', b(m) { m.atk = 'bite'; beast(m, {len: 0.55, h: 0.2, w: 0.3, c: '#9a7ac8', headS: 0.22, snout: '#c8a8e8', nostril: true, ears: '#7a5aa8'}); return {top_: [0, 0.6, 0]}; }},
  phoenixegg: {n: 'Ember Egg', d: 'A warm egg that hatches back into a Sunflare.', b(m) { m.anim = 'orb'; m.pivot('body', [0, 0.3, 0]); m.add('body', 'S', [0, 0.3, 0], [0.4, 0.55, 0.4], '#ffb43a', {m: 'gloss'}); m.add('body', 'R0.06', [0, 0.32, 0], [0.4, 0.4, 0.4], '#ff6a2a', {m: 'glow'}); return {top_: [0, 0.6, 0]}; }},
  phoenix: {n: 'Sunflare', d: 'A blazing bird that is reborn from its own egg.', b(m) { const r = critter(m, {c: '#ff8a2a', belly: '#ffe08a', headS: 0.26, bodyS: 0.34, wingC: '#ff5a2a', memb: '#ffb43a', hz: 9, span: 0.7}); m.add('head', 'K6', [0, r.headC, 0.18], [0.08, 0.14, 0.08], '#ffd04a', {r: [Math.PI / 2, 0, 0]}); face(m, r, {eyes: 'dot'}); m.atk = 'bite'; return r; }},
  phoenix2: {n: 'Sunflare', d: 'A blazing bird that is reborn from its own egg.', b(m) { return ROSTER.phoenix.b(m); }},
  empressair: {n: 'Aurora Matriarch', d: 'Rides an aurora wyrm in the sky.', b(m) { drake(m, {c: '#7a5ad0', belly: '#f0c8ff', horn: '#ffe680', memb: '#c8a0ff'}); return {top_: [0, 0.95, 0.3]}; }},
  spiritempress: {n: 'Aurora Matriarch', d: 'A spirit queen who fights on foot or calls her aurora wyrm.', b(m) { const r = mage(m, {top: '#7a5ad0', robe: '#5a3aa8', skin: '#f0d8ff'}); HAT.crown(m, r, '#ffe680', '#c8a0ff'); HAT.hair(m, r, '#f8f0ff', 'long'); WPN.staff(m, r, 'R', {orb: '#c8a0ff', ring: '#ffe680'}); m.atk = 'chop'; return r; }},
  gsmonster: {n: 'Stitch Brute', d: "The Mad Tinker's patchwork bruiser.", b(m) { const r = ogre(m, {skin: '#8ab0a0', top: '#5a4a3a'}); m.sym(s => m.seg('head', r.P(s * 0.12, r.headC - 0.05, 0), r.P(s * 0.2, r.headC - 0.05, 0), 0.02, '#c8c0a8', {m: 'metal'})); return r; }},
  goblinstein: {n: 'Mad Tinker', d: 'A goggled tinker who powers his Stitch Brute with lightning.', b(m) { const r = frog(m, {hat: 'goggles', top: '#e8e8e0'}); WPN.staff(m, r, 'R', {orb: '#7cf0ff', len: 0.6}); m.atk = 'cast'; return r; }},
  gsdoctor: {n: 'Mad Tinker', d: 'A goggled tinker.', b(m) { return ROSTER.goblinstein.b(m); }},
  guardienne: {n: 'Shellback Guard', d: 'The Young Marquis\'s turtle-shelled bodyguard.', b(m) { const r = knightBody(m, {plate: '#5a8a6a', trim: '#e6c45a', h: {bulk: 1.4}}); m.add('body', 'H', r.P(0, r.hipY + 0.1, -r.td * 0.4), [0.5, 0.5, 0.34], '#4a7a5a', {r: [-Math.PI / 2, 0, 0], m: 'gloss'}); face(m, r, {eyes: 'dot'}); HAT.greathelm(m, r, '#5a8a6a'); WPN.hammer(m, r, 'R'); return r; }},
  gravskel: {n: 'Bone Mite', d: 'A Bone Mite risen from the grave.', b(m) { return ROSTER.skeleton.b(m); }},
  goblingang: {n: 'Mudlark Gang', d: 'Mudlarks and Lancers together.', b(m) { return ROSTER.goblins.b(m); }},
  rascals: {n: 'Scrapyard Bruiser', d: 'A big kid with a scrap-iron club, backed by two Slingshot Kids.', b(m) { const r = hum(m, {leg: 0.32, torso: 0.32, headR: 0.16, bulk: 1.3, skin: '#f0c8a0', top: '#5a8a3a', bot: '#5a4a3a', boot: '#3a2a1e'}); face(m, r, {eyes: 'dot', cheeks: '#f2a08a'}); HAT.cap(m, r, 'T'); WPN.club(m, r, 'R', {c: '#8a8f9a', spikes: '#5a5a62'}); return r; }},
  skeldragons: {n: 'Bone Wyrmlings', d: 'Two skeletal drakes spitting splash bolts.', b(m) { drake(m, {c: '#e8e0c8', belly: '#c8c0a8', horn: '#8a8070', memb: '#6a5a8a', eyeC: '#7a3aff'}); return {top_: [0, 0.95, 0.3]}; }},
  battlehealer: {n: 'Field Medic', d: 'Heals nearby troops every time she strikes.', b(m) { const r = knightBody(m, {plate: '#e8e0d0', trim: '#5ad07a'}); face(m, r, {eyes: 'dot', cheeks: '#f2a08a'}); HAT.hair(m, r, '#c84a2a', 'bun'); WPN.mace(m, r, 'R', {head: '#e6c45a'}); WPN.lantern(m, r, 'L', {c: '#9dff8a'}); return r; }},
  elixirgolem: {n: 'Syrup Colossus', d: 'Splits into shards and drops when broken — gives the foe syrup.', b(m) { return golemBody(m, {c: '#c858c0', c2: '#9a3a98', glow: '#ffe0ff', bulk: 1.15}); }},
  flyingmachine: {n: 'Gyro Pilot', d: 'A frog-folk pilot in a pedal-powered gyrocopter with a bolt gun.', b(m) {
    m.anim = 'ship'; m.atk = 'aim';
    m.pivot('body', [0, 0.5, 0]); m.pivot('prop', [0, 1.0, 0]);
    m.add('body', 'S', [0, 0.5, 0], [0.42, 0.3, 0.6], '#b88a3a', {m: 'gloss'});
    m.add('body', 'C10', [0, 0.85, 0], [0.04, 0.3, 0.04], '#5a5a62', {m: 'metal'});
    m.sym(s => m.add('prop', 'B', [s * 0.3, 1.0, 0], [0.6, 0.02, 0.08], '#d8d0c0', {r: [0, 0, s * 0.08]}));
    m.add('body', 'C10', [0, 0.5, 0.36], [0.06, 0.3, 0.06], '#3a3a42', {r: [Math.PI / 2, 0, 0], m: 'metal'});
    m.add('body', 'S', [0, 0.72, 0.02], [0.2, 0.2, 0.2], '#7cc35a', {m: 'skin'});
    HAT.goggles(m, {P: (x, y, z) => [x, y, z], k: 1, headC: 0.72, R: 0.1}, '#ffd36a');
    return {top_: [0, 1.05, 0]};
  }},
  demolisher: {n: 'Fuse Tinker', d: 'Lobs bombs, then charges with a keg when hurt.', b(m) { const r = frog(m, {hat: 'goggles', top: '#7a5a3a'}); m.atk = 'throw'; EXTRA.pack(m, r, '#5a3a22'); WPN.bomb(m, r, 'R'); return r; }},
  miniongiant: {n: 'Gargoyle Brute', d: 'A huge flying gargoyle that hurls stones.', b(m) { const r = critter(m, {c: '#6a7484', belly: '#9aa4b4', headS: 0.3, bodyS: 0.44, wingC: '#4a5464', memb: '#7a6a9a', hz: 8, span: 0.75}); face(m, r, {eyes: 'glow', eyeC: 'T'}); m.atk = 'throw'; return r; }},
  susbush: {n: 'Lurking Shrub', d: 'A shrub with eyes. Hides two Bush Mudlarks.', b(m) {
    m.anim = 'beast'; m.pivot('body', [0, 0.3, 0]);
    for (const [x, y, z, s] of [[0, 0.32, 0, 0.62], [0.2, 0.22, 0.1, 0.4], [-0.2, 0.24, 0.05, 0.42], [0, 0.52, -0.05, 0.4]]) m.add('body', 'S', [x, y, z], [s, s * 0.9, s], '#4a8a3a', {m: 'cloth'});
    m.sym(s => { m.add('body', 'S', [s * 0.09, 0.4, 0.3], [0.1, 0.12, 0.05], '#ffffff', {m: 'gloss', nl: true}); m.add('body', 'S', [s * 0.09, 0.39, 0.33], [0.05, 0.06, 0.02], '#1a1420', {nl: true}); });
    return {top_: [0, 0.75, 0]};
  }},
  threemusk: {n: 'Triplet Gunners', d: 'Three Spark Gunner sisters.', b(m) { return ROSTER.musketeer.b(m); }},
  zappies: {n: 'Zap Crawlers', d: 'Little tracked robots with stun coils.', b(m) { m.atk = 'cast'; const c = cart(m, {c: '#5a6478', w: 0.34, len: 0.42, wr: 0.1, wheelC: '#2a2a32'}); m.add('root', 'C12', [0, c.top + 0.15, 0], [0.12, 0.3, 0.12], '#4a4f5a', {m: 'metal'}); m.add('root', 'S', [0, c.top + 0.35, 0], [0.12, 0.12, 0.12], '#7cf0ff', {m: 'glow'}); m.add('root', 'B', [0, c.top + 0.08, 0.2], [0.18, 0.04, 0.02], 'T', {m: 'glow'}); return {top_: [0, c.top + 0.45, 0]}; }},
  cannoncart: {n: 'Cart Cannon', d: 'A rolling cannon that digs in as a turret when its cart breaks.', b(m) { m.atk = 'aim'; const c = cart(m, {c: '#6a4a2a'}); m.add('root', 'C14t0.85', [0, c.top + 0.1, 0.15], [0.18, 0.5, 0.18], '#3c3f48', {r: [Math.PI / 2 - 0.15, 0, 0], m: 'metal'}); m.add('root', 'R0.3', [0, c.top + 0.14, 0.4], [0.16, 0.16, 0.16], 'T', {r: [Math.PI / 2 - 0.15, 0, 0]}); return {top_: [0, c.top + 0.3, 0]}; }},
  guards: {n: 'Brass Guards', d: 'Clockwork soldiers whose shields absorb the first hit.', b(m) { const r = hum(m, {leg: 0.3, torso: 0.26, headR: 0.17, bulk: 0.8, skin: '#c8a050', top: '#b8903a', bot: '#8a6a2a', boot: '#5a4a2a', topMat: 'metal', glove: '#8a6a2a'}); face(m, r, {eyes: 'glow', eyeC: 'T'}); HAT.plume(m, r, 'T'); WPN.spear(m, r, 'R', {len: 0.45}); WPN.shield(m, r, 'L', {c: '#b8903a', emblem: 'T', s: 0.85}); return r; }},
  runegiant: {n: 'Glyph Giant', d: 'A carved giant whose glowing glyphs empower nearby allies.', b(m) { const r = ogre(m, {skin: '#8a94a4', top: '#4a5a6a'}); for (let i = 0; i < 4; i++) m.add('body', 'B', r.P(-0.1 + i * 0.07, r.hipY + 0.22, r.td * 0.5), [0.04, 0.1, 0.02], '#7cf0ff', {m: 'glow', nl: true}); return r; }},
  bandit: {n: 'Dash Thief', d: 'A masked thief who blinks forward with a dagger dash.', b(m) { const r = hum(m, {leg: 0.34, torso: 0.28, headR: 0.14, bulk: 0.9, skin: '#f0c8a0', top: '#3a3a4a', bot: '#2a2a34', boot: '#1a1a20', belt: '#8a3a3a'}); face(m, r, {eyes: 'dot'}); HAT.bandana(m, r, 'T'); m.add('head', 'B', r.P(0, r.headC + r.R * 0.12, r.R * 0.85), [r.R * 2, r.R * 0.4, r.R * 0.4], '#1a1a20'); WPN.dagger(m, r, 'R'); WPN.dagger(m, r, 'L'); return r; }},
  ewiz: {n: 'Volt Mage', d: 'Stuns two targets at once with forked lightning.', b(m) { const r = mage(m, {top: '#3a7ad0', robe: '#2a4a8a', belt: '#7cf0ff'}); HAT.hair(m, r, '#e8f8ff', 'spiky'); face(m, r, {eyes: 'glow', eyeC: '#7cf0ff'}); WPN.wand(m, r, 'R', {tip: '#7cf0ff'}); WPN.wand(m, r, 'L', {tip: '#7cf0ff'}); return r; }},
  fisherman: {n: 'Harpoon Angler', d: 'Reels enemies in with a hooked harpoon.', b(m) { const r = hum(m, {leg: 0.33, torso: 0.31, headR: 0.15, bulk: 1.2, skin: '#e8b080', top: '#e0c03a', bot: '#3a4a6a', boot: '#2a2a3a'}); face(m, r, {eyes: 'dot', beard: '#8a8a90', stache: '#8a8a90', nose: '#d89a70'}); HAT.cap(m, r, '#e0c03a'); m.atk = 'thrust'; WPN.harpoon(m, r, 'R'); return r; }},
  goblinmachine: {n: 'Mudlark Mech', d: 'A walking mech piloted by a Mudlark.', b(m) { const r = hum(m, {leg: 0.4, torso: 0.34, headR: 0.14, bulk: 1.5, skin: '#7cc35a', top: '#8a6a3a', bot: '#5a5a62', boot: '#3a3a42', chest: 'box', glove: '#5a5a62', sleeve: '#5a5a62'}); face(m, r, {eyes: 'frog', lid: '#7cc35a'}); m.atk = 'punch'; return r; }},
  icewiz: {n: 'Rime Mage', d: 'Each frost bolt slows its target.', b(m) { const r = mage(m, {top: '#8ac8f0', robe: '#5aa0d8', skin: '#e0f0ff', belt: '#ffffff'}); face(m, r, {eyes: 'dot', beard: '#ffffff', beardL: 1.3}); HAT.hood(m, r, '#5aa0d8'); WPN.staff(m, r, 'R', {orb: '#c8f0ff'}); return r; }},
  lavahound: {n: 'Magma Hound', d: 'A floating molten beast that bursts into Magma Pups.', b(m) { const r = critter(m, {c: '#4a2a2a', belly: '#ff8a3a', headS: 0.34, bodyS: 0.52, wingC: '#3a2020', memb: '#ff6a2a', hz: 7, span: 0.8}); face(m, r, {eyes: 'glow', eyeC: '#ffd04a', mouth: '#ff6a2a'}); for (let i = 0; i < 4; i++) m.add('body', 'K4', [Math.cos(i * 1.6) * 0.2, 0.75, Math.sin(i * 1.6) * 0.2 - 0.05], [0.07, 0.14, 0.07], '#ff8a3a', {m: 'glow'}); m.atk = 'bite'; return r; }},
  miner: {n: 'Tunnel Mole', d: 'A mole-folk who burrows anywhere on the field.', b(m) { const r = hum(m, {leg: 0.3, torso: 0.3, headR: 0.17, bulk: 1.1, skin: '#8a6a5a', top: '#a87a4a', bot: '#5a4a3a', boot: '#3a2a1e', belt: '#3a2a1e'}); face(m, r, {eyes: 'dot', nose: '#f0a0a8', noseW: 0.35, noseD: 0.5}); HAT.hardhat(m, r, '#e0b03a', '#fff4b0'); WPN.drill(m, r, 'R'); m.atk = 'thrust'; return r; }},
  motherwitch: {n: 'Hex Matron', d: 'Her hexes turn slain foes into Hex Boarlets.', b(m) { const r = mage(m, {top: '#5a2a6a', robe: '#3a1a4a', skin: '#c8d8b0', belt: '#c77dff'}); face(m, r, {eyes: 'dot', nose: '#b8c8a0', noseW: 0.35}); HAT.pointy(m, r, '#3a1a4a', '#c77dff', 2.2); WPN.staff(m, r, 'R', {orb: '#c77dff', crook: true}); return r; }},
  nightwitch: {n: 'Dusk Witch', d: 'Calls Paper Kites out of the dusk.', b(m) { const r = mage(m, {top: '#2a2a4a', robe: '#1a1a34', skin: '#e0d0f0', atk: 'chop'}); face(m, r, {eyes: 'glow', eyeC: 'T'}); HAT.horned(m, r, '#2a2a4a', '#8a7aa8'); EXTRA.wings(m, r, '#2a2a4a', '#5a4a7a', 0.45); WPN.staff(m, r, 'R', {orb: 'T'}); return r; }},
  ramrider: {n: 'Bolas Rider', d: 'Rides a woolly yak at buildings and snares troops with bolas.', b(m) {
    m.atk = 'throw';
    const b = beast(m, {len: 0.72, h: 0.3, w: 0.42, c: '#a8784a', mane: '#c8986a', headS: 0.24, horn: false, curl: '#e8e0d0', snout: '#8a5a3a', bodyH: 0.24});
    saddle(m, b, '#c84a3a', 'T');
    const r = rider(m, b, {skin: '#d8a070', top: '#e0503a', bot: '#5a3a2a', boot: '#3a2a1e'});
    face(m, r, {eyes: 'dot'}); HAT.hair(m, r, '#2a1a10', 'braids'); WPN.sling(m, r, 'R');
    return r;
  }},
  ronin: {n: 'Wandering Blade', d: 'A straw-hatted swordsman who parries and strikes.', b(m) { const r = hum(m, {leg: 0.34, torso: 0.3, headR: 0.14, skin: '#e8c0a0', top: '#4a5a7a', bot: '#2a3048', boot: '#2a2020', belt: 'T'}); face(m, r, {eyes: 'dot', brow: '#1a1a1a'}); HAT.straw(m, r, '#d8c07a'); EXTRA.skirt(m, r, '#2a3048', 0.18); WPN.katana(m, r, 'R'); return r; }},
  sparky: {n: 'Thunder Cart', d: 'A slow-charging coil cart that fires a huge bolt.', b(m) { m.atk = 'aim'; const c = cart(m, {c: '#7a6a5a', len: 0.66}); EXTRA.coil(m, {P: (x, y, z) => [x, y, z], k: 1, shY: c.top + 0.4, hipY: c.top, td: -0.1, tw: 0.3}); m.add('root', 'S', [0, c.top + 0.12, 0.25], [0.18, 0.18, 0.18], '#ffe680', {m: 'glow'}); return {top_: [0, c.top + 0.55, 0]}; }},
  archerqueen: {n: 'Moon Huntress', d: 'A champion archer who cloaks herself and fires a rapid volley.', b(m) { const r = hum(m, {leg: 0.35, torso: 0.29, headR: 0.14, skin: '#e8c8b0', top: '#4a3a7a', bot: '#2a2a4a', boot: '#2a2030', belt: '#e6c45a'}); m.atk = 'bow'; face(m, r, {eyes: 'dot', ears: 'elf'}); HAT.hair(m, r, '#f0f0ff', 'long'); HAT.circlet(m, r, '#e6c45a', '#c8f0ff'); EXTRA.cape(m, r, '#3a2a6a', 0.55); WPN.crossbow(m, r, 'R'); return r; }},
  bossbandit: {n: 'Shadow Boss', d: 'The Dash Thief gang leader; her shadow dash cannot be stopped.', b(m) { const r = ROSTER.bandit.b(m); EXTRA.cape(m, r, '#2a2a34', 0.5); HAT.tophat(m, r, '#1a1a20', 'T'); return r; }},
  goldenknight: {n: 'Sunplate Paladin', d: 'A champion in sun-gold armour whose dash chains between foes.', b(m) { const r = knightBody(m, {plate: '#e0b84a', legs: '#a8842a', trim: '#fff0b0'}); face(m, r, {eyes: 'dot', nose: '#e8b890'}); HAT.hair(m, r, '#f8e8a0', 'long'); HAT.halo(m, r); EXTRA.cape(m, r, 'T', 0.5); WPN.sword(m, r, 'R', {len: 0.5, blade: '#fff4c8'}); return r; }},
  littleprince: {n: 'Young Marquis', d: 'A small noble sharpshooter; his Shellback Guard charges in on call.', b(m) { const r = hum(m, {leg: 0.3, torso: 0.27, headR: 0.17, bulk: 0.85, skin: '#f0d0b0', top: '#e0e0f0', bot: '#3a4a8a', boot: '#2a2a3a', belt: '#e6c45a'}); m.atk = 'aim'; face(m, r, {eyes: 'dot', cheeks: '#f2a08a'}); HAT.hair(m, r, '#e8c060', 'fringe'); HAT.crown(m, r, '#e6c45a', 'T', 0.7); EXTRA.cape(m, r, 'T', 0.4); WPN.crossbow(m, r, 'R'); return r; }},
  mightyminer: {n: 'Drill Foreman', d: 'A champion mole whose drill heats up the longer it bores.', b(m) { const r = ROSTER.miner.b(m); EXTRA.pack(m, r, '#5a5a62', 'T'); return r; }},
  monk: {n: 'Gale Monk', d: 'Deflects projectiles with a spinning staff.', b(m) { const r = hum(m, {leg: 0.33, torso: 0.3, headR: 0.15, bulk: 1.1, skin: '#d8a070', top: '#e08a2a', bot: '#c8702a', boot: '#5a3a22', robe: '#c8702a', robeTaper: 0.7}); face(m, r, {eyes: 'dot', beard: '#ffffff', beardL: 1.4, brow: '#ffffff'}); EXTRA.sash(m, r, 'T'); WPN.glaive(m, r, 'R', {blade: '#8a5a32'}); return r; }},
  skeletonking: {n: 'Ossuary King', d: 'Gathers the souls of the fallen to raise a Mite Legion.', b(m) { const r = hum(m, {leg: 0.34, torso: 0.33, headR: 0.15, bulk: 1.4, skin: '#ece3cc', top: '#3a3a4a', bot: '#2a2a34', boot: '#2a2a34', topMat: 'metal'}); face(m, r, {eyes: 'glow', eyeC: '#7cf0ff', mouth: '#3a3028'}); HAT.crown(m, r, '#9aa0ae', '#7cf0ff', 1.3); EXTRA.cape(m, r, '#2a2a4a', 0.55); WPN.mace(m, r, 'R', {head: '#5a5a6a'}); return r; }},
};
// ---- end roster
// helper units that reuse another design
const ALIAS = {minionhorde: 'minions', goblin: 'goblins', speargob: 'speargobs', barbarian: 'barbarians'};
const NAMES_EXTRA = {};
