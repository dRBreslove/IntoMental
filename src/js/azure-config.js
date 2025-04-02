'use strict';

const azureConfig = {
  apiKey: process.env.AZURE_API_KEY || '',
  endpoint: process.env.AZURE_ENDPOINT || 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
  region: process.env.AZURE_REGION || 'westus',
  messageQueueSize: 100,
};

module.exports = azureConfig;
