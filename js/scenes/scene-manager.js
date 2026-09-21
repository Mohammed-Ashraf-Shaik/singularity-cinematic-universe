/* ==========================================================================
   SOLAR SYSTEM CELESTIAL MECHANICS & 3D ASTRODYNAMICS ENGINE
   Three.js Keplerian Orbital Orrery & Line-Wise Cosmic Alignment System
   ========================================================================== */

class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Visual Modes: 'linewise' (linear cosmic alignment) vs 'heliocentric' (true Keplerian orrery)
    this.viewMode = 'linewise';
    this.lineWiseBlend = 1.0; // 1.0 = full linewise, 0.0 = full heliocentric
    this.targetLineWiseBlend = 1.0;

    // Scale Modes: 'cinematic' (proportional & visible) vs 'true' (astronomical scale)
    this.scaleMode = 'cinematic';

    // Time Warp Simulation Engine
    this.timeWarp = 1.0; // 1.0 = 1 sec is ~1 day; 10, 50, 365, etc.
    this.simTimeDays = 0.0;
    this.isPaused = false;

    // Layer Visibility
    this.showOrbits = true;
    this.showMoons = true;
    this.showAsteroids = true;
    this.showAtmosphereGlow = true;
    this.showGrid = true;

    // Focus & Navigation Target
    this.selectedBodyId = 'earth';
    this.cameraMode = 'focus'; // 'focus', 'free', 'tour'
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraOffset = new THREE.Vector3(0, 4, 14);
    this.isTransitioning = false;

    // Grand Tour Autopilot
    this.tourIndex = 0;
    this.tourTimer = 0;
    this.tourDuration = 7.0; // seconds per planet

    // Celestial Data & Objects
    this.celestialBodies = {};
    this.celestialList = [];
    this.orbitLines = [];
    this.asteroidBelt = null;
    this.sunLight = null;
    this.gridHelper = null;
    this.cosmicLineAxis = null;
    this.sharedTextures = {};

    this.init();
  }

  // --------------------------------------------------------------------------
  // 1. INITIALIZATION & WEBGL SETUP
  // --------------------------------------------------------------------------
  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 8000);
    this.camera.position.set(0, 15, 45);

    // OrbitControls for intuitive navigation
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 2500;
      this.controls.minDistance = 1.5;
      this.controls.rotateSpeed = 0.8;
      this.controls.zoomSpeed = 1.2;
    }

    // Build procedural textures
    this.generateProceduralTextures();

    // Build Celestial Data Model & 3D Objects
    this.initCelestialHierarchy();

    // Cosmic Grid & Environment Starfield
    this.createCosmicEnvironment();

    // Setup Lighting
    this.setupLighting();

    // Asteroid Belt
    this.createAsteroidBelt();

    // Initial Camera Focus
    this.focusOn('earth', false);

    // Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  // --------------------------------------------------------------------------
  // 2. CELESTIAL DATA MODEL & KEPLERIAN PARAMETERS
  // --------------------------------------------------------------------------
  initCelestialHierarchy() {
    // Definitive Astronomical Catalog with Keplerian Orbital Elements & Physical Specs
    this.celestialData = [
      {
        id: 'sun',
        name: 'THE SUN // SOL',
        symbol: '☀️',
        type: 'Yellow Dwarf Star (G2V)',
        radiusKm: 696340,
        renderRadius: 9.0,
        massKg: '1.989 × 10³⁰ kg (333,000 Earths)',
        gravity: '274.0 m/s² (28.0 g)',
        escapeVel: '617.5 km/s',
        meanTemp: '5,500 °C (Core: 15,000,000 °C)',
        rotationPeriod: '600.0 hrs (differential)',
        axialTilt: '7.25°',
        semiMajorAxisAU: 0.0,
        eccentricity: 0.0,
        inclinationDeg: 0.0,
        orbitalPeriodDays: 1.0,
        lineDistance: 0,
        desc: 'The central star of the Solar System. Generates 3.828 × 10²⁶ Watts via proton-proton nuclear fusion. Accounts for 99.86% of the total mass of the entire Solar System.',
        atmosphere: '73.46% H₂, 24.85% He, 0.77% O₂, 0.29% C',
        color: 0xffaa00,
        hasAtmosphereGlow: true,
        glowColor: 0xff7700
      },
      {
        id: 'mercury',
        name: 'MERCURY // HERMES',
        symbol: '☿',
        type: 'Terrestrial Planet',
        radiusKm: 2439.7,
        renderRadius: 1.2,
        massKg: '3.301 × 10²³ kg (0.055 Earths)',
        gravity: '3.7 m/s² (0.38 g)',
        escapeVel: '4.3 km/s',
        meanTemp: '167 °C (-180°C to +430°C)',
        rotationPeriod: '1407.6 hrs (58.6 days)',
        axialTilt: '0.034°',
        semiMajorAxisAU: 0.387,
        eccentricity: 0.2056,
        inclinationDeg: 7.00,
        orbitalPeriodDays: 87.97,
        lineDistance: 24,
        desc: 'Smallest planet and closest to the Sun. Highly eccentric orbit governed by General Relativity precession. Extreme day-to-night temperature swing of 610 °C.',
        atmosphere: 'Trace: Oxygen 42%, Sodium 29%, Hydrogen 22%',
        color: 0x8a8a8a,
        hasAtmosphereGlow: false
      },
      {
        id: 'venus',
        name: 'VENUS // APHRODITE',
        symbol: '♀',
        type: 'Terrestrial Planet',
        radiusKm: 6051.8,
        renderRadius: 2.2,
        massKg: '4.867 × 10²⁴ kg (0.815 Earths)',
        gravity: '8.87 m/s² (0.90 g)',
        escapeVel: '10.36 km/s',
        meanTemp: '464 °C (Runaway Greenhouse)',
        rotationPeriod: '-5832.5 hrs (Retrograde 243d)',
        axialTilt: '177.36° (Retrograde)',
        semiMajorAxisAU: 0.723,
        eccentricity: 0.0067,
        inclinationDeg: 3.39,
        orbitalPeriodDays: 224.7,
        lineDistance: 44,
        desc: 'Earth\'s "twin" in size, yet a volcanic furnace. Enveloped in opaque clouds of concentrated sulfuric acid with surface atmospheric pressure equal to 92 Earth atmospheres.',
        atmosphere: '96.5% CO₂, 3.5% N₂, 0.015% SO₂',
        color: 0xe3bb76,
        hasAtmosphereGlow: true,
        glowColor: 0xffaa33
      },
      {
        id: 'earth',
        name: 'EARTH // TERRA',
        symbol: '🜨',
        type: 'Terrestrial (Habitable Oasis)',
        radiusKm: 6371.0,
        renderRadius: 2.5,
        massKg: '5.972 × 10²⁴ kg (1.00 Earth)',
        gravity: '9.807 m/s² (1.00 g)',
        escapeVel: '11.19 km/s',
        meanTemp: '15 °C (288 K)',
        rotationPeriod: '23.934 hrs',
        axialTilt: '23.44°',
        semiMajorAxisAU: 1.000,
        eccentricity: 0.0167,
        inclinationDeg: 0.00,
        orbitalPeriodDays: 365.256,
        lineDistance: 68,
        desc: 'The cradle of known life. The only known world with abundant liquid surface water, an active magnetic geodynamo, dynamic plate tectonics, and a nitrogen-oxygen atmosphere.',
        atmosphere: '78.08% N₂, 20.95% O₂, 0.93% Ar, 0.04% CO₂',
        color: 0x2277ff,
        hasAtmosphereGlow: true,
        glowColor: 0x0088ff,
        hasMoons: true
      },
      {
        id: 'mars',
        name: 'MARS // ARES',
        symbol: '♂',
        type: 'Terrestrial Planet',
        radiusKm: 3389.5,
        renderRadius: 1.6,
        massKg: '6.417 × 10²³ kg (0.107 Earths)',
        gravity: '3.72 m/s² (0.38 g)',
        escapeVel: '5.03 km/s',
        meanTemp: '-63 °C (-140°C to +20°C)',
        rotationPeriod: '24.623 hrs',
        axialTilt: '25.19°',
        semiMajorAxisAU: 1.524,
        eccentricity: 0.0934,
        inclinationDeg: 1.85,
        orbitalPeriodDays: 686.98,
        lineDistance: 92,
        desc: 'The Red Planet. Home to Olympus Mons (the tallest volcano in the solar system, 21.9 km) and Valles Marineris (a grand canyon spanning 4,000 km across the globe).',
        atmosphere: '95.3% CO₂, 2.6% N₂, 1.9% Ar',
        color: 0xc4512b,
        hasAtmosphereGlow: true,
        glowColor: 0xd65b38,
        hasMoons: true
      },
      {
        id: 'asteroid_belt',
        name: 'ASTEROID BELT // CERES',
        symbol: '☄',
        type: 'Circumstellar Debris Ring',
        radiusKm: 473.0, // Ceres
        renderRadius: 1.0,
        massKg: '2.39 × 10²¹ kg (Total Belt)',
        gravity: '0.28 m/s² (Ceres)',
        escapeVel: '0.51 km/s',
        meanTemp: '-105 °C',
        rotationPeriod: '9.07 hrs',
        axialTilt: '4.0°',
        semiMajorAxisAU: 2.77,
        eccentricity: 0.0758,
        inclinationDeg: 10.59,
        orbitalPeriodDays: 1682.0,
        lineDistance: 120,
        desc: 'The primordial boundary zone between terrestrial and giant gas worlds. Contains millions of rocky remnants and dwarf planet Ceres, which harbors subsurface water ice and bright carbonate deposits.',
        atmosphere: 'Trace Water Vapor & Exosphere (Ceres)',
        color: 0x998877,
        hasAtmosphereGlow: false
      },
      {
        id: 'jupiter',
        name: 'JUPITER // ZEUS',
        symbol: '♃',
        type: 'Gas Giant (Jovian King)',
        radiusKm: 69911.0,
        renderRadius: 5.6,
        massKg: '1.898 × 10²⁷ kg (317.8 Earths)',
        gravity: '24.79 m/s² (2.53 g)',
        escapeVel: '59.5 km/s',
        meanTemp: '-110 °C (Cloud tops)',
        rotationPeriod: '9.925 hrs (Fastest in Solar System)',
        axialTilt: '3.13°',
        semiMajorAxisAU: 5.204,
        eccentricity: 0.0485,
        inclinationDeg: 1.30,
        orbitalPeriodDays: 4332.59,
        lineDistance: 154,
        desc: 'The colossal titan of the Solar System. Features the iconic Great Red Spot storm vortex (wider than Earth, persisting for over 350 years), differential wind belts, and 95 known moons.',
        atmosphere: '89.8% H₂, 10.2% He, 0.3% CH₄, 0.026% NH₃',
        color: 0xd89f66,
        hasAtmosphereGlow: true,
        glowColor: 0xcc8844,
        hasMoons: true
      },
      {
        id: 'saturn',
        name: 'SATURN // CHRONOS',
        symbol: '♄',
        type: 'Gas Giant with Rings',
        radiusKm: 58232.0,
        renderRadius: 4.8,
        massKg: '5.683 × 10²⁶ kg (95.2 Earths)',
        gravity: '10.44 m/s² (1.06 g)',
        escapeVel: '35.5 km/s',
        meanTemp: '-140 °C',
        rotationPeriod: '10.656 hrs',
        axialTilt: '26.73°',
        semiMajorAxisAU: 9.582,
        eccentricity: 0.0555,
        inclinationDeg: 2.49,
        orbitalPeriodDays: 10759.22,
        lineDistance: 194,
        desc: 'The jewel of the solar system. Adorned with a majestic ring system spanning 282,000 km but only 10 meters thick on average, composed of 99% pure water ice and rocky fragments.',
        atmosphere: '96.3% H₂, 3.25% He, 0.45% CH₄',
        color: 0xedd6a4,
        hasAtmosphereGlow: true,
        glowColor: 0xddb877,
        hasRings: true,
        hasMoons: true
      },
      {
        id: 'uranus',
        name: 'URANUS // OURANOS',
        symbol: '⛢',
        type: 'Ice Giant',
        radiusKm: 25362.0,
        renderRadius: 3.4,
        massKg: '8.681 × 10²⁵ kg (14.5 Earths)',
        gravity: '8.69 m/s² (0.89 g)',
        escapeVel: '21.3 km/s',
        meanTemp: '-195 °C (Lowest recorded: -224 °C)',
        rotationPeriod: '-17.24 hrs (Retrograde)',
        axialTilt: '97.77° (Rolling Sideways)',
        semiMajorAxisAU: 19.201,
        eccentricity: 0.0463,
        inclinationDeg: 0.77,
        orbitalPeriodDays: 30685.4,
        lineDistance: 236,
        desc: 'Unique ice giant tilted 98 degrees onto its orbital plane, likely due to an ancient cataclysmic protoplanetary collision. Its 13 faint rings orbit vertically like a bullseye.',
        atmosphere: '82.5% H₂, 15.2% He, 2.3% CH₄ (Methane)',
        color: 0x67dbdb,
        hasAtmosphereGlow: true,
        glowColor: 0x44dddd,
        hasRings: true
      },
      {
        id: 'neptune',
        name: 'NEPTUNE // POSEIDON',
        symbol: '♆',
        type: 'Ice Giant',
        radiusKm: 24622.0,
        renderRadius: 3.3,
        massKg: '1.024 × 10²⁶ kg (17.1 Earths)',
        gravity: '11.15 m/s² (1.14 g)',
        escapeVel: '23.5 km/s',
        meanTemp: '-201 °C',
        rotationPeriod: '16.11 hrs',
        axialTilt: '28.32°',
        semiMajorAxisAU: 30.047,
        eccentricity: 0.0094,
        inclinationDeg: 1.77,
        orbitalPeriodDays: 60189.0,
        lineDistance: 278,
        desc: 'The outermost major planet. Features the most violent supersonic winds in the solar system, exceeding 2,100 km/h, and retrograde moon Triton with cryovolcanic nitrogen geysers.',
        atmosphere: '80.0% H₂, 19.0% He, 1.5% CH₄',
        color: 0x3366ff,
        hasAtmosphereGlow: true,
        glowColor: 0x1155ff,
        hasMoons: true
      },
      {
        id: 'pluto',
        name: 'PLUTO & CHARON // HADES',
        symbol: '♇',
        type: 'Kuiper Belt Binary Dwarf Planet',
        radiusKm: 1188.3,
        renderRadius: 1.0,
        massKg: '1.303 × 10²² kg (0.002 Earths)',
        gravity: '0.62 m/s² (0.063 g)',
        escapeVel: '1.21 km/s',
        meanTemp: '-229 °C (44 K)',
        rotationPeriod: '-153.3 hrs (6.39 days)',
        axialTilt: '122.53°',
        semiMajorAxisAU: 39.482,
        eccentricity: 0.2488,
        inclinationDeg: 17.16,
        orbitalPeriodDays: 90560.0,
        lineDistance: 318,
        desc: 'Monarch of the Kuiper Belt. Features Tombaugh Regio (the vast nitrogen ice heart glacier Sputnik Planitia) and orbits in a tidally locked mutual binary dance with giant moon Charon.',
        atmosphere: 'Sublimated Nitrogen N₂, Methane CH₄, CO',
        color: 0xcca388,
        hasAtmosphereGlow: false
      },
      {
        id: 'voyager1',
        name: 'VOYAGER 1 // INTERSTELLAR PROBE',
        symbol: '🛰',
        type: 'Interstellar Deep Space Probe',
        radiusKm: 0.0037, // 3.7m high-gain dish
        renderRadius: 1.0,
        massKg: '825.5 kg (With Hydrazine)',
        gravity: '0.00 m/s²',
        escapeVel: '16.9 km/s (Relative to Sun)',
        meanTemp: '-270 °C (Cosmic Microwave Background)',
        rotationPeriod: '3-Axis Stabilized',
        axialTilt: 'Pointed at Earth',
        semiMajorAxisAU: 162.0, // AU from Sun in 2024
        eccentricity: 1.3, // Hyperbolic escape trajectory
        inclinationDeg: 35.5,
        orbitalPeriodDays: 999999,
        lineDistance: 360,
        desc: 'Humanity\'s farthest emissary. Launched in 1977, it crossed the Heliopause into interstellar medium in August 2012. Carries the Golden Record containing sounds and imagery of Earth.',
        atmosphere: 'Interstellar Plasma Medium (~0.1 atoms/cm³)',
        color: 0xdddddd,
        hasAtmosphereGlow: true,
        glowColor: 0x00f0ff,
        isProbe: true
      }
    ];

    // Build 3D meshes for each body
    this.celestialData.forEach((data) => {
      const bodyObj = this.createCelestialMesh(data);
      this.celestialBodies[data.id] = bodyObj;
      this.celestialList.push(bodyObj);
      this.scene.add(bodyObj.rootGroup);

      // Create Keplerian Orbit Ellipse Line
      if (data.semiMajorAxisAU > 0 && !data.isProbe) {
        const orbitLine = this.createOrbitPath(data);
        this.orbitLines.push(orbitLine);
        this.scene.add(orbitLine);
      }
    });

    // Cosmic Transect Line (for Line-Wise Alignment Mode)
    this.createCosmicTransectLine();
  }

  // --------------------------------------------------------------------------
  // 3. PROCEDURAL TEXTURE GENERATION (100% OFFLINE & ZERO EXTERNAL ASSETS)
  // --------------------------------------------------------------------------
  generateProceduralTextures() {
    this.sharedTextures.sun = this.createSunTexture();
    this.sharedTextures.mercury = this.createCrateredTexture('#6b6b6b', '#3b3b3b', '#9c9c9c', 40);
    this.sharedTextures.venus = this.createSwirlTexture('#cbb184', '#e6cf9b', '#9c7b4a');
    this.sharedTextures.earthDay = this.createEarthDayTexture();
    this.sharedTextures.earthNight = this.createEarthNightTexture();
    this.sharedTextures.earthSpec = this.createEarthSpecTexture();
    this.sharedTextures.earthClouds = this.createEarthCloudsTexture();
    this.sharedTextures.moon = this.createCrateredTexture('#888888', '#555555', '#bbbbbb', 60);
    this.sharedTextures.mars = this.createMarsTexture();
    this.sharedTextures.jupiter = this.createJupiterTexture();
    this.sharedTextures.saturn = this.createSaturnTexture();
    this.sharedTextures.saturnRings = this.createSaturnRingsTexture();
    this.sharedTextures.uranus = this.createUranusTexture();
    this.sharedTextures.neptune = this.createNeptuneTexture();
    this.sharedTextures.pluto = this.createPlutoTexture();
  }

  createSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#ff4500');
    grad.addColorStop(0.3, '#ff8c00');
    grad.addColorStop(0.5, '#ffd700');
    grad.addColorStop(0.7, '#ff8c00');
    grad.addColorStop(1, '#ff4500');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Convective noise cells
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 12 + 4;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255, 255, 220, 0.25)' : 'rgba(180, 40, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  createCrateredTexture(base, dark, light, numCraters) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle noise field
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? light : dark;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() * 6 + 2, Math.random() * 6 + 2);
    }
    ctx.globalAlpha = 1.0;

    // Distinct impact craters
    for (let i = 0; i < numCraters; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 18 + 4;

      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(1, r * 0.2);
      ctx.beginPath();
      ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createSwirlTexture(color1, color2, color3) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, 1024, 512);

    for (let y = 0; y < 512; y += 4) {
      const wave = Math.sin(y * 0.04) * 40 + Math.cos(y * 0.015) * 60;
      ctx.fillStyle = y % 8 === 0 ? color2 : color3;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, y, 1024, 6);
    }
    ctx.globalAlpha = 1.0;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthDayTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ocean deep blue
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a2342');
    oceanGrad.addColorStop(0.5, '#0d3b66');
    oceanGrad.addColorStop(1, '#0a2342');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Procedural Continents (Americas, Eurasia, Africa, Australia, Antarctica)
    const drawLandMass = (cx, cy, rx, ry, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Roughen coastline
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (rx * 0.7);
        const r = Math.random() * (rx * 0.4);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // North & South America
    drawLandMass(280, 180, 80, 60, '#2d5a27');
    drawLandMass(340, 320, 60, 90, '#1e4620');
    // Europe & Africa
    drawLandMass(540, 160, 60, 45, '#3b6e35');
    drawLandMass(550, 270, 70, 80, '#937340');
    // Asia & Australia
    drawLandMass(720, 170, 110, 75, '#2e5828');
    drawLandMass(820, 350, 45, 35, '#8c7042');
    // Polar Ice Caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillRect(0, 475, 1024, 37);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthNightTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, 1024, 512);

    // Urban City Light Clusters (Golden-Amber points)
    const addCityCluster = (cx, cy, count, spread) => {
      for (let i = 0; i < count; i++) {
        const x = cx + (Math.random() - 0.5) * spread;
        const y = cy + (Math.random() - 0.5) * spread;
        const r = Math.random() * 1.5 + 0.5;
        ctx.fillStyle = Math.random() > 0.3 ? '#ffe082' : '#ffb74d';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // North America East/West Coast
    addCityCluster(260, 170, 150, 45);
    addCityCluster(320, 170, 200, 50);
    // Western Europe
    addCityCluster(530, 155, 320, 40);
    // East Asia (Japan, Eastern China)
    addCityCluster(780, 185, 350, 60);
    // India & Nile River
    addCityCluster(680, 220, 180, 35);
    addCityCluster(565, 200, 90, 20);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthSpecTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Oceans are highly specular (white), land is matte (black)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 512);

    // Mask out continents with black
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(280, 180, 80, 60, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(340, 320, 60, 90, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(540, 160, 60, 45, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(550, 270, 70, 80, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(720, 170, 110, 75, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(820, 350, 45, 35, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthCloudsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 512);

    // Swirling white clouds
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 400 + 56;
      const rx = Math.random() * 40 + 15;
      const ry = Math.random() * 15 + 5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.sin(x * 0.01) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createMarsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rusty iron oxide base
    ctx.fillStyle = '#b34726';
    ctx.fillRect(0, 0, 1024, 512);

    // Darker basalt volcanic provinces (Syrtis Major)
    ctx.fillStyle = '#6e2b17';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 1024, Math.random() * 300 + 100, Math.random() * 90 + 30, Math.random() * 40 + 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Valles Marineris canyon rift
    ctx.strokeStyle = '#381208';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(350, 260);
    ctx.bezierCurveTo(450, 270, 520, 255, 600, 265);
    ctx.stroke();

    // Polar ice caps
    ctx.fillStyle = '#f8f4f0';
    ctx.fillRect(0, 0, 1024, 18);
    ctx.fillRect(0, 492, 1024, 20);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createJupiterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Alternating zonal cloud bands
    const bandColors = ['#f4e3c7', '#d89f66', '#a66a38', '#ebd1b2', '#c97d42', '#8c5228', '#f2dcc2'];
    for (let y = 0; y < 512; y++) {
      const colorIdx = Math.floor((y / 512) * bandColors.length) % bandColors.length;
      ctx.fillStyle = bandColors[colorIdx];
      ctx.fillRect(0, y, 1024, 1);
    }

    // Swirling turbulence eddies
    for (let i = 0; i < 80; i++) {
      const y = Math.random() * 512;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(80,30,10,0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < 1024; x += 40) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 8);
      }
      ctx.stroke();
    }

    // The Great Red Spot anticyclonic storm oval
    const grsX = 640;
    const grsY = 320;
    ctx.fillStyle = '#b7321a';
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, 55, 32, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e66848';
    ctx.lineWidth = 4;
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createSaturnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Delicate golden-amber atmospheric stripes
    const colors = ['#edd6a4', '#d8be8d', '#e8ce9b', '#cbb07c', '#f5e4be'];
    for (let y = 0; y < 512; y++) {
      const idx = Math.floor((y / 512) * colors.length);
      ctx.fillStyle = colors[idx];
      ctx.fillRect(0, y, 1024, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createSaturnRingsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Ring radial density profile from inner (C ring) to outer (A & F ring)
    // with distinct Cassini Division gap
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0.00, 'rgba(0,0,0,0)');
    grad.addColorStop(0.12, 'rgba(160, 140, 110, 0.25)'); // C Ring
    grad.addColorStop(0.32, 'rgba(215, 195, 155, 0.88)'); // B Ring (brightest)
    grad.addColorStop(0.58, 'rgba(225, 205, 165, 0.95)');
    grad.addColorStop(0.62, 'rgba(0, 0, 0, 0.02)');       // Cassini Division
    grad.addColorStop(0.66, 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(0.70, 'rgba(195, 175, 140, 0.75)'); // A Ring
    grad.addColorStop(0.88, 'rgba(180, 160, 130, 0.65)');
    grad.addColorStop(0.92, 'rgba(0,0,0,0)');             // Encke gap
    grad.addColorStop(0.97, 'rgba(170, 150, 120, 0.35)'); // F Ring
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 64);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  createUranusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#5ec7c7');
    grad.addColorStop(0.5, '#76dede');
    grad.addColorStop(1, '#5ec7c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createNeptuneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep azure blue
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2448b3');
    grad.addColorStop(0.5, '#3b6cf0');
    grad.addColorStop(1, '#2448b3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Supersonic white cirrus streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 300, y);
      ctx.lineTo(Math.random() * 500 + 400, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }

    // Great Dark Spot
    ctx.fillStyle = '#102773';
    ctx.beginPath();
    ctx.ellipse(450, 220, 50, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createPlutoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark reddish-brown tholins
    ctx.fillStyle = '#7a4f3b';
    ctx.fillRect(0, 0, 1024, 512);

    // Tombaugh Regio Nitrogen Ice Heart
    ctx.fillStyle = '#f0e6df';
    ctx.beginPath();
    ctx.moveTo(500, 220);
    ctx.bezierCurveTo(460, 180, 420, 240, 500, 310);
    ctx.bezierCurveTo(580, 240, 540, 180, 500, 220);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  // --------------------------------------------------------------------------
  // 4. CELESTIAL MESH CONSTRUCTION (PLANETS, MOONS, RINGS, SHADERS)
  // --------------------------------------------------------------------------
  createCelestialMesh(data) {
    const rootGroup = new THREE.Group();
    rootGroup.name = data.id;

    // Pivot group for axial tilt
    const tiltGroup = new THREE.Group();
    const tiltRad = (parseFloat(data.axialTilt) || 0) * (Math.PI / 180);
    tiltGroup.rotation.z = tiltRad;
    rootGroup.add(tiltGroup);

    let planetMesh = null;
    let atmosphereMesh = null;
    let cloudsMesh = null;

    if (data.id === 'sun') {
      // Custom GLSL Sun Shader with dynamic solar plasma granulation
      const sunGeo = new THREE.SphereGeometry(data.renderRadius, 64, 64);
      const sunMat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(CustomShaders.SunSurface.uniforms),
        vertexShader: CustomShaders.SunSurface.vertexShader,
        fragmentShader: CustomShaders.SunSurface.fragmentShader
      });
      planetMesh = new THREE.Mesh(sunGeo, sunMat);
      tiltGroup.add(planetMesh);

      // Solar Corona additive shell
      const coronaGeo = new THREE.SphereGeometry(data.renderRadius * 1.35, 48, 48);
      const coronaMat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(CustomShaders.SunCorona.uniforms),
        vertexShader: CustomShaders.SunCorona.vertexShader,
        fragmentShader: CustomShaders.SunCorona.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      tiltGroup.add(coronaMesh);

    } else if (data.id === 'earth') {
      // Photorealistic Earth Multi-Spectral Material
      const earthGeo = new THREE.SphereGeometry(data.renderRadius, 64, 64);
      const earthMat = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: this.sharedTextures.earthDay },
          nightTexture: { value: this.sharedTextures.earthNight },
          specularMap: { value: this.sharedTextures.earthSpec },
          cloudsTexture: { value: this.sharedTextures.earthClouds },
          sunPosition: { value: new THREE.Vector3(0, 0, 0) },
          cloudTime: { value: 0 }
        },
        vertexShader: CustomShaders.EarthSurface.vertexShader,
        fragmentShader: CustomShaders.EarthSurface.fragmentShader
      });
      planetMesh = new THREE.Mesh(earthGeo, earthMat);
      tiltGroup.add(planetMesh);

      // Earth's Moon (Luna)
      const moonGroup = new THREE.Group();
      moonGroup.name = 'earth_moon_system';
      const moonGeo = new THREE.SphereGeometry(0.68, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        map: this.sharedTextures.moon,
        roughness: 0.9,
        metalness: 0.05
      });
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);
      moonMesh.position.set(5.5, 0, 0);
      moonGroup.add(moonMesh);
      rootGroup.add(moonGroup);

    } else if (data.isProbe) {
      // 3D Procedural Model of Voyager 1 Spacecraft
      planetMesh = this.createVoyager1Mesh(data);
      tiltGroup.add(planetMesh);

    } else {
      // Standard Planetary Body with High-Res Texture & Normal Shading
      const planetGeo = new THREE.SphereGeometry(data.renderRadius, 48, 48);
      const textureKey = data.id === 'asteroid_belt' ? 'mercury' : data.id;
      const planetMat = new THREE.MeshStandardMaterial({
        map: this.sharedTextures[textureKey] || this.sharedTextures.mercury,
        roughness: data.type.includes('Gas') ? 0.45 : 0.85,
        metalness: 0.1
      });
      planetMesh = new THREE.Mesh(planetGeo, planetMat);
      tiltGroup.add(planetMesh);
    }

    // Atmospheric Rayleigh scattering rim glow
    if (data.hasAtmosphereGlow && data.id !== 'sun') {
      const atmoGeo = new THREE.SphereGeometry(data.renderRadius * 1.08, 48, 48);
      const atmoMat = new THREE.ShaderMaterial({
        uniforms: {
          sunPosition: { value: new THREE.Vector3(0, 0, 0) },
          atmosphereColor: { value: new THREE.Color(data.glowColor || 0x3388ff) },
          sunsetTint: { value: new THREE.Color(0xff5511) },
          glowPower: { value: 3.2 },
          atmosphereDensity: { value: 1.0 }
        },
        vertexShader: CustomShaders.AtmosphereScattering.vertexShader,
        fragmentShader: CustomShaders.AtmosphereScattering.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
      tiltGroup.add(atmosphereMesh);
    }

    // Saturn / Uranus Ring Systems
    let ringsMesh = null;
    if (data.hasRings) {
      const innerR = data.renderRadius * 1.35;
      const outerR = data.renderRadius * 2.45;
      const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
      // Align ring horizontally in equatorial plane
      ringGeo.rotateX(-Math.PI / 2);

      // Map UV radially
      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const u = (dist - innerR) / (outerR - innerR);
        uvs.setXY(i, u, 0.5);
      }

      const ringMat = new THREE.ShaderMaterial({
        uniforms: {
          ringTexture: { value: this.sharedTextures.saturnRings },
          sunPosition: { value: new THREE.Vector3(0, 0, 0) },
          planetCenter: { value: new THREE.Vector3(0, 0, 0) },
          planetRadius: { value: data.renderRadius }
        },
        vertexShader: CustomShaders.SaturnRings.vertexShader,
        fragmentShader: CustomShaders.SaturnRings.fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
      });

      ringsMesh = new THREE.Mesh(ringGeo, ringMat);
      tiltGroup.add(ringsMesh);

      // Saturn Moons: Titan & Enceladus
      if (data.id === 'saturn') {
        const titanGroup = new THREE.Group();
        titanGroup.name = 'saturn_titan_system';
        const titanGeo = new THREE.SphereGeometry(0.75, 24, 24);
        const titanMat = new THREE.MeshStandardMaterial({
          map: this.sharedTextures.venus,
          roughness: 0.9
        });
        const titanMesh = new THREE.Mesh(titanGeo, titanMat);
        titanMesh.position.set(13.5, 0, 0);
        titanGroup.add(titanMesh);
        rootGroup.add(titanGroup);
      }
    }

    // Jupiter Galilean Moons (Io, Europa, Ganymede, Callisto)
    if (data.id === 'jupiter') {
      const galileanGroup = new THREE.Group();
      galileanGroup.name = 'galilean_moons';
      const moonDistances = [8.5, 11.2, 14.5, 18.0];
      const moonSizes = [0.55, 0.5, 0.8, 0.72];
      moonDistances.forEach((d, idx) => {
        const mGeo = new THREE.SphereGeometry(moonSizes[idx], 16, 16);
        const mMat = new THREE.MeshStandardMaterial({ color: idx === 0 ? 0xffcc33 : 0xdddddd, roughness: 0.8 });
        const mMesh = new THREE.Mesh(mGeo, mMat);
        mMesh.position.set(d, 0, 0);
        const mOrbit = new THREE.Group();
        mOrbit.rotation.y = (idx * Math.PI) / 2;
        mOrbit.add(mMesh);
        galileanGroup.add(mOrbit);
      });
      rootGroup.add(galileanGroup);
    }

    return {
      data: data,
      rootGroup: rootGroup,
      tiltGroup: tiltGroup,
      planetMesh: planetMesh,
      atmosphereMesh: atmosphereMesh,
      ringsMesh: ringsMesh,
      heliocentricPos: new THREE.Vector3(),
      lineWisePos: new THREE.Vector3(data.lineDistance, 0, 0),
      currentPos: new THREE.Vector3(data.lineDistance, 0, 0)
    };
  }

  // --------------------------------------------------------------------------
  // 5. VOYAGER 1 PROCEDURAL 3D MESH
  // --------------------------------------------------------------------------
  createVoyager1Mesh(data) {
    const probeGroup = new THREE.Group();

    // 1. High-Gain Parabolic Reflector Dish (3.7m diameter white dish)
    const dishGeo = new THREE.SphereGeometry(2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = Math.PI / 2;
    dishMesh.position.set(0, 0, 0);
    probeGroup.add(dishMesh);

    // Subreflector Feed Horn
    const hornGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 12);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const hornMesh = new THREE.Mesh(hornGeo, hornMat);
    hornMesh.position.set(0, 0, 1.2);
    hornMesh.rotation.x = Math.PI / 2;
    probeGroup.add(hornMesh);

    // 2. Decagonal Equipment Bus Bay
    const busGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.7, 10);
    const busMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.7, roughness: 0.4 });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.position.set(0, 0, -0.6);
    busMesh.rotation.x = Math.PI / 2;
    probeGroup.add(busMesh);

    // 3. RTG Power Source Boom (Radioisotope Thermoelectric Generators)
    const rtgBoomGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
    const rtgBoomMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9 });
    const rtgBoom = new THREE.Mesh(rtgBoomGeo, rtgBoomMat);
    rtgBoom.position.set(-1.8, -0.5, -0.6);
    rtgBoom.rotation.z = Math.PI / 3;
    probeGroup.add(rtgBoom);

    // 3 RTG canister cylinders
    for (let c = 0; c < 3; c++) {
      const rtgCylGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 12);
      const rtgCylMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
      const rtgCyl = new THREE.Mesh(rtgCylGeo, rtgCylMat);
      rtgCyl.position.set(-2.8 - c * 0.4, -1.2, -0.6);
      probeGroup.add(rtgCyl);
    }

    // 4. Magnetometer Boom extending 13 meters
    const magBoomGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.0, 6);
    const magBoom = new THREE.Mesh(magBoomGeo, rtgBoomMat);
    magBoom.position.set(2.2, 1.0, -0.6);
    magBoom.rotation.z = -Math.PI / 4;
    probeGroup.add(magBoom);

    // 5. The Golden Record (Mounted on the bus bay)
    const goldGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.03, 24);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.95, roughness: 0.15 });
    const goldRecord = new THREE.Mesh(goldGeo, goldMat);
    goldRecord.position.set(0.65, 0.4, -0.6);
    goldRecord.rotation.y = Math.PI / 2;
    probeGroup.add(goldRecord);

    return probeGroup;
  }

  // --------------------------------------------------------------------------
  // 6. ASTEROID BELT (GPU INSTANCED MESH OF 1,400+ TUMBLING BODIES)
  // --------------------------------------------------------------------------
  createAsteroidBelt() {
    const count = 1400;
    const baseGeo = new THREE.DodecahedronGeometry(0.3, 1);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x82776c,
      roughness: 0.95,
      metalness: 0.1
    });

    this.asteroidBelt = new THREE.InstancedMesh(baseGeo, baseMat, count);
    this.asteroidData = [];

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // Distributed between 2.1 AU and 3.3 AU
      const rAU = 2.1 + Math.random() * 1.2;
      const rScene = rAU * 40.0;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 6.0;

      const scale = Math.random() * 1.2 + 0.3;
      dummy.position.set(Math.cos(angle) * rScene, yOffset, Math.sin(angle) * rScene);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      this.asteroidBelt.setMatrixAt(i, dummy.matrix);

      this.asteroidData.push({
        rAU: rAU,
        angle: angle,
        speed: (0.015 / Math.sqrt(rAU)) * (0.9 + Math.random() * 0.2),
        yOffset: yOffset,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        scale: scale,
        lineX: 110 + (Math.random() - 0.5) * 22,
        lineZ: (Math.random() - 0.5) * 12
      });
    }

    this.asteroidBelt.instanceMatrix.needsUpdate = true;
    this.scene.add(this.asteroidBelt);
  }

  // --------------------------------------------------------------------------
  // 7. KEPLERIAN ORBIT PATHS & COSMIC TRANSECT AXIS
  // --------------------------------------------------------------------------
  createOrbitPath(data) {
    const segments = 128;
    const points = [];
    const a = data.semiMajorAxisAU * 40.0;
    const e = data.eccentricity;
    const incRad = (data.inclinationDeg || 0) * (Math.PI / 180);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // Apply inclination
      const y = -z * Math.sin(incRad);
      const zInc = z * Math.cos(incRad);

      points.push(new THREE.Vector3(x, y, zInc));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x336699,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geo, mat);
    line.name = `orbit_${data.id}`;
    return line;
  }

  createCosmicTransectLine() {
    // Radiant scale caliper line for Line-Wise Cosmic Alignment Mode
    const points = [
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(390, 0, 0)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0x00f0ff,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.5
    });

    this.cosmicLineAxis = new THREE.Line(geo, mat);
    this.cosmicLineAxis.computeLineDistances();
    this.scene.add(this.cosmicLineAxis);
  }

  // --------------------------------------------------------------------------
  // 8. ENVIRONMENT STARFIELD & SCI-FI COORDINATE GRID
  // --------------------------------------------------------------------------
  createCosmicEnvironment() {
    // Deep Space Starfield with Stellar Classification Colors (O, B, A, G, M stars)
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const stellarPalette = [
      new THREE.Color(0x9db4ff), // O/B Class Blue Giant
      new THREE.Color(0xf8f9ff), // A Class White
      new THREE.Color(0xfff4e8), // G Class Yellow (Solar)
      new THREE.Color(0xffddb4), // K Class Orange
      new THREE.Color(0xffa07a)  // M Class Red Dwarf
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute stars on outer cosmic sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2400 + Math.random() * 800;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const color = stellarPalette[Math.floor(Math.random() * stellarPalette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    const starField = new THREE.Points(starGeo, starMat);
    this.scene.add(starField);

    // Ecliptic Coordinate Reference Grid
    this.gridHelper = new THREE.GridHelper(800, 40, 0x00f0ff, 0x0a2233);
    this.gridHelper.position.y = -0.5;
    this.scene.add(this.gridHelper);
  }

  // --------------------------------------------------------------------------
  // 9. LIGHTING ENGINE
  // --------------------------------------------------------------------------
  setupLighting() {
    // Dynamic central PointLight from Sun's core
    this.sunLight = new THREE.PointLight(0xffffff, 2.8, 3000, 0.4);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Soft cosmic fill ambient light for dark side readability
    const ambientLight = new THREE.AmbientLight(0x0a1428, 0.35);
    this.scene.add(ambientLight);
  }

  // --------------------------------------------------------------------------
  // 10. KEPLER EQUATION SOLVER & ASTRODYNAMICS UPDATE
  // --------------------------------------------------------------------------
  solveKepler(M, e) {
    let E = M;
    for (let iter = 0; iter < 12; iter++) {
      const delta = (E - e * Math.sin(E) - M) / (1.0 - e * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-6) break;
    }
    return E;
  }

  updateCelestialMechanics(delta) {
    if (!this.isPaused) {
      // 1 second of real time corresponds to this.timeWarp days in simulation
      this.simTimeDays += delta * this.timeWarp;
    }

    const t = this.clock.getElapsedTime();

    // Lerp view mode transition (Line-Wise vs Heliocentric)
    this.lineWiseBlend += (this.targetLineWiseBlend - this.lineWiseBlend) * 0.08;

    // Update Sun Shaders
    if (CustomShaders.SunSurface && CustomShaders.SunSurface.uniforms) {
      CustomShaders.SunSurface.uniforms.time.value = t;
    }
    if (CustomShaders.SunCorona && CustomShaders.SunCorona.uniforms) {
      CustomShaders.SunCorona.uniforms.time.value = t;
    }

    // Update each celestial body
    this.celestialList.forEach((body) => {
      const d = body.data;

      // 1. Sidereal Rotation around axial tilt
      const rotPeriodHours = parseFloat(d.rotationPeriod) || 24;
      const rotSpeed = ((Math.PI * 2) / (rotPeriodHours * 3600)) * (this.isPaused ? 0.2 : this.timeWarp * 86400);
      body.tiltGroup.rotation.y += rotSpeed * delta * 0.1;

      // 2. Heliocentric Keplerian Orbit Position Calculation
      if (d.semiMajorAxisAU > 0 && !d.isProbe) {
        const a = d.semiMajorAxisAU * 40.0;
        const e = d.eccentricity;
        const periodDays = d.orbitalPeriodDays;

        // Mean Anomaly M
        const n = (Math.PI * 2) / periodDays;
        const M = (this.simTimeDays * n) % (Math.PI * 2);

        // Solve Kepler's equation for Eccentric Anomaly E
        const E = this.solveKepler(M, e);

        // True Anomaly nu
        const nu = 2.0 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

        // Distance from Sun
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

        // 3D position in orbit plane
        const incRad = (d.inclinationDeg || 0) * (Math.PI / 180);
        const xOrb = r * Math.cos(nu);
        const zOrb = r * Math.sin(nu);
        const yOrb = -zOrb * Math.sin(incRad);
        const zInc = zOrb * Math.cos(incRad);

        body.heliocentricPos.set(xOrb, yOrb, zInc);

        // Compute Vis-Viva live velocity (km/s)
        const currentAU = (r / 40.0);
        const velocityKms = Math.sqrt(887.0 * (2.0 / currentAU - 1.0 / d.semiMajorAxisAU));
        body.currentVelocityKms = velocityKms;
        body.currentDistanceAU = currentAU;
      } else if (d.isProbe) {
        // Voyager 1 heading outwards along hyperbolic trajectory
        const rAU = 162.0 + (this.simTimeDays * 0.0001);
        const incRad = (d.inclinationDeg || 0) * (Math.PI / 180);
        const rScene = rAU * 4.0;
        body.heliocentricPos.set(
          rScene * Math.cos(0.8),
          rScene * Math.sin(incRad),
          rScene * Math.sin(0.8)
        );
        body.currentVelocityKms = 16.9;
        body.currentDistanceAU = rAU;
      } else {
        // The Sun is centered at origin
        body.heliocentricPos.set(0, 0, 0);
        body.currentVelocityKms = 0;
        body.currentDistanceAU = 0;
      }

      // 3. Interpolate between Heliocentric and Line-Wise Coordinates
      body.currentPos.lerpVectors(body.heliocentricPos, body.lineWisePos, this.lineWiseBlend);
      body.rootGroup.position.copy(body.currentPos);

      // 4. Update Shader Sun Position Uniforms for Shadows and Atmospheres
      if (body.atmosphereMesh && body.atmosphereMesh.material.uniforms) {
        body.atmosphereMesh.material.uniforms.sunPosition.value.copy(
          this.lineWiseBlend > 0.5 ? new THREE.Vector3(0, 0, 0) : this.celestialBodies.sun.currentPos
        );
      }
      if (body.ringsMesh && body.ringsMesh.material.uniforms) {
        body.ringsMesh.material.uniforms.planetCenter.value.copy(body.currentPos);
      }
      if (d.id === 'earth' && body.planetMesh.material.uniforms) {
        body.planetMesh.material.uniforms.cloudTime.value = t;
      }
    });

    // Update Asteroid Belt Instances
    if (this.asteroidBelt && this.showAsteroids) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.asteroidData.length; i++) {
        const ast = this.asteroidData[i];
        if (!this.isPaused) {
          ast.angle += ast.speed * delta * (this.timeWarp * 0.1);
        }

        // Heliocentric Keplerian position
        const rScene = ast.rAU * 40.0;
        const xHelio = Math.cos(ast.angle) * rScene;
        const zHelio = Math.sin(ast.angle) * rScene;
        const yHelio = ast.yOffset;

        // Line-Wise position (gathered in belt corridor along line)
        const xLine = ast.lineX;
        const yLine = ast.yOffset;
        const zLine = ast.lineZ;

        // Blend
        const x = THREE.MathUtils.lerp(xHelio, xLine, this.lineWiseBlend);
        const y = THREE.MathUtils.lerp(yHelio, yLine, this.lineWiseBlend);
        const z = THREE.MathUtils.lerp(zHelio, zLine, this.lineWiseBlend);

        dummy.position.set(x, y, z);
        dummy.rotation.x += ast.rotSpeed;
        dummy.rotation.y += ast.rotSpeed;
        dummy.scale.set(ast.scale, ast.scale, ast.scale);
        dummy.updateMatrix();

        this.asteroidBelt.setMatrixAt(i, dummy.matrix);
      }
      this.asteroidBelt.instanceMatrix.needsUpdate = true;
    }

    // Dynamic Sun PointLight Position
    if (this.sunLight && this.celestialBodies.sun) {
      this.sunLight.position.copy(this.celestialBodies.sun.currentPos);
    }
  }

  // --------------------------------------------------------------------------
  // 11. CAMERA NAVIGATION & DIRECTOR MODES
  // --------------------------------------------------------------------------
  focusOn(bodyId, smooth = true) {
    const body = this.celestialBodies[bodyId];
    if (!body) return;

    this.selectedBodyId = bodyId;
    const targetPos = body.currentPos;
    const radius = body.data.renderRadius;

    // Calculate ideal camera viewing distance proportional to planetary size
    const viewDist = Math.max(radius * 3.8, 6.0);
    const targetCamPos = targetPos.clone().add(new THREE.Vector3(viewDist * 0.6, viewDist * 0.35, viewDist * 0.9));

    if (!smooth) {
      this.camera.position.copy(targetCamPos);
      if (this.controls) {
        this.controls.target.copy(targetPos);
      }
      return;
    }

    // Smooth camera transition animation
    this.isTransitioning = true;
    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();
    const startTime = performance.now();
    const duration = 1200; // ms

    const animateTransition = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Smooth cubic s-curve ease
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Update camera position relative to body's current moving position
      const liveTarget = body.currentPos;
      const liveCamTarget = liveTarget.clone().add(new THREE.Vector3(viewDist * 0.6, viewDist * 0.35, viewDist * 0.9));

      this.camera.position.lerpVectors(startCamPos, liveCamTarget, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(startTarget, liveTarget, ease);
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateTransition);
      } else {
        this.isTransitioning = false;
      }
    };

    requestAnimationFrame(animateTransition);
  }

  setViewMode(mode) {
    if (mode === 'linewise') {
      this.viewMode = 'linewise';
      this.targetLineWiseBlend = 1.0;
      if (this.cosmicLineAxis) this.cosmicLineAxis.visible = true;
    } else if (mode === 'heliocentric') {
      this.viewMode = 'heliocentric';
      this.targetLineWiseBlend = 0.0;
      if (this.cosmicLineAxis) this.cosmicLineAxis.visible = false;
    }
  }

  setTimeWarp(speed) {
    this.timeWarp = speed;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  startGrandTour() {
    this.cameraMode = 'tour';
    this.tourIndex = 0;
    this.tourTimer = 0;
    this.focusOn(this.celestialData[0].id, true);
  }

  stopGrandTour() {
    this.cameraMode = 'focus';
  }

  updateTour(delta) {
    if (this.cameraMode !== 'tour') return;

    this.tourTimer += delta;
    if (this.tourTimer >= this.tourDuration) {
      this.tourTimer = 0;
      this.tourIndex = (this.tourIndex + 1) % this.celestialData.length;
      const nextBodyId = this.celestialData[this.tourIndex].id;
      this.focusOn(nextBodyId, true);

      // Trigger narration and HUD sync if available
      if (window.voiceNarrator) {
        const data = this.celestialData[this.tourIndex];
        window.voiceNarrator.speak(`Approaching ${data.name}. ${data.desc}`, true);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 12. RENDER LOOP
  // --------------------------------------------------------------------------
  update() {
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Astrodynamics and physics equations
    this.updateCelestialMechanics(delta);

    // Grand Tour Autopilot
    this.updateTour(delta);

    // Keep camera following locked target if not transitioning
    if (!this.isTransitioning && this.controls && this.selectedBodyId) {
      const activeBody = this.celestialBodies[this.selectedBodyId];
      if (activeBody) {
        const curTarget = this.controls.target;
        curTarget.lerp(activeBody.currentPos, 0.1);
      }
    }

    if (this.controls) {
      this.controls.update();
    }

    // Render WebGL
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // Helper for HUD Telemetry
  getSelectedTelemetry() {
    const body = this.celestialBodies[this.selectedBodyId];
    if (!body) return null;
    return {
      ...body.data,
      currentVelocityKms: (body.currentVelocityKms || 0).toFixed(2),
      currentDistanceAU: (body.currentDistanceAU || 0).toFixed(3),
      simTimeDays: this.simTimeDays.toFixed(1),
      viewMode: this.viewMode,
      timeWarp: this.timeWarp,
      isPaused: this.isPaused
    };
  }
}
