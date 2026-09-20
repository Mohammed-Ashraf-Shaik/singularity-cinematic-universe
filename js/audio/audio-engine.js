/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   Procedural Web Audio Engine (Hans Zimmer Drones, SFX & Real-Time FFT)
   ========================================================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isMuted = false;
    this.masterGain = null;
    this.droneGain = null;
    this.sfxGain = null;
    this.analyser = null;
    this.dataArray = null;

    // Active nodes
    this.droneOscillators = [];
    this.thrusterNoiseNode = null;
    this.thrusterFilter = null;
    this.thrusterGain = null;
    this.chordStep = 0;
    this.chordTimer = null;

    // Cinematic Chord Progressions (Hz)
    // Hans Zimmer style: Dm -> Bb -> F -> C -> Gm
    this.chords = [
      [73.42, 110.00, 146.83, 174.61, 220.00], // D minor
      [58.27, 116.54, 146.83, 174.61, 233.08], // Bb Major
      [87.31, 130.81, 174.61, 220.00, 261.63], // F Major
      [65.41, 130.81, 164.81, 196.00, 261.63], // C Major
      [49.00, 98.00, 146.83, 196.00, 233.08]   // G minor deep
    ];
  }

  async init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output chain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      // Analyzer for visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.85;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Sub-busses
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);

      // Route graph: Drone/SFX -> MasterGain -> Analyser -> Destination
      this.droneGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isInitialized = true;
      this.startAmbientDroneSequence();
      this.initThrusterEngine();
      console.log('🌌 [AudioEngine] Initialized procedural soundscape.');
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  }

  // Hans Zimmer Ambient Drone Sequence
  startAmbientDroneSequence() {
    if (!this.ctx) return;

    const playChord = () => {
      if (this.isMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const chordFreqs = this.chords[this.chordStep % this.chords.length];
      this.chordStep++;

      // Fade out previous oscillators
      this.droneOscillators.forEach(({ osc, gain }) => {
        try {
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 3);
          osc.stop(now + 3.1);
        } catch (e) {}
      });
      this.droneOscillators = [];

      // Create rich detuned unison layers
      chordFreqs.forEach((freq, idx) => {
        // Sub-bass layer for root
        const osc = this.ctx.createOscillator();
        const oscDetune = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        oscDetune.type = 'sawtooth';
        oscDetune.frequency.setValueAtTime(freq, now);
        oscDetune.detune.setValueAtTime(idx === 0 ? 0 : 8 - (idx * 3), now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(idx === 0 ? 120 : 350, now);
        filter.Q.setValueAtTime(2.5, now);

        // Filter slow LFO swell
        filter.frequency.exponentialRampToValueAtTime(idx === 0 ? 180 : 700, now + 4);
        filter.frequency.exponentialRampToValueAtTime(idx === 0 ? 100 : 320, now + 8);

        // Gentle volume swell
        gain.gain.setValueAtTime(0.0001, now);
        const targetVol = idx === 0 ? 0.35 : 0.07;
        gain.gain.exponentialRampToValueAtTime(targetVol, now + 3);

        osc.connect(filter);
        oscDetune.connect(filter);
        filter.connect(gain);
        gain.connect(this.droneGain);

        osc.start(now);
        oscDetune.start(now);

        this.droneOscillators.push({ osc, gain });
        this.droneOscillators.push({ osc: oscDetune, gain });
      });

      // Schedule next chord shift in 9 seconds
      this.chordTimer = setTimeout(playChord, 9000);
    };

    playChord();
  }

  // The Iconic Hans Zimmer "BRAAAM" Horn Blast
  playBraaam() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const distortion = this.ctx.createWaveShaper();
    const gain = this.ctx.createGain();

    // Distortion curve
    const n_samples = 256;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + 15) * x * 20 * (Math.PI / 180)) / (Math.PI + 15 * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.oversample = '4x';

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now); // A1
    osc1.frequency.exponentialRampToValueAtTime(45, now + 2.5);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(55.4, now);
    osc2.detune.setValueAtTime(14, now);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 2.5);

    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(27.5, now); // A0 Sub bass
    oscSub.frequency.exponentialRampToValueAtTime(22.5, now + 2.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 2.8);
    filter.Q.setValueAtTime(6, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.08); // Sharp brass attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    osc1.connect(distortion);
    osc2.connect(distortion);
    oscSub.connect(filter);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);

    osc1.stop(now + 3.3);
    osc2.stop(now + 3.3);
    oscSub.stop(now + 3.3);
  }

  // Hyperspace Jump Sound Effect
  playWarpJump() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(2800, now + 1.2);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 1.2);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.7);

    // Deep sub boom on exit
    setTimeout(() => {
      this.playSubImpact();
    }, 900);
  }

  // Deep Sub Impact Boom
  playSubImpact() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.8);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 2.1);
  }

  // Interactive Flight Thruster Sound Loop
  initThrusterEngine() {
    if (!this.ctx) return;

    // Generate brown/pink noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'lowpass';
    this.thrusterFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    this.thrusterFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.sfxGain);

    whiteNoise.start();
    this.thrusterNoiseNode = whiteNoise;
  }

  // Update thruster sound dynamically by speed
  updateThrusterSound(speedRatio, isBoost = false) {
    if (!this.ctx || !this.thrusterGain) return;

    const now = this.ctx.currentTime;
    const targetGain = this.isMuted ? 0 : Math.min(0.5, speedRatio * 0.35 + (isBoost ? 0.25 : 0));
    const targetFreq = 100 + speedRatio * 450 + (isBoost ? 400 : 0);

    this.thrusterGain.gain.setTargetAtTime(targetGain, now, 0.1);
    this.thrusterFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
  }

  // Holographic UI Chirp
  playHoloBeep(freq = 880, type = 'sine') {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Holographic Sonar Scanner Ping
  playScannerPing() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.8);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  // Toggle Mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  // Real-time FFT Frequency Data for Visualizer
  getFrequencyData() {
    if (!this.analyser || !this.dataArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}

// Global Singleton Export
window.audioEngine = new AudioEngine();
