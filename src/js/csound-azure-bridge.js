'use strict';

const azureCopilotAgent = require('./azure-copilot');

class CsoundAzureBridge {
  constructor() {
    this.azureAgent = azureCopilotAgent;
    this.messageQueue = [];
    this.isProcessing = false;
    this.context = {
      lastSoundParameters: null,
      currentProject: null,
      userPreferences: null,
    };
    this.isInitialized = false;
    this.config = null;
  }

  async initialize(config) {
    if (!config || !config.apiKey) {
      throw new Error('Azure configuration is required');
    }
    this.config = config;
    this.isInitialized = true;
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

    try {
      const messages = this.messageQueue.splice(0);
      const processPromises = messages.map(async ({ message, priority }) => {
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
      });

      await Promise.all(processPromises);
    } catch (error) {
      console.error('Error in message processing:', error);
    } finally {
      this.isProcessing = false;
      // Schedule next processing cycle
      setTimeout(() => this.startMessageProcessing(), 100);
    }
  }

  async handleAzureResponse(response) {
    try {
      const { content } = response;

      // Parse the response content
      const parsedContent = JSON.parse(content);

      // Update context with new information
      this.updateContext(parsedContent);

      // Handle different types of responses
      await this.processMessage(parsedContent);
    } catch (error) {
      console.error('Error handling Azure response:', error);
    }
  }

  updateContext(newData) {
    this.context = {
      ...this.context,
      ...newData,
      lastUpdate: new Date().toISOString(),
    };
  }

  async processMessage(message) {
    if (!message || typeof message !== 'object') {
      console.error('Invalid message format:', message);

      return;
    }

    const { type, data } = message;

    if (!type || !data) {
      console.error('Message missing required fields:', message);

      return;
    }

    try {
      switch (type) {
        case 'sound_parameters':
          await this.handleSoundParameters(data);
          break;
        case 'project_update':
          await this.handleProjectUpdate(data);
          break;
        case 'preference_update':
          await this.handlePreferenceUpdate(data);
          break;
        case 'user_message':
          await this.handleUserMessage(data);
          break;
        default:
          console.warn('Unknown message type:', type);
      }
    } catch (error) {
      console.error(`Error processing message of type ${type}:`, error);
    }
  }

  async handleSoundParameters(parameters) {
    if (!parameters || typeof parameters !== 'object') {
      console.error('Invalid sound parameters:', parameters);

      return;
    }
    // Update sound parameters in the context
    this.context.lastSoundParameters = parameters;
    // Trigger any necessary UI updates or sound processing
  }

  async handleProjectUpdate(projectData) {
    if (!projectData || typeof projectData !== 'object') {
      console.error('Invalid project data:', projectData);

      return;
    }
    // Update current project information
    this.context.currentProject = projectData;
    // Trigger project-related updates
  }

  async handlePreferenceUpdate(preferences) {
    if (!preferences || typeof preferences !== 'object') {
      console.error('Invalid preferences:', preferences);

      return;
    }
    // Update user preferences
    this.context.userPreferences = {
      ...this.context.userPreferences,
      ...preferences,
    };
    // Apply preference changes to the system
  }

  async handleUserMessage(message) {
    if (!message || typeof message !== 'object') {
      console.error('Invalid user message:', message);
    }
    // Handle user message - currently a stub
  }

  getContext() {
    return { ...this.context };
  }

  async sendMessageToAzure(message) {
    try {
      const { content, timestamp } = message;
      const formattedMessage = {
        type: 'message',
        data: {
          content,
          timestamp: timestamp || Date.now(),
        },
      };
      await this.sendToAzure(formattedMessage, 'normal');

      return true;
    } catch (error) {
      console.error('Error sending message to Azure:', error);

      return false;
    }
  }

  formatMessage(content, timestamp) {
    return {
      type: 'message',
      data: {
        content,
        timestamp: timestamp || Date.now(),
      },
    };
  }

  async processResponse(response) {
    try {
      const { type, data } = JSON.parse(response.content);
      await this.processMessage({ type, data });

      return true;
    } catch (error) {
      console.error('Error processing response:', error);

      return false;
    }
  }
}

const csoundAzureBridge = new CsoundAzureBridge();
module.exports = csoundAzureBridge;
