/* Contact sheet of every troop model: __qaGallery({variant:'', side:'p', page:0, per:66, yaw:0.5, pose:'idle'|'walk'|'attack'})
   draws a full-window overlay canvas (remove with __qaGallery.clear()). Returns the keys on the page. */
(function () {
  const POSES = {
    idle: {t: 0.4, walk: 0, wp: 0, atk: -1, kick: 0, aim: false, flash: 0},
    walk: {t: 0.4, walk: 1, wp: 1.57, atk: -1, kick: 0, aim: false, flash: 0},
    attack: {t: 0.4, walk: 0, wp: 0, atk: 0.55, kick: 0, aim: true, flash: 0}
  };
  function keys(variant) {
    const out = [];
    for (const k in CARDS) {
      const c = CARDS[k]; if (!c || c.building || c.spell) continue;
      if (!R18.modelFor(k, '')) continue;
      if (variant === 'evo' && !(window.EVOART && EVOART[k])) continue;
      if (variant === 'hero' && !(window.HEROART && HEROART[k])) continue;
      out.push(k);
    }
    return out.sort();
  }
  window.__qaGallery = function (o) {
    o = Object.assign({variant: '', side: 'p', page: 0, per: 66, yaw: 0.5, pose: 'idle', cell: 120}, o || {});
    __qaGallery.clear();
    const all = keys(o.variant), ks = all.slice(o.page * o.per, (o.page + 1) * o.per);
    const W = innerWidth, cols = Math.max(1, Math.floor(W / o.cell)), rows = Math.ceil(ks.length / cols);
    const cv = document.createElement('canvas'), dpr = devicePixelRatio || 1;
    cv.id = 'qa-gallery'; cv.width = W * dpr; cv.height = Math.max(innerHeight, rows * (o.cell + 18)) * dpr;
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;width:' + W + 'px;height:' + (cv.height / dpr) + 'px;background:#5d8f3e';
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = '#6aa046'; g.fillRect(0, 0, W, cv.height);
    ks.forEach((k, i) => {
      const x = (i % cols) * o.cell, y = Math.floor(i / cols) * (o.cell + 18);
      g.fillStyle = (i + Math.floor(i / cols)) % 2 ? '#7cb354' : '#72a84c'; g.fillRect(x, y, o.cell, o.cell + 18);
      const fr = R18.renderFrame(R18.modelFor(k, o.variant), POSES[o.pose], o.side, o.yaw, Math.min(256, Math.round(o.cell * dpr)));
      if (fr) g.drawImage(fr, x, y, o.cell, o.cell);
      g.fillStyle = '#000'; g.font = '600 10px sans-serif'; g.textAlign = 'center';
      g.fillText(k + ' · ' + ((CARDS[k] && CARDS[k].name) || ''), x + o.cell / 2, y + o.cell + 12, o.cell - 4);
    });
    document.body.appendChild(cv);
    return {total: all.length, shown: ks.length, keys: ks};
  };
  window.__qaGallery.clear = function () { const c = document.getElementById('qa-gallery'); if (c) c.remove(); };
  window.__qaGallery.keys = keys;
})();
