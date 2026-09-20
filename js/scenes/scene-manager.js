/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   Scene Manager & 5 Cinematic Acts (Three.js 3D Engine)
   ========================================================================== */

class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Scene Acts
    this.currentAct = 1;
    this.actGroups = [];
    this.isTransitioning = false;

    // Director Camera Modes: 'director', 'fps', 'drone', 'free'
    this.cameraMode = 'director';
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    // Flight Simulator State (Act IV)
    this.ship = null;
    this.shipPos = new THREE.Vector3(0, 0, 0);
    this.shipRot = new THREE.Euler(0, 0, 0);
    this.shipSpeed = 1.0;
    this.warpRings = [];
    this.ringScore = 0;
    this.keys = {};

    // Mouse tracking for camera parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    this.init();
  }

  init() {
    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 2. Scene & Base Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020308, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 8, 28);

    // 3. OrbitControls for Free Mode
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 120;
    this.controls.minDistance = 4;
    this.controls.enabled = false; // Disabled by default for director camera

    // 4. Lights
    this.ambientLight = new THREE.AmbientLight(0x0a1020, 1.2);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0x70c0ff, 1.5);
    this.dirLight.position.set(40, 60, 30);
    this.scene.add(this.dirLight);

    // 5. Build All 7 Cinematic Acts
    this.buildAct1_Singularity();
    this.buildAct2_Cyberpunk();
    this.buildAct3_Quantum();
    this.buildAct4_HyperspaceFlight();
    this.buildAct5_MultiverseCodex();
    this.buildAct6_DysonSphere();
    this.buildAct7_Stargate();

    // 6. Set Act 1 Active
    this.setActiveAct(1, true);

    // 7. Event Listeners
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('pointerdown', (e) => {
      if (this.currentAct === 4 && e.target.id === 'webgl-canvas') {
        this.fireLasers();
      }
    });

    console.log('🚀 [SceneManager] Initialized 5 Cinematic Acts.');
  }

  // ==========================================================================
  // ACT I: GARGANTUA SINGULARITY (BLACK HOLE & GRAVITATIONAL LENSING)
  // ==========================================================================
  buildAct1_Singularity() {
    const group = new THREE.Group();
    group.name = 'Act1_Singularity';

    // Deep Space Skybox Sphere
    const skyGeo = new THREE.SphereGeometry(800, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const nebulaTex = textureLoader.load('assets/nebula.jpg');
    nebulaTex.wrapS = THREE.RepeatWrapping;
    nebulaTex.wrapT = THREE.RepeatWrapping;
    nebulaTex.repeat.set(2, 1);
    const skyMat = new THREE.MeshBasicMaterial({
      map: nebulaTex,
      side: THREE.BackSide
    });
    const skySphere = new THREE.Mesh(skyGeo, skyMat);
    group.add(skySphere);

    // 1. Black Hole Event Horizon (Absorbs All Light)
    const eventHorizonGeo = new THREE.SphereGeometry(3.0, 64, 64);
    const eventHorizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eventHorizon = new THREE.Mesh(eventHorizonGeo, eventHorizonMat);
    group.add(eventHorizon);

    // 2. Primary Horizontal Accretion Disk
    const accretionGeo = new THREE.RingGeometry(3.2, 14.0, 96, 16);
    // Rotate to lie on XZ plane
    accretionGeo.rotateX(-Math.PI / 2);
    const accretionMat = new THREE.ShaderMaterial({
      vertexShader: window.CustomShaders.BlackHoleAccretion.vertexShader,
      fragmentShader: window.CustomShaders.BlackHoleAccretion.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(window.CustomShaders.BlackHoleAccretion.uniforms),
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const accretionDisk = new THREE.Mesh(accretionGeo, accretionMat);
    accretionDisk.name = 'accretionDisk';
    group.add(accretionDisk);

    // 3. Einstein Gravitational Lensing Ring (Vertical Arch)
    const lensingGeo = new THREE.RingGeometry(3.1, 10.5, 96, 16);
    const lensingMat = new THREE.ShaderMaterial({
      vertexShader: window.CustomShaders.BlackHoleAccretion.vertexShader,
      fragmentShader: window.CustomShaders.BlackHoleAccretion.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(window.CustomShaders.BlackHoleAccretion.uniforms),
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lensingRing = new THREE.Mesh(lensingGeo, lensingMat);
    lensingRing.name = 'lensingRing';
    lensingRing.rotation.y = Math.PI / 6;
    group.add(lensingRing);

    // 4. Inward-Spiraling Particle Field (Event Horizon Infall)
    const particleCount = 4000;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const radii = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    const colorCore = new THREE.Color(0x00f0ff);
    const colorOuter = new THREE.Color(0xff5500);

    for (let i = 0; i < particleCount; i++) {
      const r = 3.5 + Math.random() * 25.0;
      const th = Math.random() * Math.PI * 2;
      radii[i] = r;
      angles[i] = th;
      speeds[i] = (2.0 / Math.sqrt(r)) * (0.8 + Math.random() * 0.4);

      positions[i * 3] = r * Math.cos(th);
      positions[i * 3 + 1] = (Math.random() - 0.5) * (r * 0.12);
      positions[i * 3 + 2] = r * Math.sin(th);

      const mixedCol = colorCore.clone().lerp(colorOuter, Math.min(1, r / 20.0));
      colors[i * 3] = mixedCol.r;
      colors[i * 3 + 1] = mixedCol.g;
      colors[i * 3 + 2] = mixedCol.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeo.userData = { radii, angles, speeds };

    const particleMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    particleSystem.name = 'singularityParticles';
    group.add(particleSystem);

    // 5. Orbiting Exploration Probe "ENDURANCE-01"
    const probeGroup = new THREE.Group();
    probeGroup.name = 'singularityProbe';
    const probeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xd0d8e0, metalness: 0.9, roughness: 0.2 })
    );
    probeBody.rotation.z = Math.PI / 2;
    probeGroup.add(probeBody);

    const solarPanelMat = new THREE.MeshStandardMaterial({ color: 0x0055ff, metalness: 0.8, roughness: 0.3 });
    const solarWing1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 2.4), solarPanelMat);
    solarWing1.position.x = 0.5;
    probeGroup.add(solarWing1);
    const solarWing2 = solarWing1.clone();
    solarWing2.position.x = -0.5;
    probeGroup.add(solarWing2);

    const beaconLight = new THREE.PointLight(0x00f0ff, 2, 8);
    beaconLight.position.set(0, 0.6, 0);
    probeGroup.add(beaconLight);

    group.add(probeGroup);

    this.scene.add(group);
    this.actGroups[0] = group;
  }

  // ==========================================================================
  // ACT II: NEO-BABYLON CYBER MEGALOPOLIS
  // ==========================================================================
  buildAct2_Cyberpunk() {
    const group = new THREE.Group();
    group.name = 'Act2_Cyberpunk';

    // Backdrop Skybox
    const cyberSkyGeo = new THREE.SphereGeometry(800, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const cyberTex = textureLoader.load('assets/cyberpunk.jpg');
    cyberTex.wrapS = THREE.RepeatWrapping;
    cyberTex.repeat.set(2, 1);
    const cyberSkyMat = new THREE.MeshBasicMaterial({
      map: cyberTex,
      side: THREE.BackSide
    });
    group.add(new THREE.Mesh(cyberSkyGeo, cyberSkyMat));

    // 1. Procedural Monolith Skyscrapers
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x060914,
      metalness: 0.9,
      roughness: 0.2
    });

    const neonPalette = [0x00f0ff, 0xb026ff, 0xff0055, 0xffaa00, 0x00ff88];
    const citySize = 14;
    const buildingCount = citySize * citySize;

    const buildingMesh = new THREE.InstancedMesh(buildingGeo, buildingMat, buildingCount);
    const dummy = new THREE.Object3D();

    let idx = 0;
    for (let x = -citySize / 2; x < citySize / 2; x++) {
      for (let z = -citySize / 2; z < citySize / 2; z++) {
        // Leave central canal empty
        if (Math.abs(x) < 1.5) continue;

        const height = 15 + Math.random() * 65;
        dummy.position.set(x * 9 + (Math.random() - 0.5) * 2, height / 2 - 20, z * 9 + (Math.random() - 0.5) * 2);
        dummy.scale.set(6 + Math.random() * 2, height, 6 + Math.random() * 2);
        dummy.updateMatrix();
        buildingMesh.setMatrixAt(idx++, dummy.matrix);
      }
    }
    buildingMesh.instanceMatrix.needsUpdate = true;
    group.add(buildingMesh);

    // 2. Holographic Neon Advertising Beacons
    for (let i = 0; i < 16; i++) {
      const col = neonPalette[i % neonPalette.length];
      const signGeo = new THREE.PlaneGeometry(12, 5);
      const signMat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(
        (Math.random() - 0.5) * 70,
        10 + Math.random() * 35,
        (Math.random() - 0.5) * 70
      );
      sign.rotation.y = Math.random() * Math.PI;
      group.add(sign);

      const signGlow = new THREE.PointLight(col, 2.5, 25);
      signGlow.position.copy(sign.position);
      group.add(signGlow);
    }

    // 3. Flying Hover Cars / Spinners Traffic
    const trafficCount = 70;
    const trafficGroup = new THREE.Group();
    trafficGroup.name = 'cyberTraffic';
    const carGeo = new THREE.BoxGeometry(0.8, 0.3, 2.2);

    for (let i = 0; i < trafficCount; i++) {
      const isRed = Math.random() > 0.5;
      const carMat = new THREE.MeshBasicMaterial({ color: isRed ? 0xff0044 : 0x00f0ff });
      const car = new THREE.Mesh(carGeo, carMat);
      car.position.set(
        (Math.random() - 0.5) * 80,
        5 + Math.random() * 35,
        (Math.random() - 0.5) * 120
      );
      car.userData = {
        speed: (0.4 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1),
        laneZ: car.position.z
      };
      trafficGroup.add(car);
    }
    group.add(trafficGroup);

    // 4. Cybernetic Volumetric Rain Particles
    const rainCount = 3000;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 120;
      rainPositions[i * 3 + 1] = Math.random() * 80 - 10;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x70d8ff,
      size: 0.35,
      transparent: true,
      opacity: 0.5
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rainParticles.name = 'cyberRain';
    group.add(rainParticles);

    // 5. Reflective Wet Grid Floor
    const gridHelper = new THREE.GridHelper(160, 60, 0x00f0ff, 0x1a243a);
    gridHelper.position.y = -19.9;
    group.add(gridHelper);

    this.scene.add(group);
    this.actGroups[1] = group;
  }

  // ==========================================================================
  // ACT III: THE QUANTUM CORE (CALABI-YAU LATTICE & ATOMIC ORBITALS)
  // ==========================================================================
  buildAct3_Quantum() {
    const group = new THREE.Group();
    group.name = 'Act3_Quantum';

    // 1. Calabi-Yau Mathematical Lattice Mesh
    const torusKnotGeo = new THREE.TorusKnotGeometry(7, 2.2, 160, 32, 3, 5);
    const quantumMat = new THREE.ShaderMaterial({
      vertexShader: window.CustomShaders.QuantumLattice.vertexShader,
      fragmentShader: window.CustomShaders.QuantumLattice.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(window.CustomShaders.QuantumLattice.uniforms),
      transparent: true,
      wireframe: true
    });
    const quantumCore = new THREE.Mesh(torusKnotGeo, quantumMat);
    quantumCore.name = 'quantumCoreMesh';
    group.add(quantumCore);

    // 2. Inner Glowing Singularity Seed
    const seedGeo = new THREE.IcosahedronGeometry(2.5, 4);
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d0ff,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.9
    });
    const seed = new THREE.Mesh(seedGeo, seedMat);
    seed.name = 'quantumSeed';
    group.add(seed);

    // 3. Nested Quantum Magnetic Orbital Rings
    const ringGroup = new THREE.Group();
    ringGroup.name = 'quantumRings';
    for (let i = 0; i < 6; i++) {
      const ringRadius = 10 + i * 2.2;
      const ringGeo = new THREE.TorusGeometry(ringRadius, 0.08, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xb026ff,
        transparent: true,
        opacity: 0.75
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02
      };
      ringGroup.add(ring);
    }
    group.add(ringGroup);

    // 4. Reactive Quantum Energy Sparks
    const sparkCount = 2000;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 26;
      sparkPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      sparkPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sparkPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.28,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const sparkField = new THREE.Points(sparkGeo, sparkMat);
    sparkField.name = 'quantumSparks';
    group.add(sparkField);

    this.scene.add(group);
    this.actGroups[2] = group;
  }

  // ==========================================================================
  // ACT IV: HYPERSPACE WARP RUNNER (INTERACTIVE FLIGHT SIMULATOR)
  // ==========================================================================
  buildAct4_HyperspaceFlight() {
    const group = new THREE.Group();
    group.name = 'Act4_HyperspaceFlight';

    // 1. Procedural Warp Tunnel Cylinder
    const tunnelGeo = new THREE.CylinderGeometry(14, 14, 400, 32, 64, true);
    tunnelGeo.rotateX(Math.PI / 2); // Align with Z-axis
    const tunnelMat = new THREE.ShaderMaterial({
      vertexShader: window.CustomShaders.HyperspaceTunnel.vertexShader,
      fragmentShader: window.CustomShaders.HyperspaceTunnel.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(window.CustomShaders.HyperspaceTunnel.uniforms),
      side: THREE.BackSide,
      transparent: true
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.name = 'warpTunnelMesh';
    group.add(tunnel);

    // 2. Passing Holographic Acceleration Rings
    this.warpRings = [];
    const ringGeo = new THREE.TorusGeometry(8, 0.25, 16, 48);
    for (let i = 0; i < 15; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0xff0055,
        transparent: true,
        opacity: 0.9
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = -i * 26;
      group.add(ring);
      this.warpRings.push(ring);
    }

    // 3. User's Interceptor Spacecraft Model
    const shipGroup = new THREE.Group();
    shipGroup.name = 'playerShip';

    // Main fuselage
    const bodyGeo = new THREE.ConeGeometry(0.8, 3.2, 5);
    bodyGeo.rotateX(-Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.9,
      roughness: 0.2
    });
    const fuselage = new THREE.Mesh(bodyGeo, bodyMat);
    shipGroup.add(fuselage);

    // Swept delta wings
    const wingGeo = new THREE.BoxGeometry(4.2, 0.08, 1.4);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.8,
      emissive: 0x005577,
      emissiveIntensity: 0.4
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, 0.6);
    shipGroup.add(wings);

    // Twin Plasma Thrusters
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const thruster1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.05, 0.8, 8), thrusterMat);
    thruster1.rotateX(Math.PI / 2);
    thruster1.position.set(0.6, 0, 1.6);
    shipGroup.add(thruster1);

    const thruster2 = thruster1.clone();
    thruster2.position.set(-0.6, 0, 1.6);
    shipGroup.add(thruster2);

    shipGroup.position.set(0, 0, 8);
    group.add(shipGroup);
    this.ship = shipGroup;

    // 4. Warp Speed Particle Streaks
    const streakCount = 1500;
    const streakGeo = new THREE.BufferGeometry();
    const streakPositions = new Float32Array(streakCount * 3);
    for (let i = 0; i < streakCount; i++) {
      streakPositions[i * 3] = (Math.random() - 0.5) * 22;
      streakPositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      streakPositions[i * 3 + 2] = (Math.random() - 0.5) * 350;
    }
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
    const streakMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.35,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const streakField = new THREE.Points(streakGeo, streakMat);
    streakField.name = 'warpStreaks';
    group.add(streakField);

    // 5. Crystalline Space Debris Hazard Field
    this.debrisField = [];
    const debrisGeo = new THREE.DodecahedronGeometry(0.7, 0);
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.8
    });
    for (let i = 0; i < 18; i++) {
      const debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 8,
        -50 - Math.random() * 250
      );
      debris.userData = {
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05)
      };
      group.add(debris);
      this.debrisField.push(debris);
    }

    this.scene.add(group);
    this.actGroups[3] = group;
  }

  // ==========================================================================
  // ACT V: THE MULTIVERSE CODEX (INTERACTIVE EXOPLANET & STELLAR SCANNER)
  // ==========================================================================
  buildAct5_MultiverseCodex() {
    const group = new THREE.Group();
    group.name = 'Act5_MultiverseCodex';

    // Skybox with Nebula
    const exoSkyGeo = new THREE.SphereGeometry(800, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const nebulaTex = textureLoader.load('assets/nebula.jpg');
    nebulaTex.wrapS = THREE.RepeatWrapping;
    nebulaTex.repeat.set(2, 1);
    group.add(new THREE.Mesh(exoSkyGeo, new THREE.MeshBasicMaterial({ map: nebulaTex, side: THREE.BackSide })));

    // 1. The Alien Exoplanet "AETHEL-PRIME"
    const planetGeo = new THREE.SphereGeometry(9, 64, 64);
    const planetTex = textureLoader.load('assets/exoplanet.jpg');
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.6,
      metalness: 0.1
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.name = 'exoplanetMesh';
    group.add(planet);

    // 2. Atmospheric Glow Fresnel Atmosphere
    const atmoGeo = new THREE.SphereGeometry(9.3, 64, 64);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    group.add(atmosphere);

    // 3. Planetary Dust Rings
    const ringsGeo = new THREE.RingGeometry(12.5, 22.0, 64);
    ringsGeo.rotateX(Math.PI / 2.3);
    const ringsMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      metalness: 0.4
    });
    const rings = new THREE.Mesh(ringsGeo, ringsMat);
    group.add(rings);

    // 4. Interactive Holographic Scanner Nodes (Satellites)
    const nodeGroup = new THREE.Group();
    nodeGroup.name = 'codexNodes';
    this.codexNodes = [];

    const nodeData = [
      { name: 'Atmospheric Scanner Alpha', category: 'Composition: 72% N2, 21% O2, 4% Xenon', r: 16, speed: 0.3 },
      { name: 'Quantum Relic Beacon', category: 'Origin: Pre-Singularity Civilization', r: 19, speed: -0.25 },
      { name: 'Orbital Defense Grid', category: 'Shield Status: 100% Active', r: 23, speed: 0.18 }
    ];

    nodeData.forEach((data, idx) => {
      const nodeMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
      );
      nodeMesh.userData = data;

      const aura = new THREE.PointLight(0x00f0ff, 1.5, 8);
      nodeMesh.add(aura);

      nodeGroup.add(nodeMesh);
      this.codexNodes.push(nodeMesh);
    });
    group.add(nodeGroup);

    this.scene.add(group);
    this.actGroups[4] = group;
  }

  // ==========================================================================
  // SHIP WEAPONS SYSTEM: PLASMA PHOTON CANNONS (ACT IV)
  // ==========================================================================
  fireLasers() {
    if (this.currentAct !== 4 || !this.ship) return;

    const now = performance.now();
    if (this.lastLaserTime && now - this.lastLaserTime < 140) return;
    this.lastLaserTime = now;

    if (!this.lasers) this.lasers = [];

    const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 6);
    laserGeo.rotateX(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.95
    });

    // Left & Right wing cannons
    const offsets = [-1.8, 1.8];
    offsets.forEach(xOffset => {
      const laser = new THREE.Mesh(laserGeo, laserMat);
      laser.position.set(this.shipPos.x + xOffset, this.shipPos.y, this.ship.position.z - 2.0);
      this.actGroups[3].add(laser);
      this.lasers.push(laser);
    });

    if (window.audioEngine) {
      window.audioEngine.playLaserShot();
    }
  }

  // ==========================================================================
  // ACT VI: THE DYSON SPHERE & STELLAR HARVESTER
  // ==========================================================================
  buildAct6_DysonSphere() {
    const group = new THREE.Group();
    group.name = 'Act6_DysonSphere';

    // Skybox with Dyson backdrop
    const dysonSkyGeo = new THREE.SphereGeometry(800, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const dysonTex = textureLoader.load('assets/dyson.jpg');
    dysonTex.wrapS = THREE.RepeatWrapping;
    dysonTex.repeat.set(2, 1);
    group.add(new THREE.Mesh(dysonSkyGeo, new THREE.MeshBasicMaterial({ map: dysonTex, side: THREE.BackSide })));

    // 1. Central Blazing Star with Procedural Solar Surface Shader
    const starGeo = new THREE.SphereGeometry(12, 64, 64);
    const starMat = new THREE.ShaderMaterial({
      vertexShader: window.CustomShaders.DysonSolarSurface.vertexShader,
      fragmentShader: window.CustomShaders.DysonSolarSurface.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(window.CustomShaders.DysonSolarSurface.uniforms)
    });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.name = 'dysonStar';
    group.add(starMesh);

    // Corona Glow Flare
    const coronaGeo = new THREE.SphereGeometry(13.2, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    group.add(new THREE.Mesh(coronaGeo, coronaMat));

    // Dynamic Central Point Light
    const starLight = new THREE.PointLight(0xffaa22, 3.5, 300);
    group.add(starLight);

    // 2. Dyson Swarm Collector Rings & Hexagonal Solar Panels
    const ringGroup = new THREE.Group();
    ringGroup.name = 'dysonRings';

    const panelGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 6);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4
    });

    const ringRadii = [22, 28, 34];
    const ringTilts = [0.3, -0.6, 1.1];

    ringRadii.forEach((radius, rIdx) => {
      const subRing = new THREE.Group();
      subRing.rotation.x = ringTilts[rIdx];
      subRing.rotation.z = rIdx * 0.8;
      subRing.userData = { rotSpeed: 0.003 * (rIdx % 2 === 0 ? 1 : -1) };

      // Backbone Ring Truss
      const trussGeo = new THREE.TorusGeometry(radius, 0.2, 16, 64);
      const trussMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.8 });
      subRing.add(new THREE.Mesh(trussGeo, trussMat));

      // Hex Panels along circumference
      const panelCount = 24;
      for (let i = 0; i < panelCount; i++) {
        const theta = (i / panelCount) * Math.PI * 2;
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(radius * Math.cos(theta), 0, radius * Math.sin(theta));
        panel.rotation.y = -theta;
        panel.rotation.x = Math.PI / 2;
        subRing.add(panel);
      }
      ringGroup.add(subRing);
    });
    group.add(ringGroup);

    // 3. Orbiting Power Hub Satellite
    const hub = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.2),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1 })
    );
    hub.name = 'dysonHub';
    hub.position.set(42, 8, 0);
    group.add(hub);

    // Energy transfer beam line
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 30, 8);
    beamGeo.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.name = 'energyBeam';
    beam.position.set(21, 4, 0);
    group.add(beam);

    this.scene.add(group);
    this.actGroups[5] = group;
  }

  // ==========================================================================
  // ACT VII: THE TACHYON STARGATE (MULTIVERSE EVENT HORIZON)
  // ==========================================================================
  buildAct7_Stargate() {
    const group = new THREE.Group();
    group.name = 'Act7_Stargate';

    // Skybox with Stargate Rift
    const gateSkyGeo = new THREE.SphereGeometry(800, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const gateTex = textureLoader.load('assets/stargate.jpg');
    gateTex.wrapS = THREE.RepeatWrapping;
    gateTex.repeat.set(2, 1);
    group.add(new THREE.Mesh(gateSkyGeo, new THREE.MeshBasicMaterial({ map: gateTex, side: THREE.BackSide })));

    // 1. Outer Heavy Metallic Ring Structure
    const outerRingGeo = new THREE.TorusGeometry(14, 1.4, 32, 80);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      metalness: 0.9,
      roughness: 0.3
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    group.add(outerRing);

    // 2. Inner Rotating Glyph Dial Ring
    const dialGeo = new THREE.TorusGeometry(12.5, 0.45, 16, 64);
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.35
    });
    const dialRing = new THREE.Mesh(dialGeo, dialMat);
    dialRing.name = 'stargateDial';
    group.add(dialRing);

    // 3. Chevrons (9 Radial Lock Mechanisms)
    const chevronGeo = new THREE.BoxGeometry(1.6, 2.2, 1.8);
    const chevronMat = new THREE.MeshStandardMaterial({
      color: 0x111620,
      emissive: 0x00a0ff,
      emissiveIntensity: 0.8
    });
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const chevron = new THREE.Mesh(chevronGeo, chevronMat);
      chevron.position.set(14.2 * Math.cos(angle), 14.2 * Math.sin(angle), 0);
      chevron.rotation.z = angle;
      group.add(chevron);
    }

    // 4. Shimmering Dimensional Event Horizon
    const horizonGeo = new THREE.CircleGeometry(12.0, 64);
    const horizonMat = new THREE.ShaderMaterial({
      vertexShader: window.CustomShaders.StargateHorizon.vertexShader,
      fragmentShader: window.CustomShaders.StargateHorizon.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(window.CustomShaders.StargateHorizon.uniforms),
      side: THREE.DoubleSide,
      transparent: true
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.name = 'stargateHorizon';
    group.add(horizon);

    // 5. Dimensional Lightning Plasma Arcs
    const sparkCount = 1200;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const th = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 8.0;
      sparkPositions[i * 3] = r * Math.cos(th);
      sparkPositions[i * 3 + 1] = r * Math.sin(th);
      sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x70d0ff,
      size: 0.35,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const gateSparks = new THREE.Points(sparkGeo, sparkMat);
    gateSparks.name = 'gateSparks';
    group.add(gateSparks);

    this.scene.add(group);
    this.actGroups[6] = group;
  }

  // ==========================================================================
  // SCENE TRANSITIONS & ACT SWITCHING
  // ==========================================================================
  setActiveAct(actNumber, instant = false) {
    if (this.currentAct === actNumber && !instant) return;
    this.currentAct = actNumber;

    if (!instant) {
      // Trigger Hyperspace Flash & Sound
      this.triggerWarpFlash();
      if (window.audioEngine) {
        window.audioEngine.playWarpJump();
      }
    }

    // Toggle group visibilities
    this.actGroups.forEach((group, idx) => {
      if (group) {
        group.visible = (idx + 1 === actNumber);
      }
    });

    // Reset camera position per act defaults
    if (actNumber === 1) {
      this.camera.position.set(0, 7, 26);
      this.cameraTarget.set(0, 0, 0);
    } else if (actNumber === 2) {
      this.camera.position.set(0, 18, 45);
      this.cameraTarget.set(0, 0, -20);
    } else if (actNumber === 3) {
      this.camera.position.set(0, 0, 22);
      this.cameraTarget.set(0, 0, 0);
    } else if (actNumber === 4) {
      this.camera.position.set(0, 2.5, 14);
      this.cameraTarget.set(0, 0, -50);
    } else if (actNumber === 5) {
      this.camera.position.set(0, 10, 36);
      this.cameraTarget.set(0, 0, 0);
    } else if (actNumber === 6) {
      this.camera.position.set(0, 16, 60);
      this.cameraTarget.set(0, 0, 0);
    } else if (actNumber === 7) {
      this.camera.position.set(0, 4, 32);
      this.cameraTarget.set(0, 0, 0);
    }

    // Voice commentary
    if (window.voiceNarrator) {
      const commentaries = {
        1: "Act One: Gargantua Event Horizon. Accretion temperature 10 million Kelvin. Time dilation factor critical.",
        2: "Act Two: Sector Seven, Neo-Babylon. Atmospheric moisture 84 percent. Neural traffic online.",
        3: "Act Three: The Quantum Core. Calabi-Yau multi-dimensional manifold stabilized.",
        4: "Act Four: Hyperspace Flight Simulator engaged. Use WASD to steer and click to fire plasma cannons.",
        5: "Act Five: Multiverse Codex archive unlocked. Scanning planetary frequency and orbital beacons.",
        6: "Act Six: The Dyson Sphere Stellar Harvester. Solar energy flux 3.8 yottawatts. Collector swarm aligned.",
        7: "Act Seven: The Tachyon Stargate. Dimensional rift open. Multiverse bridge synchronized."
      };
      window.voiceNarrator.speak(commentaries[actNumber], true);
    }
  }

  triggerWarpFlash() {
    const flash = document.getElementById('hyperspace-flash');
    if (flash) {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
      }, 300);
    }
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    this.lastCameraCutTime = this.clock.getElapsedTime();
    if (mode === 'free') {
      this.controls.enabled = true;
    } else {
      this.controls.enabled = false;
    }
  }

  setLightingPreset(mode) {
    if (!this.ambientLight || !this.dirLight) return;
    switch (mode.toLowerCase()) {
      case 'void':
        this.ambientLight.color.setHex(0x0a1020);
        this.dirLight.color.setHex(0x70c0ff);
        this.renderer.toneMappingExposure = 1.25;
        break;
      case 'eclipse':
        this.ambientLight.color.setHex(0x200804);
        this.dirLight.color.setHex(0xff5500);
        this.renderer.toneMappingExposure = 1.4;
        break;
      case 'neon':
        this.ambientLight.color.setHex(0x180424);
        this.dirLight.color.setHex(0xb026ff);
        this.renderer.toneMappingExposure = 1.45;
        break;
      case 'supernova':
        this.ambientLight.color.setHex(0x203040);
        this.dirLight.color.setHex(0xffffff);
        this.renderer.toneMappingExposure = 1.9;
        break;
    }
  }

  // ==========================================================================
  // INPUT HANDLERS
  // ==========================================================================
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  onKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
  }

  onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  // ==========================================================================
  // ANIMATION & RENDER LOOP
  // ==========================================================================
  update() {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Get real-time audio intensity
    let audioIntensity = 0.0;
    if (window.audioEngine) {
      const freqData = window.audioEngine.getFrequencyData();
      if (freqData) {
        let sum = 0;
        for (let i = 0; i < 16; i++) sum += freqData[i];
        audioIntensity = sum / (16 * 255);
      }
    }

    // ------------------------------------------------------------------------
    // ACT 1 UPDATE: SINGULARITY
    // ------------------------------------------------------------------------
    if (this.currentAct === 1) {
      const g = this.actGroups[0];
      const accretion = g.getObjectByName('accretionDisk');
      if (accretion) {
        accretion.material.uniforms.time.value = elapsedTime;
        accretion.material.uniforms.audioIntensity.value = audioIntensity;
      }
      const lensing = g.getObjectByName('lensingRing');
      if (lensing) {
        lensing.material.uniforms.time.value = elapsedTime;
        lensing.material.uniforms.audioIntensity.value = audioIntensity;
        lensing.rotation.z = Math.sin(elapsedTime * 0.2) * 0.15;
      }

      // Update Inward Spiraling Particles
      const particles = g.getObjectByName('singularityParticles');
      if (particles) {
        const posAttr = particles.geometry.attributes.position;
        const { radii, angles, speeds } = particles.geometry.userData;
        for (let i = 0; i < radii.length; i++) {
          angles[i] += speeds[i] * delta * 1.8;
          radii[i] -= (0.4 + speeds[i] * 0.2) * delta;
          if (radii[i] < 3.2) {
            radii[i] = 22.0 + Math.random() * 4.0;
          }
          posAttr.array[i * 3] = radii[i] * Math.cos(angles[i]);
          posAttr.array[i * 3 + 2] = radii[i] * Math.sin(angles[i]);
        }
        posAttr.needsUpdate = true;
      }

      // Orbiting Probe
      const probe = g.getObjectByName('singularityProbe');
      if (probe) {
        const probeAngle = elapsedTime * 0.4;
        const probeR = 17.0;
        probe.position.set(probeR * Math.cos(probeAngle), Math.sin(probeAngle * 2) * 2.5, probeR * Math.sin(probeAngle));
        probe.rotation.y = -probeAngle + Math.PI / 2;
      }
    }

    // ------------------------------------------------------------------------
    // ACT 2 UPDATE: CYBERPUNK
    // ------------------------------------------------------------------------
    else if (this.currentAct === 2) {
      const g = this.actGroups[1];
      const traffic = g.getObjectByName('cyberTraffic');
      if (traffic) {
        traffic.children.forEach(car => {
          car.position.z += car.userData.speed * delta * 35;
          if (car.position.z > 60) car.position.z = -60;
          if (car.position.z < -60) car.position.z = 60;
        });
      }

      // Rain Particles
      const rain = g.getObjectByName('cyberRain');
      if (rain) {
        const posAttr = rain.geometry.attributes.position;
        for (let i = 1; i < posAttr.array.length; i += 3) {
          posAttr.array[i] -= 45 * delta;
          if (posAttr.array[i] < -20) {
            posAttr.array[i] = 60;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // ------------------------------------------------------------------------
    // ACT 3 UPDATE: QUANTUM CORE
    // ------------------------------------------------------------------------
    else if (this.currentAct === 3) {
      const g = this.actGroups[2];
      const core = g.getObjectByName('quantumCoreMesh');
      if (core) {
        core.material.uniforms.time.value = elapsedTime;
        core.material.uniforms.audioFreq.value = audioIntensity;
        core.rotation.x = elapsedTime * 0.2;
        core.rotation.y = elapsedTime * 0.3;
      }

      const seed = g.getObjectByName('quantumSeed');
      if (seed) {
        const pulse = 1.0 + Math.sin(elapsedTime * 4.0) * 0.15 + audioIntensity * 0.4;
        seed.scale.set(pulse, pulse, pulse);
        seed.rotation.y = -elapsedTime * 0.5;
      }

      const rings = g.getObjectByName('quantumRings');
      if (rings) {
        rings.children.forEach(ring => {
          ring.rotation.x += ring.userData.rotSpeedX;
          ring.rotation.y += ring.userData.rotSpeedY;
        });
      }
    }

    // ------------------------------------------------------------------------
    // ACT 4 UPDATE: HYPERSPACE FLIGHT SIMULATOR
    // ------------------------------------------------------------------------
    else if (this.currentAct === 4) {
      const g = this.actGroups[3];
      const tunnel = g.getObjectByName('warpTunnelMesh');
      if (tunnel) {
        tunnel.material.uniforms.time.value = elapsedTime;
      }

      // Interactive Ship Steering
      const steerSpeed = 22.0 * delta;
      let targetX = this.shipPos.x;
      let targetY = this.shipPos.y;

      if (this.keys['arrowleft'] || this.keys['a']) targetX -= steerSpeed;
      if (this.keys['arrowright'] || this.keys['d']) targetX += steerSpeed;
      if (this.keys['arrowup'] || this.keys['w']) targetY += steerSpeed;
      if (this.keys['arrowdown'] || this.keys['s']) targetY -= steerSpeed;

      // Mouse flight tracking when no keys pressed
      if (!this.keys['a'] && !this.keys['d'] && !this.keys['w'] && !this.keys['s']) {
        targetX += (this.mouse.x * 6 - targetX) * 0.05;
        targetY += (-this.mouse.y * 5 - targetY) * 0.05;
      }

      // Clamp within tunnel radius
      targetX = Math.max(-7.0, Math.min(7.0, targetX));
      targetY = Math.max(-5.0, Math.min(5.0, targetY));

      this.shipPos.x = targetX;
      this.shipPos.y = targetY;

      if (this.ship) {
        this.ship.position.x = this.shipPos.x;
        this.ship.position.y = this.shipPos.y;
        // Roll into turns
        this.ship.rotation.z = -this.shipPos.x * 0.12;
        this.ship.rotation.x = this.shipPos.y * 0.08;
      }

      // Check Hyperspace Rings passing ship
      const isBoosting = !!this.keys[' '];
      const speed = isBoosting ? 65.0 : 35.0;

      if (window.audioEngine) {
        window.audioEngine.updateThrusterSound(isBoosting ? 1.0 : 0.6, isBoosting);
      }

      this.warpRings.forEach(ring => {
        ring.position.z += speed * delta;
        if (ring.position.z > 15) {
          ring.position.z = -280;
          // Collision check: Did the ship fly through the ring?
          const dist = Math.hypot(this.shipPos.x - ring.position.x, this.shipPos.y - ring.position.y);
          if (dist < 8.0) {
            this.ringScore += 100;
            if (window.audioEngine) window.audioEngine.playHoloBeep(1200, 'sine');
          }
        }
      });

      // Update Debris Field
      if (this.debrisField) {
        this.debrisField.forEach(debris => {
          debris.position.z += speed * delta * 1.1;
          debris.rotation.x += debris.userData.rotSpeed.x;
          debris.rotation.y += debris.userData.rotSpeed.y;

          // Check collision with ship
          const distToShip = this.shipPos.distanceTo(debris.position);
          if (distToShip < 1.8) {
            // Collision event!
            debris.position.z = -300;
            if (window.audioEngine) window.audioEngine.playSubImpact();
            // Screen shake
            this.camera.position.x += (Math.random() - 0.5) * 0.8;
            this.camera.position.y += (Math.random() - 0.5) * 0.8;
            if (window.voiceNarrator) window.voiceNarrator.speak("Warning: Micrometeorite impact. Deflector shield absorbed shockwave.", false);
      // Update Laser Projectiles & Check Hits on Debris
      if (this.lasers && this.lasers.length > 0) {
        for (let l = this.lasers.length - 1; l >= 0; l--) {
          const laser = this.lasers[l];
          laser.position.z -= 180 * delta;

          // Check hit on debris
          let hit = false;
          if (this.debrisField) {
            for (let d = 0; d < this.debrisField.length; d++) {
              const deb = this.debrisField[d];
              if (laser.position.distanceTo(deb.position) < 2.5) {
                // Target Destroyed!
                deb.position.z = -320 - Math.random() * 40;
                deb.position.x = (Math.random() - 0.5) * 11;
                deb.position.y = (Math.random() - 0.5) * 8;
                this.ringScore += 250;
                if (window.audioEngine) window.audioEngine.playExplosion();
                hit = true;
                break;
              }
            }
          }

          if (hit || laser.position.z < -280) {
            this.actGroups[3].remove(laser);
            this.lasers.splice(l, 1);
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // ACT 5 UPDATE: MULTIVERSE CODEX
    // ------------------------------------------------------------------------
    else if (this.currentAct === 5) {
      const g = this.actGroups[4];
      const planet = g.getObjectByName('exoplanetMesh');
      if (planet) {
        planet.rotation.y = elapsedTime * 0.08;
      }

      // Update Codex Scanner Nodes
      if (this.codexNodes) {
        this.codexNodes.forEach(node => {
          const angle = elapsedTime * node.userData.speed;
          node.position.x = Math.cos(angle) * node.userData.r;
          node.position.z = Math.sin(angle) * node.userData.r;
          node.position.y = Math.sin(angle * 2) * 2;
          node.rotation.x += 0.02;
          node.rotation.y += 0.03;
        });
      }
    }

    // ------------------------------------------------------------------------
    // ACT 6 UPDATE: THE DYSON SPHERE
    // ------------------------------------------------------------------------
    else if (this.currentAct === 6) {
      const g = this.actGroups[5];
      const star = g.getObjectByName('dysonStar');
      if (star) {
        star.material.uniforms.time.value = elapsedTime;
        star.material.uniforms.audioIntensity.value = audioIntensity;
        star.rotation.y = elapsedTime * 0.05;
      }
      const rings = g.getObjectByName('dysonRings');
      if (rings) {
        rings.children.forEach(r => {
          r.rotation.y += r.userData.rotSpeed;
        });
      }
      const hub = g.getObjectByName('dysonHub');
      if (hub) {
        const hubAngle = elapsedTime * 0.2;
        hub.position.x = Math.cos(hubAngle) * 44;
        hub.position.z = Math.sin(hubAngle) * 44;
        const beam = g.getObjectByName('energyBeam');
        if (beam) {
          beam.position.set(hub.position.x * 0.5, hub.position.y * 0.5, hub.position.z * 0.5);
          beam.lookAt(hub.position);
        }
      }
    }

    // ------------------------------------------------------------------------
    // ACT 7 UPDATE: TACHYON STARGATE
    // ------------------------------------------------------------------------
    else if (this.currentAct === 7) {
      const g = this.actGroups[6];
      const dial = g.getObjectByName('stargateDial');
      if (dial) {
        dial.rotation.z = -elapsedTime * 0.15;
      }
      const horizon = g.getObjectByName('stargateHorizon');
      if (horizon) {
        horizon.material.uniforms.time.value = elapsedTime;
        horizon.material.uniforms.audioIntensity.value = audioIntensity;
      }
      const sparks = g.getObjectByName('gateSparks');
      if (sparks) {
        sparks.rotation.z = elapsedTime * 0.4;
      }
    }

    // ------------------------------------------------------------------------
    // CAMERA CHOREOGRAPHY
    // ------------------------------------------------------------------------
    // Handheld micro-shake for cinematic realism
    const shakeX = (Math.sin(elapsedTime * 14.0) * 0.04) + (Math.cos(elapsedTime * 22.0) * 0.02);
    const shakeY = (Math.cos(elapsedTime * 16.0) * 0.04) + (Math.sin(elapsedTime * 26.0) * 0.02);

    if (this.cameraMode === 'director' || this.cameraMode === 'trailer') {
      let shotPhase = 0;
      if (this.cameraMode === 'trailer') {
        // Cut every 7 seconds between 4 dynamic shot types
        shotPhase = Math.floor((elapsedTime % 28) / 7);
      }

      if (this.currentAct === 1) {
        if (shotPhase === 1) {
          // Low-Angle Accretion Edge Shot
          this.camera.position.set(Math.cos(elapsedTime * 0.15) * 14 + shakeX, -1.8 + shakeY, Math.sin(elapsedTime * 0.15) * 14);
          this.camera.lookAt(0, 1.2, 0);
        } else if (shotPhase === 2) {
          // Top-Down Polar Survey
          this.camera.position.set(shakeX, 32 + Math.sin(elapsedTime * 0.1) * 2, shakeY);
          this.camera.lookAt(0, 0, 0);
        } else if (shotPhase === 3) {
          // Close-up Probe Tracking
          const probe = this.actGroups[0].getObjectByName('singularityProbe');
          if (probe) {
            this.camera.position.set(probe.position.x + 3, probe.position.y + 1.5, probe.position.z + 4);
            this.camera.lookAt(probe.position);
          }
        } else {
          // Standard Cinematic Orbit
          const camAngle = elapsedTime * 0.1;
          const camR = 26 + Math.sin(elapsedTime * 0.15) * 4;
          this.camera.position.x = Math.cos(camAngle) * camR + this.mouse.x * 2 + shakeX;
          this.camera.position.z = Math.sin(camAngle) * camR + this.mouse.y * 2;
          this.camera.position.y = 7 + Math.sin(elapsedTime * 0.2) * 3 + shakeY;
          this.camera.lookAt(0, 0, 0);
        }
      } else if (this.currentAct === 2) {
        if (shotPhase === 1) {
          // Street-Level Looking Up At Skyscrapers
          this.camera.position.set(shakeX, -17.5 + shakeY, 15);
          this.camera.lookAt(0, 30, -30);
        } else {
          // Drone fly-through looking down city avenues
          this.camera.position.x = Math.sin(elapsedTime * 0.15) * 20 + this.mouse.x * 4 + shakeX;
          this.camera.position.y = 16 + Math.cos(elapsedTime * 0.2) * 4 + shakeY;
          this.camera.position.z = 40 + Math.sin(elapsedTime * 0.1) * 8;
          this.camera.lookAt(0, 0, -20);
        }
      } else if (this.currentAct === 3) {
        // Spiral camera around quantum lattice
        const spiralAngle = elapsedTime * 0.25;
        this.camera.position.x = Math.cos(spiralAngle) * 20 + shakeX;
        this.camera.position.z = Math.sin(spiralAngle) * 20;
        this.camera.position.y = Math.sin(elapsedTime * 0.5) * 6 + shakeY;
        this.camera.lookAt(0, 0, 0);
      } else if (this.currentAct === 4) {
        // Third-person chase cam behind ship with camera banking
        this.camera.position.x = this.shipPos.x * 0.6 + shakeX;
        this.camera.position.y = this.shipPos.y * 0.6 + 2.8 + shakeY;
        this.camera.position.z = 16;
        this.camera.lookAt(this.shipPos.x * 0.3, this.shipPos.y * 0.3, -40);
      } else if (this.currentAct === 5) {
        // Orbital survey camera
        const pAngle = elapsedTime * 0.12;
        this.camera.position.x = Math.cos(pAngle) * 36 + this.mouse.x * 3 + shakeX;
        this.camera.position.z = Math.sin(pAngle) * 36 + this.mouse.y * 3;
        this.camera.position.y = 10 + Math.sin(elapsedTime * 0.3) * 4 + shakeY;
        this.camera.lookAt(0, 0, 0);
      } else if (this.currentAct === 6) {
        // Grand high-angle cinematic survey of Dyson Swarm
        const dAngle = elapsedTime * 0.09;
        this.camera.position.x = Math.cos(dAngle) * 58 + shakeX;
        this.camera.position.z = Math.sin(dAngle) * 58;
        this.camera.position.y = 24 + Math.sin(elapsedTime * 0.2) * 6 + shakeY;
        this.camera.lookAt(0, 0, 0);
      } else if (this.currentAct === 7) {
        // Dramatic Stargate event horizon push-in
        this.camera.position.x = Math.sin(elapsedTime * 0.12) * 12 + shakeX;
        this.camera.position.y = 4 + Math.cos(elapsedTime * 0.15) * 3 + shakeY;
        this.camera.position.z = 28 + Math.sin(elapsedTime * 0.1) * 5;
        this.camera.lookAt(0, 0, 0);
      }
    } else if (this.cameraMode === 'cockpit') {
      if (this.currentAct === 4 && this.ship) {
        // FPV Cockpit view inside ship
        this.camera.position.set(this.shipPos.x, this.shipPos.y + 0.4, 6.2);
        this.camera.lookAt(this.shipPos.x, this.shipPos.y, -80);
      } else {
        // First person forward look
        this.camera.position.set(0, 1.2, 0);
        this.camera.lookAt(0, 0, -50);
      }
    } else if (this.cameraMode === 'free') {
      this.controls.update();
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

window.SceneManager = SceneManager;
