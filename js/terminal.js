/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   Interactive Holo-Terminal (CLI Diagnostics, Warp Commands & Easter Eggs)
   ========================================================================== */

class HoloTerminal {
  constructor(sceneManager) {
    this.sm = sceneManager;
    this.modal = document.getElementById('terminal-modal');
    this.body = document.getElementById('terminal-body');
    this.input = document.getElementById('terminal-input');
    this.isOpen = false;
    this.history = [];
    this.historyIndex = -1;

    this.init();
  }

  init() {
    if (!this.input) return;

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = this.input.value.trim();
        if (cmd) {
          this.execute(cmd);
          this.history.push(cmd);
          this.historyIndex = this.history.length;
          this.input.value = '';
        }
      } else if (e.key === 'ArrowUp') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex] || '';
        } else {
          this.historyIndex = this.history.length;
          this.input.value = '';
        }
      }
    });

    // Close button
    const closeBtn = document.getElementById('terminal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle());
    }

    this.printLine("PROJECT AETHEL OS v4.9.2 // QUANTUM TERMINAL ONLINE", "system");
    this.printLine("Type 'help' for available vessel directives and protocols.", "cyan");
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.modal) {
      if (this.isOpen) {
        this.modal.classList.remove('terminal-closed');
        this.input.focus();
        if (window.audioEngine) window.audioEngine.playHoloBeep(1100, 'triangle');
      } else {
        this.modal.classList.add('terminal-closed');
      }
    }
  }

  printLine(text, type = "") {
    if (!this.body) return;
    const div = document.createElement('div');
    div.className = `term-line ${type}`;
    div.textContent = text;
    this.body.appendChild(div);
    this.body.scrollTop = this.body.scrollHeight;
  }

  execute(cmdLine) {
    this.printLine(`> ${cmdLine}`, "warning");

    const parts = cmdLine.toLowerCase().split(' ');
    const cmd = parts[0];
    const arg = parts[1];

    if (window.audioEngine) window.audioEngine.playHoloBeep(750, 'sine');

    switch (cmd) {
      case 'help':
        this.printLine("--- AETHEL DIRECTIVES MENU ---", "system");
        this.printLine("  warp <1-9>       : Hyperjump directly to specified Act (1-9)", "cyan");
        this.printLine("  blackhole        : Jump to Gargantua Event Horizon (Act 1)", "cyan");
        this.printLine("  cyberpunk        : Jump to Sector 07 Neo-Babylon Megacity (Act 2)", "cyan");
        this.printLine("  quantum          : Jump to Quantum Calabi-Yau Core (Act 3)", "cyan");
        this.printLine("  flight           : Launch Hyperspace Flight Simulator (Act 4)", "cyan");
        this.printLine("  codex            : Access Multiverse Planetary Archive (Act 5)", "cyan");
        this.printLine("  dyson            : Jump to The Dyson Sphere Stellar Harvester (Act 6)", "cyan");
        this.printLine("  stargate         : Jump to The Tachyon Stargate Event Horizon (Act 7)", "cyan");
        this.printLine("  pulsar           : Jump to The Pulsar Void Nursery (Act 8)", "cyan");
        this.printLine("  ruins            : Jump to 4D Tesseract Precursor Sanctuary (Act 9)", "cyan");
        this.printLine("  fire             : Discharge dual plasma photon cannons (Act 4)", "cyan");
        this.printLine("  boost            : Toggle vessel hyperdrive booster (Act 4)", "cyan");
        this.printLine("  synthwave        : Toggle 128 BPM cyberpunk procedural sequencer", "cyan");
        this.printLine("  braaam           : Synthesize Hans Zimmer cinematic horn blast", "cyan");
        this.printLine("  soundlab         : Toggle Holographic Kaoss Pad & Audio Studio", "cyan");
        this.printLine("  photo            : Capture 4K cinematic wallpaper screenshot", "cyan");
        this.printLine("  preset <name>    : Audio preset ('interstellar', 'bladerunner', 'darkvoid', 'supernova')", "cyan");
        this.printLine("  light <mode>     : Lighting mode ('void', 'eclipse', 'neon', 'supernova')", "cyan");
        this.printLine("  camera <mode>    : Camera mode ('director', 'trailer', 'cockpit', 'free')", "cyan");
        this.printLine("  aspect           : Cycle aspect ratio (16:9 Full / 2.39:1 Cinema / IMAX)", "cyan");
        this.printLine("  hud              : Toggle HUD visibility", "cyan");
        this.printLine("  fullscreen       : Toggle display fullscreen", "cyan");
        this.printLine("  mute             : Toggle audio soundscape mute", "cyan");
        this.printLine("  voice            : Toggle onboard AI voice broadcast", "cyan");
        this.printLine("  status           : Display vessel telemetry, shields, and coordinates", "cyan");
        this.printLine("  time             : Measure relativistic time dilation", "cyan");
        this.printLine("  shields          : Recalibrate and recharge deflector harmonics", "cyan");
        this.printLine("  matrix           : Decrypt quantum matrix transmission", "cyan");
        this.printLine("  lore             : Read Project Aethel historical logbook", "cyan");
        this.printLine("  clear            : Clear screen buffer", "cyan");
        break;

      case 'light':
      case 'lighting':
        if (['void', 'eclipse', 'neon', 'supernova'].includes(arg)) {
          this.sm.setLightingPreset(arg);
          this.printLine(`Atmospheric lighting recalibrated to: ${arg.toUpperCase()}`, "success");
        } else {
          this.printLine("Usage: light void | eclipse | neon | supernova", "error");
        }
        break;

      case 'preset':
        if (['interstellar', 'bladerunner', 'darkvoid', 'supernova'].includes(arg) && window.audioEngine) {
          window.audioEngine.setPreset(arg);
          const pills = document.querySelectorAll('.preset-pill');
          pills.forEach(p => p.classList.toggle('active', p.getAttribute('data-preset') === arg));
          this.printLine(`Audio soundscape preset activated: [${arg.toUpperCase()}]`, "success");
        } else {
          this.printLine("Usage: preset interstellar | bladerunner | darkvoid | supernova", "error");
        }
        break;

      case 'warp':
        const actNum = parseInt(arg);
        if (actNum >= 1 && actNum <= 9) {
          this.sm.setActiveAct(actNum);
          const navItems = document.querySelectorAll('.act-nav-item');
          navItems.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-act')) === actNum);
          });
          this.printLine(`WARP ENGAGED: Hyperjump to Act ${actNum} complete.`, "success");
        } else {
          this.printLine("Error: Specify act number 1 to 9 (e.g. 'warp 8')", "error");
        }
        break;

      case 'blackhole':
      case 'singularity':
      case 'gargantua':
        this.sm.setActiveAct(1);
        this.printLine("Course plotted: Gargantua Event Horizon (Act 1).", "success");
        break;

      case 'cyberpunk':
      case 'city':
      case 'megalopolis':
        this.sm.setActiveAct(2);
        this.printLine("Course plotted: Sector 07 Neo-Babylon (Act 2).", "success");
        break;

      case 'quantum':
      case 'lattice':
      case 'core':
        this.sm.setActiveAct(3);
        this.printLine("Course plotted: Calabi-Yau Quantum Core (Act 3).", "success");
        break;

      case 'flight':
      case 'runner':
      case 'simulator':
        this.sm.setActiveAct(4);
        this.printLine("Hyperspace Flight Simulator active (Act 4). Steer with WASD or arrows.", "success");
        break;

      case 'codex':
      case 'planet':
      case 'archive':
        this.sm.setActiveAct(5);
        this.printLine("Accessing Multiverse Planetary Archive (Act 5)...", "success");
        const codexModal = document.getElementById('codex-modal');
        if (codexModal) codexModal.classList.add('active');
        break;

      case 'dyson':
      case 'star':
      case 'harvester':
        this.sm.setActiveAct(6);
        this.printLine("Course plotted: The Dyson Sphere Stellar Harvester (Act 6).", "success");
        break;

      case 'stargate':
      case 'portal':
      case 'rift':
        this.sm.setActiveAct(7);
        this.printLine("Course plotted: Tachyon Stargate Multiverse Portal (Act 7).", "success");
        break;

      case 'pulsar':
      case 'cradle':
      case 'nebula':
        this.sm.setActiveAct(8);
        this.printLine("Course plotted: Pulsar Void Nursery (Act 8).", "success");
        break;

      case 'ruins':
      case 'tesseract':
      case 'sanctuary':
      case 'monolith':
      case 'precursor':
        this.sm.setActiveAct(9);
        this.printLine("Course plotted: 4D Tesseract Precursor Sanctuary (Act 9).", "success");
        break;

      case 'fire':
      case 'laser':
        if (this.sm.currentAct === 4) {
          this.sm.fireLasers();
          this.printLine("FIRING DUAL PLASMA CANNONS...", "warning");
        } else {
          this.printLine("Notice: Weapons online only in Act 4 (Hyperspace Flight).", "error");
        }
        break;

      case 'boost':
      case 'throttle':
        if (this.sm.currentAct === 4) {
          this.sm.keys[' '] = !this.sm.keys[' '];
          this.printLine(`Hyperspace Booster: ${this.sm.keys[' '] ? 'ENGAGED [MACH 9999]' : 'CRUISING [MACH 4500]'}`, "success");
        } else {
          this.printLine("Notice: Hyperdrive booster online only in Act 4.", "error");
        }
        break;

      case 'synthwave':
      case 'beat':
        if (window.audioEngine) {
          const active = window.audioEngine.toggleSynthwave();
          const synthBtn = document.getElementById('synthwave-btn');
          if (synthBtn) {
            synthBtn.classList.toggle('active', active);
            synthBtn.textContent = active ? 'SYNTH: ON' : 'SYNTH [S]';
          }
          this.printLine(`Cyberpunk Synthwave: ${active ? 'ENGAGED [128 BPM]' : 'PAUSED'}`, "success");
        }
        break;

      case 'braaam':
      case 'horn':
        if (window.audioEngine) {
          window.audioEngine.playBraaam();
          this.printLine("SYNTHESIZING HANS ZIMMER BRAAAM HORN BLAST...", "success");
        }
        break;

      case 'soundlab':
      case 'lab':
      case 'kaoss':
        const labModal = document.getElementById('sound-lab-modal');
        if (labModal) {
          const active = labModal.classList.toggle('active');
          this.printLine(`Sound Lab & Kaoss Pad: ${active ? 'OPEN' : 'CLOSED'}`, "success");
        }
        break;

      case 'photo':
      case 'screenshot':
        const photoBtn = document.getElementById('photo-btn');
        if (photoBtn) photoBtn.click();
        this.printLine("Capturing 4K Cinematic Frame Screenshot...", "success");
        break;

      case 'aspect':
        const aspectBtn = document.getElementById('aspect-btn');
        if (aspectBtn) aspectBtn.click();
        this.printLine(`Aspect Ratio cycled to: ${aspectBtn ? aspectBtn.textContent : 'MODE'}`, "cyan");
        break;

      case 'hud':
        const hudBtn = document.getElementById('hide-hud-btn');
        if (hudBtn) hudBtn.click();
        this.printLine("HUD Display toggled.", "cyan");
        break;

      case 'fullscreen':
        const fsBtn = document.getElementById('fullscreen-btn');
        if (fsBtn) fsBtn.click();
        this.printLine("Fullscreen mode toggled.", "cyan");
        break;

      case 'mute':
      case 'unmute':
      case 'sound':
        const muteBtn = document.getElementById('sound-toggle-btn');
        if (muteBtn) muteBtn.click();
        this.printLine("Audio soundscape toggled.", "cyan");
        break;

      case 'voice':
        const voiceBtn = document.getElementById('voice-toggle-btn');
        if (voiceBtn) voiceBtn.click();
        this.printLine("AI Voice Narrator broadcast toggled.", "cyan");
        break;

      case 'camera':
      case 'cam':
        if (['director', 'trailer', 'cockpit', 'free'].includes(arg)) {
          this.sm.setCameraMode(arg);
          const directorBtns = document.querySelectorAll('.director-btn');
          directorBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-cam') === arg));
          this.printLine(`Camera mode switched to: [${arg.toUpperCase()}]`, "success");
        } else {
          this.printLine("Usage: camera director | trailer | cockpit | free", "error");
        }
        break;

      case 'status':
      case 'diagnostics':
        this.printLine("--- VESSEL DIAGNOSTIC TELEMETRY ---", "system");
        this.printLine(`Active Coordinates: ACT 0${this.sm.currentAct} / 09`, "cyan");
        this.printLine("Tachyon Core: 100% OPERATIONAL (Zero Flux)", "success");
        this.printLine(`Sub-Space Shields: ${this.sm.shieldIntegrity ? this.sm.shieldIntegrity.toFixed(1) : '100.0'}% STABLE`, "success");
        this.printLine("Life Support: OPTIMAL (Atmosphere 1.02 atm)", "cyan");
        this.printLine("Audio Synthesizer: 64-band procedural WebAudio ACTIVE", "cyan");
        break;

      case 'time':
        this.printLine("--- RELATIVISTIC TIME DILATION ---", "system");
        this.printLine(`Current Act: ${this.sm.currentAct}`, "cyan");
        const dilations = {
          1: "+7.24 Earth Years per Local Minute (Gargantua Singularity)",
          2: "+1.00 Sec/Sec Standard Earth Baseline (Sector 07)",
          3: "10^-43 Seconds Quantum Planck Era (Calabi-Yau Core)",
          4: "Mach 9999 Hyperluminal Warp Field",
          5: "+1.12 Earth Years per Local Minute (Cygnus Rift)",
          6: "+0.45 Earth Years per Local Minute (Dyson Swarm Sol)",
          7: "Infinite Tachyon Causal Loop (Stargate Horizon)",
          8: "+14.8 Earth Years per Local Minute (Relativistic Pulsar Jet)",
          9: "Non-Linear 4-Dimensional Tesseract Time"
        };
        this.printLine(`Dilation Factor: ${dilations[this.sm.currentAct] || 'Standard'}`, "warning");
        break;

      case 'shields':
      case 'repair':
        this.printLine("Cycling deflector frequencies: 440nm -> 520nm -> 680nm...", "system");
        if (window.audioEngine) window.audioEngine.playScannerPing();
        this.sm.shieldIntegrity = 100.0;
        setTimeout(() => {
          this.printLine("Deflector shield harmonic resonance locked at 100.0%.", "success");
        }, 400);
        break;

      case 'matrix':
        this.printLine("01000001 01000101 01010100 01001000 01000101 01001100", "success");
        this.printLine("ACCESS GRANTED: You have unlocked the Singularity Protocol core loop.", "cyan");
        break;

      case 'lore':
        this.printLine("--- ARCHIVE RECORD: YEAR 2284 ---", "system");
        this.printLine("When humanity pushed past the Oort Cloud, they encountered", "cyan");
        this.printLine("the Singularity Gateway. It was neither machine nor star,", "cyan");
        this.printLine("but a sentient nexus bridging infinite dimensional realities.", "cyan");
        break;

      case 'clear':
        this.body.innerHTML = '';
        break;

      default:
        this.printLine(`Unknown directive: '${cmd}'. Type 'help' for directory.`, "error");
        break;
    }
  }
}

window.HoloTerminal = HoloTerminal;
