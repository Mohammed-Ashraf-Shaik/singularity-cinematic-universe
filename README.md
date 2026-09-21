# ☀️ SOLAR SYSTEM 3D // KEPLERIAN ASTRODYNAMICS & LINE-WISE EXPLORER

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Planetary_Sonification-ffb700)](#planetary-audio-sonification)
[![60 FPS](https://img.shields.io/badge/Performance-60_FPS_Locked-00ff88)](#astrodynamic-engine)

> *“The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever.” — Konstantin Tsiolkovsky*

**Solar System 3D** is an ultra-realistic, physically grounded 3D astronomical simulator built with Three.js, custom GLSL astrophysical shaders, real-time Keplerian orbital mechanics solvers, and NASA/JPL Horizons telemetry.

It features **dual visual simulation modes**:
1. **Line-Wise Cosmic Alignment Mode**: All celestial bodies arranged linearly from the Sun outward along an illuminated cosmic scale bar for side-by-side comparative inspection and linear flyby.
2. **Heliocentric Keplerian Orrery Mode**: True 3D gravitational elliptical orbits governed by Kepler's laws of planetary motion.

---

## 🪐 Celestial Bodies & Astronomical Sequence

The system models all primary bodies in exact astronomical order from the center outward:

| Body | Classification | Semi-Major Axis ($a$) | Eccentricity ($e$) | Inclination ($i$) | Key Astrodynamic Feature |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **☀️ The Sun (Sol)** | Yellow Dwarf (G2V) | 0.000 AU | 0.0000 | 0.00° | GLSL convective plasma granulation & solar corona |
| **☿ Mercury** | Terrestrial | 0.387 AU | 0.2056 | 7.00° | Relativistic perihelion precession; 610°C thermal swing |
| **♀ Venus** | Terrestrial | 0.723 AU | 0.0067 | 3.39° | Dense sulfuric acid cloud deck & runaway greenhouse |
| **🜨 Earth & Luna** | Habitable Oasis | 1.000 AU | 0.0167 | 0.00° | Multi-spectral terminator, night city lights, specular ocean glint |
| **♂ Mars** | Terrestrial | 1.524 AU | 0.0934 | 1.85° | Olympus Mons (21.9 km), Valles Marineris & polar ice |
| **☄ Asteroid Belt** | Debris Ring & Ceres | 2.770 AU | 0.0758 | 10.59° | 1,400+ instanced tumbling asteroids & dwarf planet Ceres |
| **♃ Jupiter** | Gas Giant | 5.204 AU | 0.0485 | 1.30° | Differential zonal winds, Great Red Spot vortex & 4 Galilean moons |
| **♄ Saturn** | Gas Giant with Rings | 9.582 AU | 0.0555 | 2.49° | Photorealistic ice rings with Cassini division & shadow casting |
| **⛢ Uranus** | Ice Giant | 19.201 AU | 0.0463 | 0.77° | 97.77° sideways axial tilt, vertical rings & methane atmosphere |
| **♆ Neptune** | Ice Giant | 30.047 AU | 0.0094 | 1.77° | Supersonic winds (>2,100 km/h), Great Dark Spot & Triton |
| **♇ Pluto & Charon**| Kuiper Belt Binary | 39.482 AU | 0.2488 | 17.16° | Tombaugh Regio nitrogen ice heart & mutual binary barycenter |
| **🛰 Voyager 1** | Interstellar Probe | 162.00 AU | 1.3000 | 35.50° | High-gain antenna, Golden Record, RTG power boom & Heliopause |

---

## 📐 Astrodynamic & Mathematical Equations

### 1. Kepler's Equation & Iterative Newton-Raphson Solver
Planetary position at time $t$ is computed from the mean anomaly $M(t)$ and eccentricity $e$:
$$M(t) = M_0 + n \cdot t \quad \text{where } n = \frac{2\pi}{T}$$
$$M = E - e \sin E$$

Solved at each frame using Newton-Raphson iteration:
$$E_{k+1} = E_k - \frac{E_k - e \sin E_k - M}{1 - e \cos E_k}$$

### 2. True Anomaly ($\nu$) & Orbital Radius ($r$)
$$\nu = 2 \arctan\left(\sqrt{\frac{1+e}{1-e}} \tan\frac{E}{2}\right)$$
$$r = \frac{a(1 - e^2)}{1 + e \cos \nu}$$

### 3. Vis-Viva Instantaneous Orbital Velocity
$$v = \sqrt{G M_\odot \left(\frac{2}{r} - \frac{1}{a}\right)}$$

### 4. Surface Gravitation & Escape Velocity
$$g = \frac{G M}{R^2}, \quad v_{esc} = \sqrt{\frac{2 G M}{R}}$$

---

## 🎨 Custom GLSL Astrophysical Shaders

1. **Sun Chromosphere & Granulation Shader**:
   - Multi-octave 3D simplex noise simulating boiling convective granulation cells.
   - Eddington approximation limb darkening equation: $I(\mu) = I_0(0.35 + 0.65\mu^{0.6})$.
   - Additive pulsating solar corona glow with magnetic prominence arcs.
2. **Atmospheric Rayleigh Scattering Shader**:
   - Computes Fresnel rim scattering modulated by the solar illumination vector $(\mathbf{N} \cdot \mathbf{L})$.
   - Golden-orange twilight tinting along the terminator for sunset/sunrise effects on Earth, Venus, Mars, and Titan.
3. **Saturn Ring System & Mutual Shadow Occlusion**:
   - Anisotropic forward and backward light scattering phase function.
   - Ray-sphere intersection test calculating the shadow cast by Saturn's spherical body across the ring plane.
4. **Earth Multi-Spectral Material**:
   - Day continent terrain + ocean specular reflection mask (Sun glint).
   - Night-side city lights smoothly blended across the light terminator.
   - Independent rotating dynamic cloud deck with self-shadowing.

---

## 🎛 Controls & Navigation

### Mouse & Touch
- **Left Click + Drag**: 360° Orbit rotation around active celestial body.
- **Scroll / Pinch**: Zoom in / out smoothly.
- **Click Navigation Card**: Instantly target and fly to any planet or moon.

### Keyboard Shortcuts
- `[Spacebar]`: Pause / Resume simulation time flow.
- `[1] - [9]`: Jump directly to celestial bodies.
- `[T]`: Open NASA / JPL Astrodynamics CLI Terminal.
- `[P]`: Capture high-resolution 4K wallpaper screenshot.
- `[H]`: Toggle Heads-Up Display (clean cinematic view).
- `[F]`: Toggle Fullscreen mode.

### Astrodynamics CLI Commands
Press `[T]` to open the terminal and type:
- `goto <planet>` (e.g. `goto mars`, `goto saturn`)
- `linewise` : Switch to Line-Wise Cosmic Alignment Mode
- `helio` / `orrery` : Switch to Heliocentric Keplerian Orbit Mode
- `tour` : Start Cinematic Grand Tour Autopilot
- `timewarp <1|10|50|365>` : Set simulation speed (e.g. `timewarp 50`)
- `calc <planet>` : Compute and print live Keplerian parameters and Vis-Viva velocity
- `orbits on/off` : Toggle orbital ellipse paths
- `grid on/off` : Toggle ecliptic coordinate grid
- `radio` : Trigger planetary acoustic radio wave pulse

---

## 🔊 Planetary Audio Sonification

The engine synthesizes acoustic signatures derived from NASA radio wave observations and magnetospheric emissions:
- **The Sun**: Deep 5-minute $p$-mode acoustic helioseismology oscillation.
- **Earth**: Whistlers and auroral chorus harmonics (432 Hz).
- **Jupiter**: Booming Jovian decametric radio bursts with sweeping resonant bandpass filters.
- **Saturn**: Dual-detuned kilometric radiation (SKR) choral drones.
- **Voyager 1**: Interstellar carrier beacon and telemetry pulse.

---

## 🛠 Local Setup

1. Clone or open the repository:
   ```bash
   cd "d:/Antigravity/something fun"
   ```
2. Start any local HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in Chrome, Firefox, Edge, or Safari.

---

## 📄 License
MIT License. Free for educational, scientific, and personal use.
