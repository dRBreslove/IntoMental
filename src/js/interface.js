'use strict';

import csoundAzureBridge from './csound-azure-bridge.js';
import azureConfig from './config/azure-config.js';
import audioProcessor from './audio.js';

class Interface {
    constructor() {
        this.azureBridge = csoundAzureBridge;
        this.isInitialized = false;
        this.messageHistory = [];
        this.setupEventListeners();
        this.animationFrame = null;
        this.isRecording = false;
        this.knobValues = {
            bass: 50,
            treble: 50,
            volume: 50,
            balance: 50
        };
    }

    async initialize() {
        try {
            await this.azureBridge.initialize();
            this.isInitialized = true;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Failed to initialize interface:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Add event listeners for UI elements
        document.querySelectorAll('.control-knob').forEach(knob => {
            knob.addEventListener('input', (e) => this.handleKnobChange(e));
        });

        document.querySelectorAll('.effect-button').forEach(button => {
            button.addEventListener('click', (e) => this.handleEffectButtonClick(e));
        });

        // Add message input handler
        const messageInput = document.querySelector('#message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleMessageSubmit(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Transport controls
        this.playButton = document.getElementById('play');
        this.stopButton = document.getElementById('stop');
        this.recordButton = document.getElementById('record');
        
        // Parameter controls
        document.getElementById('volume').addEventListener('input', (e) => {
            audioProcessor.setVolume(parseFloat(e.target.value));
        });
        
        document.getElementById('frequency').addEventListener('input', (e) => {
            if (window.visualizer) {
                window.visualizer.setFrequency(parseFloat(e.target.value));
            }
        });
        
        document.getElementById('amplitude').addEventListener('input', (e) => {
            if (window.visualizer) {
                window.visualizer.setAmplitude(parseFloat(e.target.value));
            }
        });
        
        // File input
        document.getElementById('audioFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.handleFileSelect(file);
            }
        });

        // Slider controls
        document.querySelectorAll('.slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const label = e.target.parentElement.querySelector('label').textContent.toLowerCase();
                const value = parseFloat(e.target.value);
                this.updateAudioParameters(label, value);
            });
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handlePreset(btn.textContent));
        });
    }

    async handleKnobChange(event) {
        const { name, value } = event.target;
        const message = {
            type: 'sound_parameters',
            data: {
                parameter: name,
                value: parseFloat(value),
                timestamp: Date.now()
            }
        };
        await this.azureBridge.sendToAzure(message, 'high');
    }

    async handleEffectButtonClick(event) {
        const effectName = event.target.dataset.effect;
        const message = {
            type: 'effect_toggle',
            data: {
                effect: effectName,
                state: event.target.classList.contains('active'),
                timestamp: Date.now()
            }
        };
        await this.azureBridge.sendToAzure(message, 'normal');
    }

    async handleMessageSubmit(message) {
        if (!message.trim()) return;

        const messageData = {
            type: 'user_message',
            data: {
                content: message,
                timestamp: Date.now()
            }
        };

        await this.azureBridge.sendToAzure(messageData, 'normal');
        this.addMessageToHistory('user', message);
    }

    addMessageToHistory(role, content) {
        this.messageHistory.push({
            role,
            content,
            timestamp: Date.now()
        });

        // Keep history size manageable
        if (this.messageHistory.length > azureConfig.messageQueueSize) {
            this.messageHistory.shift();
        }

        this.updateMessageDisplay();
    }

    updateMessageDisplay() {
        const messageContainer = document.querySelector('#message-container');
        if (!messageContainer) return;

        messageContainer.innerHTML = this.messageHistory
            .map(msg => `
                <div class="message ${msg.role}">
                    <span class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    <span class="content">${msg.content}</span>
                </div>
            `)
            .join('');
    }

    updateUI() {
        // Update UI elements based on current context
        const context = this.azureBridge.getContext();
        
        // Update sound parameters
        if (context.lastSoundParameters) {
            Object.entries(context.lastSoundParameters).forEach(([param, value]) => {
                const knob = document.querySelector(`.control-knob[data-parameter="${param}"]`);
                if (knob) {
                    knob.value = value;
                }
            });
        }

        // Update project information
        if (context.currentProject) {
            const projectInfo = document.querySelector('#project-info');
            if (projectInfo) {
                projectInfo.textContent = context.currentProject.name;
            }
        }

        // Update user preferences
        if (context.userPreferences) {
            Object.entries(context.userPreferences).forEach(([pref, value]) => {
                const element = document.querySelector(`[data-preference="${pref}"]`);
                if (element) {
                    element.checked = value;
                }
            });
        }
    }

    async handlePlay() {
        await audioProcessor.init();
        audioProcessor.play();
        this.startVisualization();
    }

    handleStop() {
        audioProcessor.stop();
        this.stopVisualization();
    }

    async handleRecord() {
        if (!this.isRecording) {
            await audioProcessor.startRecording();
            this.isRecording = true;
            this.recordButton.textContent = 'Stop Recording';
            this.startVisualization();
        } else {
            audioProcessor.stopRecording();
            this.isRecording = false;
            this.recordButton.textContent = 'Record';
            this.stopVisualization();
        }
    }

    async handleFileSelect(file) {
        const success = await audioProcessor.loadAudioFile(file);
        if (success) {
            this.playButton.disabled = false;
            this.stopButton.disabled = false;
        }
    }

    startVisualization() {
        const updateVisualization = () => {
            const frequencyData = audioProcessor.getFrequencyData();
            const timeData = audioProcessor.getTimeData();
            
            if (frequencyData && timeData) {
                // Update visualization parameters based on audio data
                const amplitude = Math.max(...frequencyData) / 255;
                const frequency = Math.max(...timeData) / 255;
                
                if (window.visualizer) {
                    window.visualizer.setAmplitude(amplitude * 0.5);
                    window.visualizer.setFrequency(frequency * 2 + 0.5);
                }
            }
            
            this.animationFrame = requestAnimationFrame(updateVisualization);
        };
        
        updateVisualization();
    }

    stopVisualization() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    handlePreset(preset) {
        // Implement preset loading logic
        console.log(`Loading preset: ${preset}`);
    }

    updateAudioParameters(param, value) {
        switch(param) {
            case 'bass':
                audioProcessor.setBass(value / 100);
                break;
            case 'treble':
                audioProcessor.setTreble(value / 100);
                break;
            case 'volume':
                audioProcessor.setVolume(value / 100);
                break;
            case 'balance':
                audioProcessor.setBalance(value / 100);
                break;
        }
    }
}

// Create and export a single instance
const interfaceInstance = new Interface();
export default interfaceInstance; 