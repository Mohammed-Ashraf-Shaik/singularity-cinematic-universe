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
    this.leftRail = document.querySelector('.hud-left-rail');
    this.spectrumCanvas = document.getElementById('audio-spectrum-canvas');
    this.spectrumCtx = this.spectrumCanvas ? this.spectrumCanvas.getContext('2d') : null;
    this.fpsValueEl = document.getElementById('fps-val');
    this.dilationValEl = document.getElementById('dilation-val');
    this.warpSpeedEl = document.getElementById('warp-speed-val');
    this.ringScoreEl = document.getElementById('ring-score-val');
    this.flightReticle = document.getElementById('flight-reticle-hud');
    this.flightHint = document.getElementById('flight-hint');
    this.codexModal = document.getElementById('codex-modal');

    // Telemetry Gauges
    this.shieldValEl = document.getElementById('shield-val');
    this.shieldBarEl = document.getElementById('shield-bar');
    this.deflectorFreqEl = document.getElementById('deflector-freq-val');
    this.tachyonLeakEl = document.getElementById('tachyon-val');
    this.earthDateEl = document.getElementById('earth-date-val');

    // Sound Lab & Photo Mode Elements
    this.soundLabModal = document.getElementById('sound-lab-modal');
    this.soundLabBtn = document.getElementById('sound-lab-btn');
    this.soundLabCloseBtn = document.getElementById('sound-lab-close-btn');
    this.kaossPad = document.getElementById('kaoss-pad');
    this.kaossCrosshair = document.getElementById('kaoss-crosshair');
    this.kaossReadout = document.getElementById('kaoss-readout');
    this.photoBtn = document.getElementById('photo-btn');
    this.photoNotice = document.getElementById('photo-flash-notice');
    this.mobileActsBtn = document.getElementById('mobile-acts-btn');
    this.isDraggingKaoss = false;

    // Letterbox & Aspect Ratio ('16:9', 'cinemascope', 'imax')
    this.aspectRatioMode = '16:9';
    this.isHudVisible = true;

    // Frame metrics
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.lastRenderedScore = 0;

    // Multiverse Codex Planetary Archive Database
    this.codexData = {
      aethel: {
        title: "STELLAR CODEX // EXOPLANET AETHEL-PRIME",
        img: "assets/exoplanet.jpg",
        desc: "Aethel-Prime is a super-terrestrial world orbiting at the inner rim of the Cygnus Rift. Its bioluminescent tectonic continents resonate with sub-space tachyon frequencies, creating perpetual auroral energy rings.",
        mass: "2.48 EARTH MASSES",
        gravity: "1.34 G",
        atmosphere: "N2 / O2 / XENON",
        habitability: "CLASS IX HARMONIC"
      },
      gargantua: {
        title: "STELLAR CODEX // GARGANTUA SINGULARITY",
        img: "assets/nebula.jpg",
        desc: "A supermassive rotating Kerr black hole with a relativistic Doppler accretion disk. Extreme gravitational time dilation warps spacetime, causing 1 local hour to equal 7 Earth years.",
        mass: "100M SOLAR MASSES",
        gravity: "INF / HORIZON",
        atmosphere: "RELATIVISTIC PLASMA",
        habitability: "CLASS 0 // LETHAL"
      },
      neobabylon: {
        title: "STELLAR CODEX // SECTOR 07 NEO-BABYLON",
        img: "assets/cyberpunk.jpg",
        desc: "A dense multi-tiered cyberpunk megalopolis encasing tectonic plate 07. Home to 80 billion sentient neural synthetic entities interconnected via quantum lattice networks.",
        mass: "1.00 EARTH MASS",
        gravity: "0.98 G",
        atmosphere: "CH4 / SMOG / NEON",
        habitability: "CLASS IV INDUSTRIAL"
      },
      dysonsol: {
        title: "STELLAR CODEX // THE DYSON SPHERE SOL",
        img: "assets/dyson.jpg",
        desc: "A Type-II Kardashev megastructure enclosing a hyper-energetic G-type main sequence star. Generates 3.84 × 10^26 Watts of coherent tachyon energy beamed across interstellar relays.",
        mass: "1.989 × 10^30 KG",
        gravity: "27.9 G (STELLAR)",
        atmosphere: "CORONAL PLASMA",
        habitability: "CLASS XII MEGA-CORE"
      },
      stargate: {
        title: "STELLAR CODEX // TACHYON STARGATE",
        img: "assets/stargate.jpg",
        desc: "An ancient macro-engineered wormhole ring stabilized by magnetic chevrons. Bridges physical space with parallel multiverse timelines through a resonant event horizon.",
        mass: "4.2M METRIC TONS",
        gravity: "ARTIFICIAL 1.0 G",
        atmosphere: "EXOTIC VACUUM",
        habitability: "TRANS-DIMENSIONAL"
      },
      pulsar: {
        title: "STELLAR CODEX // PULSAR VOID NURSERY",
        img: "assets/pulsar.jpg",
        desc: "A rapidly rotating neutron star spinning at 716 revolutions per second. Relativistic synchrotron plasma jets sweep across the nebula with intense magnetic flux.",
        mass: "1.44 SOLAR MASSES",
        gravity: "2.0 × 10^11 G",
        atmosphere: "SYNCHROTRON FLUX",
        habitability: "CLASS VII RADIATION"
      },
      tesseract: {
        title: "STELLAR CODEX // 4D TESSERACT PRECURSOR RUINS",
        img: "assets/monolith.jpg",
        desc: "An ancient anti-gravity sanctuary of 12 obsidian monoliths surrounding a levitating 4-dimensional hypercube. Emits sub-quantum resonance harmonizing reality itself.",
        mass: "QUANTUM INDETERMINATE",
        gravity: "ZERO-G / NEGATIVE",
        atmosphere: "TACHYON ETHER",
        habitability: "CLASS 4D TRANSCENDENT"
      }
    };

    // Telemetry Specifications per Act
    this.actTelemetry = {
      1: { dilation: '+7.24 YR/MIN', velocity: '0.88 C', freq: '540 THz', tachyon: '0.00%' },
      2: { dilation: '+1.00 SEC/SEC', velocity: '0.12 C', freq: '620 THz', tachyon: '0.04%' },
      3: { dilation: '10^-43 S', velocity: '0.00 C', freq: '980 THz', tachyon: '0.00%' },
      4: { dilation: 'VARIABLE', velocity: 'MACH 4500', freq: '720 THz', tachyon: '0.12%' },
      5: { dilation: '+1.12 YR/MIN', velocity: '0.45 C', freq: '480 THz', tachyon: '0.00%' },
      6: { dilation: '+0.45 YR/MIN', velocity: '0.30 C', freq: '840 THz', tachyon: '0.01%' },
      7: { dilation: 'LOOP // INF', velocity: 'TACHYON', freq: '999 THz', tachyon: '4.82%' },
      8: { dilation: '+14.8 YR/MIN', velocity: '0.94 C', freq: '880 THz', tachyon: '0.05%' },
      9: { dilation: '4D TESSERACT', velocity: 'NON-LOCAL', freq: '1024 THz', tachyon: '0.00%' }
    };

    this.init();
  }

  init() {
    // 0. Dynamic Earth Date
    if (this.earthDateEl) {
      const d = new Date();
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.earthDateEl.textContent = `${yr}.${mo}.${day}`;
    }

    // 1. Act Nav Buttons
    const navButtons = document.querySelectorAll('.act-nav-item');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const actNum = parseInt(btn.getAttribute('data-act'));
        this.sm.setActiveAct(actNum);
        this.updateNavHighlight(actNum);
        if (this.leftRail && this.leftRail.classList.contains('drawer-open')) {
          this.leftRail.classList.remove('drawer-open');
        }
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
        if (window.audioEngine) window.audioEngine.playHoloBeep(650, 'sine');
      });
    }

    // 10. Codex Planetary Tabs
    const codexTabs = document.querySelectorAll('.codex-tab-btn');
    codexTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        codexTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        this.loadCodexEntry(target);
        if (window.audioEngine) window.audioEngine.playHoloBeep(1100, 'triangle');
      });
    });

    // 11. Fullscreen Toggle
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // 12. Hide/Show HUD Toggle
    const hideHudBtn = document.getElementById('hide-hud-btn');
    if (hideHudBtn) {
      hideHudBtn.addEventListener('click', () => {
        this.toggleHUD();
      });
    }

    const unhideHudBtn = document.getElementById('hud-unhide-btn');
    if (unhideHudBtn) {
      unhideHudBtn.addEventListener('click', () => {
        this.toggleHUD();
        if (window.audioEngine) window.audioEngine.playHoloBeep(950, 'sine');
      });
    }

    // 13. Mobile Acts Drawer Button
    if (this.mobileActsBtn && this.leftRail) {
      this.mobileActsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.leftRail.classList.toggle('drawer-open');
        if (window.audioEngine) window.audioEngine.playHoloBeep(920, 'sine');
      });

      document.addEventListener('click', (e) => {
        if (this.leftRail && this.leftRail.classList.contains('drawer-open')) {
          if (!e.target.closest('.hud-left-rail') && !e.target.closest('#mobile-acts-btn')) {
            this.leftRail.classList.remove('drawer-open');
          }
        }
      });
    }

    // 14. Sound Lab Toggle Buttons
    const soundLabBtns = document.querySelectorAll('#sound-lab-btn, #sound-lab-btn-top, .sound-lab-toggle');
    soundLabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleSoundLab();
      });
    });

    // 15. Sound Lab Close Button
    if (this.soundLabCloseBtn) {
      this.soundLabCloseBtn.addEventListener('click', () => {
        if (this.soundLabModal) this.soundLabModal.classList.remove('active');
        if (window.audioEngine) window.audioEngine.playHoloBeep(600, 'sine');
      });
    }

    // 16. Holographic Kaoss Pad Pointer & Touch Interaction
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

    // 17. Sound Trigger Grid Buttons
    const soundPads = document.querySelectorAll('.sound-pad-btn');
    soundPads.forEach(btn => {
      btn.addEventListener('click', () => {
        const sfx = btn.getAttribute('data-sfx');
        if (!window.audioEngine) return;
        if (sfx === 'braaam') window.audioEngine.playBraaam();
        else if (sfx === 'impact') window.audioEngine.playSubImpact();
        else if (sfx === 'warp') window.audioEngine.playWarpJump();
        else if (sfx === 'laser') window.audioEngine.playLaserVolley();
        else if (sfx === 'explosion') window.audioEngine.playExplosion();
        else if (sfx === 'ping') window.audioEngine.playScannerPing();
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 180);
      });
    });

    // 18. Soundscape Preset Pills
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

    // 19. 4K Cinematic Photo Screenshot Buttons
    const photoBtns = document.querySelectorAll('#photo-btn, #photo-btn-top, .photo-toggle');
    photoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.captureScreenshot();
      });
    });

    // 20. Global Key Shortcuts
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (document.activeElement === document.getElementById('terminal-input')) return;

      // Escape key closes modals and drawers
      if (e.key === 'Escape') {
        if (this.soundLabModal && this.soundLabModal.classList.contains('active')) {
          this.soundLabModal.classList.remove('active');
        }
        if (this.codexModal && this.codexModal.classList.contains('active')) {
          this.codexModal.classList.remove('active');
        }
        if (this.terminal && this.terminal.isOpen) {
          this.terminal.toggle();
        }
        if (this.leftRail && this.leftRail.classList.contains('drawer-open')) {
          this.leftRail.classList.remove('drawer-open');
        }
        return;
      }

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

  loadCodexEntry(key) {
    const item = this.codexData[key];
    if (!item) return;

    const titleEl = document.getElementById('codex-title');
    const imgEl = document.getElementById('codex-img');
    const descEl = document.getElementById('codex-desc');
    const massEl = document.getElementById('codex-mass');
    const gravEl = document.getElementById('codex-gravity');
    const atmoEl = document.getElementById('codex-atmosphere');
    const habEl = document.getElementById('codex-habitability');

    if (titleEl) titleEl.textContent = item.title;
    if (imgEl) imgEl.src = item.img;
    if (descEl) descEl.textContent = item.desc;
    if (massEl) massEl.textContent = item.mass;
    if (gravEl) gravEl.textContent = item.gravity;
    if (atmoEl) atmoEl.textContent = item.atmosphere;
    if (habEl) habEl.textContent = item.habitability;
  }

  toggleHUD() {
    this.isHudVisible = !this.isHudVisible;
    if (this.hudContainer) {
      this.hudContainer.classList.toggle('hud-hidden', !this.isHudVisible);
    }
    const unhideBtn = document.getElementById('hud-unhide-btn');
    if (unhideBtn) {
      unhideBtn.style.display = this.isHudVisible ? 'none' : 'block';
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
      root.style.setProperty('--letterbox-height', '64px');
      if (aspectBtn) aspectBtn.textContent = '2.39:1 CINEMA';
    } else if (this.aspectRatioMode === 'cinemascope') {
      this.aspectRatioMode = 'imax';
      root.style.setProperty('--letterbox-height', '32px');
      if (aspectBtn) aspectBtn.textContent = 'IMAX 1.43:1';
    } else {
      this.aspectRatioMode = '16:9';
      root.style.setProperty('--letterbox-height', '0px');
      if (aspectBtn) aspectBtn.textContent = '16:9 FULL';
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

    const freq = Math.round(120 * Math.pow(20000 / 120, Math.max(0, Math.min(1, nx))));
    const q = (0.5 + Math.max(0, Math.min(1, ny)) * 17.5).toFixed(1);

    if (this.kaossReadout) {
      this.kaossReadout.textContent = `CUTOFF: ${freq.toLocaleString()} Hz | RESONANCE Q: ${q}`;
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

    // Update dynamic telemetry metrics per act
    const telem = this.actTelemetry[actNum];
    if (telem) {
      if (this.dilationValEl) this.dilationValEl.textContent = telem.dilation;
      if (this.deflectorFreqEl) this.deflectorFreqEl.textContent = telem.freq;
      if (this.tachyonLeakEl) this.tachyonLeakEl.textContent = telem.tachyon;
    }

    // Toggle Flight Simulator Reticle and hints if Act IV
    const isAct4 = (actNum === 4);
    if (this.flightReticle) this.flightReticle.classList.toggle('active', isAct4);
    if (this.flightHint) this.flightHint.classList.toggle('active', isAct4);

    // If Act 5, open Codex Modal
    if (this.codexModal) {
      this.codexModal.classList.toggle('active', actNum === 5);
      if (actNum === 5) this.loadCodexEntry('aethel');
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
        const telem = this.actTelemetry[this.sm.currentAct];
        this.warpSpeedEl.textContent = telem ? telem.velocity : '0.88 C';
      }
    }

    if (this.ringScoreEl) {
      if (this.sm.ringScore !== this.lastRenderedScore) {
        this.ringScoreEl.textContent = this.sm.ringScore;
        this.ringScoreEl.classList.remove('score-pop');
        void this.ringScoreEl.offsetWidth; // Trigger reflow for animation restart
        this.ringScoreEl.classList.add('score-pop');
        this.lastRenderedScore = this.sm.ringScore;
      }
    }

    // 3. Update Shield Integrity
    if (this.shieldValEl && this.sm.shieldIntegrity !== undefined) {
      const shield = Math.max(0, Math.min(100, this.sm.shieldIntegrity));
      this.shieldValEl.textContent = `${shield.toFixed(1)}%`;
      if (this.shieldBarEl) {
        this.shieldBarEl.style.width = `${shield}%`;
        this.shieldBarEl.classList.toggle('low-shield', shield < 30);
      }
    }

    // 4. Update Dynamic Flight Reticle Tracking in Act IV
    if (this.flightReticle && this.sm.currentAct === 4 && this.flightReticle.classList.contains('active')) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const leadX = (this.sm.shipPos.x * 24) + (this.sm.mouse.x * 35);
      const leadY = (-this.sm.shipPos.y * 20) + (-this.sm.mouse.y * 30);
      this.flightReticle.style.transform = `translate(calc(-50% + ${leadX.toFixed(1)}px), calc(-50% + ${leadY.toFixed(1)}px))`;
    }

    // 5. Render Real-Time Audio Spectrum
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
