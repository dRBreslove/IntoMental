'use strict';

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.isInitialized = false;
        this.isPlaying = false;
        this.gainNode = null;
        this.frequencyData = null;
        this.timeData = null;
        this.effects = new Map();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.gainNode = this.audioContext.createGain();
            
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }

    async startRecording() {
        if (!this.isInitialized) await this.init();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.gainNode);
            this.isPlaying = true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }

    stopRecording() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        this.isPlaying = false;
    }

    async loadAudioFile(file) {
        if (!this.isInitialized) await this.init();
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            if (this.source) {
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.connect(this.gainNode);
            
            return true;
        } catch (error) {
            console.error('Error loading audio file:', error);
            return false;
        }
    }

    play() {
        if (this.source && !this.isPlaying) {
            this.source.start(0);
            this.isPlaying = true;
        }
    }

    stop() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.isPlaying = false;
            
            // Create a new source for the next playback
            const buffer = this.source.buffer;
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = buffer;
            this.source.connect(this.gainNode);
        }
    }

    getFrequencyData() {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }

    getTimeData() {
        if (this.analyser) {
            this.analyser.getByteTimeDomainData(this.timeData);
            return this.timeData;
        }
        return null;
    }

    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
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
        if (!this.effects.has(name)) {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = name === 'bass' ? 'lowshelf' : 
                         name === 'treble' ? 'highshelf' : 'mid';
            this.effects.set(name, filter);
        }
        const filter = this.effects.get(name);
        filter.gain.value = value * 40 - 20; // Convert 0-1 to -20 to +20 dB
    }
}

// Create and export a single instance
const audioProcessor = new AudioProcessor();
export default audioProcessor; 