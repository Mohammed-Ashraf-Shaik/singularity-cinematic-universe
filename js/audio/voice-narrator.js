/* ==========================================================================
   PROJECT AETHEL // THE SINGULARITY PROTOCOL
   AI Narrator & Typewriter Subtitle System (AETHEL CORE)
   ========================================================================== */

class VoiceNarrator {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voice = null;
    this.isVoiceEnabled = true;
    this.subtitleEl = null;
    this.typewriterTimeout = null;

    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;

    const findVoice = () => {
      const voices = this.synth.getVoices();
      // Look for a calm, crisp English voice (Google UK English Female, Microsoft Libby, Samantha, or default)
      this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha'))) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    };

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = findVoice;
    }
    findVoice();
  }

  setSubtitleElement(el) {
    this.subtitleEl = el;
  }

  speak(text, priority = false) {
    // 1. Render animated typewriter subtitles on the HUD
    this.renderTypewriterSubtitle(text);

    // 2. Play high-tech chirp
    if (window.audioEngine) {
      window.audioEngine.playHoloBeep(940, 'sine');
    }

    // 3. Web Speech API synthesis
    if (!this.isVoiceEnabled || !this.synth) return;

    if (priority) {
      this.synth.cancel();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.pitch = 0.92; // Slightly deeper, cybernetic
      utterance.rate = 1.05;  // Crisp, military sci-fi cadence
      utterance.volume = 0.85;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  renderTypewriterSubtitle(text) {
    if (!this.subtitleEl) return;

    if (this.typewriterTimeout) {
      clearTimeout(this.typewriterTimeout);
    }

    this.subtitleEl.textContent = '';
    let i = 0;
    const speed = 24; // ms per character

    const typeChar = () => {
      if (i < text.length) {
        this.subtitleEl.textContent += text.charAt(i);
        i++;
        this.typewriterTimeout = setTimeout(typeChar, speed);
      }
    };

    typeChar();
  }

  toggleVoice() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    if (!this.isVoiceEnabled && this.synth) {
      this.synth.cancel();
    }
    return this.isVoiceEnabled;
  }
}

// Global Singleton Export
window.voiceNarrator = new VoiceNarrator();
