'use strict';

const audioProcessor = require('./audio-processor');

class AudioManager {
  constructor() {
    this.audioProcessor = audioProcessor;
    this.isInitialized = false;
  }

  async init() {
    try {
      this.audioProcessor.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioProcessor.analyser = this.audioProcessor.audioContext.createAnalyser();
      this.audioProcessor.analyser.fftSize = 2048;
      this.audioProcessor.gainNode = this.audioProcessor.audioContext.createGain();

      this.audioProcessor.frequencyData = new Uint8Array(this.audioProcessor.analyser.frequencyBinCount);
      this.audioProcessor.timeData = new Uint8Array(this.audioProcessor.analyser.frequencyBinCount);

      this.audioProcessor.gainNode.connect(this.audioProcessor.analyser);
      this.audioProcessor.analyser.connect(this.audioProcessor.audioContext.destination);

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  async startRecording() {
    if (!this.isInitialized) await this.init();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioProcessor.source = this.audioProcessor.audioContext.createMediaStreamSource(stream);
      this.audioProcessor.source.connect(this.audioProcessor.gainNode);
      this.audioProcessor.isPlaying = true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  stopRecording() {
    if (this.audioProcessor.source) {
      this.audioProcessor.source.disconnect();
      this.audioProcessor.source = null;
    }
    this.audioProcessor.isPlaying = false;
  }

  async loadAudioFile(file) {
    if (!this.isInitialized) await this.init();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioProcessor.audioContext.decodeAudioData(arrayBuffer);

      if (this.audioProcessor.source) {
        this.audioProcessor.source.disconnect();
      }

      this.audioProcessor.source = this.audioProcessor.audioContext.createBufferSource();
      this.audioProcessor.source.buffer = audioBuffer;
      this.audioProcessor.source.connect(this.audioProcessor.gainNode);

      return true;
    } catch (error) {
      console.error('Error loading audio file:', error);

      return false;
    }
  }

  play() {
    if (this.audioProcessor.source && !this.audioProcessor.isPlaying) {
      this.audioProcessor.source.start(0);
      this.audioProcessor.isPlaying = true;
    }
  }

  stop() {
    if (this.audioProcessor.source && this.audioProcessor.isPlaying) {
      this.audioProcessor.source.stop();
      this.audioProcessor.isPlaying = false;

      // Create a new source for the next playback
      const { buffer } = this.audioProcessor.source;
      this.audioProcessor.source = this.audioProcessor.audioContext.createBufferSource();
      this.audioProcessor.source.buffer = buffer;
      this.audioProcessor.source.connect(this.audioProcessor.gainNode);
    }
  }

  getFrequencyData() {
    if (this.audioProcessor.analyser) {
      this.audioProcessor.analyser.getByteFrequencyData(this.audioProcessor.frequencyData);

      return this.audioProcessor.frequencyData;
    }

    return null;
  }

  getTimeData() {
    if (this.audioProcessor.analyser) {
      this.audioProcessor.analyser.getByteTimeDomainData(this.audioProcessor.timeData);

      return this.audioProcessor.timeData;
    }

    return null;
  }

  setVolume(value) {
    if (this.audioProcessor.gainNode) {
      this.audioProcessor.gainNode.gain.value = value;
    }
  }

  setBass(value) {
    this.setEffect('bass', value);
  }

  setTreble(value) {
    this.setEffect('treble', value);
  }

  setBalance(value) {
    this.setEffect('balance', value);
  }

  setEffect(name, value) {
    if (!this.audioProcessor.effects.has(name)) {
      const filter = this.audioProcessor.audioContext.createBiquadFilter();
      let filterType;
      if (name === 'bass') {
        filterType = 'lowshelf';
      } else if (name === 'treble') {
        filterType = 'highshelf';
      } else {
        filterType = 'mid';
      }
      filter.type = filterType;
      this.audioProcessor.effects.set(name, filter);
    }
    const filter = this.audioProcessor.effects.get(name);
    filter.gain.value = value * 40 - 20; // Convert 0-1 to -20 to +20 dB
  }
}

module.exports = new AudioManager();
