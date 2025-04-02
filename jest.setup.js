// Mock the AudioContext and related Web Audio API features
class AudioContextMock {
  constructor() {
    this.state = 'suspended';
    this.destination = {};
  }

  createGain() {
    return {
      connect: jest.fn(),
      gain: { value: 1 }
    };
  }

  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn()
    };
  }

  createBiquadFilter() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      frequency: { value: 0 },
      gain: { value: 0 },
      type: 'lowshelf'
    };
  }

  createMediaStreamSource() {
    return {
      connect: jest.fn()
    };
  }

  createBufferSource() {
    return {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }
}

// Mock the WebGL context
class WebGLRenderingContextMock {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.VERTEX_SHADER = 'vertex';
    this.FRAGMENT_SHADER = 'fragment';
    this.COMPILE_STATUS = 'compile';
    this.LINK_STATUS = 'link';
    this.ARRAY_BUFFER = 'array';
    this.ELEMENT_ARRAY_BUFFER = 'element';
    this.FLOAT = 'float';
    this.TRIANGLES = 'triangles';
    this.COLOR_BUFFER_BIT = 'color';
  }

  createShader() { return {}; }
  shaderSource() {}
  compileShader() {}
  getShaderParameter() { return true; }
  createProgram() { return {}; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return true; }
  useProgram() {}
  getAttribLocation() { return 0; }
  getUniformLocation() { return {}; }
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  clear() {}
  clearColor() {}
  viewport() {}
  drawArrays() {}
}

// Mock the navigator.mediaDevices
navigator.mediaDevices = {
  getUserMedia: jest.fn().mockImplementation(() => Promise.resolve({
    getTracks: () => [{
      stop: jest.fn()
    }]
  }))
};

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = function(contextType) {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return new WebGLRenderingContextMock();
  }
  return null;
};

// Mock AudioContext
global.AudioContext = AudioContextMock;
global.webkitAudioContext = AudioContextMock;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock window.URL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn(); 