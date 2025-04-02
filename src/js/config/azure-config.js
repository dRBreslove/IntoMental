'use strict';

const azureConfig = {
    endpoint: process.env.AZURE_COPILOT_ENDPOINT || 'https://your-azure-endpoint.openai.azure.com',
    apiKey: process.env.AZURE_COPILOT_API_KEY || 'your-api-key',
    deploymentName: process.env.AZURE_COPILOT_DEPLOYMENT_NAME || 'your-deployment-name',
    maxTokens: 1000,
    temperature: 0.7,
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
    messageQueueSize: 100,
    contextUpdateInterval: 5000, // milliseconds
    soundParameters: {
        updateFrequency: 100, // milliseconds
        maxHistorySize: 100
    },
    projectSettings: {
        autoSave: true,
        saveInterval: 30000 // milliseconds
    }
};

export default azureConfig; 