'use strict';

class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // Create effect nodes
    this.reverbNode = this.createReverb();
    this.distortionNode = this.createDistortion();
    this.delayNode = this.createDelay();
    this.eqNode = this.createEqualizer();
    this.chorusNode = this.createChorus();
    this.flangerNode = this.createFlanger();
    this.compressorNode = this.createCompressor();
    this.phaserNode = this.createPhaser();
    this.tremoloNode = this.createTremolo();
    this.bitcrusherNode = this.createBitcrusher();

    // Connect nodes in a chain
    this.masterGain.connect(this.bitcrusherNode);
    this.bitcrusherNode.connect(this.phaserNode);
    this.phaserNode.connect(this.chorusNode);
    this.chorusNode.connect(this.flangerNode);
    this.flangerNode.connect(this.tremoloNode);
    this.tremoloNode.connect(this.reverbNode);
    this.reverbNode.connect(this.distortionNode);
    this.distortionNode.connect(this.delayNode);
    this.delayNode.connect(this.compressorNode);
    this.compressorNode.connect(this.eqNode);
    this.eqNode.connect(this.audioContext.destination);

    // Initialize parameters
    this.parameters = {
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
      bitcrush: 0.3,
    };
  }

  createReverb() {
    const convolver = this.audioContext.createConvolver();
    const reverbGain = this.audioContext.createGain();
    convolver.connect(reverbGain);
    return reverbGain;
  }

  createDistortion() {
    const distortion = this.audioContext.createWaveShaper();
    const distortionGain = this.audioContext.createGain();
    distortion.connect(distortionGain);
    return distortionGain;
  }

  createDelay() {
    const delay = this.audioContext.createDelay();
    const feedback = this.audioContext.createGain();
    const delayGain = this.audioContext.createGain();

    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayGain);

    return delayGain;
  }

  createEqualizer() {
    const eq = this.audioContext.createBiquadFilter();
    eq.type = 'peaking';
    eq.frequency.value = 1000;
    eq.Q.value = 1;
    return eq;
  }

  createChorus() {
    const chorus = this.audioContext.createGain();
    const delay = this.audioContext.createDelay();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // Set up LFO for modulation
    lfo.frequency.value = 1.5;
    lfoGain.gain.value = 0.002;

    // Connect nodes
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    delay.connect(chorus);

    // Start LFO
    lfo.start();

    return chorus;
  }

  createFlanger() {
    const flanger = this.audioContext.createGain();
    const delay = this.audioContext.createDelay();
    const feedback = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // Set up LFO for modulation
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 0.005;

    // Set up feedback
    feedback.gain.value = 0.5;

    // Connect nodes
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(flanger);

    // Start LFO
    lfo.start();

    return flanger;
  }

  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  createPhaser() {
    const phaser = this.audioContext.createGain();
    const allpassFilters = [];
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // Create 4 allpass filters
    for (let i = 0; i < 4; i += 1) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = 350;
      allpassFilters.push(filter);
    }

    // Set up LFO for modulation
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 1000;

    // Connect filters in series
    let lastNode = this.audioContext.createGain();
    allpassFilters.forEach((filter) => {
      lastNode.connect(filter);
      lastNode = filter;
    });
    lastNode.connect(phaser);

    // Connect LFO to filter frequencies
    lfo.connect(lfoGain);
    allpassFilters.forEach((filter) => {
      lfoGain.connect(filter.frequency);
    });

    // Start LFO
    lfo.start();

    return phaser;
  }

  createTremolo() {
    const tremolo = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // Set up LFO for modulation
    lfo.frequency.value = 5; // 5 Hz tremolo rate
    lfoGain.gain.value = 0.5;

    // Connect nodes
    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);

    // Start LFO
    lfo.start();

    return tremolo;
  }

  createBitcrusher() {
    const bitcrusher = this.audioContext.createScriptProcessor(4096, 1, 1);
    const bits = 16;

    bitcrusher.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);

      for (let i = 0; i < input.length; i += 1) {
        const step = (1 / 2) ** bits;
        output[i] = step * Math.floor(input[i] / step + 0.5);
      }
    };

    return bitcrusher;
  }

  setVolume(value) {
    this.parameters.volume = value;
    this.masterGain.gain.value = value;
  }

  setBass(value) {
    this.parameters.bass = value;
    this.eqNode.frequency.value = 100;
    this.eqNode.gain.value = (value - 0.5) * 20;
  }

  setTreble(value) {
    this.parameters.treble = value;
    this.eqNode.frequency.value = 5000;
    this.eqNode.gain.value = (value - 0.5) * 20;
  }

  setReverb(value) {
    this.parameters.reverb = value;
    this.reverbNode.gain.value = value;
  }

  setDistortion(value) {
    this.parameters.distortion = value;
    this.distortionNode.gain.value = value * 2;
  }

  setDelay(value) {
    this.parameters.delay = value;
    this.delayNode.gain.value = value;
  }

  setBalance(value) {
    this.parameters.balance = value;
    // Implement stereo panning
    const pan = (value - 0.5) * 2;
    this.masterGain.gain.value = this.parameters.volume * (1 - Math.abs(pan));
  }

  setChorus(value) {
    this.parameters.chorus = value;
    this.chorusNode.gain.value = value;
  }

  setFlanger(value) {
    this.parameters.flanger = value;
    this.flangerNode.gain.value = value;
  }

  setCompression(value) {
    this.parameters.compression = value;
    this.compressorNode.threshold.value = -24 + (value * 24); // Range from -24 to 0 dB
  }

  setPhaser(value) {
    this.parameters.phaser = value;
    this.phaserNode.gain.value = value;
  }

  setTremolo(value) {
    this.parameters.tremolo = value;
    this.tremoloNode.gain.value = value;
  }

  setBitcrush(value) {
    this.parameters.bitcrush = value;
    // Adjust bit depth based on value (16 to 1 bits)
    const bits = Math.max(1, Math.floor(16 * (1 - value)));
    this.bitcrusherNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      const step = (1 / 2) ** bits;

      for (let i = 0; i < input.length; i += 1) {
        output[i] = step * Math.floor(input[i] / step + 0.5);
      }
    };
  }

  setEqualizer(params) {
    if (params.bass !== undefined) {
      this.setBass(params.bass);
    }
    if (params.treble !== undefined) {
      this.setTreble(params.treble);
    }
  }

  // Audio analysis methods
  getFrequencyData() {
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getTimeDomainData() {
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // Audio file handling
  async loadAudioFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  playAudioBuffer(buffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(0);
    return source;
  }
}

// Export singleton instance
const audioManager = new AudioManager();
module.exports = audioManager;
