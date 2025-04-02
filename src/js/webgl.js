'use strict';

// Vertex shader program
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`;

// Fragment shader program
const fsSource = `
    precision highp float;
    varying highp vec2 vTextureCoord;
    
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uAmplitude;
    uniform float uFrequency;

    void main(void) {
        vec2 uv = vTextureCoord;
        
        // Create a dynamic wave pattern
        float wave = sin(uv.x * uFrequency * 10.0 + uTime) * uAmplitude;
        float wave2 = cos(uv.x * uFrequency * 15.0 - uTime * 0.5) * uAmplitude * 0.5;
        
        // Calculate distance from wave
        float dist = abs(uv.y - 0.5 - wave - wave2);
        
        // Create glow effect
        float glow = 0.02 / dist;
        
        // Color gradient
        vec3 color = vec3(0.2, 0.6, 1.0) * glow;
        color += vec3(0.8, 0.3, 1.0) * glow * 0.5;
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

class WebGLVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        
        if (!this.gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }

        this.programInfo = null;
        this.buffers = null;
        this.time = 0;
        this.amplitude = 0.1;
        this.frequency = 1.0;

        this.init();
    }

    init() {
        // Initialize shaders and program
        const shaderProgram = this.initShaderProgram(vsSource, fsSource);

        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                textureCoord: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
                time: this.gl.getUniformLocation(shaderProgram, 'uTime'),
                resolution: this.gl.getUniformLocation(shaderProgram, 'uResolution'),
                amplitude: this.gl.getUniformLocation(shaderProgram, 'uAmplitude'),
                frequency: this.gl.getUniformLocation(shaderProgram, 'uFrequency'),
            },
        };

        this.buffers = this.initBuffers();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    initBuffers() {
        const positions = [
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0,
        ];

        const textureCoordinates = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ];

        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            textureCoord: textureCoordBuffer,
        };
    }

    resize() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        }
    }

    animate() {
        this.time += 0.01;
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    draw() {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const projectionMatrix = mat4.create();
        const modelViewMatrix = mat4.create();

        // Set up attribute buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.textureCoord);
        this.gl.vertexAttribPointer(
            this.programInfo.attribLocations.textureCoord,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);

        // Use shader program
        this.gl.useProgram(this.programInfo.program);

        // Set uniforms
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );
        this.gl.uniform1f(this.programInfo.uniformLocations.time, this.time);
        this.gl.uniform2f(
            this.programInfo.uniformLocations.resolution,
            this.gl.canvas.width,
            this.gl.canvas.height
        );
        this.gl.uniform1f(this.programInfo.uniformLocations.amplitude, this.amplitude);
        this.gl.uniform1f(this.programInfo.uniformLocations.frequency, this.frequency);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    initShaderProgram(vsSource, fsSource) {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    loadShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setAmplitude(value) {
        this.amplitude = value;
    }

    setFrequency(value) {
        this.frequency = value;
    }
}

// Initialize the visualizer when the page loads
window.addEventListener('load', () => {
    const canvas = document.querySelector('#glCanvas');
    const visualizer = new WebGLVisualizer(canvas);
    window.visualizer = visualizer; // Make it accessible globally for debugging
}); 