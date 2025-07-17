// Side panel script for VOIX extension - matching original functionality
console.log("VOIX sidepanel script loaded");

class VOIXSidePanel {
  constructor() {
    this.messages = [];
    this.currentTabId = null;
    this.isConnected = false;
    this.thinkModeEnabled = false;
    this.lastToolsSnapshot = null;
    
    // Voice input properties
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.voiceInputSupported = false;
    
    // Live voice mode properties
    this.liveVoiceMode = false;
    this.vadInstance = null;
    this.liveVoiceStream = null;
    this.vadSupported = false;

    // Element storage for efficient updates
    this.toolElements = {};
    this.contextElements = {};
    
    this.init();
  }

  async init() {
    console.log('VOIX Side Panel initializing...');
    
    // Initialize voice input
    this.initVoiceInput();
    
    // Initialize live voice mode
    this.initLiveVoiceMode();
    
    // Get the current active tab
    await this.getCurrentTab();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up communication with content script
    this.setupContentScriptCommunication();
    
    // Listen for tab changes
    this.setupTabChangeListener();
    
    // Show initial state and load initial data
    this.show();
    
    // Load initial tools data
    this.updateToolsOverview();
    
    // Set up toolbar button actions
    this.setupToolbar();
    
    console.log('VOIX Side Panel initialized');
  }

  initLiveVoiceMode() {
    // Check if VAD is available
    if (typeof vad !== 'undefined' && vad.MicVAD) {
      this.vadSupported = true;
      console.log('Silero VAD initialized successfully');
    } else {
      this.vadSupported = false;
      console.log('Silero VAD not available, checking Web Speech API fallback...');
      
      // Check for Web Speech API as fallback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        this.vadSupported = true; // Use Web Speech API as fallback
        console.log('Web Speech API available as fallback for live voice mode');
      } else {
        console.log('No voice recognition support available');
      }
    }
  }

  initVoiceInput() {
    // Voice input is supported via permissions tab
    this.voiceInputSupported = true;
    console.log('Voice input initialized successfully with permissions tab approach');
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTabId = tab.id;
      console.log('Current tab ID:', this.currentTabId);
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  setupEventListeners() {
    console.log('Setting up event listeners for VOIX Side Panel');
    
    // Send message
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    const thinkToggleBtn = document.getElementById('think-toggle-btn');
    const resetBtn = document.getElementById('chat-reset-btn');
    const voiceBtn = document.getElementById('voice-input-btn');
    const liveVoiceBtn = document.getElementById('live-voice-btn');
    
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Think toggle functionality
    thinkToggleBtn.addEventListener('click', () => {
      this.thinkModeEnabled = !this.thinkModeEnabled;
      thinkToggleBtn.classList.toggle('active', this.thinkModeEnabled);
      thinkToggleBtn.title = this.thinkModeEnabled ? 'Thinking mode ON' : 'Thinking mode OFF';
    });

    // Live voice mode functionality
    if (liveVoiceBtn) {
      liveVoiceBtn.addEventListener('click', () => this.toggleLiveVoiceMode());
    }

    // Voice input functionality
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetChat();
      });
    }
    
    // Update voice button states based on support
    this.updateVoiceUI();
    this.updateLiveVoiceUI();
  }

  setupToolbar() {
    // Options button opens the options page
    const optionsBtn = document.getElementById('toolbar-options-btn');
    if (optionsBtn) {
      optionsBtn.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          chrome.tabs.create({ url: 'options.html' });
        }
      });
    }
    // Reset Context button resets chat context and refreshes tools/context
    const resetContextBtn = document.getElementById('toolbar-reset-context-btn');
    if (resetContextBtn) {
      resetContextBtn.addEventListener('click', async () => {
        // Optionally send a message to background/content script to reset context
        chrome.runtime.sendMessage({ type: 'RESET_CONTEXT' }, () => {
          this.resetChat();
          this.updateToolsOverview();
        });
      });
    }
  }

  async toggleLiveVoiceMode() {
    if (!this.vadSupported) {
      this.showLiveVoiceStatus('⚠️ Live voice mode not supported', 'error');
      setTimeout(() => this.hideLiveVoiceStatus(), 3000);
      return;
    }

    if (this.liveVoiceMode) {
      // Stop live voice mode
      await this.stopLiveVoiceMode();
    } else {
      // Start live voice mode
      await this.startLiveVoiceMode();
    }
  }

  async startLiveVoiceMode() {
    try {
      console.log('Starting live voice mode...');
      
      // Check if Silero VAD is available first
      if (typeof vad !== 'undefined' && vad.MicVAD) {
        console.log('Attempting to use Silero VAD...');
        
        // Request microphone permission
        this.liveVoiceStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        // Try to initialize VAD
        try {
          this.vadInstance = await vad.MicVAD.new({
            stream: this.liveVoiceStream,
            onSpeechStart: () => {
              console.log('Speech start detected');
              this.updateLiveVoiceUI('listening');
              this.showLiveVoiceStatus('🎤 Listening...', 'listening');
            },
            onSpeechEnd: async (audio) => {
              console.log('Speech end detected, processing audio...');
              this.updateLiveVoiceUI('active');
              this.showLiveVoiceStatus('🔄 Processing...', 'active');
              
              // Convert Float32Array to audio blob and transcribe
              await this.processVADAudio(audio);
            },
            onVADMisfire: () => {
              console.log('VAD misfire detected');
              this.updateLiveVoiceUI('active');
              this.showLiveVoiceStatus('🎯 Live voice mode active', 'active');
            }
          });

          // Start VAD
          this.vadInstance.start();
          this.liveVoiceMode = true;
          this.updateLiveVoiceUI('active');
          this.showLiveVoiceStatus('🎯 Live voice mode active (VAD)', 'active');
          
          console.log('Live voice mode started successfully with Silero VAD');
          return;
          
        } catch (vadError) {
          console.warn('Silero VAD initialization failed, falling back to Web Speech API:', vadError);
          
          // Clean up stream if VAD failed
          if (this.liveVoiceStream) {
            this.liveVoiceStream.getTracks().forEach(track => track.stop());
            this.liveVoiceStream = null;
          }
        }
      }
      
      // Fallback to Web Speech API
      console.log('Using Web Speech API fallback for live voice mode...');
      await this.startWebSpeechLiveMode();

    } catch (error) {
      console.error('Error starting live voice mode:', error);
      this.liveVoiceMode = false;
      this.updateLiveVoiceUI();
      
      if (error.name === 'NotAllowedError') {
        this.showLiveVoiceStatus('🔓 Microphone permission denied', 'error');
        chrome.runtime.sendMessage({ type: 'REQUEST_MICROPHONE_PERMISSION' });
      } else {
        let errorMessage = '⚠️ Live voice mode error';
        if (error.name === 'NotFoundError') {
          errorMessage = '⚠️ No microphone found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '⚠️ Microphone in use by another app';
        }
        
        this.showLiveVoiceStatus(errorMessage, 'error');
      }
      
      setTimeout(() => this.hideLiveVoiceStatus(), 3000);
    }
  }

  async startWebSpeechLiveMode() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported');
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = 'en-US';

    this.speechRecognition.onstart = () => {
      console.log('Web Speech API started');
      this.liveVoiceMode = true;
      this.updateLiveVoiceUI('active');
      this.showLiveVoiceStatus('🎯 Live voice mode active (Web Speech)', 'active');
    };

    this.speechRecognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        console.log('Speech recognized:', transcript);
        
        if (transcript.length > 0) {
          this.showLiveVoiceStatus('🔄 Processing...', 'active');
          this.sendAutoMessage(transcript);
          this.showLiveVoiceStatus('✓ Message sent', 'active');
          
          // Reset status after 2 seconds
          setTimeout(() => {
            if (this.liveVoiceMode) {
              this.showLiveVoiceStatus('🎯 Live voice mode active (Web Speech)', 'active');
            }
          }, 2000);
        }
      }
    };

    this.speechRecognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        this.showLiveVoiceStatus('🔓 Microphone permission denied', 'error');
        chrome.runtime.sendMessage({ type: 'REQUEST_MICROPHONE_PERMISSION' });
      } else if (event.error === 'no-speech') {
        // This is normal, just continue listening
        console.log('No speech detected, continuing...');
      } else {
        this.showLiveVoiceStatus('⚠️ Speech recognition error', 'error');
      }
    };

    this.speechRecognition.onend = () => {
      console.log('Speech recognition ended');
      // Restart if live voice mode is still active
      if (this.liveVoiceMode) {
        try {
          this.speechRecognition.start();
        } catch (error) {
          console.error('Error restarting speech recognition:', error);
        }
      }
    };

    // Start recognition
    this.speechRecognition.start();
  }

  async stopLiveVoiceMode() {
    try {
      console.log('Stopping live voice mode...');
      
      // Stop Silero VAD if active
      if (this.vadInstance) {
        this.vadInstance.pause();
        this.vadInstance = null;
      }
      
      // Stop microphone stream if active
      if (this.liveVoiceStream) {
        this.liveVoiceStream.getTracks().forEach(track => track.stop());
        this.liveVoiceStream = null;
      }
      
      // Stop Web Speech API if active
      if (this.speechRecognition) {
        this.speechRecognition.stop();
        this.speechRecognition = null;
      }
      
      this.liveVoiceMode = false;
      this.updateLiveVoiceUI();
      this.hideLiveVoiceStatus();
      
      console.log('Live voice mode stopped');
      
    } catch (error) {
      console.error('Error stopping live voice mode:', error);
    }
  }

  async processVADAudio(audioFloat32Array) {
    try {
      // Convert Float32Array to WAV blob
      const audioBlob = this.float32ArrayToWavBlob(audioFloat32Array, 16000);
      
      // Convert blob to base64 for transmission
      const base64AudioData = await this.blobToBase64(audioBlob);
      
      // Send to OpenAI Whisper API via background script
      chrome.runtime.sendMessage({
        type: 'WHISPER_TRANSCRIBE',
        data: {
          audioBlob: base64AudioData
        }
      }, (response) => {
        if (response && response.success && response.text) {
          const transcription = response.text.trim();
          
          if (transcription.length > 0) {
            // Automatically send the transcribed text as a chat message
            this.sendAutoMessage(transcription);
            this.showLiveVoiceStatus('✓ Message sent', 'active');
          } else {
            this.showLiveVoiceStatus('🎯 Live voice mode active', 'active');
          }
        } else {
          console.error('Whisper transcription failed:', response?.error);
          this.showLiveVoiceStatus('⚠️ Transcription failed', 'active');
        }
        
        // Hide status after 2 seconds, but keep live voice mode active
        setTimeout(() => {
          if (this.liveVoiceMode) {
            this.showLiveVoiceStatus('🎯 Live voice mode active', 'active');
          }
        }, 2000);
      });

    } catch (error) {
      console.error('Error processing VAD audio:', error);
      this.showLiveVoiceStatus('⚠️ Processing failed', 'active');
      setTimeout(() => {
        if (this.liveVoiceMode) {
          this.showLiveVoiceStatus('🎯 Live voice mode active', 'active');
        }
      }, 2000);
    }
  }

  float32ArrayToWavBlob(float32Array, sampleRate) {
    // Convert Float32Array to 16-bit PCM
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample * 0x7FFF;
    }

    // Create WAV header
    const length = int16Array.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Copy audio data
    const offset = 44;
    for (let i = 0; i < length; i++) {
      view.setInt16(offset + i * 2, int16Array[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  sendAutoMessage(message) {
    const messageWithThinkMode = this.thinkModeEnabled ? `${message} /think` : `${message} /no_think`;
    this.addMessage('user', message);
    
    // Send the user message; LLM logic will fetch tools/context
    chrome.runtime.sendMessage({
      type: 'LLM_REQUEST',
      data: { role: 'user', content: messageWithThinkMode }
    }, (response) => {
      if (response?.role === 'assistant') {
        this.addMessage('assistant', response.content);
      } else if (response?.content) {
        this.addMessage('assistant', response.content);
      } else {
        this.addMessage('assistant', 'Sorry, there was an error processing your request.');
      }
    });
  }

  updateLiveVoiceUI(state = null) {
    const liveVoiceBtn = document.getElementById('live-voice-btn');
    if (!liveVoiceBtn) return;

    // Remove all state classes
    liveVoiceBtn.classList.remove('active', 'listening', 'disabled');

    if (!this.vadSupported) {
      liveVoiceBtn.classList.add('disabled');
      liveVoiceBtn.title = 'Live voice mode not supported';
    } else if (this.liveVoiceMode) {
      if (state === 'listening') {
        liveVoiceBtn.classList.add('listening');
        liveVoiceBtn.title = 'Live voice mode - Listening for speech';
      } else {
        liveVoiceBtn.classList.add('active');
        liveVoiceBtn.title = 'Live voice mode ON - Click to stop';
      }
    } else {
      liveVoiceBtn.title = 'Click to start live voice mode';
    }
  }

  showLiveVoiceStatus(message, type = 'active') {
    const liveVoiceBtn = document.getElementById('live-voice-btn');
    if (!liveVoiceBtn) return;

    // Remove existing status indicator
    let statusEl = liveVoiceBtn.querySelector('.live-voice-status');
    if (statusEl) {
      statusEl.remove();
    }

    // Create new status indicator
    statusEl = document.createElement('div');
    statusEl.className = `live-voice-status ${type}`;
    statusEl.textContent = message;
    liveVoiceBtn.appendChild(statusEl);

    // Show with animation
    setTimeout(() => {
      statusEl.classList.add('visible');
    }, 10);
  }

  hideLiveVoiceStatus() {
    const liveVoiceBtn = document.getElementById('live-voice-btn');
    if (!liveVoiceBtn) return;

    const statusEl = liveVoiceBtn.querySelector('.live-voice-status');
    if (statusEl) {
      statusEl.classList.remove('visible');
      setTimeout(() => {
        statusEl.remove();
      }, 200);
    }
  }

  async toggleVoiceInput() {
    if (!this.voiceInputSupported) {
      setTimeout(() => this.hideVoiceStatus(), 3000);
      return;
    }

    if (this.isRecording) {
      // Stop recording
      this.stopRecording();
    } else {
      // Start recording
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      // Try to access microphone directly first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio with OpenAI Whisper
        await this.processAudioWithWhisper(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        this.isRecording = false;
        this.updateVoiceUI();
        setTimeout(() => this.hideVoiceStatus(), 3000);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.updateVoiceUI();

    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      this.updateVoiceUI();
      
      // If permission was denied, open permissions tab
      if (error.name === 'NotAllowedError') {
        chrome.runtime.sendMessage({ type: 'REQUEST_MICROPHONE_PERMISSION' });
        setTimeout(() => this.hideVoiceStatus(), 3000);
      } else {
        let errorMessage = '⚠️ Voice input error';
        if (error.name === 'NotFoundError') {
          errorMessage = '⚠️ No microphone found';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '⚠️ Microphone in use by another app';
        }
        
        setTimeout(() => this.hideVoiceStatus(), 3000);
      }
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.updateVoiceUI();
    }
  }

  async processAudioWithWhisper(audioBlob) {
    try {
      // Convert blob to base64 for transmission
      const base64AudioData = await this.blobToBase64(audioBlob);
      
      // Send to OpenAI Whisper API via background script
      chrome.runtime.sendMessage({
        type: 'WHISPER_TRANSCRIBE',
        data: {
          audioBlob: base64AudioData
        }
      }, (response) => {
        if (response && response.success && response.text) {
          // Update input field with transcribed text
          const input = document.getElementById('chat-input');
          input.value = response.text;
          input.focus();
          
          setTimeout(() => this.hideVoiceStatus(), 2000);
        } else {
          console.error('Whisper transcription failed:', response?.error);
          setTimeout(() => this.hideVoiceStatus(), 3000);
        }
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      setTimeout(() => this.hideVoiceStatus(), 3000);
    }
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  updateVoiceUI() {
    const voiceBtn = document.getElementById('voice-input-btn');
    if (!voiceBtn) return;

    // Remove all state classes
    voiceBtn.classList.remove('recording', 'disabled');

    if (!this.voiceInputSupported) {
      voiceBtn.classList.add('disabled');
      voiceBtn.title = 'Voice input not supported in this browser';
    } else if (this.isRecording) {
      voiceBtn.classList.add('recording');
      voiceBtn.title = 'Click to stop recording';
    } else {
      voiceBtn.title = 'Click to start voice input';
    }
  }

  showVoiceStatus(message, type = 'recording') {
    const voiceBtn = document.getElementById('voice-input-btn');
    if (!voiceBtn) return;

    // Remove existing status indicator
    let statusEl = voiceBtn.querySelector('.voice-status');
    if (statusEl) {
      statusEl.remove();
    }

    // Create new status indicator
    statusEl = document.createElement('div');
    statusEl.className = `voice-status ${type}`;
    statusEl.textContent = message;
    voiceBtn.appendChild(statusEl);

    // Show with animation
    setTimeout(() => {
      statusEl.classList.add('visible');
    }, 10);
  }

  hideVoiceStatus() {
    const voiceBtn = document.getElementById('voice-input-btn');
    if (!voiceBtn) return;

    const statusEl = voiceBtn.querySelector('.voice-status');
    if (statusEl) {
      statusEl.classList.remove('visible');
      setTimeout(() => {
        statusEl.remove();
      }, 200);
    }
  }

  setupContentScriptCommunication() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PAGE_DATA_UPDATED') {
        console.log('📡 Sidepanel received PAGE_DATA_UPDATED event, updating tools overview');
        this.updateToolsOverview();
      } else if (message.type === 'MCP_CALL_TOOL') {
        // Display a system message for tool execution
        console.log('📡 Sidepanel received tool call:', message);
        this.addMessage('system', `**🔧 Tool executed:** \`${message.toolName || 'unknown'}\``);
      } else {
        console.warn('📡 Sidepanel received unknown message type:', message.type);
      }
    });
  }

  setupTabChangeListener() {
    // Listen for tab activation changes
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      this.currentTabId = activeInfo.tabId;
      await this.updateToolsOverview();
    });
  }

  show() {
    console.log('Showing side panel');
    this.updateToolsOverview();
    this.showExamplesSection();
    
    // Add welcome message if no messages exist
    const messagesContainer = document.getElementById('chat-messages');
    const existingMessages = messagesContainer.querySelectorAll('.chat-message');
    if (existingMessages.length === 0) {
      this.addMessage('assistant', 
        'Hello! How can I help you today? I can see the tools and resources available on this page - just ask me to interact with them or help with any task.');
    }
    
    // Focus input
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 100);
  }

  async refreshPageData() {
    if (!this.currentTabId) return;
    try {
      const response = await chrome.tabs.sendMessage(this.currentTabId, { type: 'GET_PAGE_DATA' });
      if (response && response.success) {
        this.updateToolsOverview();
        this.updateToolsList();
      }
    } catch (error) {
      console.error('Error refreshing page data:', error);
    }
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    const messageWithThinkMode = this.thinkModeEnabled ? `${message} /think` : `${message} /no_think`;
    this.addMessage('user', message);
    input.value = '';
    // Only send the user message; LLM logic will fetch tools/context
    chrome.runtime.sendMessage({
      type: 'LLM_REQUEST',
      data: { role: 'user', content: messageWithThinkMode }
    }, (response) => {
      if (response?.role === 'assistant') {
        this.addMessage('assistant', response.content);
      } else if (response?.content) {
        this.addMessage('assistant', response.content);
      } else {
        this.addMessage('assistant', 'Sorry, there was an error processing your request.');
      }
    });
  }

  async getToolsAndContext() {
    if (!this.currentTabId) return { tools: [], context: [] };
    try {
      const response = await chrome.tabs.sendMessage(this.currentTabId, { type: 'GET_PAGE_DATA' });
      if (response && response.success) {
        return {
          tools: response.tools || [],
          context: response.context || []
        };
      }
    } catch (error) {
      console.error('Error getting tools/context:', error);
    }
    return { tools: [], context: [] };
  }

  addMessage(sender, text) {
    // if text is empty, do not add a message
    if (!text || text.trim() === '') return;
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}`;
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    
    // Markdown rendering with sanitization
    if (window.marked && window.DOMPurify) {
      const html = window.marked.parse(text || '');
      contentElement.innerHTML = window.DOMPurify.sanitize(html);
    } else {
      contentElement.textContent = text;
    }
    messageElement.appendChild(contentElement);
    
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom of messages
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  createMessageElement(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${sender}`;
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    
    // Markdown rendering with sanitization
    if (window.marked && window.DOMPurify) {
      const html = window.marked.parse(text || '');
      contentElement.innerHTML = window.DOMPurify.sanitize(html);
    } else {
      contentElement.textContent = text;
    }
    messageElement.appendChild(contentElement);
    
    return messageElement;
  }

  resetChat() {
    const messagesContainer = document.getElementById('chat-messages');
    // Get the tools overview element to preserve it
    const toolsOverview = document.getElementById('chat-tools-overview');
    // Clear only the chat messages, not the entire container
    const messageElements = messagesContainer.querySelectorAll('.chat-message');
    messageElements.forEach(element => element.remove());
    // Clear the messages array
    this.messages = [];
    // Add welcome message back
    const welcomeMessage = this.createMessageElement('assistant', 
      'Hello! How can I help you today? I can see the tools and resources available on this page - just ask me to interact with them or help with any task.');
    messagesContainer.appendChild(welcomeMessage);
    // Update the tools overview to refresh it
    this.updateToolsOverview();
    // --- NEW: Reset LLM backend conversation ---
    chrome.runtime.sendMessage({ type: 'RESET_CHAT_HISTORY' });
  }

  async showExamplesSection() {
    try {
      const { tools, context } = await this.getToolsAndContext();
      const exampleSection = document.getElementById('chat-examples');
      exampleSection.innerHTML = '<div class="examples-loading">Loading example prompts...</div>';
      chrome.runtime.sendMessage({
        type: 'GET_EXAMPLE_PROMPTS',
        data: { tools, context }
      }, (response) => {
        if (response && response.prompts && Array.isArray(response.prompts)) {
          exampleSection.innerHTML = response.prompts.map(prompt =>
            `<button class="example-prompt-btn">${window.DOMPurify ? window.DOMPurify.sanitize(prompt) : prompt}</button>`
          ).join('');
          exampleSection.querySelectorAll('.example-prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              document.getElementById('chat-input').value = btn.textContent;
              document.getElementById('chat-input').focus();
            });
          });
          this.setupHorizontalScrolling(exampleSection);
        } else {
          exampleSection.innerHTML = '<div class="examples-error">Could not load example prompts.</div>';
        }
      });
    } catch (error) {
      console.error('Error showing examples section:', error);
    }
  }

  setupHorizontalScrolling(element) {
    element.addEventListener('wheel', (e) => {
      // Prevent default vertical scrolling
      e.preventDefault();
      
      // Smooth horizontal scrolling with reduced speed
      const scrollAmount = e.deltaY * 0.5; // Reduce scroll speed by half
      element.scrollTo({
        left: element.scrollLeft + scrollAmount,
      });
    }, { passive: false });
  }

  updateToolsList() {
    this.getToolsAndContext().then(({ tools }) => {
      const toolsList = document.getElementById('tools-list');
      if (tools.length === 0) {
        toolsList.innerHTML = '<div class="no-tools">No tools found on this page</div>';
      } else {
        toolsList.innerHTML = tools.map(tool =>
          `<div class="tool-item">
            <strong>${tool.name}</strong>: ${tool.description}
          </div>`).join('');
      }
    }).catch(error => {
      console.error('Error updating tools list:', error);
    });
  }

  // *** MODIFIED FUNCTION ***
  async updateToolsOverview() {
    const overviewContainer = document.getElementById('tools-overview-content');
    try {
        const { tools, context } = await this.getToolsAndContext();
        console.log('Updating tools overview with data:', { tools, context });

        const contextArr = Array.isArray(context) ? context : [];

        const hasChanged = this.detectMajorChanges(tools, contextArr);
        if (hasChanged) {
            console.log('Major changes detected, refreshing example prompts');
            this.showExamplesSection();
        }
        this.lastToolsSnapshot = this.createToolsSnapshot(tools, contextArr);

        // remove the .tools-overview-loading element if it exists
        const loadingElement = overviewContainer.querySelector('.tools-overview-loading');
        if (loadingElement) {
            loadingElement.remove();
        }

        if (tools.length === 0 && contextArr.length === 0) {
            overviewContainer.innerHTML = `
                <div class="tools-overview-empty">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-text">No tools or resources detected on this page</div>
                    <div class="empty-subtext">Navigate to a page with interactive elements to see available tools</div>
                </div>
            `;
            this.toolElements = {};
            this.contextElements = {};
            return;
        } else {
            const emptyState = overviewContainer.querySelector('.tools-overview-empty');
            if (emptyState) emptyState.remove();
        }

        this.manageSections(overviewContainer, tools.length, contextArr.length);

        const newToolNames = new Set(tools.map(t => t.name));
        const newContextNames = new Set(contextArr.map(c => c.name));

        const toolsGrid = overviewContainer.querySelector('.tools-grid');
        if (toolsGrid) {
            for (const toolName in this.toolElements) {
                if (!newToolNames.has(toolName)) {
                    this.toolElements[toolName].remove();
                    delete this.toolElements[toolName];
                }
            }
            for (const tool of tools) {
                if (!this.toolElements[tool.name]) {
                    const toolElement = this.createToolElement(tool);
                    toolsGrid.appendChild(toolElement);
                    this.toolElements[tool.name] = toolElement;
                }
            }
        }

        const contextList = overviewContainer.querySelector('.context-list');
        if (contextList) {
            for (const contextName in this.contextElements) {
                if (!newContextNames.has(contextName)) {
                    this.contextElements[contextName].remove();
                    delete this.contextElements[contextName];
                }
            }

            for (const ctx of contextArr) {
                if (this.contextElements[ctx.name]) {
                    const existingElement = this.contextElements[ctx.name];
                    const codeElement = existingElement.querySelector('pre code');
                    if (codeElement && codeElement.textContent !== ctx.content) {
                        codeElement.textContent = ctx.content;
                    }
                } else {
                    const contextElement = this.createContextElement(ctx);
                    contextList.appendChild(contextElement);
                    this.contextElements[ctx.name] = contextElement;
                }
            }
        }

    } catch (error) {
        console.error('Error updating tools overview:', error);
        overviewContainer.innerHTML = `
            <div class="tools-overview-error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">Error loading tools information</div>
            </div>
        `;
        this.toolElements = {};
        this.contextElements = {};
    }
  }

  // *** NEW HELPER FUNCTION ***
  manageSections(container, toolCount, contextCount) {
    let toolsSection = container.querySelector('.tools-section');
    if (toolCount > 0 && !toolsSection) {
        toolsSection = document.createElement('div');
        toolsSection.className = 'tools-section';
        toolsSection.innerHTML = `
            <div class="tools-section-header">
                <span class="tools-section-title">🛠️ Tools (${toolCount})</span>
            </div>
            <div class="tools-grid"></div>
        `;
        container.appendChild(toolsSection);
    } else if (toolCount === 0 && toolsSection) {
        toolsSection.remove();
    } else if (toolCount > 0 && toolsSection) {
        toolsSection.querySelector('.tools-section-title').textContent = `🛠️ Tools (${toolCount})`;
    }

    let contextSection = container.querySelector('.context-section');
    if (contextCount > 0 && !contextSection) {
        contextSection = document.createElement('div');
        contextSection.className = 'context-section';
        contextSection.innerHTML = `
            <div class="context-section-header">
                <span class="context-section-title">📄 Context (${contextCount})</span>
            </div>
            <div class="context-list"></div>
        `;
        const toolsSect = container.querySelector('.tools-section');
        if (toolsSect) {
            toolsSect.insertAdjacentElement('afterend', contextSection);
        } else {
            container.prepend(contextSection);
        }
    } else if (contextCount === 0 && contextSection) {
        contextSection.remove();
    } else if (contextCount > 0 && contextSection) {
        contextSection.querySelector('.context-section-title').textContent = `📄 Context (${contextCount})`;
    }
  }

  // *** NEW HELPER FUNCTION ***
  createToolElement(tool) {
    const category = this.getToolCategory(tool.name, tool.description);
    const element = document.createElement('div');
    element.className = `tool-card ${category}`;
    element.innerHTML = `
        <div class="tool-header">
            <span class="tool-icon">${this.getToolIcon(category)}</span>
            <span class="tool-name">${this.escapeHtml(tool.name)}</span>
        </div>
        <div class="tool-description">${this.escapeHtml(tool.description)}</div>
        ${tool.inputSchema && tool.inputSchema.properties ? 
            `<div class="tool-params">
                <span class="params-label">Parameters:</span>
                ${Object.keys(tool.inputSchema.properties).slice(0, 3).map(p => this.escapeHtml(p)).join(', ')}
                ${Object.keys(tool.inputSchema.properties).length > 3 ? '...' : ''}
            </div>` : ''
        }
    `;
    return element;
  }

  // *** NEW HELPER FUNCTION ***
  createContextElement(ctx) {
    const element = document.createElement('div');
    element.className = 'context-item';
    element.innerHTML = `
        <div class="context-info">
            <details class="context-details">
                <summary class="context-summary">${this.escapeHtml(ctx.name) || 'Context'}</summary>
                <pre><code>${this.escapeHtml(ctx.content)}</code></pre>
            </details>
        </div>
    `;
    return element;
  }

  getToolCategory(name, description) {
    // Simple categorization based on keywords in name/description
    const n = (name || '').toLowerCase();
    const d = (description || '').toLowerCase();
    if (n.includes('form') || d.includes('form')) return 'form';
    if (n.includes('nav') || d.includes('nav') || n.includes('page') || d.includes('page')) return 'navigation';
    if (n.includes('content') || d.includes('content')) return 'content';
    if (n.includes('interact') || d.includes('interact')) return 'interaction';
    return 'general';
  }

  createToolsSnapshot(tools, context) {
    // context is an array of objects (from scanForContext), but may be undefined/null
    const contextArr = Array.isArray(context) ? context : [];
    return {
      toolNames: tools.map(t => t.name).sort(),
      toolCount: tools.length,
      contextNames: contextArr.map(c => c.name).sort(),
      contextCount: contextArr.length,
      timestamp: Date.now()
    };
  }

  detectMajorChanges(tools, context) {
    if (!this.lastToolsSnapshot) {
      return false; // First time, no comparison needed
    }
    const currentSnapshot = this.createToolsSnapshot(tools, context);
    const lastSnapshot = this.lastToolsSnapshot;
    // Check for significant changes
    const toolCountChanged = Math.abs(currentSnapshot.toolCount - lastSnapshot.toolCount) >= 2;
    const contextCountChanged = Math.abs(currentSnapshot.contextCount - lastSnapshot.contextCount) >= 3;
    // Check for tool name changes (new tools or renamed tools)
    const toolNamesChanged = this.arraysSignificantlyDifferent(
      currentSnapshot.toolNames, 
      lastSnapshot.toolNames,
      0.3 // 30% change threshold
    );
    // Check for context name changes
    const contextNamesChanged = this.arraysSignificantlyDifferent(
      currentSnapshot.contextNames, 
      lastSnapshot.contextNames,
      0.4 // 40% change threshold
    );
    // Consider it a major change if any of these conditions are met
    const majorChange = toolCountChanged || contextCountChanged || toolNamesChanged || contextNamesChanged;
    if (majorChange) {
      console.log('Major change detected:', {
        toolCountChanged,
        contextCountChanged,
        toolNamesChanged,
        contextNamesChanged,
        oldToolCount: lastSnapshot.toolCount,
        newToolCount: currentSnapshot.toolCount,
        oldContextCount: lastSnapshot.contextCount,
        newContextCount: currentSnapshot.contextCount
      });
    }
    return majorChange;
  }

  arraysSignificantlyDifferent(arr1, arr2, threshold = 0.3) {
    if (arr1.length === 0 && arr2.length === 0) return false;
    if (arr1.length === 0 || arr2.length === 0) return true;

    // Calculate intersection
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // Calculate similarity ratio
    const totalUnique = new Set([...arr1, ...arr2]).size;
    const similarity = intersection.size / totalUnique;
    
    // Return true if difference exceeds threshold
    return (1 - similarity) > threshold;
  }

  getToolIcon(category) {
    switch (category) {
      case 'form': return '📝';
      case 'navigation': return '🧭';
      case 'content': return '📄';
      case 'interaction': return '🤖';
      default: return '🛠️';
    }
  }

  getResourceType(uri, mimeType) {
    if (mimeType && mimeType.includes('image')) return 'image';
    if (mimeType && mimeType.includes('pdf')) return 'pdf';
    if (mimeType && mimeType.includes('html')) return 'html';
    if (mimeType && mimeType.includes('json')) return 'json';
    if (mimeType && mimeType.includes('csv')) return 'csv';
    if (mimeType && mimeType.includes('text')) return 'text';
    if (uri && uri.endsWith('.png')) return 'image';
    if (uri && uri.endsWith('.jpg')) return 'image';
    if (uri && uri.endsWith('.jpeg')) return 'image';
    if (uri && uri.endsWith('.pdf')) return 'pdf';
    if (uri && uri.endsWith('.html')) return 'html';
    if (uri && uri.endsWith('.json')) return 'json';
    if (uri && uri.endsWith('.csv')) return 'csv';
    return 'text';
  }

  getResourceIcon(type) {
    switch (type) {
      case 'image': return '🖼️';
      case 'pdf': return '📄';
      case 'html': return '🌐';
      case 'json': return '🗂️';
      case 'csv': return '📊';
      case 'text': return '📄';
      default: return '📄';
    }
  }

  // Add a helper to escape HTML for safe preview rendering
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]);
    });
  }
}

// Initialize the side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VOIXSidePanel();
});