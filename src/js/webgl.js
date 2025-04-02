'use strict';

// Vertex shader program
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    
    varying vec2 vTextureCoord;
    varying vec3 vPosition;
    
    void main() {
        gl_Position = aVertexPosition;
        vTextureCoord = aTextureCoord;
        vPosition = aVertexPosition.xyz;
    }
`;

// Fragment shader program
const fragmentShaderSource = `
    precision mediump float;
    
    varying vec2 vTextureCoord;
    varying vec3 vPosition;
    
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    
    void main() {
        // Calculate wave pattern
        float wave = sin(vPosition.x * uFrequency + uTime) * uAmplitude;
        
        // Create dynamic color based on position and time
        vec3 dynamicColor = uColor * (0.5 + 0.5 * sin(vPosition.y * 2.0 + uTime));
        
        // Add air pressure effect
        float pressureEffect = 0.5 + 0.5 * sin(vPosition.z * 3.0 + uTime * 0.5);
        
        // Combine effects
        vec3 finalColor = mix(dynamicColor, vec3(1.0), pressureEffect * uOpacity);
        
        // Add wave distortion
        float distortion = wave * 0.1;
        vec2 distortedCoord = vTextureCoord + vec2(distortion, 0.0);
        
        gl_FragColor = vec4(finalColor, uOpacity);
    }
`;

class WebGLVisualizer {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.vertices = null;
    this.vertexBuffer = null;
    this.isInitialized = false;

    this.visualizationParams = {
      amplitude: 0.5,
      frequency: 1.0,
      color: [1.0, 1.0, 1.0],
      opacity: 0.8,
    };
  }

  init() {
    try {
      this.canvas = document.getElementById('visualizer');
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }

      this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      if (!this.gl) {
        throw new Error('WebGL not supported');
      }

      this.setupShaders();
      this.setupBuffers();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      return false;
    }
  }

  setupShaders() {
    // Initialize shaders
    const vertexShader = this.initShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.initShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    // Create program
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Unable to initialize shader program:', this.gl.getProgramInfoLog(this.program));

      return;
    }

    // Get attribute and uniform locations
    this.attributes = {
      vertexPosition: this.gl.getAttribLocation(this.program, 'aVertexPosition'),
      textureCoord: this.gl.getAttribLocation(this.program, 'aTextureCoord'),
    };

    this.uniforms = {
      amplitude: this.gl.getUniformLocation(this.program, 'uAmplitude'),
      frequency: this.gl.getUniformLocation(this.program, 'uFrequency'),
      color: this.gl.getUniformLocation(this.program, 'uColor'),
      opacity: this.gl.getUniformLocation(this.program, 'uOpacity'),
      time: this.gl.getUniformLocation(this.program, 'uTime'),
    };
  }

  initShader(source, type) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);

      return null;
    }

    return shader;
  }

  setupBuffers() {
    // Create vertex buffer
    const positions = new Float32Array([
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0,
      -1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
    ]);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // Create texture coordinate buffer
    const textureCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
    ]);

    const textureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, textureCoords, this.gl.STATIC_DRAW);

    this.buffers = {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
    };
  }

  animate() {
    this.render();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    // Clear canvas
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use shader program
    this.gl.useProgram(this.program);

    // Set uniforms
    const time = (Date.now() - this.startTime) * 0.001;
    this.gl.uniform1f(this.uniforms.time, time);
    this.gl.uniform1f(this.uniforms.amplitude, this.visualizationParams.amplitude);
    this.gl.uniform1f(this.uniforms.frequency, this.visualizationParams.frequency);
    this.gl.uniform3fv(this.uniforms.color, this.visualizationParams.color);
    this.gl.uniform1f(this.uniforms.opacity, this.visualizationParams.opacity);

    // Set attributes
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.enableVertexAttribArray(this.attributes.vertexPosition);
    this.gl.vertexAttribPointer(this.attributes.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.textureCoord);
    this.gl.enableVertexAttribArray(this.attributes.textureCoord);
    this.gl.vertexAttribPointer(this.attributes.textureCoord, 2, this.gl.FLOAT, false, 0, 0);

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  setAmplitude(value) {
    this.visualizationParams.amplitude = Math.max(0.0, Math.min(1.0, value));
  }

  setFrequency(value) {
    this.visualizationParams.frequency = Math.max(0.1, value);
  }

  setColor(r, g, b) {
    this.visualizationParams.color = [
      Math.max(0.0, Math.min(1.0, r)),
      Math.max(0.0, Math.min(1.0, g)),
      Math.max(0.0, Math.min(1.0, b)),
    ];
  }

  setOpacity(value) {
    this.visualizationParams.opacity = Math.max(0.0, Math.min(1.0, value));
  }

  getAmplitude() {
    return this.visualizationParams.amplitude;
  }

  getFrequency() {
    return this.visualizationParams.frequency;
  }

  getColor() {
    return [...this.visualizationParams.color];
  }

  getOpacity() {
    return this.visualizationParams.opacity;
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

module.exports = WebGLVisualizer;
