/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   Custom GLSL Shaders (Black Hole Accretion Disk, Hyperspace Tunnel, Quantum)
   ========================================================================== */

const CustomShaders = {
  // --------------------------------------------------------------------------
  // 1. BLACK HOLE ACCRETION DISK WITH RELATIVISTIC DOPPLER BEAMING
  // --------------------------------------------------------------------------
  BlackHoleAccretion: {
    uniforms: {
      time: { value: 0 },
      innerRadius: { value: 3.2 },
      outerRadius: { value: 12.0 },
      coreColor: { value: new THREE.Color(0xff4500) },
      blueShiftColor: { value: new THREE.Color(0x00f0ff) },
      redShiftColor: { value: new THREE.Color(0xff0033) },
      audioIntensity: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float innerRadius;
      uniform float outerRadius;
      uniform vec3 coreColor;
      uniform vec3 blueShiftColor;
      uniform vec3 redShiftColor;
      uniform float audioIntensity;

      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;

      // Pseudo-random & Noise functions
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = p * 2.1 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // Distance from center on XZ plane
        float r = length(vPosition.xz);

        if (r < innerRadius || r > outerRadius) {
          discard;
        }

        // Angle in polar coordinates
        float theta = atan(vPosition.z, vPosition.x);

        // Relativistic orbital velocity increases closer to center
        float orbitalSpeed = (3.0 / (r * 0.3 + 0.5)) * time * 0.8;
        float swirlTheta = theta + orbitalSpeed;

        // Swirling plasma filaments via FBM noise
        vec2 noiseCoord = vec2(r * 1.5, swirlTheta * 3.0);
        float plasma = fbm(noiseCoord);

        // Relativistic Doppler Beaming (approaching side is brighter & blue-shifted)
        // Cosine of angle relative to camera view
        float dopplerFactor = sin(theta + 0.3); // -1.0 to +1.0
        float dopplerBoost = pow(clamp(dopplerFactor * 0.5 + 0.5, 0.0, 1.0), 2.2);

        // Color blending based on temperature and Doppler shift
        vec3 col = mix(redShiftColor, coreColor, clamp((r - innerRadius) / (outerRadius - innerRadius), 0.0, 1.0));
        col = mix(col, blueShiftColor, dopplerBoost * 0.7);

        // Radial falloff and hot photon ring near inner radius
        float innerFade = smoothstep(innerRadius, innerRadius + 0.4, r);
        float outerFade = smoothstep(outerRadius, outerRadius - 1.5, r);
        float photonRing = 1.0 / (abs(r - (innerRadius + 0.15)) * 12.0 + 0.2);

        float intensity = (plasma * 0.7 + 0.3) * innerFade * outerFade * (0.8 + dopplerBoost * 1.4) + (photonRing * 0.45);
        intensity += audioIntensity * 0.35;

        gl_FragColor = vec4(col * intensity * 2.2, clamp(intensity * 1.5, 0.0, 0.95));
      }
    `
  },

  // --------------------------------------------------------------------------
  // 2. HYPERSPACE WARP TUNNEL PROCEDURAL SHADER
  // --------------------------------------------------------------------------
  HyperspaceTunnel: {
    uniforms: {
      time: { value: 0 },
      speed: { value: 2.5 },
      colorA: { value: new THREE.Color(0x00f0ff) },
      colorB: { value: new THREE.Color(0xb026ff) },
      distortion: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float speed;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform float distortion;

      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        // Z-axis movement through tunnel
        vec2 uv = vUv;
        uv.y = uv.y * 3.0 - time * speed;

        // Radial streak pattern
        float streaks = sin(uv.x * 60.0 + sin(uv.y * 4.0)) * 0.5 + 0.5;
        streaks = pow(streaks, 8.0); // sharp light streaks

        // Speed pulse rings
        float rings = sin(uv.y * 12.0) * 0.5 + 0.5;
        rings = pow(rings, 4.0);

        // Dynamic color mix
        vec3 col = mix(colorA, colorB, sin(uv.x * 10.0 + time) * 0.5 + 0.5);
        col += vec3(0.3, 0.7, 1.0) * rings * 0.8;
        col += vec3(1.0) * streaks * 1.5;

        // Depth fogging
        float alpha = clamp(streaks * 1.2 + rings * 0.6, 0.15, 0.85);

        gl_FragColor = vec4(col, alpha);
      }
    `
  },

  // --------------------------------------------------------------------------
  // 3. QUANTUM STRING CALABI-YAU LATTICE SHADER
  // --------------------------------------------------------------------------
  QuantumLattice: {
    uniforms: {
      time: { value: 0 },
      audioFreq: { value: 0 },
      coreColor: { value: new THREE.Color(0x00ffcc) },
      rimColor: { value: new THREE.Color(0xff00aa) }
    },
    vertexShader: `
      uniform float time;
      uniform float audioFreq;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        
        // Quantum harmonic oscillation
        vec3 p = position;
        float wave = sin(p.x * 3.0 + time * 3.0) * cos(p.y * 3.0 + time * 2.0) * sin(p.z * 3.0 + time * 2.5);
        p += normal * (wave * 0.35 + (audioFreq * 0.4));

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 coreColor;
      uniform vec3 rimColor;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
        fresnel = pow(fresnel, 2.8);

        vec3 col = mix(coreColor, rimColor, fresnel);
        gl_FragColor = vec4(col * (1.2 + fresnel * 2.0), clamp(0.3 + fresnel * 0.7, 0.0, 1.0));
      }
    `
  }
};

window.CustomShaders = CustomShaders;
