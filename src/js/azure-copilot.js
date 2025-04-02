'use strict';

class AzureCopilotAgent {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.apiKey = config.apiKey;
        this.deploymentName = config.deploymentName;
        this.maxTokens = config.maxTokens || 1000;
        this.temperature = config.temperature || 0.7;
    }

    async initialize() {
        try {
            // Initialize Azure OpenAI client
            const response = await fetch(`${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify({
                    messages: [{
                        role: 'system',
                        content: 'You are a CsoundAI assistant specialized in sound design and music composition.'
                    }],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`Azure Copilot initialization failed: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Error initializing Azure Copilot:', error);
            return false;
        }
    }

    async sendMessage(message, context = {}) {
        try {
            const response = await fetch(`${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: this.formatMessage(message, context)
                    }],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`Azure Copilot request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return this.processResponse(data);
        } catch (error) {
            console.error('Error sending message to Azure Copilot:', error);
            throw error;
        }
    }

    formatMessage(message, context) {
        // Format the message with context for better understanding
        return JSON.stringify({
            message,
            context: {
                ...context,
                timestamp: new Date().toISOString()
            }
        });
    }

    processResponse(data) {
        // Process and format the response from Azure Copilot
        if (data.choices && data.choices[0]) {
            return {
                content: data.choices[0].message.content,
                role: data.choices[0].message.role,
                timestamp: new Date().toISOString()
            };
        }
        throw new Error('Invalid response format from Azure Copilot');
    }
}

// Create and export a single instance
const azureCopilotAgent = new AzureCopilotAgent({
    endpoint: process.env.AZURE_COPILOT_ENDPOINT,
    apiKey: process.env.AZURE_COPILOT_API_KEY,
    deploymentName: process.env.AZURE_COPILOT_DEPLOYMENT_NAME
});

export default azureCopilotAgent; 