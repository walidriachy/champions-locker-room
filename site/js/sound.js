// Synthesized sound: room tone, crowd murmur and UI cues. No audio files.
const KEY = 'loker.sound';

class Sound extends EventTarget {
  constructor() {
    super();
    this.on = false;
    try { this.on = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
    this.ctx = null;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    this.fx = ctx.createGain(); this.fx.gain.value = 0.6; this.fx.connect(this.master);

    // brown-noise buffer shared by ambience and whooshes
    const len = ctx.sampleRate * 4; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    this.noise = buf;

    const room = ctx.createBufferSource(); room.buffer = buf; room.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const rg = ctx.createGain(); rg.gain.value = 0.22; room.connect(lp).connect(rg).connect(this.master); room.start();

    const crowd = ctx.createBufferSource(); crowd.buffer = buf; crowd.loop = true; crowd.playbackRate.value = 1.7;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 820; bp.Q.value = 0.8;
    const cg = ctx.createGain(); cg.gain.value = 0.05;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 0.035; lfo.connect(lg).connect(cg.gain); lfo.start();
    crowd.connect(bp).connect(cg).connect(this.master); crowd.start();

    [110, 164.8, 220.5].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = i * 4;
      const g = ctx.createGain(); g.gain.value = 0.012; o.connect(g).connect(this.master); o.start();
    });
    return ctx;
  }

  set(v) {
    this.on = v;
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
    if (v) this.ensure();
    if (this.ctx) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.25);
    this.dispatchEvent(new Event('change'));
  }

  toggle() { this.set(!this.on); }

  tone(freq = 660, dur = 0.07, type = 'sine', vol = 0.18, slide = 0) {
    if (!this.on || !this.ensure()) return;
    const t = this.ctx.currentTime; const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.fx); o.start(t); o.stop(t + dur + 0.02);
  }

  burst(freq = 1200, dur = 0.12, vol = 0.3, q = 1) {
    if (!this.on || !this.ensure()) return;
    const t = this.ctx.currentTime; const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 3;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.fx); s.start(t, Math.random() * 2, dur + 0.05);
  }

  click() { this.tone(1500, 0.03, 'square', 0.05); }
  tick() { this.tone(2400, 0.015, 'square', 0.025); }
  hover() { this.tone(900, 0.04, 'sine', 0.05); }
  whoosh() { this.burst(600, 0.45, 0.35, 0.6); }
  door() { this.burst(260, 0.18, 0.5, 2); this.tone(140, 0.25, 'triangle', 0.12, -60); setTimeout(() => this.tone(520, 0.5, 'sawtooth', 0.025, 140), 60); }
  shut() { this.burst(180, 0.22, 0.6, 1.5); this.tone(95, 0.3, 'triangle', 0.2, -30); }
  kick() { this.burst(300, 0.08, 0.7, 0.9); this.tone(90, 0.12, 'sine', 0.3, -40); }
  cheer() { if (!this.on) return; for (let i = 0; i < 6; i++) setTimeout(() => this.burst(700 + Math.random() * 900, 0.9, 0.18, 0.5), i * 90); }
  chime() { [784, 988, 1175].forEach((f, i) => setTimeout(() => this.tone(f, 0.5, 'sine', 0.08), i * 90)); }
}

export const sound = new Sound();
