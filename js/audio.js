// All sound is synthesized live with the Web Audio API — no samples.
// Raw square/saw oscillators and filtered noise, monophonic per voice,
// in the spirit of discrete-logic arcade sound boards.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.6;
    this.muted = false;
    this.stepIdx = 0;
    this.ufoNodes = null;
    this._noiseBuf = null;
  }

  // Must be called from a user-gesture handler to satisfy autoplay policy.
  unlock() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
      } catch (e) {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _applyVolume() {
    if (this.master) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : this.volume, this.ctx.currentTime, 0.01);
    }
  }

  setVolume(v) {
    this.volume = Math.min(1, Math.max(0, Math.round(v * 10) / 10));
    this._applyVolume();
    return this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    this._applyVolume();
    return this.muted;
  }

  // One oscillator voice with an exponential-ish decay envelope.
  _tone(type, f0, f1, dur, vol, opts) {
    if (!this.ctx) return;
    opts = opts || {};
    const t0 = this.ctx.currentTime + (opts.delay || 0);
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), t0);
    if (f1 !== f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let head = osc;
    if (opts.lowpass) {
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = opts.lowpass;
      osc.connect(lp);
      head = lp;
    }
    head.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noiseBuffer() {
    if (!this._noiseBuf) {
      const len = this.ctx.sampleRate;
      this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this._noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this._noiseBuf;
  }

  // Filtered white-noise burst with a sweeping filter.
  _noise(dur, vol, f0, f1, type) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer();
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type || 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(f0, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // --- Game voices -------------------------------------------------------

  // Four-step descending bass pulse; the formation drives its cadence.
  stepPulse() {
    const notes = [55, 50, 46, 42];
    const f = notes[this.stepIdx];
    this.stepIdx = (this.stepIdx + 1) % 4;
    this._tone('square', f, f, 0.1, 0.55, { lowpass: 140 });
  }

  playerFire() {
    this._tone('sawtooth', 880, 110, 0.22, 0.22);
    this._noise(0.08, 0.1, 3000, 800);
  }

  bombDrop() {
    this._tone('square', 1500, 900, 0.03, 0.06);
  }

  alienDie() {
    this._noise(0.14, 0.35, 1200, 180);
    this._tone('square', 320, 55, 0.13, 0.25);
  }

  playerDie() {
    this._noise(0.9, 0.5, 900, 70, 'lowpass');
    this._tone('sawtooth', 220, 28, 0.85, 0.3);
  }

  ufoStart() {
    if (!this.ctx || this.ufoNodes) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 420;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 14;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 95;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const gain = this.ctx.createGain();
    gain.gain.value = 0.11;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    lfo.start(t0);
    this.ufoNodes = { osc, lfo, gain };
  }

  ufoStop() {
    if (!this.ufoNodes) return;
    const t = this.ctx.currentTime;
    this.ufoNodes.gain.gain.setTargetAtTime(0, t, 0.02);
    this.ufoNodes.osc.stop(t + 0.1);
    this.ufoNodes.lfo.stop(t + 0.1);
    this.ufoNodes = null;
  }

  ufoHit() {
    this.ufoStop();
    this._tone('sine', 700, 70, 0.5, 0.3);
    this._noise(0.3, 0.25, 1500, 200);
  }

  extraLife() {
    const notes = [523, 659, 880, 1047];
    for (let i = 0; i < notes.length; i++) {
      this._tone('square', notes[i], notes[i], 0.09, 0.2, { delay: i * 0.09 });
    }
  }

  waveStart() {
    this._tone('square', 220, 220, 0.1, 0.2);
    this._tone('square', 330, 330, 0.12, 0.2, { delay: 0.12 });
  }

  gameOver() {
    const notes = [330, 262, 196, 131];
    for (let i = 0; i < notes.length; i++) {
      this._tone('square', notes[i], notes[i], 0.16, 0.22, { delay: i * 0.17 });
    }
  }

  uiBlip() {
    this._tone('square', 700, 700, 0.05, 0.12);
  }
}
