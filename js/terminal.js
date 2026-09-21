/* ==========================================================================
   SOLAR SYSTEM 3D // ASTRODYNAMICS COMMAND LINE CONSOLE (CLI)
   Interactive Mission Control, Keplerian Solvers, Flight Routing & Diagnostics
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

    const closeBtn = document.getElementById('terminal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggle());
    }

    this.printLine("NASA / JPL ASTRODYNAMICS TELEMETRY CONSOLE v5.2 ONLINE", "system");
    this.printLine("Type 'help' for available astrodynamics directives, planetary trajectories, and solvers.", "cyan");
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
        this.printLine("--- ASTRODYNAMICS COMMAND DIRECTIVES ---", "system");
        this.printLine("  goto <planet>    : Target world ('sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'voyager1')", "cyan");
        this.printLine("  linewise         : Switch to Line-Wise Cosmic Alignment Mode", "cyan");
        this.printLine("  helio / orrery   : Switch to Heliocentric Keplerian Orbit Mode", "cyan");
        this.printLine("  tour             : Engage Cinematic Grand Tour Autopilot", "cyan");
        this.printLine("  timewarp <speed> : Set simulation rate (1, 10, 50, 365)", "cyan");
        this.printLine("  pause / resume   : Pause or resume orbital mechanics time flow", "cyan");
        this.printLine("  calc <planet>    : Print live Keplerian equations, Vis-Viva velocity & mass", "cyan");
        this.printLine("  orbits <on|off>  : Toggle Keplerian orbital ellipse trails", "cyan");
        this.printLine("  grid <on|off>    : Toggle ecliptic coordinate reference grid", "cyan");
        this.printLine("  radio            : Discharge planetary radio wave sonification acoustic pulse", "cyan");
        this.printLine("  photo            : Capture 4K high-resolution frame screenshot", "cyan");
        this.printLine("  hud              : Toggle Heads-Up Display visibility", "cyan");
        this.printLine("  clear            : Clear screen buffer", "cyan");
        break;

      case 'linewise':
      case 'line':
        this.sm.stopGrandTour();
        this.sm.setViewMode('linewise');
        const btnLine = document.getElementById('mode-linewise-btn');
        if (btnLine && window.hudManager) window.hudManager.setModeBtnActive(btnLine);
        this.printLine("Mode engaged: Line-Wise Cosmic Alignment. All celestial bodies aligned in linear sequence.", "success");
        break;

      case 'helio':
      case 'heliocentric':
      case 'orrery':
        this.sm.stopGrandTour();
        this.sm.setViewMode('heliocentric');
        const btnHelio = document.getElementById('mode-helio-btn');
        if (btnHelio && window.hudManager) window.hudManager.setModeBtnActive(btnHelio);
        this.printLine("Mode engaged: Heliocentric Keplerian Orrery. Gravitational 3D orbits active.", "success");
        break;

      case 'tour':
        this.sm.startGrandTour();
        const btnTour = document.getElementById('mode-tour-btn');
        if (btnTour && window.hudManager) window.hudManager.setModeBtnActive(btnTour);
        this.printLine("Grand Tour Autopilot engaged. Initiating sequential flyby from Sol outward.", "success");
        break;

      case 'goto':
        if (!arg) {
          this.printLine("Usage: goto <sun|mercury|venus|earth|mars|jupiter|saturn|uranus|neptune|pluto|voyager1>", "error");
          break;
        }
        const targetBody = this.resolveBodyId(arg);
        if (targetBody && window.hudManager) {
          window.hudManager.selectBody(targetBody);
          this.printLine(`Navigation lock established: Vector aligned to [${targetBody.toUpperCase()}].`, "success");
        } else {
          this.printLine(`Error: Celestial body '${arg}' unrecognized in JPL Horizons catalog.`, "error");
        }
        break;

      case 'sun':
      case 'mercury':
      case 'venus':
      case 'earth':
      case 'mars':
      case 'jupiter':
      case 'saturn':
      case 'uranus':
      case 'neptune':
      case 'pluto':
      case 'voyager':
      case 'voyager1':
        const directTarget = this.resolveBodyId(cmd);
        if (directTarget && window.hudManager) {
          window.hudManager.selectBody(directTarget);
          this.printLine(`Vector aligned to [${directTarget.toUpperCase()}].`, "success");
        }
        break;

      case 'calc':
        const calcTarget = this.resolveBodyId(arg || this.sm.selectedBodyId);
        const bodyObj = this.sm.celestialBodies[calcTarget];
        if (bodyObj) {
          const d = bodyObj.data;
          this.printLine(`--- KEPLERIAN ASTRODYNAMICS: ${d.name} ---`, "system");
          this.printLine(`  Semi-Major Axis (a) : ${d.semiMajorAxisAU} AU (${(d.semiMajorAxisAU * 149597870.7).toLocaleString()} km)`, "cyan");
          this.printLine(`  Eccentricity (e)    : ${d.eccentricity}`, "cyan");
          this.printLine(`  Inclination (i)     : ${d.inclinationDeg}° to Ecliptic`, "cyan");
          this.printLine(`  Orbital Period (T)  : ${d.orbitalPeriodDays} Earth Days`, "cyan");
          this.printLine(`  Vis-Viva Velocity   : v = sqrt(GM * (2/r - 1/a)) = ${bodyObj.currentVelocityKms || 0} km/s`, "success");
          this.printLine(`  Surface Gravity (g) : ${d.gravity}`, "cyan");
          this.printLine(`  Escape Velocity     : ${d.escapeVel}`, "cyan");
        } else {
          this.printLine("Usage: calc <planet_name>", "error");
        }
        break;

      case 'timewarp':
      case 'warp':
        const warpSpeed = parseFloat(arg);
        if ([1, 10, 50, 365].includes(warpSpeed)) {
          this.sm.setTimeWarp(warpSpeed);
          const warpBtns = document.querySelectorAll('.time-btn[data-warp]');
          warpBtns.forEach(b => b.classList.toggle('active', parseFloat(b.getAttribute('data-warp')) === warpSpeed));
          this.printLine(`Simulation Time Warp rate set to: ${warpSpeed}× (${warpSpeed} days/sec).`, "success");
        } else {
          this.printLine("Usage: timewarp 1 | 10 | 50 | 365", "error");
        }
        break;

      case 'pause':
        this.sm.isPaused = true;
        this.printLine("Simulation paused. Planetary motion frozen.", "warning");
        break;

      case 'resume':
        this.sm.isPaused = false;
        this.printLine("Simulation resumed. Keplerian orbital motion running.", "success");
        break;

      case 'orbits':
        if (arg === 'on') this.sm.showOrbits = true;
        else if (arg === 'off') this.sm.showOrbits = false;
        else this.sm.showOrbits = !this.sm.showOrbits;
        this.sm.orbitLines.forEach(l => l.visible = this.sm.showOrbits);
        this.printLine(`Orbital ellipses display: ${this.sm.showOrbits ? 'ON' : 'OFF'}.`, "info");
        break;

      case 'grid':
        if (this.sm.gridHelper) {
          if (arg === 'on') this.sm.gridHelper.visible = true;
          else if (arg === 'off') this.sm.gridHelper.visible = false;
          else this.sm.gridHelper.visible = !this.sm.gridHelper.visible;
          this.printLine(`Ecliptic coordinate grid: ${this.sm.gridHelper.visible ? 'ON' : 'OFF'}.`, "info");
        }
        break;

      case 'radio':
      case 'pulse':
        if (window.audioEngine) {
          window.audioEngine.playPlanetaryRadioWave(this.sm.selectedBodyId);
          this.printLine(`Discharged planetary acoustic wave: [${this.sm.selectedBodyId.toUpperCase()}].`, "success");
        }
        break;

      case 'photo':
        if (window.hudManager) window.hudManager.captureScreenshot();
        this.printLine("4K high-resolution screenshot captured and downloaded.", "success");
        break;

      case 'hud':
        if (window.hudManager) window.hudManager.toggleHUD();
        break;

      case 'clear':
      case 'cls':
        if (this.body) this.body.innerHTML = '';
        break;

      default:
        this.printLine(`Unknown command: '${cmd}'. Type 'help' for directives list.`, "error");
        break;
    }
  }

  resolveBodyId(str) {
    if (!str) return null;
    str = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (str.includes('sun') || str.includes('sol')) return 'sun';
    if (str.includes('merc')) return 'mercury';
    if (str.includes('ven')) return 'venus';
    if (str.includes('ear') || str.includes('terra')) return 'earth';
    if (str.includes('mar') || str.includes('ares')) return 'mars';
    if (str.includes('ast') || str.includes('belt') || str.includes('ceres')) return 'asteroid_belt';
    if (str.includes('jup') || str.includes('zeus')) return 'jupiter';
    if (str.includes('sat') || str.includes('chron')) return 'saturn';
    if (str.includes('ura')) return 'uranus';
    if (str.includes('nep') || str.includes('pos')) return 'neptune';
    if (str.includes('plu') || str.includes('had')) return 'pluto';
    if (str.includes('voy') || str.includes('probe')) return 'voyager1';
    return null;
  }
}
