/* ==========================================================================
   SOLAR SYSTEM 3D // AI MISSION NARRATOR & SYNCHRONIZED SUBTITLES
   Natural Speech Synthesis & Grand Tour Event Synchronization
   ========================================================================== */

class VoiceNarrator {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voice = null;
    this.isVoiceEnabled = true;
    this.subtitleEl = null;
    this.typewriterTimeout = null;
    this.isSpeaking = false;
    this.activeCallback = null;

    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;

    const findVoice = () => {
      const voices = this.synth.getVoices();
      // Look for a natural, clear English voice (Natural, Google, Libby, Samantha, or default)
      this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Libby') || v.name.includes('Zira'))) 
                || voices.find(v => v.lang.startsWith('en')) 
                || voices[0];
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = findVoice;
    }
    findVoice();
  }

  setSubtitleElement(el) {
    this.subtitleEl = el;
  }

  speak(text, priority = false, onEnd = null) {
    this.activeCallback = onEnd;

    // 1. Render animated typewriter subtitles on the HUD
    this.renderTypewriterSubtitle(text);

    // 2. Play subtle mission control chirp
    if (window.audioEngine) {
      window.audioEngine.playHoloBeep(940, 'sine');
    }

    // 3. If speech synthesis is unavailable or disabled, simulate reading duration
    if (!this.isVoiceEnabled || !this.synth) {
      this.isSpeaking = true;
      const readingDurationMs = Math.max(5000, text.length * 60);
      setTimeout(() => {
        this.isSpeaking = false;
        if (this.activeCallback) {
          const cb = this.activeCallback;
          this.activeCallback = null;
          cb();
        }
      }, readingDurationMs);
      return;
    }

    if (priority && this.synth.speaking) {
      this.synth.cancel();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.pitch = 0.95; // Authoritative, natural space telemetry tone
      utterance.rate = 1.0;   // Natural conversational speed (not rushed)
      utterance.volume = 0.9;

      this.isSpeaking = true;

      const finishSpeech = () => {
        this.isSpeaking = false;
        if (this.activeCallback) {
          const cb = this.activeCallback;
          this.activeCallback = null;
          cb();
        }
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      if (this.activeCallback) {
        const cb = this.activeCallback;
        this.activeCallback = null;
        cb();
      }
    }
  }

  renderTypewriterSubtitle(text) {
    if (!this.subtitleEl) return;

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }

    this.subtitleEl.textContent = '';
    let i = 0;
    // Calculate typing speed to match utterance pacing
    const speed = Math.max(18, Math.min(32, Math.floor(4000 / Math.max(text.length, 1))));

    const typeChar = () => {
      if (i < text.length) {
        this.subtitleEl.textContent += text.charAt(i);
        i++;
        this.typewriterTimeout = setTimeout(typeChar, speed);
      }
    };

    typeChar();
  }

  stop() {
    this.isSpeaking = false;
    this.activeCallback = null;
    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  toggleVoice() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    if (!this.isVoiceEnabled) {
      this.stop();
    }
    return this.isVoiceEnabled;
  }
}

// Global Singleton Export
window.voiceNarrator = new VoiceNarrator();
