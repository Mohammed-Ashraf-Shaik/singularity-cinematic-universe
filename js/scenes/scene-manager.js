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
    this.sharedTextures.mercury = this.createMercuryTexture();
    this.sharedTextures.venus = this.createVenusTexture();
    this.sharedTextures.earthDay = this.createEarthDayTexture();
    this.sharedTextures.earthNight = this.createEarthNightTexture();
    this.sharedTextures.earthSpec = this.createEarthSpecTexture();
    this.sharedTextures.earthClouds = this.createEarthCloudsTexture();
    this.sharedTextures.moon = this.createMoonTexture();
    this.sharedTextures.mars = this.createMarsTexture();
    this.sharedTextures.phobos = this.createPhobosTexture();
    this.sharedTextures.ceres = this.createCeresTexture();
    this.sharedTextures.jupiter = this.createJupiterTexture();
    this.sharedTextures.io = this.createIoTexture();
    this.sharedTextures.europa = this.createEuropaTexture();
    this.sharedTextures.ganymede = this.createGanymedeTexture();
    this.sharedTextures.callisto = this.createCallistoTexture();
    this.sharedTextures.saturn = this.createSaturnTexture();
    this.sharedTextures.saturnRings = this.createSaturnRingsTexture();
    this.sharedTextures.titan = this.createTitanTexture();
    this.sharedTextures.enceladus = this.createEnceladusTexture();
    this.sharedTextures.uranus = this.createUranusTexture();
    this.sharedTextures.uranusRings = this.createUranusRingsTexture();
    this.sharedTextures.neptune = this.createNeptuneTexture();
    this.sharedTextures.triton = this.createTritonTexture();
    this.sharedTextures.pluto = this.createPlutoTexture();
    this.sharedTextures.charon = this.createCharonTexture();
  }

  createSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#ff3e00');
    grad.addColorStop(0.25, '#ff8000');
    grad.addColorStop(0.5, '#ffd200');
    grad.addColorStop(0.75, '#ff8000');
    grad.addColorStop(1, '#ff3e00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Convective granulation noise cells
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 14 + 3;
      ctx.fillStyle = Math.random() > 0.45 ? 'rgba(255, 255, 220, 0.28)' : 'rgba(180, 35, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Solar Magnetic Sunspots (Umbra & Penumbra)
    const sunspots = [
      { x: 320, y: 220, r: 16 },
      { x: 345, y: 232, r: 9 },
      { x: 680, y: 290, r: 22 },
      { x: 715, y: 278, r: 12 },
      { x: 700, y: 310, r: 8 },
      { x: 840, y: 240, r: 14 }
    ];
    sunspots.forEach(sp => {
      // Penumbra
      ctx.fillStyle = 'rgba(110, 35, 5, 0.75)';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      // Umbra
      ctx.fillStyle = '#1c0500';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  createMercuryTexture() {
    // NASA MESSENGER Cartographic Mosaic: Basaltic low albedo (0.12), Caloris Basin, rayed craters
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base charcoal-brown basalt
    ctx.fillStyle = '#36322c';
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle geological tonal variations
    for (let i = 0; i < 4500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(75, 68, 60, 0.12)' : 'rgba(35, 30, 26, 0.14)';
      ctx.fillRect(Math.random() * 2048, Math.random() * 1024, Math.random() * 16 + 4, Math.random() * 16 + 4);
    }

    // Widespread impact craters
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 960 + 32;
      const r = Math.random() * 22 + 4;

      ctx.fillStyle = '#221f1b';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlighted crater rim
      ctx.strokeStyle = '#5a5246';
      ctx.lineWidth = Math.max(1.2, r * 0.22);
      ctx.beginPath();
      ctx.arc(x - r * 0.12, y - r * 0.12, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Caloris Basin (1,550 km multi-ring impact basin)
    const cbX = 620;
    const cbY = 480;
    const cbR = 190;

    // Interior lava smooth plains
    const calorisGrad = ctx.createRadialGradient(cbX, cbY, 10, cbX, cbY, cbR);
    calorisGrad.addColorStop(0, '#26221d');
    calorisGrad.addColorStop(0.7, '#2f2a24');
    calorisGrad.addColorStop(0.92, '#50483e');
    calorisGrad.addColorStop(1.0, '#36322c');
    ctx.fillStyle = calorisGrad;
    ctx.beginPath();
    ctx.arc(cbX, cbY, cbR, 0, Math.PI * 2);
    ctx.fill();

    // Concentric mountain scarps around Caloris
    [cbR * 0.55, cbR * 0.8, cbR * 1.0].forEach(ringR => {
      ctx.strokeStyle = 'rgba(100, 90, 78, 0.6)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cbX, cbY, ringR, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Pantheon Fossae radiating extensional graben troughs
    ctx.strokeStyle = 'rgba(70, 62, 52, 0.5)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      ctx.beginPath();
      ctx.moveTo(cbX, cbY);
      ctx.lineTo(cbX + Math.cos(a) * (cbR * 0.75), cbY + Math.sin(a) * (cbR * 0.75));
      ctx.stroke();
    }

    // Debussy Crater (Extensive Bright Radial Ejecta Ray System)
    const debX = 1420;
    const debY = 680;
    // Radial bright ejecta rays
    for (let r = 0; r < 36; r++) {
      const angle = (r / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const rayLen = 180 + Math.random() * 380;
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.38)';
      ctx.lineWidth = Math.random() * 3.5 + 1.2;
      ctx.beginPath();
      ctx.moveTo(debX, debY);
      ctx.lineTo(debX + Math.cos(angle) * rayLen, debY + Math.sin(angle) * rayLen);
      ctx.stroke();
    }
    // Bright central crater
    ctx.fillStyle = '#faf6ed';
    ctx.beginPath();
    ctx.arc(debX, debY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2dcce';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Kuiper Crater with bright halo
    const kuiX = 980;
    const kuiY = 460;
    for (let r = 0; r < 20; r++) {
      const angle = (r / 20) * Math.PI * 2;
      const rayLen = 90 + Math.random() * 160;
      ctx.strokeStyle = 'rgba(225, 220, 210, 0.3)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(kuiX, kuiY);
      ctx.lineTo(kuiX + Math.cos(angle) * rayLen, kuiY + Math.sin(angle) * rayLen);
      ctx.stroke();
    }
    ctx.fillStyle = '#f0ebe0';
    ctx.beginPath();
    ctx.arc(kuiX, kuiY, 14, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createVenusTexture() {
    // NASA Magellan & Akatsuki UV/Visible: Creamy sulfuric acid clouds, zonal chevron shear
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base warm cream-amber sulfuric haze
    ctx.fillStyle = '#ebdcb7';
    ctx.fillRect(0, 0, 2048, 1024);

    // Zonal horizontal wind bands
    const cloudBands = ['#f4ecd8', '#ebd8af', '#e4cea0', '#ebdcb7', '#d8be8d', '#eedcb8'];
    for (let y = 0; y < 1024; y += 4) {
      const idx = Math.floor((y / 1024) * cloudBands.length * 2) % cloudBands.length;
      ctx.fillStyle = cloudBands[idx];
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, y, 2048, 4);
    }
    ctx.globalAlpha = 1.0;

    // Supersonic V-shaped chevron wave streaks (360 km/h retrograde wind shear)
    ctx.strokeStyle = 'rgba(190, 162, 115, 0.28)';
    ctx.lineWidth = 3.5;
    for (let row = 180; row < 860; row += 55) {
      for (let x = -100; x < 2148; x += 160) {
        ctx.beginPath();
        ctx.moveTo(x - 70, row - 25);
        ctx.lineTo(x, row);
        ctx.lineTo(x - 70, row + 25);
        ctx.stroke();
      }
    }

    // High altitude turbulent streaks
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * 800 + 112;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 252, 240, 0.22)' : 'rgba(165, 138, 92, 0.18)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < 2048; x += 64) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + y) * 12);
      }
      ctx.stroke();
    }

    // Polar Vortex Dipoles (North & South Pole spirals)
    [60, 964].forEach(py => {
      ctx.strokeStyle = 'rgba(180, 150, 100, 0.35)';
      ctx.lineWidth = 3.0;
      for (let r = 20; r < 90; r += 14) {
        ctx.beginPath();
        ctx.ellipse(1024, py, r * 3, r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthDayTexture() {
    // NASA Blue Marble True-Color: Bathymetric oceans, true continental topography, lush vegetation
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Bathymetric deep ocean gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0.0, '#06162a');
    oceanGrad.addColorStop(0.2, '#09213f');
    oceanGrad.addColorStop(0.5, '#0d2d54');
    oceanGrad.addColorStop(0.8, '#09213f');
    oceanGrad.addColorStop(1.0, '#06162a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Continental shelf shallow coastal waters
    const drawShelf = (cx, cy, rx, ry) => {
      ctx.fillStyle = 'rgba(24, 88, 128, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // North America (Alaska, Canada, USA, Mexico, Baja)
    drawShelf(580, 360, 180, 130);
    // South America
    drawShelf(720, 660, 130, 190);
    // Eurasia
    drawShelf(1400, 340, 260, 160);
    // Africa
    drawShelf(1120, 560, 150, 180);
    // Australia
    drawShelf(1680, 720, 110, 85);

    // Realistic Continental Landmasses
    const drawLandmass = (cx, cy, rx, ry, baseColor, roughSteps = 30) => {
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Geological perimeter fracture and fractal coastlines
      for (let i = 0; i < roughSteps; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (rx * 0.85);
        const r = Math.random() * (rx * 0.45) + 8;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // 1. North America (Boreal forests, Great Plains, Mexican deserts)
    drawLandmass(560, 340, 170, 115, '#2c5926', 45);
    drawLandmass(620, 380, 120, 75, '#48682e', 35);
    drawLandmass(520, 460, 65, 80, '#9a7f45', 25); // Mexico / Southwest arid
    drawLandmass(430, 260, 85, 55, '#35562a', 20); // Alaska

    // Greenland Ice Sheet
    ctx.fillStyle = '#ebf2f8';
    ctx.beginPath();
    ctx.ellipse(780, 210, 65, 95, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. South America (Amazon Basin, Andes mountain chain, Pampas)
    drawLandmass(720, 580, 115, 90, '#1a481a', 40); // Amazon lush rainforest
    drawLandmass(730, 710, 80, 130, '#506e36', 35); // Brazilian highlands / Pampas
    // Andes Mountain Cordillera (Dry brown ridge along western coast)
    ctx.strokeStyle = '#5a422a';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(630, 510);
    ctx.bezierCurveTo(635, 620, 650, 730, 690, 870);
    ctx.stroke();

    // 3. Europe & Mediterranean (Scandinavia, UK, France, Germany, Italy, Balkans)
    drawLandmass(1080, 310, 110, 80, '#36682c', 35);
    drawLandmass(1010, 280, 35, 45, '#326028', 15); // British Isles
    drawLandmass(1100, 220, 45, 75, '#2a5224', 20); // Scandinavia

    // 4. Africa (Sahara Desert, Sahel, Congo Rainforest, South Africa)
    drawLandmass(1120, 450, 155, 75, '#c8994d', 40); // Vast Sahara Desert
    drawLandmass(1130, 590, 120, 110, '#184419', 45); // Congo Basin Rainforest
    drawLandmass(1160, 720, 85, 95, '#5d6e32', 30); // Southern Africa
    drawLandmass(1285, 690, 22, 55, '#2c5826', 15); // Madagascar

    // 5. Eurasia (Siberia, Tibetan Plateau, Himalayas, India, East Asia)
    drawLandmass(1440, 290, 240, 110, '#244e22', 50); // Siberian Taiga
    drawLandmass(1520, 380, 140, 95, '#3c642e', 40); // China / East Asia
    drawLandmass(1360, 420, 80, 50, '#8d7348', 25); // Tibetan Plateau & Gobi Desert
    drawLandmass(1360, 520, 75, 80, '#38642a', 30); // Indian Subcontinent
    drawLandmass(1560, 580, 65, 70, '#224e20', 25); // Southeast Asia

    // Himalayan Snowcaps
    ctx.strokeStyle = '#f8fbff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(1330, 435);
    ctx.lineTo(1430, 430);
    ctx.stroke();

    // 6. Australia & Oceania (Red Outback, green coastlines, New Zealand)
    drawLandmass(1680, 715, 115, 85, '#a65426', 35); // Arid Red Outback
    // Green coastal rim
    ctx.strokeStyle = '#346628';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(1680, 715, 90, -0.6, 1.8);
    ctx.stroke();
    drawLandmass(1840, 790, 18, 45, '#2e5a26', 10); // New Zealand

    // 7. Antarctica (Massive Southern Ice Sheet)
    ctx.fillStyle = '#f2f6fc';
    ctx.fillRect(0, 935, 2048, 89);
    // Rough coastline
    for (let x = 0; x < 2048; x += 32) {
      const h = Math.sin(x * 0.03) * 24 + Math.random() * 18;
      ctx.fillRect(x, 920 - h, 36, h + 20);
    }

    // Arctic Sea Ice
    ctx.fillRect(0, 0, 2048, 42);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthNightTexture() {
    // NASA Black Marble: Urban electric city lighting clusters with incandescent glow
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep void black night side
    ctx.fillStyle = '#010204';
    ctx.fillRect(0, 0, 2048, 1024);

    const addCityCluster = (cx, cy, count, spread, intensity = 1.0) => {
      for (let i = 0; i < count; i++) {
        const x = cx + (Math.random() - 0.5) * spread;
        const y = cy + (Math.random() - 0.5) * (spread * 0.75);
        const r = Math.random() * 2.2 + 0.6;
        ctx.fillStyle = Math.random() > 0.35 ? '#ffe28a' : '#ffb347';
        ctx.globalAlpha = (Math.random() * 0.5 + 0.5) * intensity;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Core urban bloom
      const bloomGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, spread * 0.4);
      bloomGrad.addColorStop(0, 'rgba(255, 210, 110, 0.45)');
      bloomGrad.addColorStop(1, 'rgba(255, 170, 50, 0.0)');
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, spread * 0.4, 0, Math.PI * 2);
      ctx.fill();
    };

    // North America (Bos-Wash Megalopolis, Chicago, West Coast, Texas)
    addCityCluster(640, 360, 280, 85, 1.0); // US East Coast
    addCityCluster(580, 365, 160, 60, 0.9); // Chicago & Midwest
    addCityCluster(470, 370, 140, 50, 0.85); // California (LA, SF)
    addCityCluster(570, 420, 110, 55, 0.8); // Texas Triangle

    // Western Europe Megalopolis (London, Paris, Benelux, Ruhr, Milan)
    addCityCluster(1060, 310, 380, 75, 1.0);
    addCityCluster(1090, 335, 180, 50, 0.9); // Italy & Mediterranean

    // East Asia (Tokyo-Osaka corridor, Beijing, Shanghai, Pearl River Delta, Seoul)
    addCityCluster(1600, 375, 340, 60, 1.0); // Japan Tokaido corridor
    addCityCluster(1520, 360, 220, 65, 0.95); // Beijing / Tianjin
    addCityCluster(1540, 420, 260, 65, 1.0); // Shanghai / Yangtze Delta
    addCityCluster(1500, 470, 240, 55, 0.95); // Guangzhou / Hong Kong
    addCityCluster(1545, 365, 110, 30, 0.9); // Seoul

    // Indian Subcontinent (Ganges River corridor, Mumbai, Delhi, Bengaluru)
    addCityCluster(1360, 460, 260, 75, 0.95); // Northern India
    addCityCluster(1330, 510, 180, 50, 0.9); // Mumbai / Western Coast
    addCityCluster(1360, 540, 140, 50, 0.85); // Bengaluru / South India

    // Nile River & Delta ribbon of golden lights
    for (let ny = 450; ny < 520; ny += 6) {
      addCityCluster(1185, ny, 12, 12, 0.85);
    }
    addCityCluster(1185, 435, 90, 25, 0.95); // Nile Delta & Cairo

    ctx.globalAlpha = 1.0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthSpecTexture() {
    // NASA Specular Ocean Mask: Water is reflective (white), land is matte (black)
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Oceans are pure reflective white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 2048, 1024);

    // Mask out landmasses with pure matte black
    const maskLand = (cx, cy, rx, ry) => {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    maskLand(560, 340, 175, 120);
    maskLand(620, 380, 125, 80);
    maskLand(720, 580, 120, 95);
    maskLand(730, 710, 85, 135);
    maskLand(1080, 310, 115, 85);
    maskLand(1120, 450, 160, 80);
    maskLand(1130, 590, 125, 115);
    maskLand(1440, 290, 245, 115);
    maskLand(1520, 380, 145, 100);
    maskLand(1360, 520, 80, 85);
    maskLand(1680, 715, 120, 90);

    // Polar ice has moderate specular reflection
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 930, 2048, 94);
    ctx.fillRect(0, 0, 2048, 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEarthCloudsTexture() {
    // Dynamic Swirling Storm Systems & ITCZ Tropical Cloud Bands
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 2048, 1024);

    // ITCZ Convective Equatorial Cloud Clusters
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * 2048;
      const y = 512 + (Math.random() - 0.5) * 110;
      const rx = Math.random() * 45 + 15;
      const ry = Math.random() * 18 + 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swirling Mid-Latitude Cyclonic Storms (North & South Hemispheres)
    const drawCyclone = (cx, cy, radius, arms = 3, spin = 1) => {
      for (let a = 0; a < arms; a++) {
        const startAngle = (a / arms) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        for (let t = 0; t < 2.5; t += 0.08) {
          const r = (t / 2.5) * radius;
          const theta = startAngle + t * spin * 2.2;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * (r * 0.65);
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // Eye of the storm
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
    };

    drawCyclone(480, 320, 110, 3, 1); // North Pacific Storm
    drawCyclone(920, 280, 130, 3, 1); // North Atlantic Storm
    drawCyclone(1750, 340, 100, 3, 1); // West Pacific Typhoon
    drawCyclone(680, 780, 120, 3, -1); // Southern Ocean Storm
    drawCyclone(1380, 800, 140, 3, -1); // South Indian Ocean Cyclone

    // Wispy high altitude cirrus sheets
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 880 + 72;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.ellipse(x, y, Math.random() * 55 + 20, Math.random() * 12 + 4, Math.random() * 0.5 - 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createMoonTexture() {
    // NASA Lunar Reconnaissance Orbiter (LRO): Basaltic dark maria vs anorthosite highlands, Tycho rays
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Highly cratered bright anorthositic highlands base
    ctx.fillStyle = '#8c8a86';
    ctx.fillRect(0, 0, 2048, 1024);

    // Highland textural micro-cratering
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(175, 172, 168, 0.15)' : 'rgba(90, 88, 85, 0.18)';
      ctx.fillRect(Math.random() * 2048, Math.random() * 1024, Math.random() * 10 + 2, Math.random() * 10 + 2);
    }

    // Basaltic Lunar Maria (Dark Lowlands)
    const drawMare = (cx, cy, rx, ry, col = '#302e2b', roughCount = 25) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < roughCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (rx * 0.75);
        const r = Math.random() * (rx * 0.5) + 6;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Oceanus Procellarum (Vast dark western plain)
    drawMare(680, 480, 160, 210, '#2b2926', 45);
    // Mare Imbrium (Circular basin)
    drawMare(820, 360, 120, 110, '#262422', 35);
    // Mare Serenitatis
    drawMare(1020, 370, 85, 80, '#282624', 25);
    // Mare Tranquillitatis (Apollo 11 landing site!)
    drawMare(1080, 470, 95, 85, '#262523', 30);
    // Mare Crisium (Isolated circular dark basin)
    drawMare(1250, 410, 60, 55, '#22211f', 20);
    // Mare Fecunditatis & Mare Nectaris
    drawMare(1180, 560, 75, 70, '#2c2a27', 20);
    drawMare(1090, 590, 50, 45, '#2e2c29', 15);

    // Ancient Crater Pits across highlands
    for (let i = 0; i < 320; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 18 + 4;

      ctx.fillStyle = '#22211f';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c0bdb7';
      ctx.lineWidth = Math.max(1, r * 0.22);
      ctx.beginPath();
      ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.95, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Tycho Crater & Magnificent Radial Ejecta Ray System
    const tychoX = 1040;
    const tychoY = 780;
    for (let r = 0; r < 40; r++) {
      const angle = (r / 40) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
      const rayLen = 220 + Math.random() * 450;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = Math.random() * 3.5 + 1.2;
      ctx.beginPath();
      ctx.moveTo(tychoX, tychoY);
      ctx.lineTo(tychoX + Math.cos(angle) * rayLen, tychoY + Math.sin(angle) * rayLen);
      ctx.stroke();
    }
    // Tycho high-albedo crater core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tychoX, tychoY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Copernicus Crater in Mare Imbrium
    const copX = 810;
    const copY = 440;
    for (let r = 0; r < 24; r++) {
      const angle = (r / 24) * Math.PI * 2;
      const rayLen = 80 + Math.random() * 140;
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.35)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(copX, copY);
      ctx.lineTo(copX + Math.cos(angle) * rayLen, copY + Math.sin(angle) * rayLen);
      ctx.stroke();
    }
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.arc(copX, copY, 14, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createMarsTexture() {
    // NASA MRO & Viking Global Mosaic: Hematite dust, Syrtis Major basalt, Olympus Mons, Valles Marineris
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rusty iron oxide ferric dust base
    ctx.fillStyle = '#b74824';
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle desert sand dunes & tonal bands
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(215, 105, 55, 0.15)' : 'rgba(145, 50, 20, 0.15)';
      ctx.fillRect(Math.random() * 2048, Math.random() * 1024, Math.random() * 24 + 4, Math.random() * 14 + 4);
    }

    // Dark Volcanic Basalt Provinces
    const drawBasalt = (cx, cy, rx, ry) => {
      ctx.fillStyle = '#401e13';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (rx * 0.8);
        const r = Math.random() * (rx * 0.4) + 10;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Syrtis Major Planum (Iconic dark triangular volcanic shield)
    drawBasalt(1460, 510, 130, 95);
    // Acidalia Planitia (Northern dark lowlands)
    drawBasalt(860, 330, 150, 85);
    // Sinus Meridiani & Mare Tyrrhenum
    drawBasalt(1040, 520, 110, 60);
    drawBasalt(1650, 640, 140, 75);

    // Olympus Mons (Tallest volcano in Solar System: 21.9 km high, 600 km wide)
    const olyX = 600;
    const olyY = 440;
    const olyR = 65;

    // Basal scarp cliff perimeter
    ctx.fillStyle = '#823018';
    ctx.beginPath();
    ctx.arc(olyX, olyY, olyR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a1e0c';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Central Caldera Depression (Multi-ring collapse pits)
    ctx.fillStyle = '#260b04';
    ctx.beginPath();
    ctx.ellipse(olyX - 4, olyY - 2, 18, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tharsis Montes (Trio of giant shield volcanoes: Arsia, Pavonis, Ascraeus)
    const tharsis = [
      { x: 740, y: 550, r: 24 }, // Arsia Mons
      { x: 790, y: 480, r: 26 }, // Pavonis Mons
      { x: 840, y: 410, r: 28 }  // Ascraeus Mons
    ];
    tharsis.forEach(v => {
      ctx.fillStyle = '#843219';
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2e0f06';
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    // Valles Marineris Grand Canyon Complex (Spanning 4,000 km across the globe)
    ctx.strokeStyle = '#240d05';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(710, 560);
    ctx.bezierCurveTo(860, 580, 980, 550, 1140, 570);
    ctx.stroke();

    // Branching tributary chasmata (Coprates, Candor, Melas Chasma)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(850, 575);
    ctx.lineTo(920, 540);
    ctx.moveTo(960, 560);
    ctx.lineTo(1030, 595);
    ctx.stroke();

    // Hellas Planitia Impact Basin
    ctx.fillStyle = '#c8704d';
    ctx.beginPath();
    ctx.ellipse(1480, 720, 105, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brilliant White Polar Ice Caps
    // North Pole (Planum Boreum) - Spiral water/CO2 ice cap
    ctx.fillStyle = '#fefefe';
    ctx.fillRect(0, 0, 2048, 38);
    for (let x = 0; x < 2048; x += 40) {
      const h = Math.sin(x * 0.04) * 16 + Math.random() * 12;
      ctx.fillRect(x, 38, 42, h);
    }
    // South Pole (Planum Australe)
    ctx.fillRect(0, 986, 2048, 38);
    for (let x = 0; x < 2048; x += 45) {
      const h = Math.sin(x * 0.035) * 14 + Math.random() * 10;
      ctx.fillRect(x, 986 - h, 48, h);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createPhobosTexture() {
    // NASA MRO HiRISE: Dark carbonaceous regolith, Stickney crater and linear fracture grooves
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#48443e';
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#58524a' : '#34302a';
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() * 8 + 2, Math.random() * 8 + 2);
    }

    // Stickney Crater (9 km impact basin dominating Phobos)
    ctx.fillStyle = '#262420';
    ctx.beginPath();
    ctx.arc(380, 250, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#706a60';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Linear striation grooves radiating from Stickney
    ctx.strokeStyle = 'rgba(50, 46, 40, 0.5)';
    ctx.lineWidth = 2.5;
    for (let y = 140; y < 380; y += 22) {
      ctx.beginPath();
      ctx.moveTo(460, y);
      ctx.lineTo(880, y + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createCeresTexture() {
    // NASA Dawn Mission: Dark carbonaceous asteroid regolith, Occator Crater Cerealia Facula salt spots
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#423e3a';
    ctx.fillRect(0, 0, 2048, 1024);

    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#524e48' : '#2e2a26';
      ctx.fillRect(Math.random() * 2048, Math.random() * 1024, Math.random() * 12 + 2, Math.random() * 12 + 2);
    }

    // Impact Craters
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 20 + 4;
      ctx.fillStyle = '#262320';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#68625a';
      ctx.lineWidth = Math.max(1, r * 0.2);
      ctx.stroke();
    }

    // Occator Crater (92 km crater hosting bright sodium carbonate salt deposits)
    const occX = 1060;
    const occY = 480;
    const occR = 55;

    ctx.fillStyle = '#2b2724';
    ctx.beginPath();
    ctx.arc(occX, occY, occR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a544c';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cerealia Facula (Brilliant glowing central sodium carbonate dome)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(occX, occY, 14, 0, Math.PI * 2);
    ctx.fill();
    // Glowing halo
    const glowGrad = ctx.createRadialGradient(occX, occY, 3, occX, occY, 28);
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glowGrad.addColorStop(0.5, 'rgba(215, 240, 255, 0.45)');
    glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(occX, occY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Vinalia Faculae (Secondary bright salt fracture patches nearby)
    [-18, 16, 22].forEach((offset, idx) => {
      ctx.fillStyle = '#f8fbff';
      ctx.beginPath();
      ctx.arc(occX + offset, occY + (idx - 1) * 12, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createJupiterTexture() {
    // NASA Juno & Cassini Composite: High-res alternating Belts and Zones, Great Red Spot, shear eddies
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Alternating NASA atmospheric zonal bands
    const bands = [
      { y1: 0, y2: 120, col1: '#546a78', col2: '#688090' },     // North Polar Storm Region
      { y1: 120, y2: 200, col1: '#844c2c', col2: '#965634' },   // North North Temperate Belt (NNTB)
      { y1: 200, y2: 290, col1: '#f4ebd8', col2: '#fcf6ec' },   // North Tropical Zone (NTrZ)
      { y1: 290, y2: 440, col1: '#7c3617', col2: '#9a4622' },   // North Equatorial Belt (NEB)
      { y1: 440, y2: 560, col1: '#f2dfc5', col2: '#f6ebd9' },   // Equatorial Zone (EZ)
      { y1: 560, y2: 710, col1: '#823a19', col2: '#a44e26' },   // South Equatorial Belt (SEB - GRS region)
      { y1: 710, y2: 800, col1: '#eddcc5', col2: '#f4ebd8' },   // South Tropical Zone (STrZ)
      { y1: 800, y2: 890, col1: '#8a4e2e', col2: '#9e5836' },   // South Temperate Belt (STB)
      { y1: 890, y2: 1024, col1: '#546a78', col2: '#688090' }   // South Polar Storm Region
    ];

    bands.forEach(b => {
      const grad = ctx.createLinearGradient(0, b.y1, 0, b.y2);
      grad.addColorStop(0, b.col1);
      grad.addColorStop(0.5, b.col2);
      grad.addColorStop(1, b.col1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, b.y1, 2048, b.y2 - b.y1);
    });

    // Equatorial Bluish-Gray Festoon Plumes
    ctx.strokeStyle = 'rgba(105, 130, 150, 0.45)';
    ctx.lineWidth = 5;
    for (let x = 0; x < 2048; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, 440);
      ctx.bezierCurveTo(x + 35, 480, x + 65, 520, x + 25, 555);
      ctx.stroke();
    }

    // Atmospheric Shear Wave Turbulence along band borders
    for (let i = 0; i < 160; i++) {
      const y = Math.random() * 920 + 50;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(70, 24, 8, 0.28)';
      ctx.lineWidth = Math.random() * 3 + 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < 2048; x += 48) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + y) * 11);
      }
      ctx.stroke();
    }

    // Anticyclonic White Ovals (Along South Temperate Belt)
    for (let i = 0; i < 7; i++) {
      const ox = 260 + i * 270;
      const oy = 755 + (Math.random() - 0.5) * 20;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ox, oy, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#caa582';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // The Great Red Spot (GRS: Anticyclonic Storm persisting for >350 years)
    const grsX = 1320;
    const grsY = 645;
    const grsW = 165;
    const grsH = 100;

    // Outer white halo collar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsW * 0.62, grsH * 0.64, 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Dark perimeter rim
    ctx.fillStyle = '#6e1e0d';
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsW * 0.55, grsH * 0.55, 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Deep brick-orange/red vortex core
    const grsGrad = ctx.createRadialGradient(grsX, grsY, 5, grsX, grsY, grsW * 0.5);
    grsGrad.addColorStop(0, '#c43418');
    grsGrad.addColorStop(0.65, '#b02c14');
    grsGrad.addColorStop(1, '#821a08');
    ctx.fillStyle = grsGrad;
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsW * 0.5, grsH * 0.48, 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Turbulent wake vortices trailing westward behind the GRS
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    for (let w = 0; w < 4; w++) {
      const wx = grsX - 90 - w * 70;
      const wy = grsY + (w % 2 === 0 ? 15 : -15);
      ctx.beginPath();
      ctx.arc(wx, wy, 20 + w * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createIoTexture() {
    // NASA Galileo/Juno: Volcanic sulfur world ("pizza moon"), Pele and Loki Patera lava lakes
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Cadmium yellow & sulfur orange base
    ctx.fillStyle = '#ffde38';
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#ff9e18' : '#e0ba24';
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() * 12 + 3, Math.random() * 12 + 3);
    }

    // White SO2 frost patches
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * 1024, Math.random() * 512, Math.random() * 30 + 10, Math.random() * 20 + 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Volcanic Calderas & Lava Lakes (Pele, Loki Patera, Prometheus)
    const calderas = [
      { x: 280, y: 220, r: 24, redHalo: true }, // Pele with giant red sulfur fallout ring
      { x: 520, y: 290, r: 32, redHalo: false }, // Loki Patera
      { x: 740, y: 200, r: 18, redHalo: true },
      { x: 860, y: 340, r: 22, redHalo: false },
      { x: 420, y: 390, r: 16, redHalo: true }
    ];

    calderas.forEach(c => {
      if (c.redHalo) {
        ctx.strokeStyle = '#c42408';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#180e06'; // Pitch-black silicate lava lake
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEuropaTexture() {
    // NASA Galileo: Global water-ice shell, intricate reddish-brown chaos fractures (lineae)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Pearlescent icy white-blue surface
    ctx.fillStyle = '#f2f6fa';
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = 'rgba(215, 230, 245, 0.45)';
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() * 20 + 4, Math.random() * 10 + 2);
    }

    // Complex Reddish-Brown Lineae Fracture Network
    ctx.strokeStyle = 'rgba(122, 58, 30, 0.65)';
    for (let i = 0; i < 55; i++) {
      ctx.lineWidth = Math.random() * 4 + 1.2;
      ctx.beginPath();
      let x = Math.random() * 1024;
      let y = Math.random() * 512;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (Math.random() - 0.5) * 160;
        y += (Math.random() - 0.5) * 100;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Lenticulae Chaos Terrain (Dark reddish disrupted ice bergs)
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = 'rgba(140, 68, 36, 0.45)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * 1024, Math.random() * 512, Math.random() * 22 + 8, Math.random() * 14 + 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createGanymedeTexture() {
    // NASA Galileo: Ancient dark cratered regions (Galileo Regio) vs bright grooved terrain (sulci)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Light grooved terrain base
    ctx.fillStyle = '#8a8278';
    ctx.fillRect(0, 0, 1024, 512);

    // Ancient Dark Cratered Polygons (Galileo Regio, Marius Regio)
    const drawRegio = (cx, cy, rx, ry) => {
      ctx.fillStyle = '#48423c';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawRegio(320, 240, 160, 130);
    drawRegio(750, 310, 180, 140);

    // Tectonic grooved fault lines (Sulci)
    ctx.strokeStyle = 'rgba(180, 172, 162, 0.45)';
    ctx.lineWidth = 2.0;
    for (let y = 80; y < 450; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(340, y + 25, 680, y - 25, 1024, y);
      ctx.stroke();
    }

    // Bright high-albedo impact craters
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 6 + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createCallistoTexture() {
    // NASA Galileo: Ancient saturated ice-rock craters, Valhalla multi-ring basin
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 0, 1024, 512);

    // Thousands of ancient bright frost-rimmed craters
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const r = Math.random() * 10 + 2;
      ctx.fillStyle = '#1e1c1a';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8d4dc';
      ctx.lineWidth = Math.max(1, r * 0.25);
      ctx.stroke();
    }

    // Valhalla Multi-Ring Impact Basin (1,900 km across)
    const valX = 480;
    const valY = 240;
    for (let ring = 25; ring < 160; ring += 18) {
      ctx.strokeStyle = 'rgba(215, 230, 240, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(valX, valY, ring, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(valX, valY, 14, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createSaturnTexture() {
    // NASA Cassini True-Color: Golden butterscotch pastel bands, North Polar Hexagon storm
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Delicate golden-amber atmospheric stripes
    const bands = [
      { y: 0, col: '#726649' },    // North Polar Hexagon Region
      { y: 140, col: '#c8aa74' },  // North Temperate Belt
      { y: 280, col: '#e8d6ab' },  // North Tropical Zone
      { y: 440, col: '#eddcb8' },  // Equatorial Zone (Brightest)
      { y: 580, col: '#dcc495' },  // South Equatorial Belt
      { y: 720, col: '#cbb180' },  // South Temperate Belt
      { y: 880, col: '#9c845c' },  // South Polar Hood
      { y: 1024, col: '#7a6744' }
    ];

    for (let i = 0; i < bands.length - 1; i++) {
      const grad = ctx.createLinearGradient(0, bands[i].y, 0, bands[i + 1].y);
      grad.addColorStop(0, bands[i].col);
      grad.addColorStop(1, bands[i + 1].col);
      ctx.fillStyle = grad;
      ctx.fillRect(0, bands[i].y, 2048, bands[i + 1].y - bands[i].y);
    }

    // High frequency subtle zonal micro-stripes
    for (let y = 0; y < 1024; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? 'rgba(255, 245, 220, 0.08)' : 'rgba(150, 115, 60, 0.08)';
      ctx.fillRect(0, y, 2048, 4);
    }

    // The North Polar Hexagon (Discovered by Voyager, mapped by Cassini at ~78°N)
    const hexY = 70;
    ctx.strokeStyle = '#94845e';
    ctx.lineWidth = 7;
    for (let x = 180; x < 2048; x += 341) {
      ctx.beginPath();
      const r = 52;
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const px = x + Math.cos(a) * r;
        const py = hexY + Math.sin(a) * (r * 0.45);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    // Hexagon central eye
    ctx.fillStyle = '#5c5035';
    ctx.fillRect(0, 0, 2048, 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createSaturnRingsTexture() {
    // NASA Cassini Ring Profile: C-Ring, B-Ring, Cassini Division, A-Ring, Encke Gap, F-Ring
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 2048, 0);
    grad.addColorStop(0.00, 'rgba(0,0,0,0)');
    grad.addColorStop(0.08, 'rgba(140, 122, 100, 0.12)'); // D Ring
    grad.addColorStop(0.14, 'rgba(165, 145, 120, 0.38)'); // C Ring (Crepe Ring)
    grad.addColorStop(0.28, 'rgba(195, 175, 140, 0.65)');
    grad.addColorStop(0.32, 'rgba(235, 215, 170, 0.96)'); // B Ring (Brightest & most dense)
    grad.addColorStop(0.58, 'rgba(240, 220, 175, 0.98)');
    grad.addColorStop(0.60, 'rgba(0, 0, 0, 0.02)');       // Cassini Division (4,800 km gap)
    grad.addColorStop(0.67, 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(0.69, 'rgba(205, 185, 150, 0.78)'); // A Ring
    grad.addColorStop(0.87, 'rgba(195, 175, 140, 0.72)');
    grad.addColorStop(0.88, 'rgba(0, 0, 0, 0.02)');       // Encke Gap
    grad.addColorStop(0.90, 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(0.92, 'rgba(185, 165, 130, 0.55)');
    grad.addColorStop(0.95, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.97, 'rgba(180, 160, 125, 0.42)'); // F Ring (Thin shepherd ring)
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 64);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  createTitanTexture() {
    // NASA Cassini/Huygens: Dense photochemical golden-orange smog atmosphere
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#bf7218');
    grad.addColorStop(0.2, '#e89e38');
    grad.addColorStop(0.5, '#f4ad44');
    grad.addColorStop(0.8, '#e89e38');
    grad.addColorStop(1, '#bf7218');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle dark polar hood
    ctx.fillStyle = 'rgba(120, 60, 10, 0.35)';
    ctx.fillRect(0, 0, 1024, 45);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createEnceladusTexture() {
    // NASA Cassini: Pure brilliant white ice (>0.99 albedo), south polar cyan-blue "tiger stripes"
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fbfcfe';
    ctx.fillRect(0, 0, 1024, 512);

    // North cratering
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = 'rgba(215, 225, 235, 0.5)';
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 200, Math.random() * 8 + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // South Polar Cryovolcanic "Tiger Stripe" Fissures (Damascus, Baghdad, Alexandria, Cairo Sulci)
    ctx.strokeStyle = '#3898b8';
    ctx.lineWidth = 3.5;
    [410, 435, 460, 485].forEach(sy => {
      ctx.beginPath();
      ctx.moveTo(340, sy);
      ctx.bezierCurveTo(460, sy + 15, 580, sy - 15, 700, sy);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createUranusTexture() {
    // NASA Voyager 2 & JWST: Aquamarine methane absorption, pale collar, rolling 98° tilt
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#50c4c4');
    grad.addColorStop(0.2, '#66d2d2');
    grad.addColorStop(0.5, '#78dede');
    grad.addColorStop(0.8, '#66d2d2');
    grad.addColorStop(1.0, '#50c4c4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Pale brighter polar hood
    ctx.fillStyle = 'rgba(235, 255, 255, 0.18)';
    ctx.fillRect(0, 0, 2048, 180);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createUranusRingsTexture() {
    // Narrow dark vertical charcoal rings (Epsilon ring)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 1024, 64);
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0.00, 'rgba(0,0,0,0)');
    grad.addColorStop(0.35, 'rgba(0,0,0,0)');
    grad.addColorStop(0.40, 'rgba(70, 85, 95, 0.45)');
    grad.addColorStop(0.44, 'rgba(0,0,0,0)');
    grad.addColorStop(0.65, 'rgba(85, 100, 110, 0.6)'); // Epsilon ring
    grad.addColorStop(0.72, 'rgba(0,0,0,0)');
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 64);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  createNeptuneTexture() {
    // NASA Voyager 2: Deep azure cobalt blue, supersonic white cirrus streaks ("Scooter"), Great Dark Spot
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep cobalt azure blue base
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.0, '#1638b8');
    grad.addColorStop(0.2, '#1e48d4');
    grad.addColorStop(0.5, '#285ef0');
    grad.addColorStop(0.8, '#1e48d4');
    grad.addColorStop(1.0, '#1638b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle zonal banding
    for (let y = 0; y < 1024; y += 8) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, y, 2048, 4);
    }

    // The Great Dark Spot (Voyager 2 anticyclonic oval storm)
    const gdsX = 940;
    const gdsY = 580;
    ctx.fillStyle = '#0b1e60';
    ctx.beginPath();
    ctx.ellipse(gdsX, gdsY, 95, 52, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Bright white companion cirrus clouds flanking the dark spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(gdsX - 25, gdsY - 48, 45, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Supersonic Methane Ice Cirrus Clouds ("Scooter" - 2,100 km/h wind shear)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.lineWidth = 4.5;
    for (let i = 0; i < 28; i++) {
      const y = Math.random() * 880 + 72;
      const startX = Math.random() * 1200;
      const len = 180 + Math.random() * 380;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + len, y + (Math.random() - 0.5) * 8);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createTritonTexture() {
    // NASA Voyager 2: Retrograde Kuiper capture moon, pinkish nitrogen frost, "cantaloupe terrain"
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Pinkish-peach nitrogen frost
    ctx.fillStyle = '#e8c4b8';
    ctx.fillRect(0, 0, 1024, 512);

    // Cantaloupe Terrain (Dimpled cryovolcanic plains)
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = 'rgba(160, 155, 145, 0.35)';
      ctx.beginPath();
      ctx.arc(Math.random() * 1024, Math.random() * 350 + 80, Math.random() * 12 + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Nitrogen Cryovolcanic Geyser Streaks (Black organic fallout blown downwind)
    ctx.fillStyle = '#2b231f';
    for (let i = 0; i < 16; i++) {
      const gx = Math.random() * 900 + 50;
      const gy = Math.random() * 180 + 300;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 60, gy - 8);
      ctx.lineTo(gx + 65, gy - 4);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createPlutoTexture() {
    // NASA New Horizons: Tombaugh Regio nitrogen ice heart, Sputnik Planitia, Cthulhu Macula tholins
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark reddish-ochre upland crust
    ctx.fillStyle = '#7a422a';
    ctx.fillRect(0, 0, 2048, 1024);

    // Cthulhu Macula ("The Whale" - pitch black to reddish-brown organic tholin equatorial belt)
    ctx.fillStyle = '#220904';
    ctx.fillRect(0, 520, 1100, 160);
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 1100, 520 + (Math.random() - 0.5) * 120, Math.random() * 50 + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Northern and eastern cratered uplands
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#8c4e32' : '#5a2818';
      ctx.fillRect(Math.random() * 2048, Math.random() * 1024, Math.random() * 16 + 4, Math.random() * 16 + 4);
    }

    // Tombaugh Regio: The Famous Bright Heart-Shaped Glacier
    const hx = 1080;
    const hy = 480;

    // Western Lobe: Sputnik Planitia (1,000 km plain of nitrogen, methane, and CO ices)
    ctx.fillStyle = '#fef8f0';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.bezierCurveTo(hx - 120, hy - 140, hx - 240, hy - 40, hx - 200, hy + 90);
    ctx.bezierCurveTo(hx - 160, hy + 200, hx - 40, hy + 220, hx, hy + 260);
    ctx.bezierCurveTo(hx + 40, hy + 220, hx + 160, hy + 200, hx + 200, hy + 90);
    ctx.bezierCurveTo(hx + 240, hy - 40, hx + 120, hy - 140, hx, hy);
    ctx.fill();

    // Polygonal Convection Cell Margins in Sputnik Planitia
    ctx.strokeStyle = 'rgba(215, 195, 180, 0.4)';
    ctx.lineWidth = 2.0;
    for (let cellY = hy - 60; cellY < hy + 180; cellY += 35) {
      for (let cellX = hx - 140; cellX < hx + 140; cellX += 45) {
        ctx.strokeRect(cellX + (Math.random() - 0.5) * 8, cellY, 40, 30);
      }
    }

    // Hillary Montes & Norgay Montes (Rugged water-ice mountain peaks along Sputnik edge)
    ctx.fillStyle = '#bca696';
    for (let m = 0; m < 16; m++) {
      ctx.beginPath();
      ctx.arc(hx - 180 + (Math.random() - 0.5) * 30, hy + (m - 8) * 20, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  createCharonTexture() {
    // NASA New Horizons: Dark red Mordor Macula north polar hood, Serenity Chasma rift, cratered plains
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Smooth cratered water-ice plains (Vulcan Planitia)
    ctx.fillStyle = '#9c9892';
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#aca7a0' : '#84807a';
      ctx.fillRect(Math.random() * 1024, Math.random() * 512, Math.random() * 10 + 2, Math.random() * 10 + 2);
    }

    // Mordor Macula: Striking dark reddish-brown tholin north polar hood
    ctx.fillStyle = '#632616';
    ctx.fillRect(0, 0, 1024, 75);
    for (let x = 0; x < 1024; x += 32) {
      const h = Math.sin(x * 0.04) * 20 + Math.random() * 16;
      ctx.fillRect(x, 75, 36, h);
    }

    // Serenity Chasma: Colossal equatorial tectonic rift canyon splitting Charon
    ctx.strokeStyle = '#46403a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(0, 260);
    ctx.bezierCurveTo(280, 245, 640, 275, 1024, 255);
    ctx.stroke();

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
    const moons = [];

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

      // Earth's Moon (Luna) with LRO basaltic maria & Tycho rays
      const moonGeo = new THREE.SphereGeometry(0.68, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        map: this.sharedTextures.moon,
        roughness: 0.9,
        metalness: 0.05
      });
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);
      rootGroup.add(moonMesh);
      moons.push({
        mesh: moonMesh,
        distance: 5.8,
        orbitSpeed: 0.55,
        angle: 0.0,
        inclination: 0.089, // 5.14 degrees lunar inclination
        rotSpeed: 0.2
      });

    } else if (data.isProbe) {
      // 3D Procedural Model of Voyager 1 Spacecraft
      planetMesh = this.createVoyager1Mesh(data);
      tiltGroup.add(planetMesh);

    } else {
      // Standard Planetary Body with NASA-Calibrated Textures & Surface Shading
      const planetGeo = new THREE.SphereGeometry(data.renderRadius, 64, 64);
      const textureKey = data.id === 'asteroid_belt' ? 'ceres' : data.id;
      const planetMat = new THREE.MeshStandardMaterial({
        map: this.sharedTextures[textureKey] || this.sharedTextures.mercury,
        roughness: data.type.includes('Gas') || data.type.includes('Ice') ? 0.45 : 0.85,
        metalness: 0.08
      });
      planetMesh = new THREE.Mesh(planetGeo, planetMat);
      tiltGroup.add(planetMesh);
    }

    // Real NASA Polar Flattening / Oblateness Factors
    if (data.id === 'jupiter') {
      planetMesh.scale.set(1.0, 0.9351, 1.0); // Real NASA oblateness f = 0.06487
    } else if (data.id === 'saturn') {
      planetMesh.scale.set(1.0, 0.9020, 1.0); // Real NASA oblateness f = 0.09796 (highest oblateness)
    } else if (data.id === 'uranus') {
      planetMesh.scale.set(1.0, 0.9771, 1.0); // Real NASA oblateness f = 0.0229
    } else if (data.id === 'neptune') {
      planetMesh.scale.set(1.0, 0.9829, 1.0); // Real NASA oblateness f = 0.0171
    } else if (data.id === 'asteroid_belt') {
      planetMesh.scale.set(1.0, 0.9240, 1.0); // Ceres oblate spheroid
    }

    // Atmospheric Rayleigh scattering rim glow
    if (data.hasAtmosphereGlow && data.id !== 'sun') {
      const atmoGeo = new THREE.SphereGeometry(data.renderRadius * 1.06, 48, 48);
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
      if (data.id === 'jupiter') atmosphereMesh.scale.set(1.0, 0.9351, 1.0);
      else if (data.id === 'saturn') atmosphereMesh.scale.set(1.0, 0.9020, 1.0);
      else if (data.id === 'uranus') atmosphereMesh.scale.set(1.0, 0.9771, 1.0);
      else if (data.id === 'neptune') atmosphereMesh.scale.set(1.0, 0.9829, 1.0);
      tiltGroup.add(atmosphereMesh);
    }

    // Saturn / Uranus Ring Systems
    let ringsMesh = null;
    if (data.hasRings) {
      const isUranus = data.id === 'uranus';
      const innerR = isUranus ? data.renderRadius * 1.5 : data.renderRadius * 1.35;
      const outerR = isUranus ? data.renderRadius * 2.1 : data.renderRadius * 2.45;
      const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
      ringGeo.rotateX(-Math.PI / 2);

      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const u = (dist - innerR) / (outerR - innerR);
        uvs.setXY(i, u, 0.5);
      }

      const ringTex = isUranus ? this.sharedTextures.uranusRings : this.sharedTextures.saturnRings;
      const ringMat = new THREE.ShaderMaterial({
        uniforms: {
          ringTexture: { value: ringTex },
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
    }

    // Moons for each planetary system (NASA-Accurate)
    if (data.id === 'mars') {
      // Phobos (Non-spherical triaxial ellipsoid with Stickney Crater)
      const phobosGeo = new THREE.DodecahedronGeometry(0.24, 2);
      const phobosMat = new THREE.MeshStandardMaterial({ map: this.sharedTextures.phobos, roughness: 0.95 });
      const phobosMesh = new THREE.Mesh(phobosGeo, phobosMat);
      phobosMesh.scale.set(1.3, 1.0, 0.8);
      rootGroup.add(phobosMesh);
      moons.push({ mesh: phobosMesh, distance: 2.8, orbitSpeed: 1.4, angle: 0.4, inclination: 0.02, rotSpeed: 0.8 });

      // Deimos (Smaller irregular body)
      const deimosGeo = new THREE.DodecahedronGeometry(0.16, 1);
      const deimosMesh = new THREE.Mesh(deimosGeo, phobosMat);
      deimosMesh.scale.set(1.1, 0.9, 0.7);
      rootGroup.add(deimosMesh);
      moons.push({ mesh: deimosMesh, distance: 4.6, orbitSpeed: 0.65, angle: 2.1, inclination: 0.03, rotSpeed: 0.4 });
    }

    if (data.id === 'jupiter') {
      // Galilean Moons (Io, Europa, Ganymede, Callisto)
      const galileanMoons = [
        { name: 'Io', r: 0.52, d: 8.5, tex: this.sharedTextures.io, speed: 0.95, inc: 0.005 },
        { name: 'Europa', r: 0.44, d: 11.2, tex: this.sharedTextures.europa, speed: 0.70, inc: 0.008 },
        { name: 'Ganymede', r: 0.74, d: 14.8, tex: this.sharedTextures.ganymede, speed: 0.48, inc: 0.003 },
        { name: 'Callisto', r: 0.68, d: 18.5, tex: this.sharedTextures.callisto, speed: 0.32, inc: 0.004 }
      ];
      galileanMoons.forEach((mSpec, idx) => {
        const mGeo = new THREE.SphereGeometry(mSpec.r, 24, 24);
        const mMat = new THREE.MeshStandardMaterial({ map: mSpec.tex, roughness: 0.85, metalness: 0.05 });
        const mMesh = new THREE.Mesh(mGeo, mMat);
        rootGroup.add(mMesh);
        moons.push({ mesh: mMesh, distance: mSpec.d, orbitSpeed: mSpec.speed, angle: idx * 1.57, inclination: mSpec.inc, rotSpeed: 0.3 });
      });
    }

    if (data.id === 'saturn') {
      // Titan (Dense orange smog atmosphere)
      const titanGeo = new THREE.SphereGeometry(0.72, 24, 24);
      const titanMat = new THREE.MeshStandardMaterial({ map: this.sharedTextures.titan, roughness: 0.9, metalness: 0.05 });
      const titanMesh = new THREE.Mesh(titanGeo, titanMat);
      rootGroup.add(titanMesh);
      moons.push({ mesh: titanMesh, distance: 14.0, orbitSpeed: 0.38, angle: 0.8, inclination: 0.06, rotSpeed: 0.2 });

      // Enceladus (Pure white ice with south polar tiger stripes)
      const encGeo = new THREE.SphereGeometry(0.30, 20, 20);
      const encMat = new THREE.MeshStandardMaterial({ map: this.sharedTextures.enceladus, roughness: 0.5, metalness: 0.1 });
      const encMesh = new THREE.Mesh(encGeo, encMat);
      rootGroup.add(encMesh);
      moons.push({ mesh: encMesh, distance: 8.4, orbitSpeed: 0.75, angle: 3.2, inclination: 0.002, rotSpeed: 0.5 });
    }

    if (data.id === 'uranus') {
      // Titania & Miranda
      const titaniaGeo = new THREE.SphereGeometry(0.42, 20, 20);
      const titaniaMat = new THREE.MeshStandardMaterial({ map: this.sharedTextures.moon, roughness: 0.9 });
      const titaniaMesh = new THREE.Mesh(titaniaGeo, titaniaMat);
      rootGroup.add(titaniaMesh);
      moons.push({ mesh: titaniaMesh, distance: 7.8, orbitSpeed: 0.45, angle: 1.1, inclination: tiltRad, rotSpeed: 0.3 });
    }

    if (data.id === 'neptune') {
      // Triton (Captured retrograde Kuiper moon)
      const tritonGeo = new THREE.SphereGeometry(0.54, 24, 24);
      const tritonMat = new THREE.MeshStandardMaterial({ map: this.sharedTextures.triton, roughness: 0.85 });
      const tritonMesh = new THREE.Mesh(tritonGeo, tritonMat);
      rootGroup.add(tritonMesh);
      moons.push({ mesh: tritonMesh, distance: 7.2, orbitSpeed: -0.45, angle: 0.5, inclination: 2.74, rotSpeed: -0.3 });
    }

    if (data.id === 'pluto') {
      // Charon (Binary Dwarf Planet Companion with Mordor Macula)
      const charonGeo = new THREE.SphereGeometry(0.52, 24, 24);
      const charonMat = new THREE.MeshStandardMaterial({ map: this.sharedTextures.charon, roughness: 0.88, metalness: 0.05 });
      const charonMesh = new THREE.Mesh(charonGeo, charonMat);
      rootGroup.add(charonMesh);
      moons.push({ mesh: charonMesh, distance: 3.8, orbitSpeed: 0.52, angle: 0.0, inclination: 0.0, rotSpeed: 0.52 });
    }

    return {
      data: data,
      rootGroup: rootGroup,
      tiltGroup: tiltGroup,
      planetMesh: planetMesh,
      atmosphereMesh: atmosphereMesh,
      ringsMesh: ringsMesh,
      moons: moons,
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

      // 5. Update Orbiting Moons in Keplerian Motion
      if (body.moons && body.moons.length > 0) {
        body.moons.forEach(m => {
          if (!this.isPaused) {
            m.angle += m.orbitSpeed * delta * (this.timeWarp * 0.1);
          }
          const inc = m.inclination || 0;
          const x = Math.cos(m.angle) * m.distance;
          const z = Math.sin(m.angle) * m.distance * Math.cos(inc);
          const y = Math.sin(m.angle) * m.distance * Math.sin(inc);
          m.mesh.position.set(x, y, z);
          m.mesh.rotation.y += m.rotSpeed * delta;
          m.mesh.visible = this.showMoons;
        });
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
    this.tourWaitingForNext = false;
    this.tourPostSpeechTimer = 0;
    this.playTourStep(0);
  }

  stopGrandTour() {
    this.cameraMode = 'focus';
    this.tourWaitingForNext = false;
    this.tourPostSpeechTimer = 0;
    if (window.voiceNarrator) {
      window.voiceNarrator.stop();
    }
  }

  playTourStep(index) {
    if (this.cameraMode !== 'tour') return;
    this.tourIndex = index % this.celestialData.length;
    const bodyData = this.celestialData[this.tourIndex];
    this.focusOn(bodyData.id, true);

    if (window.hudManager) {
      window.hudManager.selectBody(bodyData.id, false);
    }

    const narrationText = `Approaching ${bodyData.name}. ${bodyData.desc}`;

    if (window.voiceNarrator) {
      window.voiceNarrator.speak(narrationText, true, () => {
        if (this.cameraMode === 'tour') {
          this.tourWaitingForNext = true;
          this.tourPostSpeechTimer = 0;
        }
      });
    } else {
      this.tourWaitingForNext = true;
      this.tourPostSpeechTimer = 0;
    }
  }

  updateTour(delta) {
    if (this.cameraMode !== 'tour') return;

    if (this.tourWaitingForNext) {
      this.tourPostSpeechTimer += delta;
      // Graceful 2.5 second pause after narration concludes before gliding to next world
      if (this.tourPostSpeechTimer >= 2.5) {
        this.tourWaitingForNext = false;
        this.tourPostSpeechTimer = 0;
        this.playTourStep(this.tourIndex + 1);
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
