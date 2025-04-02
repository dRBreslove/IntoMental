'use strict';

class AudioProcessor {
  constructor() {
    this.bass = 0;
    this.treble = 0;
    this.volume = 0;
    this.balance = 0;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.gainNode = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error('Error initializing audio processor:', error);

      return false;
    }
  }

  async loadPreset(preset) {
    if (!this.isInitialized) {
      throw new Error('AudioProcessor not initialized');
    }
    // Apply preset settings
    if (preset.bass !== undefined) {
      this.bass = preset.bass;
    }
    if (preset.treble !== undefined) {
      this.treble = preset.treble;
    }
    if (preset.volume !== undefined) {
      this.volume = preset.volume;
    }
    if (preset.balance !== undefined) {
      this.balance = preset.balance;
    }
  }

  setBass(value) {
    if (value !== null) {
      this.bass = Math.max(0, Math.min(1, value));
    }
  }

  setTreble(value) {
    if (value !== null) {
      this.treble = Math.max(0, Math.min(1, value));
    }
  }

  setVolume(value) {
    if (value !== null) {
      this.volume = Math.max(0, Math.min(1, value));
      if (this.gainNode) {
        this.gainNode.gain.value = this.volume;
      }
    }
  }

  setBalance(value) {
    if (value !== null) {
      this.balance = Math.max(0, Math.min(1, value));
    }
  }

  getBass() {
    return typeof this.bass === 'number' ? this.bass : 0;
  }

  getTreble() {
    return typeof this.treble === 'number' ? this.treble : 0;
  }

  getVolume() {
    return typeof this.volume === 'number' ? this.volume : 0;
  }

  getBalance() {
    return typeof this.balance === 'number' ? this.balance : 0;
  }
}

const audioProcessor = new AudioProcessor();
module.exports = audioProcessor;
