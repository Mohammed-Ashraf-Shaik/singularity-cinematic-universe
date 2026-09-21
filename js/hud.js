/* ==========================================================================
   SOLAR SYSTEM 3D // HUD MANAGER & ASTRODYNAMICS TELEMETRY
   NASA/JPL Mission Control Interface, Mode Switcher & Time Warp Engine
   ========================================================================== */

class HUDManager {
  constructor(sceneManager, terminal) {
    this.sm = sceneManager;
    this.terminal = terminal;

    // HUD Elements
    this.hudContainer = document.getElementById('hud-container');
    this.leftRail = document.getElementById('celestial-selector-rail');
    this.scrollList = document.getElementById('celestial-scroll-list');
    this.spectrumCanvas = document.getElementById('audio-spectrum-canvas');
    this.spectrumCtx = this.spectrumCanvas ? this.spectrumCanvas.getContext('2d') : null;

    // Top Telemetry Readouts
    this.simTimeVal = document.getElementById('sim-time-val');
    this.timewarpVal = document.getElementById('timewarp-val');
    this.fpsVal = document.getElementById('fps-val');

    // Scientific Telemetry Card
    this.targetTitle = document.getElementById('target-name');
    this.targetType = document.getElementById('target-type');
    this.targetSymbol = document.getElementById('target-symbol');
    this.statVelocity = document.getElementById('stat-velocity');
    this.statDistance = document.getElementById('stat-distance');
    this.statRadius = document.getElementById('stat-radius');
    this.statMass = document.getElementById('stat-mass');
    this.statGravity = document.getElementById('stat-gravity');
    this.statEscape = document.getElementById('stat-escape');
    this.statTemp = document.getElementById('stat-temp');
    this.statRotation = document.getElementById('stat-rotation');
    this.statTilt = document.getElementById('stat-tilt');
    this.statEccentricity = document.getElementById('stat-eccentricity');
    this.statAtmosphere = document.getElementById('stat-atmosphere');
    this.targetDescription = document.getElementById('target-description');

    // AI Banner & Photos
    this.subtitleText = document.getElementById('ai-subtitle-text');
    this.photoNotice = document.getElementById('photo-flash-notice');

    // State Tracking
    this.isHudVisible = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    this.currentBodyId = 'earth';

    this.initEventListeners();
    this.updateStaticTelemetry('earth');
  }

  // --------------------------------------------------------------------------
  // 1. EVENT LISTENERS & CONTROL BINDINGS
  // --------------------------------------------------------------------------
  initEventListeners() {
    // 1. Line-Wise Celestial Navigation Items
    const navItems = document.querySelectorAll('.act-nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const bodyId = item.getAttribute('data-body');
        if (!bodyId) return;

        this.selectBody(bodyId);
        if (window.audioEngine) {
          window.audioEngine.playHoloBeep(900, 'sine');
        }
      });
    });

    // 2. View Mode Switcher Buttons
    const btnLinewise = document.getElementById('mode-linewise-btn');
    const btnHelio = document.getElementById('mode-helio-btn');
    const btnTour = document.getElementById('mode-tour-btn');

    if (btnLinewise) {
      btnLinewise.addEventListener('click', () => {
        this.sm.stopGrandTour();
        this.sm.setViewMode('linewise');
        this.setModeBtnActive(btnLinewise);
        this.setBannerText('Line-Wise Cosmic Alignment Mode active. Celestial bodies arranged in linear astronomical sequence.');
        if (window.audioEngine) window.audioEngine.playHoloBeep(800, 'sine');
      });
    }

    if (btnHelio) {
      btnHelio.addEventListener('click', () => {
        this.sm.stopGrandTour();
        this.sm.setViewMode('heliocentric');
        this.setModeBtnActive(btnHelio);
        this.setBannerText('Heliocentric Keplerian Orrery active. Celestial bodies orbiting according to true gravitational mechanics.');
        if (window.audioEngine) window.audioEngine.playHoloBeep(1100, 'sine');
      });
    }

    if (btnTour) {
      btnTour.addEventListener('click', () => {
        this.sm.startGrandTour();
        this.setModeBtnActive(btnTour);
        this.setBannerText('Grand Tour Autopilot engaged. Journeying sequentially from the Sun through the outer planets.');
        if (window.audioEngine) window.audioEngine.playBraaam();
      });
    }

    // 3. Time Warp Engine Controls
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        const isPaused = this.sm.togglePause();
        pauseBtn.classList.toggle('active', isPaused);
        pauseBtn.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
      });
    }

    const warpButtons = document.querySelectorAll('.time-btn[data-warp]');
    warpButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        warpButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const warpSpeed = parseFloat(btn.getAttribute('data-warp')) || 1.0;
        this.sm.setTimeWarp(warpSpeed);
        if (this.timewarpVal) {
          this.timewarpVal.textContent = warpSpeed === 365 ? '365× (1s = 1yr)' : `${warpSpeed}× (1s = ${warpSpeed}d)`;
        }
      });
    });

    // 4. Radio Sonification Pulse Button
    const radioBtn = document.getElementById('radio-pulse-btn');
    if (radioBtn) {
      radioBtn.addEventListener('click', () => {
        if (window.audioEngine) {
          window.audioEngine.playPlanetaryRadioWave(this.currentBodyId);
          this.triggerVisualWave();
        }
      });
    }

    // 5. Sound Mute / Unmute Toggle
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        if (window.audioEngine) {
          const isMuted = window.audioEngine.toggleMute();
          soundToggleBtn.textContent = isMuted ? '🔇' : '🔊';
        }
      });
    }

    // 6. Display Layer Toggles (Orbits, Grid, Reset Cam)
    const toggleOrbitsBtn = document.getElementById('toggle-orbits-btn');
    if (toggleOrbitsBtn) {
      toggleOrbitsBtn.addEventListener('click', () => {
        this.sm.showOrbits = !this.sm.showOrbits;
        this.sm.orbitLines.forEach(line => line.visible = this.sm.showOrbits);
        toggleOrbitsBtn.classList.toggle('active', this.sm.showOrbits);
      });
    }

    const toggleGridBtn = document.getElementById('toggle-grid-btn');
    if (toggleGridBtn) {
      toggleGridBtn.addEventListener('click', () => {
        if (this.sm.gridHelper) {
          this.sm.gridHelper.visible = !this.sm.gridHelper.visible;
          toggleGridBtn.classList.toggle('active', this.sm.gridHelper.visible);
        }
      });
    }

    const resetCamBtn = document.getElementById('toggle-cam-view-btn');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        this.sm.focusOn(this.currentBodyId, true);
      });
    }

    // 7. Astrodynamics Terminal Toggle
    const termBtn = document.getElementById('terminal-toggle-btn');
    if (termBtn && this.terminal) {
      termBtn.addEventListener('click', () => {
        this.terminal.toggle();
      });
    }

    // 8. Photo Screenshot Capture
    const photoBtn = document.getElementById('photo-btn');
    if (photoBtn) {
      photoBtn.addEventListener('click', () => {
        this.captureScreenshot();
      });
    }

    // 9. Fullscreen & HUD Hide/Show
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    const hideHudBtn = document.getElementById('hide-hud-btn');
    if (hideHudBtn) {
      hideHudBtn.addEventListener('click', () => this.toggleHUD());
    }

    const unhideHudBtn = document.getElementById('hud-unhide-btn');
    if (unhideHudBtn) {
      unhideHudBtn.addEventListener('click', () => this.toggleHUD());
    }

    // 10. Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === document.getElementById('terminal-input')) return;
      const k = e.key.toLowerCase();

      if (k === 'h') this.toggleHUD();
      else if (k === 'f') this.toggleFullscreen();
      else if (k === 't' && this.terminal) this.terminal.toggle();
      else if (k === 'p') this.captureScreenshot();
      else if (k === ' ') {
        if (pauseBtn) pauseBtn.click();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. CELESTIAL SELECTION & TELEMETRY CARD UPDATING
  // --------------------------------------------------------------------------
  selectBody(bodyId) {
    this.currentBodyId = bodyId;
    this.sm.focusOn(bodyId, true);

    // Update active class on navigation list
    const navItems = document.querySelectorAll('.act-nav-item');
    navItems.forEach((item) => {
      const isTarget = item.getAttribute('data-body') === bodyId;
      item.classList.toggle('active', isTarget);
      if (isTarget) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    this.updateStaticTelemetry(bodyId);

    // Play planetary sonification
    if (window.audioEngine) {
      window.audioEngine.playPlanetaryRadioWave(bodyId);
    }

    // Narrator announcement
    const body = this.sm.celestialBodies[bodyId];
    if (body && window.voiceNarrator) {
      this.setBannerText(`Target locked: ${body.data.name}. Distance: ${body.data.semiMajorAxisAU} AU. ${body.data.desc}`);
    }
  }

  updateStaticTelemetry(bodyId) {
    const body = this.sm.celestialBodies[bodyId];
    if (!body) return;
    const d = body.data;

    if (this.targetTitle) this.targetTitle.textContent = d.name;
    if (this.targetType) this.targetType.textContent = d.type.toUpperCase();
    if (this.targetSymbol) this.targetSymbol.textContent = d.symbol;
    if (this.statRadius) this.statRadius.textContent = `${d.radiusKm.toLocaleString()} km`;
    if (this.statMass) this.statMass.textContent = d.massKg;
    if (this.statGravity) this.statGravity.textContent = d.gravity;
    if (this.statEscape) this.statEscape.textContent = d.escapeVel;
    if (this.statTemp) this.statTemp.textContent = d.meanTemp;
    if (this.statRotation) this.statRotation.textContent = d.rotationPeriod;
    if (this.statTilt) this.statTilt.textContent = d.axialTilt;
    if (this.statEccentricity) this.statEccentricity.textContent = d.eccentricity.toFixed(4);
    if (this.statAtmosphere) this.statAtmosphere.textContent = d.atmosphere;
    if (this.targetDescription) this.targetDescription.textContent = d.desc;
  }

  setModeBtnActive(activeBtn) {
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  setBannerText(text) {
    if (this.subtitleText) {
      this.subtitleText.textContent = text;
    }
  }

  // --------------------------------------------------------------------------
  // 3. REAL-TIME TELEMETRY & AUDIO SPECTRUM ANIMATION
  // --------------------------------------------------------------------------
  update() {
    // 1. Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
      if (this.fpsVal) {
        this.fpsVal.textContent = `${this.fps} FPS`;
      }
    }

    // 2. Update Live Telemetry Metrics
    const telemetry = this.sm.getSelectedTelemetry();
    if (telemetry) {
      if (this.simTimeVal) {
        this.simTimeVal.textContent = `T+ ${telemetry.simTimeDays} DAYS`;
      }
      if (this.statVelocity) {
        this.statVelocity.textContent = `${telemetry.currentVelocityKms} km/s`;
      }
      if (this.statDistance) {
        this.statDistance.textContent = `${telemetry.currentDistanceAU} AU`;
      }

      // Check if Grand Tour has changed the active body
      if (this.sm.cameraMode === 'tour' && this.sm.selectedBodyId !== this.currentBodyId) {
        this.selectBody(this.sm.selectedBodyId);
      }
    }

    // 3. Render Audio Sonification Spectrum
    this.renderAudioVisualizer();
  }

  renderAudioVisualizer() {
    if (!this.spectrumCtx || !this.spectrumCanvas) return;
    const ctx = this.spectrumCtx;
    const w = this.spectrumCanvas.width;
    const h = this.spectrumCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (window.audioEngine && window.audioEngine.analyser && window.audioEngine.dataArray) {
      window.audioEngine.analyser.getByteFrequencyData(window.audioEngine.dataArray);
      const data = window.audioEngine.dataArray;
      const barCount = 18;
      const barWidth = w / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const val = data[i * 2] || (10 + Math.sin(now * 0.01 + i) * 6);
        const barHeight = Math.max((val / 255) * h, 2);
        const x = i * (barWidth + 2);
        const y = h - barHeight;

        ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ffb700';
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    } else {
      // Ambient aesthetic pulsing waves
      const t = performance.now() * 0.003;
      const barCount = 16;
      const barWidth = w / barCount - 2;
      for (let i = 0; i < barCount; i++) {
        const hVal = Math.max((Math.sin(t + i * 0.4) * 0.5 + 0.5) * (h - 4), 3);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(i * (barWidth + 2), h - hVal, barWidth, hVal);
      }
    }
  }

  triggerVisualWave() {
    if (!this.spectrumCanvas) return;
    this.spectrumCanvas.style.filter = 'drop-shadow(0 0 10px #ffb700)';
    setTimeout(() => {
      this.spectrumCanvas.style.filter = 'none';
    }, 400);
  }

  // --------------------------------------------------------------------------
  // 4. SCREENSHOT & MODAL UTILITIES
  // --------------------------------------------------------------------------
  captureScreenshot() {
    try {
      this.sm.renderer.render(this.sm.scene, this.sm.camera);
      const dataURL = this.sm.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `SolarSystem3D_${this.currentBodyId}_${Date.now()}.png`;
      link.href = dataURL;
      link.click();

      if (this.photoNotice) {
        this.photoNotice.classList.add('show');
        setTimeout(() => this.photoNotice.classList.remove('show'), 2400);
      }
      if (window.audioEngine) window.audioEngine.playHoloBeep(1200, 'sine');
    } catch (err) {
      console.warn('Screenshot capture failed:', err);
    }
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
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}
