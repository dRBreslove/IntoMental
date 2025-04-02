'use strict';

const AirSoundPixel = require('./air-sound-pixel');
const AudioManager = require('./audio');
const AzureCopilot = require('./azure-copilot');
const WebGLVisualizer = require('./webgl');

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
      chorus: 50,
      flanger: 50,
      compression: 50,
    };
    this.lastSoundParameters = {
      frequency: 440,
      amplitude: 0.5,
      phase: 0,
    };
    this.visualizer = new WebGLVisualizer();
    this.currentAudioSource = null;
    this.setupEventListeners();
  }

  async initialize() {
    try {
      await this.azureCopilot.initialize();
      this.setupEventListeners();
      this.visualizer.init();
      this.visualizer.animate();
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
    const presetButtons = document.querySelectorAll('.preset-btn');
    const effectButtons = document.querySelectorAll('.effect-btn');
    const playButton = document.getElementById('play');
    const stopButton = document.getElementById('stop');

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

    if (playButton) {
      playButton.addEventListener('click', this.handlePlay.bind(this));
    }

    if (stopButton) {
      stopButton.addEventListener('click', this.handleStop.bind(this));
    }

    // Add event listeners for preset buttons
    presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const { preset } = button.dataset;
        this.handlePreset(preset);
        this.updateVisualization(preset);
      });
    });

    // Add event listeners for effect buttons
    effectButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const { effect } = button.dataset;
        this.handleEffect(effect);
        this.updateVisualization(effect);
      });
    });

    // Add new effect controls
    document.getElementById('phaser-control').addEventListener('input', (e) => {
      this.audioManager.setPhaser(parseFloat(e.target.value));
      this.updateVisualization();
    });

    document.getElementById('tremolo-control').addEventListener('input', (e) => {
      this.audioManager.setTremolo(parseFloat(e.target.value));
      this.updateVisualization();
    });

    document.getElementById('bitcrush-control').addEventListener('input', (e) => {
      this.audioManager.setBitcrush(parseFloat(e.target.value));
      this.updateVisualization();
    });
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

  handleEffect(effect) {
    switch (effect) {
      case 'reverb':
        this.audioManager.setReverb(0.7);
        break;
      case 'distortion':
        this.audioManager.setDistortion(0.5);
        break;
      case 'delay':
        this.audioManager.setDelay(0.3);
        break;
      case 'equalizer':
        this.audioManager.setEqualizer({
          bass: this.knobValues.bass / 100,
          treble: this.knobValues.treble / 100,
        });
        break;
      case 'chorus':
        this.audioManager.setChorus(0.5);
        break;
      case 'flanger':
        this.audioManager.setFlanger(0.5);
        break;
      case 'compressor':
        this.audioManager.setCompression(0.5);
        break;
      default:
        break;
    }
  }

  async handleAudioFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const audioBuffer = await this.audioManager.loadAudioFile(file);
      this.currentAudioBuffer = audioBuffer;
      this.updateVisualization('fileLoaded');
    } catch (error) {
      console.error('Error loading audio file:', error);
    }
  }

  handlePlay() {
    if (this.currentAudioBuffer) {
      this.currentAudioSource = this.audioManager.playAudioBuffer(this.currentAudioBuffer);
      this.startVisualizationUpdate();
    }
  }

  handleStop() {
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
      this.stopVisualizationUpdate();
    }
  }

  startVisualizationUpdate() {
    if (this.visualizationInterval) return;

    this.visualizationInterval = setInterval(() => {
      const frequencyData = this.audioManager.getFrequencyData();
      const timeData = this.audioManager.getTimeDomainData();

      if (this.visualizer && this.visualizer.isInitialized) {
        // Update visualization based on audio data
        const averageFrequency = this.calculateAverageFrequency(frequencyData);
        const averageAmplitude = this.calculateAverageAmplitude(timeData);

        this.visualizer.setFrequency(averageFrequency);
        this.visualizer.setAmplitude(averageAmplitude);
      }
    }, 1000 / 30); // 30 FPS
  }

  stopVisualizationUpdate() {
    if (this.visualizationInterval) {
      clearInterval(this.visualizationInterval);
      this.visualizationInterval = null;
    }
  }

  calculateAverageFrequency(data) {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length / 255; // Normalize to 0-1 range
  }

  calculateAverageAmplitude(data) {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + Math.abs(val - 128), 0);
    return sum / data.length / 128; // Normalize to 0-1 range
  }

  updateVisualization(type) {
    if (!this.visualizer || !this.visualizer.isInitialized) return;

    switch (type) {
      case 'bass':
        this.visualizer.setColor(0.2, 0.4, 0.8);
        this.visualizer.setFrequency(0.5);
        this.visualizer.setAmplitude(0.7);
        break;
      case 'drums':
        this.visualizer.setColor(0.8, 0.2, 0.2);
        this.visualizer.setFrequency(2.0);
        this.visualizer.setAmplitude(0.9);
        break;
      case 'synth':
        this.visualizer.setColor(0.2, 0.8, 0.4);
        this.visualizer.setFrequency(1.5);
        this.visualizer.setAmplitude(0.6);
        break;
      case 'vocals':
        this.visualizer.setColor(0.8, 0.6, 0.2);
        this.visualizer.setFrequency(1.0);
        this.visualizer.setAmplitude(0.8);
        break;
      case 'reverb':
        this.visualizer.setColor(0.6, 0.2, 0.8);
        this.visualizer.setFrequency(0.8);
        this.visualizer.setAmplitude(0.5);
        break;
      case 'distortion':
        this.visualizer.setColor(0.8, 0.2, 0.4);
        this.visualizer.setFrequency(2.5);
        this.visualizer.setAmplitude(0.9);
        break;
      case 'delay':
        this.visualizer.setColor(0.2, 0.8, 0.8);
        this.visualizer.setFrequency(1.2);
        this.visualizer.setAmplitude(0.6);
        break;
      case 'equalizer':
        this.visualizer.setColor(0.8, 0.8, 0.2);
        this.visualizer.setFrequency(1.8);
        this.visualizer.setAmplitude(0.7);
        break;
      case 'chorus':
        this.visualizer.setColor(0.4, 0.6, 0.9);
        this.visualizer.setFrequency(1.3);
        this.visualizer.setAmplitude(0.6);
        break;
      case 'flanger':
        this.visualizer.setColor(0.9, 0.4, 0.6);
        this.visualizer.setFrequency(1.7);
        this.visualizer.setAmplitude(0.7);
        break;
      case 'compressor':
        this.visualizer.setColor(0.6, 0.9, 0.4);
        this.visualizer.setFrequency(1.1);
        this.visualizer.setAmplitude(0.8);
        break;
      case 'fileLoaded':
        this.startVisualizationUpdate();
        break;
      default:
        break;
    }
  }

  // ... rest of the class implementation ...
}

module.exports = Interface;
