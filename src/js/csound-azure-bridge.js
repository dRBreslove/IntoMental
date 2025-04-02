'use strict';

import azureCopilotAgent from './azure-copilot.js';

class CsoundAzureBridge {
    constructor() {
        this.azureAgent = azureCopilotAgent;
        this.messageQueue = [];
        this.isProcessing = false;
        this.context = {
            lastSoundParameters: null,
            currentProject: null,
            userPreferences: {}
        };
    }

    async initialize() {
        try {
            await this.azureAgent.initialize();
            this.startMessageProcessing();
            return true;
        } catch (error) {
            console.error('Failed to initialize CsoundAzureBridge:', error);
            return false;
        }
    }

    async sendToAzure(message, priority = 'normal') {
        this.messageQueue.push({ message, priority, timestamp: Date.now() });
        this.messageQueue.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            return a.timestamp - b.timestamp;
        });
    }

    async startMessageProcessing() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.messageQueue.length > 0) {
            const { message, priority } = this.messageQueue.shift();
            try {
                const response = await this.azureAgent.sendMessage(message, this.context);
                await this.handleAzureResponse(response);
            } catch (error) {
                console.error('Error processing message:', error);
                // Retry high priority messages
                if (priority === 'high') {
                    this.messageQueue.unshift({ message, priority, timestamp: Date.now() });
                }
            }
        }

        this.isProcessing = false;
        // Schedule next processing cycle
        setTimeout(() => this.startMessageProcessing(), 100);
    }

    async handleAzureResponse(response) {
        try {
            const { content, role } = response;
            
            // Parse the response content
            const parsedContent = JSON.parse(content);
            
            // Update context with new information
            this.updateContext(parsedContent);
            
            // Handle different types of responses
            switch (parsedContent.type) {
                case 'sound_parameters':
                    await this.handleSoundParameters(parsedContent.data);
                    break;
                case 'project_update':
                    await this.handleProjectUpdate(parsedContent.data);
                    break;
                case 'preference_update':
                    await this.handlePreferenceUpdate(parsedContent.data);
                    break;
                default:
                    console.log('Received unknown response type:', parsedContent.type);
            }
        } catch (error) {
            console.error('Error handling Azure response:', error);
        }
    }

    updateContext(newData) {
        this.context = {
            ...this.context,
            ...newData,
            lastUpdate: new Date().toISOString()
        };
    }

    async handleSoundParameters(parameters) {
        // Update sound parameters in the context
        this.context.lastSoundParameters = parameters;
        // Trigger any necessary UI updates or sound processing
        // This would integrate with your existing audio processing system
    }

    async handleProjectUpdate(projectData) {
        // Update current project information
        this.context.currentProject = projectData;
        // Trigger project-related updates
    }

    async handlePreferenceUpdate(preferences) {
        // Update user preferences
        this.context.userPreferences = {
            ...this.context.userPreferences,
            ...preferences
        };
        // Apply preference changes to the system
    }

    getContext() {
        return { ...this.context };
    }
}

// Create and export a single instance
const csoundAzureBridge = new CsoundAzureBridge();
export default csoundAzureBridge; 