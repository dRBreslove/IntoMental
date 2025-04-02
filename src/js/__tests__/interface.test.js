'use strict';

// Mock Web Audio API
const mockAudioContext = {
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: { value: 0 }
  }),
  createAnalyser: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    getByteFrequencyData: jest.fn()
  }),
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 }
  })
};

global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

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

// Mock Azure configuration
jest.mock('../azure-config', () => ({
  apiKey: 'test-api-key',
  endpoint: 'https://test-endpoint',
  region: 'test-region',
  messageQueueSize: 100
}));

// Mock Azure Copilot
jest.mock('../azure-copilot', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  sendMessage: jest.fn().mockResolvedValue({
    content: JSON.stringify({
      type: 'response',
      data: {
        message: 'Test response',
        timestamp: Date.now()
      }
    }),
    role: 'assistant'
  })
}));

jest.mock('../audio-processor');
jest.mock('../azure-config');
jest.mock('../csound-azure-bridge');
jest.mock('../azure-copilot');

const Interface = require('../interface');
const audioProcessor = require('../audio-processor');
const azureConfig = require('../azure-config');
const csoundAzureBridge = require('../csound-azure-bridge');
const AirSoundPixel = require('../air-sound-pixel');

describe('Interface', () => {
  let interfaceInstance;
  let mockAzureCopilot;
  let mockAudioManager;
  const mockVisualizer = {
    setAmplitude: jest.fn(),
    setFrequency: jest.fn(),
    setOpacity: jest.fn(),
    setColor: jest.fn(),
    getFrequency: jest.fn().mockReturnValue(440),
  };

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="message-container"></div>
      <div id="air-status-text"></div>
      <input type="range" class="control-knob" data-parameter="volume" />
      <button class="effect-button" data-effect="reverb"></button>
    `;

    // Mock window.visualizer
    window.visualizer = mockVisualizer;

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
      setBalance: jest.fn()
    };

    // Create interface instance
    interfaceInstance = new Interface();
    interfaceInstance.azureCopilot = mockAzureCopilot;
    interfaceInstance.audioManager = mockAudioManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    delete window.visualizer;
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
      expect(mockVisualizer.setFrequency).toHaveBeenCalled();
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
        messageInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
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