// Real MCP-compliant DOM server
class DOMInProcessMCPServer {
  constructor() {
    this.tools = new Map();
    this.resources = new Map();
    this.capabilities = {
      tools: { listChanged: true },
      resources: { subscribe: true, listChanged: true },
      prompts: {}
    };
    this.mcpInitialized = false;
  }

  // MCP Standard Methods
  async initialize(clientInfo) {
    return {
      protocolVersion: "2024-11-05",
      capabilities: this.capabilities,
      serverInfo: {
        name: "dom-mcp-server",
        version: "1.0.0"
      }
    };
  }

  async listTools() {
    this.parseDOMTools();
    return {
      tools: Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.schema,
        params: this.flattenSchemaParams(tool.schema)
      }))
    };
  }

  // Recursively flatten schema properties for UI/LLM
  flattenSchemaParams(schema, parent = "") {
    let params = [];
    if (schema.type === "object" && schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const fullName = parent ? `${parent}.${key}` : key;
        if (prop.type === "object" || prop.type === "array") {
          params = params.concat(this.flattenSchemaParams(prop, fullName));
        } else {
          params.push({
            name: fullName,
            type: prop.type,
            description: prop.description || "",
            required: schema.required && schema.required.includes(key),
            enum: prop.enum,
            example: prop.example
          });
        }
      }
    } else if (schema.type === "array" && schema.items) {
      // For arrays, show the item structure
      params = params.concat(this.flattenSchemaParams(schema.items, parent ? `${parent}[]` : "[]"));
    }
    return params;
  }

  async callTool(name, arguments_) {
    this.parseDOMTools();
    
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    // Use your existing DOM event system but return MCP-compliant response
    return new Promise((resolve, reject) => {
      const responseHandler = (event) => {
        tool.element.removeEventListener('response', responseHandler);
        
        if (event.detail?.error) {
          reject(new Error(event.detail.error));
        } else {
          // MCP-compliant tool response
          resolve({
            content: [
              {
                type: "text",
                text: JSON.stringify(event.detail || { success: true })
              }
            ],
            isError: false
          });
        }
      };

      tool.element.addEventListener('response', responseHandler);
      
      console.log("calling tool:", name, "with arguments:", arguments_);
      // Dispatch MCP-style call event
      const callEvent = new CustomEvent('call', {
        detail: arguments_,
        bubbles: true,
        cancelable: true
      });

      tool.element.dispatchEvent(callEvent);
      
      // Timeout
      setTimeout(() => {
        tool.element.removeEventListener('response', responseHandler);
        resolve({
          content: [{ type: "text", text: "Tool executed (no response)" }],
          isError: false
        });
      }, 5000);
    });
  }

  async listResources() {
    this.parseDOMResources();
    return {
      resources: Array.from(this.resources.values()).map(resource => ({
        uri: `dom://${resource.name}`,
        name: resource.name,
        description: resource.description,
        mimeType: "text/plain"
      }))
    };
  }

  async readResource(uri) {
    const name = uri.replace('dom://', '');
    const resource = this.resources.get(name);
    
    if (!resource) {
      throw new Error(`Resource ${uri} not found`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: resource.content
        }
      ]
    };
  }

  async sendMessage(message) {
    // Initialize MCP server if not done
    if (!this.mcpInitialized) {
      await this.initialize({ name: "voix-client", version: "1.0.0" });
      this.mcpInitialized = true;
    }

    // Initialize conversation if not exists
    if (!this.conversation) {
      this.conversation = [];
    }

    // Get tools and resources using MCP standard methods
    const toolsResponse = await this.listTools();
    const resourcesResponse = await this.listResources();
    
    // Build context from resources
    let context = "";
    if (resourcesResponse.resources.length > 0) {
      for (const resource of resourcesResponse.resources) {
        try {
          const resourceData = await this.readResource(resource.uri);
          context += `${resource.name}: ${resourceData.contents[0].text}\n\n`;
        } catch (error) {
          console.error(`Error reading resource ${resource.uri}:`, error);
        }
      }
    }
    
    // Add user message to conversation
    this.conversation.push({ role: 'user', content: message });
    
    // Prepare message payload
    const payload = {
      messages: [...this.conversation], // Send full conversation history
      tools: toolsResponse.tools,
      context: context || this.getPageContext()
    };
    
    // Get initial response from LLM
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'LLM_REQUEST', data: payload }, async (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }

        // Handle direct OpenAI message response
        if (response?.role === 'assistant') {
          const assistantMessage = response;
          
          // Add assistant message to conversation
          this.conversation.push(assistantMessage);
          
          // Check if there are tool calls
          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            try {
              // Execute all tool calls
              const toolResults = await this.executeAllToolCalls(assistantMessage.tool_calls);
              
              // Add tool result messages to conversation
              for (const result of toolResults) {
                this.conversation.push({
                  role: 'tool',
                  tool_call_id: result.tool_call_id,
                  content: result.content
                });
              }
              
              // Get final response from LLM after tool execution
              const followUpPayload = {
                messages: [...this.conversation, {
                  role: 'user',
                  content: 'Please explain what you just did and summarize the results. /no_think'
                }],
                tools: toolsResponse.tools,
                context: context || this.getPageContext()
              };
              
              chrome.runtime.sendMessage({ type: 'LLM_REQUEST', data: followUpPayload }, (finalResponse) => {
                if (finalResponse?.role === 'assistant') {
                  this.conversation.push(finalResponse);
                  resolve(finalResponse.content || 'Tools executed successfully.');
                } else {
                  resolve('Tools executed successfully.');
                }
              });
            } catch (toolError) {
              resolve(`Error executing tools: ${toolError.message}`);
            }
          } else {
            // No tool calls, return the assistant's message
            resolve(assistantMessage.content || 'No response received.');
          }
        } else {
          // Handle legacy responses for backward compatibility
          if (response?.type === 'message') {
            resolve(response.content);
          } else {
            reject(new Error('Unexpected response format'));
          }
        }
      });
    });
  }

  async executeAllToolCalls(toolCalls) {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        console.log(`🔧 Executing tool: ${toolCall.function.name}`);
        
        const args = JSON.parse(toolCall.function.arguments);
        const result = await this.callTool(toolCall.function.name, args);
        
        results.push({
          tool_call_id: toolCall.id,
          content: result.content[0].text
        });
      } catch (error) {
        console.error(`Error executing tool ${toolCall.function.name}:`, error);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: error.message })
        });
      }
    }
    
    return results;
  }

  getPageContext() {
    // Fallback context if no MCP resources
    const currentURL = window.location.href;
    const pageTitle = document.title;
    return `Current URL: ${currentURL}\nPage Title: ${pageTitle}`;
  }

  getTools() {
    // Legacy method for backward compatibility
    return this.listTools().then(response => response.tools);
  }

  getContext() {
    // Legacy method for backward compatibility  
    return this.listResources().then(async (response) => {
      if (response.resources.length === 0) {
        return this.getPageContext();
      }
      
      let context = "";
      for (const resource of response.resources) {
        try {
          const resourceData = await this.readResource(resource.uri);
          context += `${resource.name}: ${resourceData.contents[0].text}\n\n`;
        } catch (error) {
          console.error(`Error reading resource ${resource.uri}:`, error);
        }
      }
      return context;
    });
  }

  parseDOMTools() {
    const tools = new Map();
    const context = new Map();

    const toolElements = document.querySelectorAll('tool[name]');
    toolElements.forEach(toolEl => {
      const name = toolEl.getAttribute('name');
      const description = toolEl.getAttribute('description') || '';
      
      const schema = this.parseToolSchema(toolEl);
      
      tools.set(name, {
        name,
        description,
        schema,
        element: toolEl
      });
    });

    const contextElements = document.querySelectorAll('context[name]');
    contextElements.forEach(contextEl => {
      const name = contextEl.getAttribute('name');
      const content = contextEl.textContent.trim();
      
      context.set(name, {
        name,
        content,
        element: contextEl
      });
    });

    this.tools = tools;
    this.context = context;
    
    return { tools: Array.from(tools.values()), context: Array.from(context.values()) };
  }

  parseToolSchema(toolEl) {
    const schema = {
      type: "object",
      properties: {},
      required: []
    };

    const props = toolEl.querySelectorAll(':scope > prop');
    props.forEach(prop => {
      const propSchema = this.parsePropElement(prop);
      schema.properties[propSchema.name] = propSchema.schema;
      if (prop.hasAttribute('required')) {
        schema.required.push(propSchema.name);
      }
    });

    const arrays = toolEl.querySelectorAll(':scope > array');
    arrays.forEach(array => {
      const arraySchema = this.parseArrayElement(array);
      schema.properties[arraySchema.name] = arraySchema.schema;
      if (array.hasAttribute('required')) {
        schema.required.push(arraySchema.name);
      }
    });

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
      type: "array",
      description,
      items: {
        type: "object",
        properties: {},
        required: []
      }
    };

    const dicts = arrayEl.querySelectorAll(':scope > dict');
    dicts.forEach(dict => {
      const props = dict.querySelectorAll('prop');
      props.forEach(prop => {
        const propSchema = this.parsePropElement(prop);
        schema.items.properties[propSchema.name] = propSchema.schema;
        if (prop.hasAttribute('required')) {
          schema.items.required.push(propSchema.name);
        }
      });
    });

    return { name, schema };
  }

  parseDOMResources() {
    const resources = new Map();
    
    // Parse <resource> elements (new MCP standard)
    const resourceElements = document.querySelectorAll('resource[name]');
    resourceElements.forEach(resourceEl => {
      const name = resourceEl.getAttribute('name');
      const description = resourceEl.getAttribute('description') || '';
      const content = resourceEl.textContent.trim();
      
      resources.set(name, {
        name,
        description,
        content,
        element: resourceEl
      });
    });
    
    // Parse <context> elements (backward compatibility)
    const contextElements = document.querySelectorAll('context[name]');
    contextElements.forEach(contextEl => {
      const name = contextEl.getAttribute('name');
      const description = contextEl.getAttribute('description') || '';
      const content = contextEl.textContent.trim();
      
      // Add as resource if not already defined by <resource> tag
      if (!resources.has(name)) {
        resources.set(name, {
          name,
          description,
          content,
          element: contextEl
        });
      }
    });
    
    this.resources = resources;
  }
}