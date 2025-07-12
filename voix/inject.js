// MCP-compatible MCP Server injected into every page


// Dedicated function to simplify HTML by whitelisting content tags
function simplifyHtmlElement(element) {
  // Whitelist of content tags to keep
  const whitelist = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
    'a', 'b', 'strong', 'i', 'em', 'blockquote',
    'pre', 'code', 'span', 'div', 'br', 'hr', 'table', 'thead', 'tbody', 'tfoot',
    'caption', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'figure', 'figcaption', 'details', 'summary', 'dl', 'dt', 'dd', 'math', 'b', 'em', 'strong', 'mark', 'small', 'sub', 'sup', 'time', 'u', 's', 'del', 'ins', 'kbd', 'var', 'samp', 'cite', 'q', 'dfn', 'abbr', 'address'
  ];
  // Remove all elements not in the whitelist
  element.querySelectorAll('*').forEach(el => {
    if (!whitelist.includes(el.tagName.toLowerCase())) {
      el.remove();
    }
  });
  // Remove all attributes from all elements
  element.querySelectorAll('*').forEach(el => {
    while (el.attributes.length > 0) {
      el.removeAttribute(el.attributes[0].name);
    }
  });

  return element;
}


console.log('Injecting MCP Server into page');
(function() {
  if (window.voixMCPServer) return;

  class MCPServer {
    constructor() {
      this.tools = new Map();
      this.resources = new Map();
      this.capabilities = {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        prompts: {}
      };
      this.mcpInitialized = false;
      this.setupMessageListeners();
      this.startPageMonitoring();
    }

    setupMessageListeners() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'MCP_INITIALIZE') {
          sendResponse(this.initialize(message.clientInfo));
          return true;
        }
        if (message.type === 'MCP_LIST_TOOLS') {
          this.refreshPageData().then(() => {
            sendResponse({ tools: this.getToolsList() });
          });
          return true;
        }
        if (message.type === 'MCP_LIST_RESOURCES') {
          this.refreshPageData().then(() => {
            sendResponse({ resources: this.getResourcesList() });
          });
          return true;
        }
        if (message.type === 'MCP_READ_RESOURCE') {
          const resource = this.resources.get(message.name);
          if (resource) {
            sendResponse({
              contents: [{
                uri: `dom://${resource.name}`,
                mimeType: 'text/plain',
                text: resource.content
              }]
            });
          } else {
            sendResponse({ error: 'Resource not found' });
          }
          return true;
        }
        if (message.type === 'MCP_CALL_TOOL') {
          this.callTool(message.toolName, message.arguments)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;
        }
        // Legacy/compat
        if (message.type === 'GET_PAGE_DATA') {
          this.getPageData().then(data => sendResponse(data));
          return true;
        }
        if (message.type === 'CALL_TOOL') {
          this.callTool(message.toolName, message.arguments)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;
        }
      });
    }

    async initialize(clientInfo) {
      return {
        protocolVersion: '2024-11-05',
        capabilities: this.capabilities,
        serverInfo: {
          name: 'voix-mcp-server',
          version: '2.0.0'
        }
      };
    }

    getToolsList() {
      return Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.schema,
        params: this.flattenSchemaParams(tool.schema)
      }));
    }

    getResourcesList() {
      return Array.from(this.resources.values()).map(resource => ({
        uri: `dom://${resource.name}`,
        name: resource.name,
        description: resource.description,
        mimeType: 'text/plain'
      }));
    }

    flattenSchemaParams(schema, parent = '') {
      let params = [];
      if (schema.type === 'object' && schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          const fullName = parent ? `${parent}.${key}` : key;
          if (prop.type === 'object' || prop.type === 'array') {
            params = params.concat(this.flattenSchemaParams(prop, fullName));
          } else {
            params.push({
              name: fullName,
              type: prop.type,
              description: prop.description || '',
              required: schema.required && schema.required.includes(key),
              enum: prop.enum,
              example: prop.example
            });
          }
        }
      } else if (schema.type === 'array' && schema.items) {
        params = params.concat(this.flattenSchemaParams(schema.items, parent ? `${parent}[]` : '[]'));
      }
      return params;
    }

    async callTool(toolName, args) {
      try {
        const toolElements = document.querySelectorAll('tool');
        let toolElement = null;
        for (const el of toolElements) {
          if (el.getAttribute('name') === toolName) {
            toolElement = el;
            break;
          }
        }
        if (!toolElement) throw new Error(`Tool ${toolName} not found`);
        const event = new CustomEvent('call', { detail: args, bubbles: true });
        if (args && typeof args === 'object') {
          for (const [key, value] of Object.entries(args)) {
            toolElement.setAttribute(`arg-${key}`, String(value));
          }
        }
        toolElement.dispatchEvent(event);
        // Notify sidepanel and other extension pages that a tool was called
        chrome.runtime.sendMessage({
          type: 'MCP_CALL_TOOL',
          toolName,
          arguments: args
        });
        return { success: true, result: `Tool ${toolName} executed successfully` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async getPageData() {
      try {
        const tools = this.scanForTools();
        const resources = this.scanForResources();
        const context = this.scanForContext();
        // Fallback: if no tools and no context/resources, add current_url and html as resources
        if (
          tools.length === 0 &&
          resources.length === 0 &&
          context.length === 0
        ) {
          // Use visible text only for fallback html resource, limited to 10,000 words
          let cleanedText = '';
          if (document.body) {
            cleanedText = document.body.innerText;
            // Limit to 10,000 words
            const words = cleanedText.split(/\s+/);
            if (words.length > 10000) {
              cleanedText = words.slice(0, 10000).join(' ');
            }
          }
          resources.push(
            {
              name: 'current_url',
              description: 'The current URL of the website',
              content: window.location.href
            },
            {
              name: 'html',
              description: 'The visible text content of the page body (up to 10,000 words)',
              content: cleanedText
            }
          );
        }
        // combine resources and context into a single array to context
        context.push(...resources);
        return { success: true, tools, context, resources };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    scanForTools() {
      const tools = [];
      const toolElements = document.querySelectorAll('tool[name]');
      toolElements.forEach((toolEl) => {
        try {
          // if disabled attribute is present, skip this tool
          if (toolEl.hasAttribute('disabled')) return;
          const name = toolEl.getAttribute('name');
          const description = toolEl.getAttribute('description') || toolEl.textContent?.trim() || 'No description';
          const schema = this.parseToolSchema(toolEl);
          tools.push({ name, description, inputSchema: schema });
        } catch {}
      });
      return tools;
    }

    parseToolSchema(toolEl) {
      const schema = { type: 'object', properties: {}, required: [] };
      const props = toolEl.querySelectorAll(':scope > prop');
      props.forEach(prop => {
        const propSchema = this.parsePropElement(prop);
        schema.properties[propSchema.name] = propSchema.schema;
        if (prop.hasAttribute('required')) schema.required.push(propSchema.name);
      });
      const arrays = toolEl.querySelectorAll(':scope > array');
      arrays.forEach(array => {
        const arraySchema = this.parseArrayElement(array);
        schema.properties[arraySchema.name] = arraySchema.schema;
        if (array.hasAttribute('required')) schema.required.push(arraySchema.name);
      });
      if (Object.keys(schema.properties).length === 0) {
        const schemaAttr = toolEl.getAttribute('schema');
        if (schemaAttr) {
          try { return JSON.parse(schemaAttr); } catch {}
        }
        const params = {};
        for (const attr of toolEl.attributes) {
          if (attr.name.startsWith('param-')) {
            const paramName = attr.name.substring(6);
            params[paramName] = { type: 'string', description: attr.value };
          }
        }
        if (Object.keys(params).length > 0) {
          schema.properties = { ...schema.properties, ...params };
          schema.required = Object.keys(params);
        }
      }
      return schema;
    }

    parsePropElement(propEl) {
      const name = propEl.getAttribute('name');
      const type = propEl.getAttribute('type') || 'string';
      const description = propEl.getAttribute('description') || '';
      const example = propEl.textContent.trim().replace(/^Example:\s*/i, '');
      const schema = { type, description };
      if (example) schema.example = example;
      return { name, schema };
    }

    parseArrayElement(arrayEl) {
      const name = arrayEl.getAttribute('name');
      const description = arrayEl.getAttribute('description') || '';
      const schema = {
        type: 'array',
        description,
        items: { type: 'object', properties: {}, required: [] }
      };
      const dicts = arrayEl.querySelectorAll(':scope > dict');
      dicts.forEach(dict => {
        const props = dict.querySelectorAll('prop');
        props.forEach(prop => {
          const propSchema = this.parsePropElement(prop);
          schema.items.properties[propSchema.name] = propSchema.schema;
          if (prop.hasAttribute('required')) schema.items.required.push(propSchema.name);
        });
      });
      return { name, schema };
    }

    scanForResources() {
      const resources = [];
      const resourceElements = document.querySelectorAll('resource');
      resourceElements.forEach((resourceEl, index) => {
        try {
          const name = resourceEl.getAttribute('name') || `resource_${index}`;
          const description = resourceEl.getAttribute('description') || 'Resource content';
          const content = resourceEl.textContent?.trim() || '';
          resources.push({ name, description, content });
        } catch {}
      });
      return resources;
    }

    scanForContext() {
      const context = [];
      const contextElements = document.querySelectorAll('context');
      contextElements.forEach((contextEl, index) => {
        try {
          const name = contextEl.getAttribute('name') || `context_${index}`;
          const description = contextEl.getAttribute('description') || 'Context information';
          const content = contextEl.textContent?.trim() || '';
          context.push({ name, description, content });
        } catch {}
      });
      return context;
    }

    refreshPageData() {
      // Re-scan DOM for tools/resources/context
      this.tools.clear();
      this.resources.clear();
      this.scanForTools().forEach(tool => this.tools.set(tool.name, tool));
      this.scanForResources().forEach(resource => this.resources.set(resource.name, resource));
      return Promise.resolve();
    }

    startPageMonitoring() {
      const observer = new MutationObserver((mutations) => {
        let shouldNotify = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);
            const relevantNodes = [...addedNodes, ...removedNodes].filter(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName?.toLowerCase();
                return tagName === 'tool' || tagName === 'context' || tagName === 'resource' ||
                  node.querySelector?.('tool, context, resource');
              }
              return false;
            });
            if (relevantNodes.length > 0) {
              shouldNotify = true;
              break;
            }
            // NEW: If the target itself is a <context> or <resource>, notify (for text node changes)
            if (
              mutation.target &&
              mutation.target.nodeType === Node.ELEMENT_NODE &&
              (
                mutation.target.tagName.toLowerCase() === 'context' ||
                mutation.target.tagName.toLowerCase() === 'resource'
              )
            ) {
              shouldNotify = true;
              break;
            }
          }
          // NEW: Detect text changes in <context> or <resource>
          if (mutation.type === 'characterData') {
            let el = mutation.target.parentElement;
            while (el) {
              if (el.tagName && (el.tagName.toLowerCase() === 'context' || el.tagName.toLowerCase() === 'resource')) {
                shouldNotify = true;
                break;
              }
              el = el.parentElement;
            }
            if (shouldNotify) break;
          }
          // NEW: Detect attribute changes in <context> or <resource>
          if (mutation.type === 'attributes') {
            let el = mutation.target;
            if (el.tagName && (el.tagName.toLowerCase() === 'context' || el.tagName.toLowerCase() === 'resource')) {
              shouldNotify = true;
              break;
            }
          }
        }
        if (shouldNotify) {
          clearTimeout(this.notifyTimeout);
          this.notifyTimeout = setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'PAGE_DATA_UPDATED' });
          }, 500);
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
      this.mutationObserver = observer;
    }
  }

  window.voixMCPServer = new MCPServer();

  // Add SPA navigation support: listen for popstate and hashchange events
  window.addEventListener('popstate', () => {
    chrome.runtime.sendMessage({ type: 'PAGE_DATA_UPDATED' });
  });
  window.addEventListener('hashchange', () => {
    chrome.runtime.sendMessage({ type: 'PAGE_DATA_UPDATED' });
  });

  console.log('MCP Server injected successfully');

  chrome.runtime.sendMessage({ type: 'PAGE_DATA_UPDATED' });
})();
