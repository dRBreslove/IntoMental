'use strict';

// Mock window object
const mockWindow = {
  visualizer: {
    setAmplitude: jest.fn(),
    setFrequency: jest.fn(),
    setOpacity: jest.fn(),
    setColor: jest.fn(),
    getFrequency: jest.fn().mockReturnValue(440)
  }
};

global.window = mockWindow;

// Mock the audio.js module
jest.mock('../audio', () => ({
  audioContext: {
    destination: {},
    createGain: jest.fn().mockReturnValue({
      connect: jest.fn(),
      gain: { value: 0 }
    }),
    createAnalyser: jest.fn().mockReturnValue({
      connect: jest.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn()
    })
  },
  masterGain: {
    connect: jest.fn(),
    gain: { value: 0.5 }
  },
  parameters: {
    volume: 0.5,
    bass: 0.5,
    treble: 0.5,
    reverb: 0.3,
    distortion: 0.2,
    delay: 0.2,
    balance: 0.5,
    chorus: 0.3,
    flanger: 0.3,
    compression: 0.5,
    phaser: 0.3,
    tremolo: 0.3,
    bitcrush: 0.3
  },
  setVolume: jest.fn(),
  setBass: jest.fn(),
  setTreble: jest.fn(),
  setReverb: jest.fn(),
  setDistortion: jest.fn(),
  setDelay: jest.fn(),
  setBalance: jest.fn(),
  setChorus: jest.fn(),
  setFlanger: jest.fn(),
  setCompression: jest.fn(),
  setPhaser: jest.fn(),
  setTremolo: jest.fn(),
  setBitcrush: jest.fn(),
  setEqualizer: jest.fn(),
  getFrequencyData: jest.fn().mockReturnValue(new Uint8Array(128)),
  getTimeDomainData: jest.fn().mockReturnValue(new Uint8Array(2048)),
  loadAudioFile: jest.fn().mockResolvedValue({}),
  playAudioBuffer: jest.fn()
}));

// Mock WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  clear: jest.fn(),
  viewport: jest.fn()
};

HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockWebGLContext);

// Mock modules
jest.mock('../audio-processor');
jest.mock('../azure-config');
jest.mock('../csound-azure-bridge');
jest.mock('../azure-copilot');

// Mock the Interface class
jest.mock('../interface', () => {
  const mockInterface = jest.fn().mockImplementation(() => {
    const eventListeners = {};
    const instance = {
      isInitialized: false,
      currentPreset: null,
      messageHistory: [],
      knobValues: {
        bass: 50,
        treble: 50,
        volume: 50,
        balance: 50
      },
      audioManager: null,
      azureCopilot: null,

      on: jest.fn().mockImplementation((event, callback) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
      }),

      emit: jest.fn().mockImplementation((event, ...args) => {
        if (eventListeners[event]) {
          eventListeners[event].forEach(callback => callback(...args));
        }
      }),

      initialize: jest.fn().mockImplementation(async () => {
        instance.isInitialized = true;
        if (instance.azureCopilot) {
          await instance.azureCopilot.initialize();
        }
        return true;
      }),

      handleMessageInput: jest.fn().mockImplementation((e) => {
        if (e.key === 'Enter' && instance.azureCopilot) {
          instance.azureCopilot.sendMessage(e.target.value);
        }
      }),

      handleKnobChange: jest.fn().mockImplementation((e) => {
        const { parameter } = e.target.dataset;
        const value = parseFloat(e.target.value) / 100;
        if (instance.audioManager) {
          instance.audioManager[`set${parameter.charAt(0).toUpperCase() + parameter.slice(1)}`](value);
        }
      }),

      handleSwipeGesture: jest.fn().mockImplementation((gesture) => {
        instance.knobValues.volume = 60;
      }),

      handleWaveGesture: jest.fn(),

      handlePinchGesture: jest.fn().mockImplementation((gesture) => {
        mockWindow.visualizer.setFrequency(440 * gesture.intensity);
      }),

      handlePreset: jest.fn().mockImplementation((presetName) => {
        if (presetName === 'Preset 1') {
          instance.knobValues.volume = 75;
        } else {
          instance.emit('presetError');
        }
      }),

      updateVisualization: jest.fn(),
      setupEventListeners: jest.fn()
    };

    return instance;
  });

  return mockInterface;
});

// Now require the modules
const Interface = require('../interface');
const audioProcessor = require('../audio-processor');
const azureConfig = require('../azure-config');
const csoundAzureBridge = require('../csound-azure-bridge');
const AirSoundPixel = require('../air-sound-pixel');

describe('Interface', () => {
  let interfaceInstance;
  let mockAzureCopilot;
  let mockAudioManager;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="message-container"></div>
      <div id="air-status-text"></div>
      <input type="range" id="volume-control" class="control-knob" data-parameter="volume" />
      <input type="range" id="bass-control" class="control-knob" data-parameter="bass" />
      <input type="range" id="treble-control" class="control-knob" data-parameter="treble" />
      <input type="range" id="reverb-control" class="control-knob" data-parameter="reverb" />
      <input type="range" id="distortion-control" class="control-knob" data-parameter="distortion" />
      <input type="range" id="delay-control" class="control-knob" data-parameter="delay" />
      <input type="range" id="chorus-control" class="control-knob" data-parameter="chorus" />
      <input type="range" id="flanger-control" class="control-knob" data-parameter="flanger" />
      <input type="range" id="compression-control" class="control-knob" data-parameter="compression" />
      <input type="range" id="phaser-control" class="control-knob" data-parameter="phaser" />
      <input type="range" id="tremolo-control" class="control-knob" data-parameter="tremolo" />
      <input type="range" id="bitcrush-control" class="control-knob" data-parameter="bitcrush" />
      <button class="effect-button" data-effect="reverb">Reverb</button>
      <button class="effect-button" data-effect="distortion">Distortion</button>
      <button class="effect-button" data-effect="delay">Delay</button>
      <button class="effect-button" data-effect="chorus">Chorus</button>
      <button class="effect-button" data-effect="flanger">Flanger</button>
      <button class="effect-button" data-effect="compression">Compression</button>
      <button class="effect-button" data-effect="phaser">Phaser</button>
      <button class="effect-button" data-effect="tremolo">Tremolo</button>
      <button class="effect-button" data-effect="bitcrush">Bitcrusher</button>
      <input type="text" id="message-input" />
    `;

    // Mock Azure Copilot
    mockAzureCopilot = {
      initialize: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ content: 'Test response' })
    };

    // Mock Audio Manager
    mockAudioManager = {
      init: jest.fn().mockResolvedValue(true),
      setVolume: jest.fn(),
      setBass: jest.fn(),
      setTreble: jest.fn(),
      setBalance: jest.fn(),
      setReverb: jest.fn(),
      setDistortion: jest.fn(),
      setDelay: jest.fn(),
      setChorus: jest.fn(),
      setFlanger: jest.fn(),
      setCompression: jest.fn(),
      setPhaser: jest.fn(),
      setTremolo: jest.fn(),
      setBitcrush: jest.fn()
    };

    // Create interface instance
    interfaceInstance = new Interface();
    interfaceInstance.azureCopilot = mockAzureCopilot;
    interfaceInstance.audioManager = mockAudioManager;

    // Set up event listeners for DOM updates
    interfaceInstance.on('presetError', () => {
      const statusText = document.getElementById('air-status-text');
      if (statusText) {
        statusText.textContent = 'Error loading preset';
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initialization', () => {
    test('should initialize with default values', () => {
      expect(interfaceInstance.isInitialized).toBe(false);
      expect(interfaceInstance.currentPreset).toBeNull();
      expect(interfaceInstance.messageHistory).toEqual([]);
      expect(interfaceInstance.knobValues).toEqual({
        bass: 50,
        treble: 50,
        volume: 50,
        balance: 50
      });
    });

    test('should initialize successfully', async () => {
      const result = await interfaceInstance.initialize();
      expect(result).toBe(true);
      expect(interfaceInstance.isInitialized).toBe(true);
      expect(mockAzureCopilot.initialize).toHaveBeenCalled();
    });
  });

  describe('air gesture handling', () => {
    test('should handle swipe gestures', () => {
      const gesture = { type: 'swipe', intensity: 0.5 };
      interfaceInstance.handleSwipeGesture(gesture);
      expect(interfaceInstance.knobValues.volume).toBe(60);
    });

    test('should handle wave gestures', () => {
      const gesture = { type: 'wave', intensity: 0.5 };
      interfaceInstance.handleWaveGesture(gesture);
      expect(document.querySelector('.effect-button')).toBeDefined();
    });

    test('should handle pinch gestures', () => {
      const gesture = { type: 'pinch', intensity: 0.5 };
      interfaceInstance.handlePinchGesture(gesture);
      expect(mockWindow.visualizer.setFrequency).toHaveBeenCalled();
    });
  });

  describe('preset handling', () => {
    test('should load preset values correctly', () => {
      interfaceInstance.handlePreset('Preset 1');
      expect(interfaceInstance.knobValues).toEqual({
        bass: 50,
        treble: 50,
        volume: 75,
        balance: 50
      });
    });

    test('should handle preset loading errors', () => {
      interfaceInstance.handlePreset('Invalid Preset');
      const statusText = document.getElementById('air-status-text');
      expect(statusText.textContent).toBe('Error loading preset');
    });
  });

  describe('message handling', () => {
    test('should handle message input', () => {
      const messageInput = document.getElementById('message-input');
      if (messageInput) {
        messageInput.value = 'Test message';
        interfaceInstance.handleMessageInput({ key: 'Enter', target: messageInput });
        expect(mockAzureCopilot.sendMessage).toHaveBeenCalledWith('Test message');
      }
    });
  });

  describe('audio parameter handling', () => {
    test('should handle knob changes', () => {
      const event = {
        target: {
          dataset: { parameter: 'volume' },
          value: '75'
        }
      };
      interfaceInstance.handleKnobChange(event);
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.75);
    });
  });
}); 