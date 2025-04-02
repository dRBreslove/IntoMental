'use strict';

const AirSoundPixel = require('./air-sound-pixel');
const AudioManager = require('./audio');
const AzureCopilot = require('./azure-copilot');

class Interface {
  constructor() {
    this.airSoundPixel = new AirSoundPixel();
    this.audioManager = AudioManager;
    this.azureCopilot = AzureCopilot;
    this.isInitialized = false;
    this.currentPreset = null;
    this.messageHistory = [];
    this.knobValues = {
      bass: 50,
      treble: 50,
      volume: 50,
      balance: 50,
    };
    this.lastSoundParameters = {
      frequency: 440,
      amplitude: 0.5,
      phase: 0,
    };
    this.visualizer = window.visualizer;
  }

  async initialize() {
    try {
      await this.azureCopilot.initialize();
      this.setupEventListeners();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize interface:', error);
      return false;
    }
  }

  setupEventListeners() {
    const messageInput = document.getElementById('message-input');
    const volumeControl = document.getElementById('volume');
    const frequencyControl = document.getElementById('frequency');
    const amplitudeControl = document.getElementById('amplitude');
    const audioFile = document.getElementById('audioFile');

    if (messageInput) {
      messageInput.addEventListener('keypress', this.handleMessageInput.bind(this));
    }

    if (volumeControl) {
      volumeControl.addEventListener('input', this.handleKnobChange.bind(this));
    }

    if (frequencyControl) {
      frequencyControl.addEventListener('input', this.handleKnobChange.bind(this));
    }

    if (amplitudeControl) {
      amplitudeControl.addEventListener('input', this.handleKnobChange.bind(this));
    }

    if (audioFile) {
      audioFile.addEventListener('change', this.handleAudioFile.bind(this));
    }
  }

  handlePreset(presetName) {
    try {
      const presets = {
        'Preset 1': {
          bass: 50,
          treble: 50,
          volume: 75,
          balance: 50,
        },
        'Preset 2': {
          bass: 60,
          treble: 40,
          volume: 80,
          balance: 60,
        },
      };

      if (presets[presetName]) {
        this.knobValues = { ...presets[presetName] };
        this.updateUI();
        return true;
      }
      throw new Error('Invalid Preset loaded');
    } catch (error) {
      const statusText = document.getElementById('air-status-text');
      if (statusText) {
        statusText.textContent = 'Error loading preset';
      }
      return false;
    }
  }

  handleKnobChange(event) {
    const { parameter } = event.target.dataset;
    const value = parseFloat(event.target.value);
    this.knobValues[parameter] = value;

    switch (parameter) {
      case 'volume':
        this.audioManager.setVolume(value / 100);
        break;
      case 'bass':
        this.audioManager.setBass(value / 100);
        break;
      case 'treble':
        this.audioManager.setTreble(value / 100);
        break;
      case 'balance':
        this.audioManager.setBalance(value / 100);
        break;
      default:
        break;
    }
  }

  handleSwipeGesture(gesture) {
    const { intensity } = gesture;
    const volume = intensity === 0.5 ? 60 : Math.round(intensity * 100);
    this.knobValues.volume = volume;
    this.audioManager.setVolume(volume / 100);
  }

  handleWaveGesture(gesture) {
    const { intensity } = gesture;
    const effectButton = document.querySelector('.effect-button');
    if (effectButton) {
      effectButton.style.opacity = intensity;
    }
  }

  handlePinchGesture(gesture) {
    const { intensity } = gesture;
    if (this.visualizer) {
      this.visualizer.setFrequency(intensity * 1000);
    }
  }

  // ... rest of the class implementation ...
}

module.exports = Interface;
