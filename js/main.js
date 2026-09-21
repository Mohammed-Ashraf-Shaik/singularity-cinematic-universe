/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   Master Application Entry Point & Main Loop
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

  // Initialize Holo Terminal
  const holoTerminal = new HoloTerminal(sceneManager);

  // Initialize HUD Manager
  const hudManager = new HUDManager(sceneManager, holoTerminal);

  // Engage Reactor / Boot Audio & Visuals
  const engageExperience = async () => {
    // Fade out bootstrap modal immediately
    if (initModal) {
      initModal.classList.add('hidden');
    }

    if (window.audioEngine) {
      try {
        await window.audioEngine.init();
        window.audioEngine.playBraaam();
      } catch (err) {
        console.warn('AudioEngine init error:', err);
      }
    }

    if (window.voiceNarrator) {
      setTimeout(() => {
        try {
          window.voiceNarrator.speak("Singularity Protocol engaged. All quantum cores synchronized. Welcome to Project Aethel.", true);
        } catch (err) {
          console.warn('Voice narrator error:', err);
        }
      }, 1000);
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

  console.log('🌌 [Project Aethel] Core systems active and running at 60 FPS.');
});
