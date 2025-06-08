// Side panel script for VOIX extension - matching original functionality
console.log("VOIX sidepanel script loaded");

class VOIXSidePanel {
  constructor() {
    this.messages = [];
    this.currentTabId = null;
    this.isConnected = false;
    this.thinkModeEnabled = false;
    this.lastToolsSnapshot = null;
    
    this.init();
  }

  async init() {
    console.log('VOIX Side Panel initializing...');
    
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
    
    console.log('VOIX Side Panel initialized');
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

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetChat();
      });
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

  async updateToolsOverview() {
    const overviewContent = document.getElementById('tools-overview-content');
    try {
      const { tools, context } = await this.getToolsAndContext();
      console.log('Updating tools overview with data:', { tools, context });
      // Ensure context is always an array
      const contextArr = Array.isArray(context) ? context : [];
      // Check for major changes and refresh examples if needed
      const hasChanged = this.detectMajorChanges(tools, contextArr);
      if (hasChanged) {
        console.log('Major changes detected in tools/resources, refreshing example prompts');
        this.showExamplesSection(); // Refresh example prompts
      }
      this.lastToolsSnapshot = this.createToolsSnapshot(tools, contextArr);
      if (tools.length === 0 && contextArr.length === 0) {
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
      if (contextArr.length > 0) {
        html += `
          <div class="resources-section">
            <div class="resources-section-header">
              <span class="resources-section-title">📄 Resources (${contextArr.length})</span>
            </div>
            <div class="resources-list">
        `;
        contextArr.forEach(resource => {
          const resourceType = this.getResourceType(resource.uri, resource.mimeType);
          // Show the start of the resource content (first 80 chars, ellipsis if longer)
          let preview = '';
          if (resource.content) {
            preview = resource.content.length > 80 ?
              resource.content.slice(0, 80) + '…' :
              resource.content;
          }
          html += `
            <div class="resource-item ${resourceType}">
              <span class="resource-icon">${this.getResourceIcon(resourceType)}</span>
              <div class="resource-info">
                <div class="resource-name">${resource.name || resource.uri}</div>
                <div class="resource-preview">${preview ? this.escapeHtml(preview) : '<em>No content</em>'}</div>
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