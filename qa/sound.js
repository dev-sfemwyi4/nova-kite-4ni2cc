/* Sound check helpers: inject into a freshly loaded page BEFORE any click (so the AudioContext is still uncreated).
   __snd.state()        -> {ac: AudioContext state or null, soundOn, profileSound, voices}
   __snd.pt(x, y)       -> client coordinates of canvas point (x, y), for a trusted `agent-browser mouse` click
   __snd.muteBtn()      -> client coordinates of the in-battle 🔊 toggle (hit box W-52, 18, 36×32)
   __snd.battle(sec)    -> runs `sec` seconds of a real battle (rendered every 2nd tick) and returns stats
   Every node connected to the destination is also teed into an AnalyserNode, so the peak level proves that
   non-silent samples were generated. That is NOT a human-audible check: no speakers or ears are involved. */
window.__snd = (function () {
  const S = {voices: 0, an: null, peak: 0};
  const conn = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dst) {
    if (dst && dst instanceof AudioDestinationNode) {
      if (!S.an || S.an.context !== dst.context) { S.an = dst.context.createAnalyser(); S.an.fftSize = 2048; }
      S.voices++; conn.call(this, S.an);
    }
    return conn.apply(this, arguments);
  };
  const buf = new Float32Array(2048);
  const level = () => { if (!S.an) return 0; S.an.getFloatTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v)); return m; };
  const pt = (x, y) => { const r = CV.getBoundingClientRect(), s = r.width / W; return {x: Math.round(r.left + x * s), y: Math.round(r.top + y * s)}; };
  return {
    state: () => ({ac: typeof AC !== 'undefined' && AC ? AC.state : null, soundOn, profileSound: profile.sound, voices: S.voices}),
    pt, muteBtn: () => pt(W - 52 + 18, 18 + 16),
    battle(sec) {
      const v0 = S.voices; let peak = 0, nonSilent = 0, samples = 0;
      return new Promise(res => {
        let t = 0;
        const step = () => {
          for (let i = 0; i < 6 && t < sec; i++) {
            if (G.introT > 0) G.introT = 0;
            if (G.selected < 0 && G.you.elixir >= 5) { const h = G.you.hand; for (let j = 0; j < 4; j++) if (CARDS[h[j]] && !CARDS[h[j]].spell && G.you.elixir >= CARDS[h[j]].cost) { G.selected = j; deployPlayer(9, 22); G.selected = -1; break; } }
            update(1 / 30); t += 1 / 30; if (i % 2 === 0) render();
          }
          const l = level(); samples++; if (l > 1e-4) nonSilent++; peak = Math.max(peak, l);
          if (t < sec && G.phase !== 'ended') setTimeout(step, 16); else res(JSON.stringify({sec: Math.round(t), voices: S.voices - v0, peak: +peak.toFixed(4), nonSilentSamples: nonSilent, samples, ac: AC && AC.state, soundOn}));
        };
        step();
      });
    }
  };
})();
1;
