/* ==========================================================================
   SOLAR SYSTEM 3D // MASTER APPLICATION ENTRY POINT & MAIN LOOP
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  const initModal = document.getElementById('init-modal');
  const reactorBtn = document.getElementById('reactor-btn');
  const subtitleTextEl = document.getElementById('ai-subtitle-text');

  // Link subtitle element to voice narrator
  if (window.voiceNarrator && subtitleTextEl) {
    window.voiceNarrator.setSubtitleElement(subtitleTextEl);
  }

  // Initialize Scene Manager
  const sceneManager = new SceneManager(canvas);
  window.sceneManager = sceneManager;

  // Initialize Holo Terminal
  const holoTerminal = new HoloTerminal(sceneManager);
  window.holoTerminal = holoTerminal;

  // Initialize HUD Manager
  const hudManager = new HUDManager(sceneManager, holoTerminal);
  window.hudManager = hudManager;

  // Engage Simulation / Boot Audio & Visuals
  const engageExperience = async () => {
    // Fade out bootstrap modal immediately
    if (initModal) {
      initModal.classList.add('hidden');
      setTimeout(() => {
        initModal.style.display = 'none';
      }, 450);
    }

    if (window.audioEngine) {
      try {
        await window.audioEngine.init();
        window.audioEngine.playPlanetaryRadioWave('earth');
      } catch (err) {
        console.warn('AudioEngine init error:', err);
      }
    }

    if (window.voiceNarrator) {
      setTimeout(() => {
        try {
          window.voiceNarrator.speak("Astrodynamics engine active. Solar System Keplerian simulation engaged. Welcome to the Solar System 3D Explorer.", true);
        } catch (err) {
          console.warn('Voice narrator error:', err);
        }
      }, 800);
    }
  };

  if (reactorBtn) {
    reactorBtn.addEventListener('click', engageExperience);
  }

  // Keyboard shortcut to start on Space or Enter if modal still visible
  window.addEventListener('keydown', (e) => {
    if (initModal && !initModal.classList.contains('hidden')) {
      if (e.key === 'Enter' || e.key === ' ') {
        engageExperience();
      }
    }
  });

  // Main 60 FPS Render Loop
  function animate() {
    requestAnimationFrame(animate);
    sceneManager.update();
    hudManager.update();
  }

  animate();

  console.log('☀️ [Solar System 3D] Astrodynamics engine active and running at 60 FPS.');
});
