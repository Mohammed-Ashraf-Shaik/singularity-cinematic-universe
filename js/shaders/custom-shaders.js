/* ==========================================================================
   SOLAR SYSTEM DYNAMICS // ADVANCED GLSL ASTROPHYSICAL SHADERS
   High-Precision Celestial Shaders: Solar Corona, Planetary Atmospheres,
   Saturn Ring Shadow Scattering & Earth Multi-Spectral Terminator
   ========================================================================== */

const CustomShaders = {
  // --------------------------------------------------------------------------
  // 1. THE SUN: CHROMOSPHERE GRANULATION & SOLAR FLARE EMISSION
  // --------------------------------------------------------------------------
  SunSurface: {
    uniforms: {
      time: { value: 0 },
      colorCore: { value: new THREE.Color(0xfff5d0) },
      colorMid: { value: new THREE.Color(0xff8c00) },
      colorEdge: { value: new THREE.Color(0xd92600) },
      colorSpot: { value: new THREE.Color(0x3a0900) },
      granulationScale: { value: 24.0 },
      audioIntensity: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 colorCore;
      uniform vec3 colorMid;
      uniform vec3 colorEdge;
      uniform vec3 colorSpot;
      uniform float granulationScale;
      uniform float audioIntensity;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewDir;

      // 3D Simplex noise approximation
      vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float fbm(vec3 p) {
        float total = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 4; i++) {
          total += snoise(p * freq) * amp;
          freq *= 2.05;
          amp *= 0.5;
        }
        return total;
      }

      void main() {
        vec3 normPos = normalize(vPosition);
        float t = time * 0.15;

        // Convective granulation flow
        float n1 = fbm(normPos * granulationScale + vec3(0.0, t, 0.0));
        float n2 = fbm(normPos * (granulationScale * 2.2) - vec3(t * 0.7, 0.0, t * 0.5));
        float combinedNoise = (n1 * 0.65 + n2 * 0.35);

        // Astrophysical Eddington Limb Darkening: I(mu) = I0 * (0.4 + 0.6 * mu)
        float mu = max(dot(vNormal, vViewDir), 0.0);
        float limbDarkening = 0.35 + 0.65 * pow(mu, 0.6);

        // Solar faculae and magnetic sunspots
        float spotMask = smoothstep(-0.35, -0.15, combinedNoise);
        vec3 surfaceColor = mix(colorSpot, colorMid, spotMask);
        surfaceColor = mix(surfaceColor, colorCore, smoothstep(0.1, 0.5, combinedNoise));

        // Edge emission & audio reactivity
        surfaceColor = mix(colorEdge, surfaceColor, limbDarkening);
        surfaceColor += colorCore * (audioIntensity * 0.25);

        gl_FragColor = vec4(surfaceColor * (1.1 + 0.15 * sin(time * 2.0)), 1.0);
      }
    `
  },

  // --------------------------------------------------------------------------
  // 2. SOLAR CORONA & MAGNETIC PROMINENCE FIELD (ADDITIVE GLOW)
  // --------------------------------------------------------------------------
  SunCorona: {
    uniforms: {
      time: { value: 0 },
      coronaColor: { value: new THREE.Color(0xff9922) },
      audioIntensity: { value: 0.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 coronaColor;
      uniform float audioIntensity;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPosition;

      void main() {
        float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        float pulse = 0.85 + 0.15 * sin(time * 1.8 + vWorldPosition.x * 0.05);
        float intensity = pow(fresnel, 2.5) * pulse;

        intensity += audioIntensity * 0.3 * pow(fresnel, 1.5);
        vec3 finalColor = coronaColor * intensity * 1.8;
        gl_FragColor = vec4(finalColor, intensity * 0.85);
      }
    `
  },

  // --------------------------------------------------------------------------
  // 3. ATMOSPHERIC RAYLEIGH & MIE SCATTERING SHADER (EARTH, VENUS, MARS, TITAN)
  // --------------------------------------------------------------------------
  AtmosphereScattering: {
    uniforms: {
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      atmosphereColor: { value: new THREE.Color(0x3388ff) },
      sunsetTint: { value: new THREE.Color(0xff6622) },
      glowPower: { value: 3.5 },
      atmosphereDensity: { value: 1.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vec4 mvPosition = viewMatrix * worldPos;
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 sunPosition;
      uniform vec3 atmosphereColor;
      uniform vec3 sunsetTint;
      uniform float glowPower;
      uniform float atmosphereDensity;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        // Solar vector relative to surface point
        vec3 lightDir = normalize(sunPosition - vWorldPos);
        vec3 worldNorm = normalize(vNormal);

        // Rim Fresnel scattering
        float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        float rimIntensity = pow(fresnel, glowPower) * atmosphereDensity;

        // Illumination factor (day vs night side terminator)
        float dotLight = dot(worldNorm, lightDir);
        float dayFactor = clamp(dotLight * 1.4 + 0.25, 0.0, 1.0);

        // Twilight sunset scattering along the day/night terminator
        float terminator = 1.0 - abs(dotLight);
        terminator = pow(clamp(terminator, 0.0, 1.0), 4.0);

        vec3 scatteredColor = mix(atmosphereColor, sunsetTint, terminator * 0.7);
        vec3 finalGlow = scatteredColor * rimIntensity * dayFactor;

        gl_FragColor = vec4(finalGlow, rimIntensity * dayFactor * 0.95);
      }
    `
  },

  // --------------------------------------------------------------------------
  // 4. SATURN RING SYSTEM WITH ANISOTROPIC SCATTERING & PLANETARY OCCLUSION
  // --------------------------------------------------------------------------
  SaturnRings: {
    uniforms: {
      ringTexture: { value: null },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      planetCenter: { value: new THREE.Vector3(0, 0, 0) },
      planetRadius: { value: 9.45 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D ringTexture;
      uniform vec3 sunPosition;
      uniform vec3 planetCenter;
      uniform float planetRadius;

      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        // Sample translucent ring density & coloration
        vec4 ringTex = texture2D(ringTexture, vUv);
        if (ringTex.a < 0.02) discard;

        // Check if ring segment is in Saturn's spherical shadow cast by the Sun
        vec3 lightDir = normalize(sunPosition - vWorldPosition);
        vec3 toCenter = planetCenter - vWorldPosition;

        // Closest point from planet center to the sun-light ray
        float proj = dot(toCenter, lightDir);
        float shadow = 1.0;

        // If the planet is between the ring point and the Sun
        if (proj > 0.0) {
          float distSq = dot(toCenter, toCenter) - (proj * proj);
          if (distSq < (planetRadius * planetRadius)) {
            // Soft shadow edge penumbra
            float dist = sqrt(max(distSq, 0.0));
            shadow = smoothstep(planetRadius * 0.85, planetRadius * 1.02, dist);
          }
        }

        // Forward & backscattering phase function
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float cosTheta = dot(lightDir, viewDir);
        float phase = 0.75 + 0.25 * (cosTheta * cosTheta);

        vec3 litColor = ringTex.rgb * (shadow * 0.9 + 0.1) * phase;
        gl_FragColor = vec4(litColor, ringTex.a);
      }
    `
  },

  // --------------------------------------------------------------------------
  // 5. EARTH MULTI-SPECTRAL MATERIAL: DAY/NIGHT LIGHTS & OCEAN SPECULAR GLINT
  // --------------------------------------------------------------------------
  EarthSurface: {
    uniforms: {
      dayTexture: { value: null },
      nightTexture: { value: null },
      specularMap: { value: null },
      cloudsTexture: { value: null },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      cloudTime: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vec4 mvPosition = viewMatrix * worldPos;
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D specularMap;
      uniform sampler2D cloudsTexture;
      uniform vec3 sunPosition;
      uniform float cloudTime;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewDir;

      void main() {
        vec3 lightDir = normalize(sunPosition - vWorldPosition);
        vec3 normal = normalize(vNormal);

        // Day vs night illumination
        float NdotL = dot(normal, lightDir);
        float dayWeight = smoothstep(-0.15, 0.15, NdotL);
        float nightWeight = 1.0 - dayWeight;

        // Sample textures
        vec3 dayColor = texture2D(dayTexture, vUv).rgb;
        vec3 nightColor = texture2D(nightTexture, vUv).rgb;
        float specValue = texture2D(specularMap, vUv).r;

        // Moving clouds with shadow cast onto terrain
        vec2 cloudUv = vec2(vUv.x + cloudTime * 0.005, vUv.y);
        vec4 cloudColor = texture2D(cloudsTexture, cloudUv);

        // Specular Sun glint on oceans
        vec3 halfVector = normalize(lightDir + vViewDir);
        float NdotH = max(dot(normal, halfVector), 0.0);
        float specularGlint = pow(NdotH, 48.0) * specValue * dayWeight * 1.5;

        // Combine surface day/night
        vec3 baseSurface = dayColor * dayWeight + nightColor * (nightWeight * 1.6);
        baseSurface += vec3(specularGlint);

        // Blend clouds over surface (clouds illuminate white on day side, dark on night side)
        vec3 litCloud = cloudColor.rgb * (dayWeight * 1.1 + 0.04);
        vec3 finalColor = mix(baseSurface, litCloud, cloudColor.a * 0.85);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }
};
