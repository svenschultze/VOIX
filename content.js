// content.js
console.log("DOM Agent Chat content script loaded");
if (window.DOMAgentChat === undefined) {
    console.warn('DOMAgentChat is not defined, initializing...');
} else {
    console.warn('DOMAgentChat already defined, skipping initialization.');
    console.warn(DOMAgentChat);
}
class DOMAgentChat {
  constructor() {
    this.mcpServer = new DOMInProcessMCPServer();
    this.messages = [];
    this.isVisible = false;
    this.mode = 'side-panel-right'; // Default to docked mode on the right
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isResizing = false;
    this.dockPreview = null;
    this.originalBodyStyle = null; // Store original body styles
    this.init();
  }

  async init() {
    await this.loadSettings(); // Wait for settings to load before creating UI
    this.createChatUI();
    this.setupEventListeners();
    this.setupKeyboardShortcut();
    this.setupDragAndResize();
    
    // Signal that the content script is ready
    console.log('DOM Agent Chat initialized');
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get({
        chatMode: 'side-panel-right', // Default to docked mode on the right
        chatPosition: { x: 20, y: 20 },
        chatSize: { width: 400, height: 500 }
      });
      
      this.mode = settings.chatMode;
      this.position = settings.chatPosition;
      this.size = settings.chatSize;
      
      console.log('Loaded chat settings:', { mode: this.mode, position: this.position, size: this.size });
    } catch (error) {
      console.error('Error loading chat settings:', error);
      // Fallback to default values
      this.mode = 'side-panel-right';
      this.position = { x: 20, y: 20 };
      this.size = { width: 400, height: 500 };
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        chatMode: this.mode,
        chatPosition: this.position,
        chatSize: this.size
      });
    } catch (error) {
      console.error('Error saving chat settings:', error);
    }
  }

  async showExamplesSection() {
    // Get tools and context
    const [toolsResponse, resourcesResponse] = await Promise.all([
      this.mcpServer.listTools(),
      this.mcpServer.listResources()
    ]);
    const tools = toolsResponse.tools || [];
    let context = '';
    if (resourcesResponse.resources && resourcesResponse.resources.length > 0) {
      for (const resource of resourcesResponse.resources) {
        try {
          const resourceData = await this.mcpServer.readResource(resource.uri);
          context += `${resource.name}: ${resourceData.contents[0].text}\n`;
        } catch (e) {}
      }
    }
    // Request example prompts from LLM
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
        // Add click listeners
        exampleSection.querySelectorAll('.example-prompt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.getElementById('chat-input').value = btn.textContent;
            document.getElementById('chat-input').focus();
          });
        });
      } else {
        exampleSection.innerHTML = '<div class="examples-error">Could not load example prompts.</div>';
      }
    });
  }

  createChatUI() {
    // Create chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'dom-agent-chat';
    this.chatContainer.className = `dom-agent-chat-container hidden ${this.mode}`;
    
    this.chatContainer.innerHTML = `
      <div class="chat-header" id="chat-header">
        <span>🤖 DOM Agent</span>
        <div class="chat-controls">
          <button id="chat-close-btn" class="chat-btn close" title="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="chat-examples" id="chat-examples"></div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-tools hidden" id="chat-tools">
        <div class="tools-header">Available Tools:</div>
        <div class="tools-list" id="tools-list"></div>
      </div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Ask me to help with this page..." />
        <button id="chat-send-btn" class="chat-send-btn">Send</button>
      </div>
      <div class="chat-status" id="chat-status"></div>
    `;
    document.body.appendChild(this.chatContainer);
    this.createDockPreview();
    this.applySettings();
  }

  createDockPreview() {
    this.dockPreview = document.createElement('div');
    this.dockPreview.className = 'dock-preview hidden';
    document.body.appendChild(this.dockPreview);
  }

  applySettings() {
    if (this.mode === 'floating' && this.position && this.size) {
      this.chatContainer.style.left = this.position.x + 'px';
      this.chatContainer.style.top = this.position.y + 'px';
      this.chatContainer.style.width = this.size.width + 'px';
      this.chatContainer.style.height = this.size.height + 'px';
    }
  }

  setupEventListeners() {
    console.log('Setting up event listeners for DOM Agent Chat');
    // Send message
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Only close button
    document.getElementById('chat-close-btn').addEventListener('click', () => this.hide());

    // Tool calls
    document.addEventListener('call', (event) => {
      this.addMessage('system', `🔧 Tool executed: ${event.detail.name}`);
    });

    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);
      
      if (message.type === 'TOGGLE_CHAT') {
        this.toggle();
        sendResponse({success: true});
      } else if (message.type === 'SCAN_TOOLS') {
        this.scanAndShowTools();
        sendResponse({success: true});
      }
      
      return true; // Keep message channel open
    });
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+A to toggle chat
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  setupDragAndResize() {
    // Only keep floating mode resizing (native CSS)
    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.mode === 'floating' && !this.isDragging) {
        this.chatContainer.classList.add('resizing');
        const entry = entries[0];
        if (entry && entry.contentRect) {
          this.size = {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          };
        }
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.chatContainer.classList.remove('resizing');
          this.saveSettings();
        }, 100);
      }
    });
    this.resizeObserver.observe(this.chatContainer);
    
    // Remove all mouse event handlers for side panel resizing
    // Only keep drag logic for floating mode
    document.addEventListener('mousedown', (e) => {
      if (e.target.closest('#chat-header') && !e.target.closest('.chat-btn')) {
        this.isDragging = true;
        this.chatContainer.classList.add('dragging');
        const rect = this.chatContainer.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        e.preventDefault();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        const dockZone = this.getDockZone(e.clientX, e.clientY);
        if (dockZone) {
          this.showDockPreview(dockZone);
        } else {
          this.hideDockPreview();
          const maxX = window.innerWidth - this.chatContainer.offsetWidth;
          const maxY = window.innerHeight - this.chatContainer.offsetHeight;
          const clampedX = Math.max(0, Math.min(x, maxX));
          const clampedY = Math.max(0, Math.min(y, maxY));
          this.chatContainer.style.left = clampedX + 'px';
          this.chatContainer.style.top = clampedY + 'px';
          this.chatContainer.style.right = 'auto';
          this.position = { x: clampedX, y: clampedY };
        }
        return;
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.chatContainer.classList.remove('dragging');
        const dockZone = this.getDockZone(e.clientX, e.clientY);
        if (dockZone) {
          this.dockToSide(dockZone);
        } else {
          this.setMode('floating');
        }
        this.hideDockPreview();
        this.saveSettings();
      }
    });
  }

  isInResizeArea(clientX, clientY, rect = null) {
    // Use provided rect or get fresh one (avoid multiple calls during resize)
    const containerRect = rect || this.chatContainer.getBoundingClientRect();
    
    let inArea = false;
    
    if (this.mode === 'side-panel-right') {
      inArea = clientX >= containerRect.left - 8 && 
               clientX <= containerRect.left + 8 &&
               clientY >= containerRect.top && 
               clientY <= containerRect.bottom;
    } else if (this.mode === 'side-panel-left') {
      inArea = clientX >= containerRect.right - 8 && 
               clientX <= containerRect.right + 8 &&
               clientY >= containerRect.top && 
               clientY <= containerRect.bottom;
    }
    
    return inArea;
  }

  getDockZone(clientX, clientY) {
    const dockThreshold = 50; // Distance from edge to trigger docking
    
    if (clientX <= dockThreshold) {
      return 'left';
    } else if (clientX >= window.innerWidth - dockThreshold) {
      return 'right';
    }
    
    return null;
  }

  showDockPreview(zone) {
    this.dockPreview.className = `dock-preview ${zone}`;
    this.dockPreview.classList.remove('hidden');
  }

  hideDockPreview() {
    this.dockPreview.classList.add('hidden');
  }

  dockToSide(side) {
    if (side === 'left') {
      this.setMode('side-panel-left');
    } else if (side === 'right') {
      this.setMode('side-panel-right');
    }
  }

  adjustWebsiteLayout() {
    if (!this.isVisible) return;
    
    if (this.mode === 'side-panel-right' || this.mode === 'side-panel-left') {
      const panelWidth = this.chatContainer.offsetWidth || this.size.width || 400;
      
      // Simply inject CSS to handle viewport-width elements and prevent overlap
      // Don't modify body margins since the panel is fixed-positioned
      this.injectLayoutCSS(panelWidth);
      
    } else {
      // Restore original layout for floating mode
      this.restoreWebsiteLayout();
    }
  }

  injectLayoutCSS(panelWidth) {
    // Remove existing injected CSS
    const existingStyle = document.getElementById('dom-agent-layout-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new CSS rules
    const style = document.createElement('style');
    style.id = 'dom-agent-layout-css';
    
    let cssRules = '';
    
    if (this.mode === 'side-panel-right') {
      cssRules = `
        /* Ensure our panel stays fixed and on top */
        .dom-agent-chat-container.side-panel-right {
          position: fixed !important;
          right: 0 !important;
          top: 0 !important;
          width: ${panelWidth}px !important;
          height: 100vh !important;
          z-index: 10000 !important;
        }
        
        /* Only adjust elements that explicitly use viewport width */
        body > *:not(.dom-agent-chat-container) {
          max-width: calc(100vw - ${panelWidth}px) !important;
        }
        
        /* Handle common full-viewport elements */
        [style*="width: 100vw"],
        [style*="width:100vw"] {
          width: calc(100vw - ${panelWidth}px) !important;
        }
      `;
    } else if (this.mode === 'side-panel-left') {
      cssRules = `
        /* Ensure our panel stays fixed and on top */
        .dom-agent-chat-container.side-panel-left {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: ${panelWidth}px !important;
          height: 100vh !important;
          z-index: 10000 !important;
        }
        
        /* Only adjust elements that explicitly use viewport width */
        body > *:not(.dom-agent-chat-container) {
          max-width: calc(100vw - ${panelWidth}px) !important;
          margin-left: ${panelWidth}px !important;
        }
        
        /* Handle common full-viewport elements */
        [style*="width: 100vw"],
        [style*="width:100vw"] {
          width: calc(100vw - ${panelWidth}px) !important;
          margin-left: ${panelWidth}px !important;
        }
      `;
    }
    
    style.textContent = cssRules;
    document.head.appendChild(style);
  }

  restoreWebsiteLayout() {
    // Remove injected CSS
    const injectedStyle = document.getElementById('dom-agent-layout-css');
    if (injectedStyle) {
      injectedStyle.remove();
    }
    
    // Remove any stored original styles (cleanup from old implementation)
    const elementsWithOriginalStyles = document.querySelectorAll('[data-original-style]');
    elementsWithOriginalStyles.forEach(element => {
      element.removeAttribute('data-original-style');
    });
    
    // Clear the stored original styles
    this.originalBodyStyle = null;
  }

  setMode(newMode) {
    const oldMode = this.mode;
    this.mode = newMode;
    this.chatContainer.className = `dom-agent-chat-container ${this.isVisible ? '' : 'hidden'} ${this.mode}`;
    
    if (this.mode === 'side-panel-right') {
      this.chatContainer.style.left = 'auto';
      this.chatContainer.style.top = '0';
      this.chatContainer.style.right = '0';
      this.chatContainer.style.height = '100vh';
      this.chatContainer.style.width = (this.size.width || 400) + 'px';
    } else if (this.mode === 'side-panel-left') {
      this.chatContainer.style.left = '0';
      this.chatContainer.style.top = '0';
      this.chatContainer.style.right = 'auto';
      this.chatContainer.style.height = '100vh';
      this.chatContainer.style.width = (this.size.width || 400) + 'px';
    } else {
      // Floating mode
      this.applySettings();
    }
    
    // Adjust website layout when mode changes
    if (oldMode !== newMode) {
      this.adjustWebsiteLayout();
    }
  }

  toggle() {
    console.log('Toggling chat, current visibility:', this.isVisible);
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    console.log('Showing chat');
    this.chatContainer.classList.remove('hidden');
    this.isVisible = true;
    this.updateToolsList();
    this.showExamplesSection();
    
    // Adjust website layout when showing
    this.adjustWebsiteLayout();
    
    // Use setTimeout to ensure the element is visible before focusing
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    }, 100);
  }

  hide() {
    this.chatContainer.classList.add('hidden');
    this.isVisible = false;
    
    // Restore website layout when hiding
    this.restoreWebsiteLayout();
  }

  minimize() {
    this.chatContainer.classList.toggle('minimized');
  }

  toggleTools() {
    const toolsDiv = document.getElementById('chat-tools');
    toolsDiv.classList.toggle('hidden');
  }

  sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addMessage('user', message);
    input.value = '';
    
    // Delegate everything to MCP server
    this.mcpServer.sendMessage(message)
      .then(response => {
        this.addMessage('assistant', response);
      })
      .catch(error => {
        console.error('Error sending message:', error);
        this.addMessage('assistant', 'Sorry, there was an error processing your request.');
      });
  }

  addMessage(sender, text) {
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

  updateToolsList() {
    this.mcpServer.listTools().then(response => {
      const tools = response.tools;
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

  scanAndShowTools() {
    this.mcpServer.listTools().then(response => {
      const tools = response.tools;
      
      if (tools.length === 0) {
        this.addMessage('system', 'No tools found on this page.');
        return;
      }
      
      this.addMessage('system', `Found ${tools.length} tool(s) on this page:`);
      
      tools.forEach(tool => {
        this.addMessage('system', `🔧 ${tool.name}: ${tool.description}`);
      });
    }).catch(error => {
      console.error('Error scanning tools:', error);
      this.addMessage('system', 'Error scanning for tools on this page.');
    });
  }
}

window.DOMAgentChat = new DOMAgentChat();