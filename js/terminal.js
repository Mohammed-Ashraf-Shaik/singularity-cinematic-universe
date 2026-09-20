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
    this.printLine("Type 'help' for available directives.", "cyan");
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
        this.printLine("  warp <1-7>       : Engage hyperjump to Act (1-7)", "cyan");
        this.printLine("  blackhole        : Jump to Gargantua Event Horizon (Act 1)", "cyan");
        this.printLine("  cyberpunk        : Jump to Sector 07 Neo-Babylon Megacity (Act 2)", "cyan");
        this.printLine("  quantum          : Jump to Quantum Calabi-Yau Core (Act 3)", "cyan");
        this.printLine("  flight           : Engage Hyperspace Flight Simulator (Act 4)", "cyan");
        this.printLine("  codex            : Access Multiverse Archive & Planet Scanner (Act 5)", "cyan");
        this.printLine("  dyson            : Jump to The Dyson Sphere Stellar Harvester (Act 6)", "cyan");
        this.printLine("  stargate         : Jump to The Tachyon Stargate Event Horizon (Act 7)", "cyan");
        this.printLine("  fire             : Discharge dual plasma photon cannons (Act 4)", "cyan");
        this.printLine("  synthwave        : Toggle 128 BPM cyberpunk procedural sequencer", "cyan");
        this.printLine("  braaam           : Synthesize Hans Zimmer cinematic horn blast", "cyan");
        this.printLine("  camera <mode>    : Switch camera ('director', 'trailer', 'cockpit', 'free')", "cyan");
        this.printLine("  status           : Display vessel telemetry & shield integrity", "cyan");
        this.printLine("  time             : Measure relativistic time dilation", "cyan");
        this.printLine("  shields          : Recalibrate magnetic defense fields", "cyan");
        this.printLine("  matrix           : Decrypt quantum matrix transmission", "cyan");
        this.printLine("  lore             : Read Project Aethel historical logbook", "cyan");
        this.printLine("  clear            : Clear screen buffer", "cyan");
        break;

      case 'warp':
        const actNum = parseInt(arg);
        if (actNum >= 1 && actNum <= 7) {
          this.sm.setActiveAct(actNum);
          this.printLine(`WARP ENGAGED: Jumping to Act ${actNum}...`, "success");
        } else {
          this.printLine("Error: Specify act number 1 to 7 (e.g. 'warp 6')", "error");
        }
        break;

      case 'blackhole':
      case 'singularity':
        this.sm.setActiveAct(1);
        this.printLine("Course plotted: Gargantua Event Horizon.", "success");
        break;

      case 'cyberpunk':
      case 'city':
        this.sm.setActiveAct(2);
        this.printLine("Course plotted: Sector 07 Neo-Babylon.", "success");
        break;

      case 'quantum':
        this.sm.setActiveAct(3);
        this.printLine("Course plotted: Calabi-Yau Quantum Core.", "success");
        break;

      case 'flight':
        this.sm.setActiveAct(4);
        this.printLine("Hyperspace Flight Simulator active. Steer with WASD or arrows.", "success");
        break;

      case 'codex':
      case 'planet':
        this.sm.setActiveAct(5);
        this.printLine("Accessing Multiverse Archive...", "success");
        const codexModal = document.getElementById('codex-modal');
        if (codexModal) codexModal.classList.add('active');
        break;

      case 'dyson':
      case 'star':
        this.sm.setActiveAct(6);
        this.printLine("Course plotted: The Dyson Sphere Stellar Harvester.", "success");
        break;

      case 'stargate':
      case 'portal':
        this.sm.setActiveAct(7);
        this.printLine("Course plotted: Tachyon Stargate Multiverse Portal.", "success");
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

      case 'synthwave':
      case 'beat':
        if (window.audioEngine) {
          const active = window.audioEngine.toggleSynthwave();
          this.printLine(`Cyberpunk Synthwave: ${active ? 'ENGAGED [128 BPM]' : 'PAUSED'}`, "success");
        }
        break;

      case 'braaam':
        if (window.audioEngine) {
          window.audioEngine.playBraaam();
          this.printLine("SYNTHESIZING HANS ZIMMER BRAAAM HORN BLAST...", "success");
        }
        break;

      case 'camera':
        if (arg === 'free' || arg === 'director') {
          this.sm.setCameraMode(arg);
          this.printLine(`Camera mode switched to: ${arg.toUpperCase()}`, "success");
        } else {
          this.printLine("Usage: camera director | camera free", "error");
        }
        break;

      case 'status':
      case 'diagnostics':
        this.printLine("--- VESSEL DIAGNOSTIC TELEMETRY ---", "system");
        this.printLine(`Active Coordinates: ACT ${this.sm.currentAct} / 5`, "cyan");
        this.printLine("Tachyon Core: 100% OPERATIONAL (Zero Flux)", "success");
        this.printLine("Sub-Space Shields: 98.4% STABLE", "success");
        this.printLine("Life Support: OPTIMAL (Atmosphere 1.02 atm)", "cyan");
        this.printLine("Audio Synthesizer: 64-band procedural WebAudio ACTIVE", "cyan");
        break;

      case 'time':
        this.printLine("--- RELATIVISTIC TIME DILATION ---", "system");
        this.printLine("Local Vessel Time: Synchronous", "cyan");
        this.printLine("Event Horizon Field: +7.24 Earth Years per Local Minute", "warning");
        this.printLine("Gravity Well: 4.88 x 10^7 m/s²", "warning");
        break;

      case 'shields':
        this.printLine("Cycling deflector frequencies: 440nm -> 520nm -> 680nm...", "system");
        if (window.audioEngine) window.audioEngine.playScannerPing();
        setTimeout(() => {
          this.printLine("Deflector shield harmonic resonance locked at 100%.", "success");
        }, 600);
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
