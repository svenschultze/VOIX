// content.js
console.log("VOIX content script loaded");
if (window.VOIXChat === undefined) {
    console.warn('VOIXChat is not defined, initializing...');
} else {
    console.warn('VOIXChat already defined, skipping initialization.');
    console.warn(VOIXChat);
}
class VOIXChat {
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
    this.toolsRefreshInterval = null; // For periodic tools overview refresh
    this.lastToolsSnapshot = null; // Store last tools/resources state for change detection
    this.init();
  }

  async init() {
    await this.loadSettings(); // Wait for settings to load before creating UI
    this.createChatUI();
    this.setupEventListeners();
    this.setupKeyboardShortcut();
    this.setupDragAndResize();
    this.startToolsRefresh(); // Start periodic refresh
    
    // Signal that the content script is ready
    console.log('VOIX Chat initialized');
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
        
        // Add horizontal scroll with normal mouse wheel
        this.setupHorizontalScrolling(exampleSection);
      } else {
        exampleSection.innerHTML = '<div class="examples-error">Could not load example prompts.</div>';
      }
    });
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

  createChatUI() {
    // Create chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'voix-chat';
    this.chatContainer.className = `voix-chat-container hidden ${this.mode}`;
    
    this.chatContainer.innerHTML = `
      <div class="chat-header" id="chat-header">
        <span>VOIX</span>
        <div class="chat-controls">
          <button id="chat-reset-btn" class="chat-btn reset" title="Reset Chat">
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z" fill="currentColor"/>
            </svg>
          </button>
          <button id="chat-close-btn" class="chat-btn close" title="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-tools-overview" id="chat-tools-overview">
          <div class="tools-overview-content" id="tools-overview-content">
            <div class="tools-overview-loading">Scanning for tools...</div>
          </div>
        </div>
      </div>
      <div class="chat-examples" id="chat-examples"></div>
      <div class="chat-input-container">
        <button id="think-toggle-btn" class="think-toggle-btn" title="Toggle thinking mode">
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2M14 13.58V16H13V11.41L14.71 9.71C15.1 9.32 15.1 8.68 14.71 8.29C14.32 7.9 13.68 7.9 13.29 8.29L12 9.59L10.71 8.29C10.32 7.9 9.68 7.9 9.29 8.29C8.9 8.68 8.9 9.32 9.29 9.71L11 11.41V16H10V13.58C8.23 12.81 7 11.05 7 9C7 6.24 9.24 4 12 4S17 6.24 17 9C17 11.05 15.77 12.81 14 13.58M9 20H15V21C15 21.55 14.55 22 14 22H10C9.45 22 9 21.55 9 21V20Z" fill="currentColor"/>
          </svg>
        </button>
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
    console.log('Setting up event listeners for VOIX Chat');
    // Initialize think toggle state
    this.thinkModeEnabled = false;
    
    // Send message
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-input');
    const thinkToggleBtn = document.getElementById('think-toggle-btn');
    
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

    // Close button
    document.getElementById('chat-close-btn').addEventListener('click', () => {
      this.hide();
    });

    // Reset button
    document.getElementById('chat-reset-btn').addEventListener('click', () => {
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
    });

    // Tool calls
    document.addEventListener('call', (event) => {
      this.addMessage('system', `🔧 Tool executed: ${event.target.attributes.name.value}`);
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
    const existingStyle = document.getElementById('voix-layout-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new CSS rules
    const style = document.createElement('style');
    style.id = 'voix-layout-css';
    
    let cssRules = '';
    
    if (this.mode === 'side-panel-right') {
      cssRules = `
        /* Ensure our panel stays fixed and on top */
        .voix-chat-container.side-panel-right {
          position: fixed !important;
          right: 0 !important;
          top: 0 !important;
          width: ${panelWidth}px !important;
          height: 100vh !important;
          z-index: 10000 !important;
        }
        
        /* Only adjust elements that explicitly use viewport width */
        body > *:not(.voix-chat-container) {
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
        .voix-chat-container.side-panel-left {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: ${panelWidth}px !important;
          height: 100vh !important;
          z-index: 10000 !important;
        }
        
        /* Only adjust elements that explicitly use viewport width */
        body > *:not(.voix-chat-container) {
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
    const injectedStyle = document.getElementById('voix-layout-css');
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
    this.chatContainer.className = `voix-chat-container ${this.isVisible ? '' : 'hidden'} ${this.mode}`;
    
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
    this.updateToolsOverview();
    this.updateToolsList();
    this.showExamplesSection();
    
    // Start/resume tools refresh when showing
    this.startToolsRefresh();
    
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
    
    // Stop tools refresh when hiding to save resources
    this.stopToolsRefresh();
    
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
    
    // Add think mode suffix
    const messageWithThinkMode = this.thinkModeEnabled ? 
      `${message} /think` : 
      `${message} /no_think`;
    
    this.addMessage('user', message); // Display original message without suffix
    input.value = '';
    
    // Delegate everything to MCP server with think mode suffix
    this.mcpServer.sendMessage(messageWithThinkMode)
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

  async updateToolsOverview() {
    const overviewContent = document.getElementById('tools-overview-content');
    
    try {
      // Get tools and resources in parallel
      const [toolsResponse, resourcesResponse] = await Promise.all([
        this.mcpServer.listTools(),
        this.mcpServer.listResources()
      ]);
      
      const tools = toolsResponse.tools || [];
      const resources = resourcesResponse.resources || [];
      
      // Check for major changes and refresh examples if needed
      const hasChanged = this.detectMajorChanges(tools, resources);
      if (hasChanged) {
        console.log('Major changes detected in tools/resources, refreshing example prompts');
        this.showExamplesSection(); // Refresh example prompts
      }
      
      // Store current state for future comparisons
      this.lastToolsSnapshot = this.createToolsSnapshot(tools, resources);
      
      if (tools.length === 0 && resources.length === 0) {
        overviewContent.innerHTML = `
          <div class="tools-overview-empty">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">No tools or resources detected on this page</div>
            <div class="empty-subtext">Navigate to a page with interactive elements to see available tools</div>
          </div>
        `;
        return;
      }
      
      let html = '';
      
      // Tools section
      if (tools.length > 0) {
        html += `
          <div class="tools-section">
            <div class="tools-section-header">
              <span class="tools-section-title">🛠️ Tools (${tools.length})</span>
            </div>
            <div class="tools-grid">
        `;
        
        tools.forEach(tool => {
          // Extract tool category from name or description for better organization
          const category = this.getToolCategory(tool.name, tool.description);
          html += `
            <div class="tool-card ${category}">
              <div class="tool-header">
                <span class="tool-icon">${this.getToolIcon(category)}</span>
                <span class="tool-name">${tool.name}</span>
              </div>
              <div class="tool-description">${tool.description}</div>
              ${tool.inputSchema && tool.inputSchema.properties ? 
                `<div class="tool-params">
                  <span class="params-label">Parameters:</span>
                  ${Object.keys(tool.inputSchema.properties).slice(0, 3).join(', ')}
                  ${Object.keys(tool.inputSchema.properties).length > 3 ? '...' : ''}
                </div>` : ''
              }
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      // Resources section
      if (resources.length > 0) {
        html += `
          <div class="resources-section">
            <div class="resources-section-header">
              <span class="resources-section-title">📄 Resources (${resources.length})</span>
            </div>
            <div class="resources-list">
        `;
        
        resources.forEach(resource => {
          const resourceType = this.getResourceType(resource.uri, resource.mimeType);
          html += `
            <div class="resource-item ${resourceType}">
              <span class="resource-icon">${this.getResourceIcon(resourceType)}</span>
              <div class="resource-info">
                <div class="resource-name">${resource.name || resource.uri}</div>
                <div class="resource-type">${resource.mimeType || 'Unknown type'}</div>
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      overviewContent.innerHTML = html;
      
    } catch (error) {
      console.error('Error updating tools overview:', error);
      overviewContent.innerHTML = `
        <div class="tools-overview-error">
          <div class="error-icon">⚠️</div>
          <div class="error-text">Error loading tools information</div>
        </div>
      `;
    }
  }

  getToolCategory(name, description) {
    const nameAndDesc = (name + ' ' + description).toLowerCase();
    
    if (nameAndDesc.includes('form') || nameAndDesc.includes('submit') || nameAndDesc.includes('input')) {
      return 'form';
    } else if (nameAndDesc.includes('click') || nameAndDesc.includes('button')) {
      return 'interaction';
    } else if (nameAndDesc.includes('navigate') || nameAndDesc.includes('url') || nameAndDesc.includes('link')) {
      return 'navigation';
    } else if (nameAndDesc.includes('text') || nameAndDesc.includes('content') || nameAndDesc.includes('read')) {
      return 'content';
    } else if (nameAndDesc.includes('scroll') || nameAndDesc.includes('page')) {
      return 'page';
    } else {
      return 'general';
    }
  }

  getToolIcon(category) {
    const icons = {
      form: '📝',
      interaction: '👆',
      navigation: '🧭',
      content: '📄',
      page: '📜',
      general: '🔧'
    };
    return icons[category] || '🔧';
  }

  getResourceType(uri, mimeType) {
    if (mimeType) {
      if (mimeType.includes('text')) return 'text';
      if (mimeType.includes('image')) return 'image';
      if (mimeType.includes('json')) return 'data';
      if (mimeType.includes('html')) return 'html';
    }
    
    if (uri) {
      if (uri.includes('.json')) return 'data';
      if (uri.includes('.html')) return 'html';
      if (uri.match(/\.(jpg|jpeg|png|gif|svg)$/i)) return 'image';
    }
    
    return 'generic';
  }

  getResourceIcon(type) {
    const icons = {
      text: '📝',
      image: '🖼️',
      data: '📊',
      html: '🌐',
      generic: '📄'
    };
    return icons[type] || '📄';
  }

  /**
   * Create a snapshot of current tools and resources for change detection
   */
  createToolsSnapshot(tools, resources) {
    return {
      toolNames: tools.map(t => t.name).sort(),
      toolCount: tools.length,
      resourceNames: resources.map(r => r.name || r.uri).sort(),
      resourceCount: resources.length,
      timestamp: Date.now()
    };
  }

  /**
   * Detect if there are major changes in tools/resources that warrant refreshing examples
   */
  detectMajorChanges(tools, resources) {
    if (!this.lastToolsSnapshot) {
      return false; // First time, no comparison needed
    }

    const currentSnapshot = this.createToolsSnapshot(tools, resources);
    const lastSnapshot = this.lastToolsSnapshot;

    // Check for significant changes
    const toolCountChanged = Math.abs(currentSnapshot.toolCount - lastSnapshot.toolCount) >= 2;
    const resourceCountChanged = Math.abs(currentSnapshot.resourceCount - lastSnapshot.resourceCount) >= 3;
    
    // Check for tool name changes (new tools or renamed tools)
    const toolNamesChanged = this.arraysSignificantlyDifferent(
      currentSnapshot.toolNames, 
      lastSnapshot.toolNames,
      0.3 // 30% change threshold
    );
    
    // Check for resource name changes
    const resourceNamesChanged = this.arraysSignificantlyDifferent(
      currentSnapshot.resourceNames, 
      lastSnapshot.resourceNames,
      0.4 // 40% change threshold
    );

    // Consider it a major change if any of these conditions are met
    const majorChange = toolCountChanged || resourceCountChanged || toolNamesChanged || resourceNamesChanged;

    if (majorChange) {
      console.log('Major change detected:', {
        toolCountChanged,
        resourceCountChanged,
        toolNamesChanged,
        resourceNamesChanged,
        oldToolCount: lastSnapshot.toolCount,
        newToolCount: currentSnapshot.toolCount,
        oldResourceCount: lastSnapshot.resourceCount,
        newResourceCount: currentSnapshot.resourceCount
      });
    }

    return majorChange;
  }

  /**
   * Check if two arrays are significantly different based on a threshold
   */
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

  resetChat() {
    // Clear chat messages
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    
    // Optionally, reset other states or UI elements as needed
    this.messages = [];
    this.position = { x: 20, y: 20 };
    this.size = { width: 400, height: 500 };
    this.mode = 'side-panel-right';
    this.isVisible = false;
    this.chatContainer.className = `voix-chat-container hidden ${this.mode}`;
    
    // Reset settings in storage
    chrome.storage.sync.set({
      chatMode: this.mode,
      chatPosition: this.position,
      chatSize: this.size
    });
    
    console.log('Chat reset to initial state');
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

  startToolsRefresh() {
    // Clear any existing interval
    if (this.toolsRefreshInterval) {
      clearInterval(this.toolsRefreshInterval);
    }
    
    // Set up periodic refresh every 5 seconds
    this.toolsRefreshInterval = setInterval(() => {
      if (this.isVisible) {
        this.updateToolsOverview();
      }
    }, 5000);
  }

  stopToolsRefresh() {
    if (this.toolsRefreshInterval) {
      clearInterval(this.toolsRefreshInterval);
      this.toolsRefreshInterval = null;
    }
  }
}

window.VOIXChat = new VOIXChat();