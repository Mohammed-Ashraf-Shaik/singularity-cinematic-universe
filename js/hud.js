/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   HUD Manager (Audio Spectrum, Telemetry, Letterboxing & Flight UI)
   ========================================================================== */

class HUDManager {
  constructor(sceneManager, terminal) {
    this.sm = sceneManager;
    this.terminal = terminal;

    // HUD Elements
    this.hudContainer = document.getElementById('hud-container');
    this.spectrumCanvas = document.getElementById('audio-spectrum-canvas');
    this.spectrumCtx = this.spectrumCanvas ? this.spectrumCanvas.getContext('2d') : null;
    this.fpsValueEl = document.getElementById('fps-val');
    this.dilationValEl = document.getElementById('dilation-val');
    this.warpSpeedEl = document.getElementById('warp-speed-val');
    this.ringScoreEl = document.getElementById('ring-score-val');
    this.flightReticle = document.getElementById('flight-reticle-hud');
    this.flightHint = document.getElementById('flight-hint');
    this.codexModal = document.getElementById('codex-modal');

    // Sound Lab & Photo Mode Elements
    this.soundLabModal = document.getElementById('sound-lab-modal');
    this.soundLabBtn = document.getElementById('sound-lab-btn');
    this.soundLabCloseBtn = document.getElementById('sound-lab-close-btn');
    this.kaossPad = document.getElementById('kaoss-pad');
    this.kaossCrosshair = document.getElementById('kaoss-crosshair');
    this.photoBtn = document.getElementById('photo-btn');
    this.photoNotice = document.getElementById('photo-flash-notice');
    this.isDraggingKaoss = false;

    // Letterbox & Aspect Ratio
    this.aspectRatioMode = '16:9'; // 'cinemascope', '16:9', '4:3'
    this.isHudVisible = true;

    // Frame metrics
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;

    this.init();
  }

  init() {
    // 1. Act Nav Buttons
    const navButtons = document.querySelectorAll('.act-nav-item');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const actNum = parseInt(btn.getAttribute('data-act'));
        this.sm.setActiveAct(actNum);
        this.updateNavHighlight(actNum);
        if (window.audioEngine) window.audioEngine.playHoloBeep(900, 'sine');
      });
    });

    // 2. Camera Director Pills
    const directorBtns = document.querySelectorAll('.director-btn');
    directorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        directorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-cam');
        this.sm.setCameraMode(mode);
        if (window.audioEngine) window.audioEngine.playHoloBeep(1000, 'sine');
      });
    });

    // 3. Aspect Ratio Selector
    const aspectBtn = document.getElementById('aspect-btn');
    if (aspectBtn) {
      aspectBtn.addEventListener('click', () => {
        this.cycleAspectRatio();
        if (window.audioEngine) window.audioEngine.playHoloBeep(850, 'triangle');
      });
    }

    // 4. Audio Mute Button
    const muteBtn = document.getElementById('sound-toggle-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.audioEngine) {
          const isMuted = window.audioEngine.toggleMute();
          muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
        }
      });
    }

    // 5. AI Voice Narrator Button
    const voiceBtn = document.getElementById('voice-toggle-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (window.voiceNarrator) {
          const enabled = window.voiceNarrator.toggleVoice();
          voiceBtn.classList.toggle('active', enabled);
          voiceBtn.textContent = enabled ? 'AI VOICE: ON' : 'AI VOICE: OFF';
        }
      });
    }

    // 6. Terminal Open Button
    const termBtn = document.getElementById('terminal-toggle-btn');
    if (termBtn) {
      termBtn.addEventListener('click', () => {
        this.terminal.toggle();
      });
    }

    // 7. Hans Zimmer BRAAAM Horn Button
    const braaamBtn = document.getElementById('braaam-btn');
    if (braaamBtn) {
      braaamBtn.addEventListener('click', () => {
        if (window.audioEngine) {
          window.audioEngine.playBraaam();
          this.terminal.printLine("SYNTHESIZING HANS ZIMMER BRAAAM HORN BLAST...", "success");
        }
      });
    }

    // 8. Synthwave Beat Toggle Button
    const synthBtn = document.getElementById('synthwave-btn');
    if (synthBtn) {
      synthBtn.addEventListener('click', () => {
        if (window.audioEngine) {
          const active = window.audioEngine.toggleSynthwave();
          synthBtn.classList.toggle('active', active);
          synthBtn.textContent = active ? 'SYNTH: ON' : 'SYNTH [S]';
          if (active) this.terminal.printLine("CYBERPUNK SYNTHWAVE SEQUENCER: ENGAGED [128 BPM]", "success");
        }
      });
    }

    // 9. Codex Close Button
    const codexClose = document.getElementById('codex-close-btn');
    if (codexClose && this.codexModal) {
      codexClose.addEventListener('click', () => {
        this.codexModal.classList.remove('active');
      });
    }

    // 10. Fullscreen Toggle
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // 11. Hide/Show HUD Toggle
    const hideHudBtn = document.getElementById('hide-hud-btn');
    if (hideHudBtn) {
      hideHudBtn.addEventListener('click', () => {
        this.toggleHUD();
      });
    }

    // 12. Sound Lab Toggle Buttons
    const soundLabBtns = document.querySelectorAll('#sound-lab-btn, #sound-lab-btn-top, .sound-lab-toggle');
    soundLabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleSoundLab();
      });
    });

    // 13. Sound Lab Close Button
    if (this.soundLabCloseBtn) {
      this.soundLabCloseBtn.addEventListener('click', () => {
        if (this.soundLabModal) this.soundLabModal.classList.remove('active');
        if (window.audioEngine) window.audioEngine.playHoloBeep(600, 'sine');
      });
    }

    // 14. Holographic Kaoss Pad Pointer Interaction (Cutoff & Resonance Modulation)
    if (this.kaossPad) {
      const onKaossMove = (e) => {
        if (!this.isDraggingKaoss && e.type !== 'pointerdown') return;
        this.handleKaossPointer(e);
      };

      this.kaossPad.addEventListener('pointerdown', (e) => {
        this.isDraggingKaoss = true;
        try { this.kaossPad.setPointerCapture(e.pointerId); } catch (_) {}
        onKaossMove(e);
      });

      this.kaossPad.addEventListener('pointermove', onKaossMove);

      const endKaoss = (e) => {
        if (this.isDraggingKaoss) {
          this.isDraggingKaoss = false;
          try { this.kaossPad.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      this.kaossPad.addEventListener('pointerup', endKaoss);
      this.kaossPad.addEventListener('pointercancel', endKaoss);
    }

    // 15. Sound Trigger Grid Buttons
    const soundPads = document.querySelectorAll('.sound-pad-btn');
    soundPads.forEach(btn => {
      btn.addEventListener('click', () => {
        const sfx = btn.getAttribute('data-sfx');
        if (!window.audioEngine) return;
        if (sfx === 'braaam') window.audioEngine.playBraaam();
        else if (sfx === 'impact') window.audioEngine.playSubImpact();
        else if (sfx === 'warp') window.audioEngine.playWarpJump();
        else if (sfx === 'laser') window.audioEngine.playLaserVolley();
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 180);
      });
    });

    // 16. Soundscape Preset Pills
    const presetPills = document.querySelectorAll('.preset-pill');
    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const preset = pill.getAttribute('data-preset');
        if (window.audioEngine) window.audioEngine.setPreset(preset);
        this.terminal.printLine(`AUDIO PRESET LOADED: [${preset.toUpperCase()}]`, "info");
      });
    });

    // 17. 4K Cinematic Photo Screenshot Buttons
    const photoBtns = document.querySelectorAll('#photo-btn, #photo-btn-top, .photo-toggle');
    photoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.captureScreenshot();
      });
    });

    // Global Key Shortcuts
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (document.activeElement === document.getElementById('terminal-input')) return;

      if (k === 'h') this.toggleHUD();
      else if (k === 'f') this.toggleFullscreen();
      else if (k === 'l') this.toggleSoundLab();
      else if (k === 'p') this.captureScreenshot();
      else if (k === 'o' && this.codexModal) {
        this.codexModal.classList.toggle('active');
        if (window.audioEngine) window.audioEngine.playHoloBeep(1200, 'triangle');
      }
      else if (k === 'm' && window.audioEngine) {
        const isMuted = window.audioEngine.toggleMute();
        if (muteBtn) muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
      } else if (k === 't') {
        this.terminal.toggle();
      } else if (k === 'b' && window.audioEngine) {
        window.audioEngine.playBraaam();
      } else if (k === 's' && window.audioEngine) {
        const active = window.audioEngine.toggleSynthwave();
        if (synthBtn) {
          synthBtn.classList.toggle('active', active);
          synthBtn.textContent = active ? 'SYNTH: ON' : 'SYNTH [S]';
        }
      } else if (e.key === 'Enter' && this.sm.currentAct === 4) {
        this.sm.fireLasers();
      } else if (k === 'c') {
        const modes = ['director', 'trailer', 'cockpit', 'free'];
        const curIdx = modes.indexOf(this.sm.cameraMode);
        const nextMode = modes[(curIdx + 1) % modes.length];
        this.sm.setCameraMode(nextMode);
        const directorBtns = document.querySelectorAll('.director-btn');
        directorBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-cam') === nextMode));
        if (window.audioEngine) window.audioEngine.playHoloBeep(980, 'sine');
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(k)) {
        const act = parseInt(k);
        this.sm.setActiveAct(act);
        this.updateNavHighlight(act);
      }
    });
  }

  toggleHUD() {
    this.isHudVisible = !this.isHudVisible;
    if (this.hudContainer) {
      this.hudContainer.classList.toggle('hud-hidden', !this.isHudVisible);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  }

  cycleAspectRatio() {
    const root = document.documentElement;
    const aspectBtn = document.getElementById('aspect-btn');

    if (this.aspectRatioMode === '16:9') {
      this.aspectRatioMode = 'cinemascope';
      root.style.setProperty('--letterbox-height', '70px');
      if (aspectBtn) aspectBtn.textContent = '2.39:1 CINEMA';
    } else if (this.aspectRatioMode === 'cinemascope') {
      this.aspectRatioMode = '4:3';
      root.style.setProperty('--letterbox-height', '0px');
      if (aspectBtn) aspectBtn.textContent = '16:9 IMAX';
    } else {
      this.aspectRatioMode = '16:9';
      root.style.setProperty('--letterbox-height', '0px');
      if (aspectBtn) aspectBtn.textContent = '16:9 IMAX';
    }
  }

  toggleSoundLab() {
    if (this.soundLabModal) {
      const active = this.soundLabModal.classList.toggle('active');
      if (window.audioEngine) window.audioEngine.playHoloBeep(active ? 1100 : 700, 'triangle');
    }
  }

  handleKaossPointer(e) {
    if (!this.kaossPad) return;
    const rect = this.kaossPad.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const nx = rect.width > 0 ? (x / rect.width) : 0.5;
    const ny = rect.height > 0 ? (1.0 - (y / rect.height)) : 0.5;

    if (this.kaossCrosshair) {
      this.kaossCrosshair.style.left = `${x}px`;
      this.kaossCrosshair.style.top = `${y}px`;
    }

    if (window.audioEngine && typeof window.audioEngine.setFilterParams === 'function') {
      window.audioEngine.setFilterParams(nx, ny);
    }
  }

  captureScreenshot() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    if (window.audioEngine && typeof window.audioEngine.playShutterChirp === 'function') {
      window.audioEngine.playShutterChirp();
    } else if (window.audioEngine) {
      window.audioEngine.playHoloBeep(1400, 'sine');
    }

    if (this.photoNotice) {
      this.photoNotice.classList.add('show');
      setTimeout(() => {
        this.photoNotice.classList.remove('show');
      }, 2500);
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `AETHEL_ACT0${this.sm.currentAct}_${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.warn('Screenshot download blocked:', err);
    }
  }

  updateNavHighlight(actNum) {
    const navButtons = document.querySelectorAll('.act-nav-item');
    navButtons.forEach(btn => {
      const btnAct = parseInt(btn.getAttribute('data-act'));
      btn.classList.toggle('active', btnAct === actNum);
    });

    // Toggle Flight Simulator Reticle and hints if Act IV
    const isAct4 = (actNum === 4);
    if (this.flightReticle) this.flightReticle.classList.toggle('active', isAct4);
    if (this.flightHint) this.flightHint.classList.toggle('active', isAct4);

    // If Act 5, open Codex Modal
    if (this.codexModal) {
      this.codexModal.classList.toggle('active', actNum === 5);
    }
  }

  update() {
    // 1. Calculate FPS
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFrameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
      if (this.fpsValueEl) this.fpsValueEl.textContent = `${this.fps} FPS`;
    }

    // 2. Update Flight Speed & Score
    if (this.warpSpeedEl) {
      if (this.sm.currentAct === 4) {
        const isBoosting = !!this.sm.keys[' '];
        const machSpeed = isBoosting ? 9999 : 4500;
        this.warpSpeedEl.textContent = `MACH ${machSpeed}`;
      } else {
        this.warpSpeedEl.textContent = `0.88 C`;
      }
    }

    if (this.ringScoreEl) {
      this.ringScoreEl.textContent = this.sm.ringScore;
    }

    // 3. Render Real-Time Audio Spectrum
    this.renderAudioSpectrum();
  }

  renderAudioSpectrum() {
    if (!this.spectrumCtx || !window.audioEngine) return;

    const data = window.audioEngine.getFrequencyData();
    const ctx = this.spectrumCtx;
    const width = this.spectrumCanvas.width;
    const height = this.spectrumCanvas.height;

    ctx.clearRect(0, 0, width, height);

    const barCount = 16;
    const barWidth = (width / barCount) - 2;

    for (let i = 0; i < barCount; i++) {
      let val = data ? (data[i * 2] / 255.0) : 0.05;
      if (window.audioEngine.isMuted) val = 0.04;

      const barHeight = Math.max(3, val * height);
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      // Glowing gradient from cyan to purple
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(1, '#b026ff');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.shadowBlur = 0;
    }
  }
}

window.HUDManager = HUDManager;
