// Default settings
const DEFAULT_SETTINGS = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4',
  maxTokens: '1000',
  temperature: '0.7',
  // Whisper settings
  whisperLanguage: 'en',
  whisperModel: 'whisper-1',
  whisperResponseFormat: 'json',
  whisperPrompt: '',
  whisperTemperature: '0'
};

// Presets for different providers
const PRESETS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4'
  },
  azure: {
    baseUrl: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
    model: 'gpt-4'
  },
  local: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama2'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-haiku-20240307'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    document.getElementById('baseUrl').value = settings.baseUrl || DEFAULT_SETTINGS.baseUrl;
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('model').value = settings.model || DEFAULT_SETTINGS.model;
    document.getElementById('maxTokens').value = settings.maxTokens || DEFAULT_SETTINGS.maxTokens;
    document.getElementById('temperature').value = settings.temperature || DEFAULT_SETTINGS.temperature;
    
    // Load Whisper settings
    document.getElementById('whisperLanguage').value = settings.whisperLanguage || DEFAULT_SETTINGS.whisperLanguage;
    document.getElementById('whisperModel').value = settings.whisperModel || DEFAULT_SETTINGS.whisperModel;
    document.getElementById('whisperResponseFormat').value = settings.whisperResponseFormat || DEFAULT_SETTINGS.whisperResponseFormat;
    document.getElementById('whisperPrompt').value = settings.whisperPrompt || DEFAULT_SETTINGS.whisperPrompt;
    document.getElementById('whisperTemperature').value = settings.whisperTemperature || DEFAULT_SETTINGS.whisperTemperature;
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

function setupEventListeners() {
  // Form submission
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings();
  });

  // Test connection
  document.getElementById('test-connection').addEventListener('click', async () => {
    await testConnection();
  });

  // Reset settings
  document.getElementById('reset-settings').addEventListener('click', async () => {
    await resetSettings();
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.preset];
      if (preset) {
        document.getElementById('baseUrl').value = preset.baseUrl;
        document.getElementById('model').value = preset.model;
      }
    });
  });
}

async function saveSettings() {
  try {
    const settings = {
      baseUrl: document.getElementById('baseUrl').value.trim(),
      apiKey: document.getElementById('apiKey').value.trim(),
      model: document.getElementById('model').value.trim(),
      maxTokens: document.getElementById('maxTokens').value.trim(),
      temperature: document.getElementById('temperature').value,
      // Include Whisper settings
      whisperLanguage: document.getElementById('whisperLanguage').value,
      whisperModel: document.getElementById('whisperModel').value,
      whisperResponseFormat: document.getElementById('whisperResponseFormat').value,
      whisperPrompt: document.getElementById('whisperPrompt').value.trim(),
      whisperTemperature: document.getElementById('whisperTemperature').value
    };

    // Validate required fields
    if (!settings.baseUrl) {
      showStatus('Base URL is required', 'error');
      return;
    }

    if (!settings.apiKey) {
      showStatus('API Key is required', 'error');
      return;
    }

    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

async function testConnection() {
  try {
    showStatus('Testing connection...', 'success');
    
    const baseUrl = document.getElementById('baseUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('model').value.trim();

    if (!baseUrl || !apiKey) {
      showStatus('Please fill in Base URL and API Key before testing', 'error');
      return;
    }

    // Send test request to background script
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_CONNECTION',
      data: { baseUrl, apiKey, model }
    });

    if (response.success) {
      showStatus('Connection successful! ✅', 'success');
    } else {
      showStatus('Connection failed: ' + response.error, 'error');
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    showStatus('Error testing connection: ' + error.message, 'error');
  }
}

async function resetSettings() {
  try {
    await chrome.storage.sync.clear();
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
  } catch (error) {
    console.error('Error resetting settings:', error);
    showStatus('Error resetting settings: ' + error.message, 'error');
  }
}

async function requestMicrophoneAccess() {
  try {
    showStatus('Requesting microphone access...', 'success');
    
    // Send message to background script to create offscreen document and request permissions
    const response = await chrome.runtime.sendMessage({
      type: 'REQUEST_MICROPHONE_PERMISSION'
    });

    if (response && response.success) {
      showStatus('✅ Microphone access granted! Voice input is now available.', 'success');
    } else {
      const errorMessage = response?.error || 'Permission request failed';
      if (errorMessage.includes('denied') || errorMessage.includes('NotAllowedError')) {
        showStatus('❌ Microphone access denied. Please check your browser settings and try again.', 'error');
      } else if (errorMessage.includes('NotFoundError')) {
        showStatus('❌ No microphone found. Please connect a microphone and try again.', 'error');
      } else {
        showStatus('❌ ' + errorMessage, 'error');
      }
    }
  } catch (error) {
    console.error('Error requesting microphone access:', error);
    showStatus('❌ Error requesting microphone access: ' + error.message, 'error');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}