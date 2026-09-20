# 🌌 PROJECT AETHEL: THE SINGULARITY PROTOCOL

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00f0ff?style=for-the-badge&logo=github)](https://mohammed-ashraf-shaik.github.io/singularity-cinematic-universe/)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_WebAudio-blueviolet)](#procedural-audio-engine)
[![60 FPS](https://img.shields.io/badge/Performance-60_FPS_Locked-00ff88)](#performance-architecture)

> *“Beyond the event horizon lies not the end of time, but the inception of infinity.”*

🔗 **Live Experience**: [https://mohammed-ashraf-shaik.github.io/singularity-cinematic-universe/](https://mohammed-ashraf-shaik.github.io/singularity-cinematic-universe/)

**Project Aethel** is a state-of-the-art, hyper-cinematic 3D WebGL odyssey built from the ground up with Three.js, custom GLSL shaders, procedural Web Audio synthesis, and an interactive sci-fi HUD. It delivers an AAA film-grade interactive experience directly in the browser with zero external dependencies.

---

## 🚀 Experience Features

### 🎬 5 Interactive Cinematic Acts
1. **Act I: Gargantua Singularity**
   - Procedural gravitational lensing and relativistic Doppler beaming accretion disk shader.
   - 4,000-particle infall accretion stream spiraling towards the event horizon.
   - Orbiting telemetry probe *ENDURANCE-01* with active navigational beacons.
   - Relativistic time dilation gauge (+7.24 Earth Years per local minute).

2. **Act II: Sector 07 Neo-Babylon (Cyber Megalopolis)**
   - 120 procedural skyscrapers with illuminated window lattices and rooftop beacons.
   - Multi-colored neon holographic advertising billboards.
   - Dynamic flying spinner traffic traveling along elevated sky-corridors.
   - Volumetric rain simulation and reflective wet cyber-grid floor.

3. **Act III: The Quantum Core**
   - Calabi-Yau mathematical manifold lattice with pulsating harmonic displacement shaders.
   - Glowing quantum core seed with audio-frequency reactive breathing.
   - Superconducting magnetic containment rings revolving along orthogonal Euler axes.
   - 2,000 sub-atomic floating quantum sparks.

4. **Act IV: Hyperspace Warp Runner (Flight Simulator)**
   - Interactive high-velocity flight through a procedural wormhole vortex.
   - Pilot your interceptor spacecraft using `WASD` or Arrow Keys.
   - Fly through holographic acceleration rings for score multipliers and speed boosts (up to Mach 9999).
   - Dynamic thruster sound that modulates pitch and resonance based on vessel throttle.

5. **Act V: The Multiverse Codex**
   - Interactive 3D alien exoplanet *Aethel-Prime* with dynamic atmospheric Fresnel scattering.
   - Bioluminescent surface topography and stardust rings.
   - Orbiting scanner probes analyzing atmospheric composition, surface gravity, and habitability ratings.

---

## 🔊 Procedural Web Audio Engine

Zero static audio files are used. The entire soundscape is generated algorithmically in real time using the **Web Audio API**:
- **Hans Zimmer Cinematic Drone**: Detuned saw and sine wave oscillators routed through resonant lowpass filters with slow LFO frequency swells, playing emotional harmonic progressions ($D_{min} \rightarrow B\flat \rightarrow F \rightarrow C \rightarrow G_{min}$).
- **The Iconic "BRAAAM" Horn Blast**: Distorted brass oscillators with exponential pitch decay and sub-bass impact.
- **Hyperspace Warp Jump**: Rising frequency chirp with stereo Doppler pan and sub-bass drop.
- **Adaptive Thruster Sound**: Pink/Brown noise generator with real-time frequency tracking linked to flight velocity.
- **High-Tech Holographic SFX**: Crystal UI chirps, scanner pings, and deflector shield harmonics.
- **Real-Time FFT Audio Visualizer**: 32-band frequency spectrum rendered directly onto the HUD canvas.

---

## 💻 Interactive Holo-Terminal Directives

Press `T` or click **TERMINAL** to open the interactive sci-fi console. Supported commands:
- `help` - Lists all vessel commands and protocols
- `warp <1-5>` - Hyperjump directly to specified act
- `blackhole` - Teleport to Gargantua Event Horizon
- `cyberpunk` - Jump to Sector 07 Megacity
- `quantum` - Enter the Calabi-Yau Core
- `flight` - Launch the Hyperspace Flight Simulator
- `codex` - Open the Multiverse Planetary Archive
- `braaam` - Trigger Hans Zimmer horn blast
- `camera [director|free]` - Toggle camera perspectives
- `status` - Telemetry diagnostics and shield status
- `time` - Measure relativistic time dilation
- `shields` - Recalibrate deflector harmonics
- `matrix` - Decrypt quantum matrix easter egg
- `lore` - Read ancient historical logs of Project Aethel
- `clear` - Clear terminal buffer

---

## 🎮 Keyboard & Mouse Controls

| Key / Input | Action |
|-------------|--------|
| **WASD / Arrows** | Steer spacecraft in Hyperspace Flight Sim |
| **Spacebar** | Hyperspace Booster (Mach 9999) |
| **1 - 5** | Instant Act Warp Jump |
| **B** | Synthesize Hans Zimmer BRAAAM Horn Blast |
| **T** | Toggle Holo-Terminal Console |
| **M** | Toggle Audio Mute / Unmute |
| **H** | Toggle HUD Display (for wallpaper screenshots) |
| **F** | Toggle Fullscreen Mode |
| **Mouse Drag** | Orbit around scene in Free Camera Mode |

---

## 🛠️ Local Development & Quick Start

Simply serve the repository folder with any static file server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node (npx)
npx serve .
```

Open `http://localhost:8000` in any modern WebGL-compatible browser (Chrome, Edge, Firefox, Safari) and click **ENGAGE** to enter the singularity.

---

## 📜 Architecture & Technology Stack
- **Graphics**: [Three.js r128](https://threejs.org/) + Custom GLSL Shaders (Additive Blending, ACES Filmic Tone Mapping)
- **Audio**: Web Audio API (Multi-oscillator synthesis, WaveShaper distortion, BiquadFilter, AnalyserNode)
- **AI Narration**: Web Speech API (`SpeechSynthesis`) + Typewriter HUD Subtitle System
- **Styling**: Vanilla CSS3 Glassmorphism with hardware-accelerated transforms and `@keyframes`

---

## 👤 Author
- **Mohammed Ashraf Shaik** ([@Mohammed-Ashraf-Shaik](https://github.com/Mohammed-Ashraf-Shaik))

*Engineered with precision for advanced web immersion.*
