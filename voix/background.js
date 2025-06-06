chrome.runtime.onInstalled.addListener(() => {
  console.log('VOIX installed');
});

// Handle extension icon click to toggle chat
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to toggle chat
    await chrome.tabs.sendMessage(tab.id, {type: 'TOGGLE_CHAT'});
  } catch (error) {
    console.error('Error toggling chat:', error);
    // If content script isn't loaded yet, try to inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['mcp-server.js', 'content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['chat.css']
      });
      // Try again after injection
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, {type: 'TOGGLE_CHAT'});
        } catch (retryError) {
          console.error('Error after retry:', retryError);
        }
      }, 100);
    } catch (injectionError) {
      console.error('Error injecting content script:', injectionError);
    }
  }
});

// Handle messages from content script and options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LLM_REQUEST') {
    handleLLMRequest(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'TEST_CONNECTION') {
    testConnection(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // Add a new message type for example prompts
  if (message.type === 'GET_EXAMPLE_PROMPTS') {
    generateExamplePrompts(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function getSettings() {
  const defaultSettings = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    maxTokens: '1000',
    temperature: '0.7'
  };
  
  try {
    const settings = await chrome.storage.sync.get(defaultSettings);
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
}

async function testConnection(testData) {
  try {
    const { baseUrl, apiKey, model } = testData;
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4',
        messages: [{ role: 'user', content: 'Hello, this is a connection test.' }],
        max_tokens: 10,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { success: true, model: data.model };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { success: false, error: error.message };
  }
}

async function handleLLMRequest(data) {
  const { messages, tools, context } = data;
  
  try {
    const settings = await getSettings();
    
    if (!settings.apiKey) {
      throw new Error('API key not configured. Please go to extension settings to configure your OpenAI API key.');
    }

    // Prepare the system message with available tools and context
    const systemMessage = createSystemMessage(tools, context);
    
    // Prepare messages for the API - handle existing conversation history
    let apiMessages = [];
    
    // Add system message if not already present
    if (messages.length === 0 || messages[0].role !== 'system') {
      apiMessages.push({ role: 'system', content: systemMessage });
    }
    
    // Add conversation messages (keep last 20 to manage token limit)
    apiMessages = apiMessages.concat(messages.slice(-20));

    const requestBody = {
      model: settings.model,
      messages: apiMessages,
      max_tokens: parseInt(settings.maxTokens) || 1000,
      temperature: parseFloat(settings.temperature) || 0.7
    };

    // Only add tools if available
    if (tools && tools.length > 0) {
      requestBody.tools = formatToolsForAPI(tools);
      requestBody.tool_choice = 'auto';
    }

    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const assistantMessage = result.choices?.[0]?.message;
    
    if (!assistantMessage) {
      throw new Error('No response message received from API');
    }

    // Return the raw OpenAI message directly
    return assistantMessage;
    
  } catch (error) {
    console.error('LLM request error:', error);
    
    // Fall back to mock responses if API fails
    console.log('Falling back to mock responses...');
    return handleMockResponse(data);
  }
}

function formatToolsForAPI(tools) {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || tool.schema // Support both new and legacy format
    }
  }));
}

function createSystemMessage(tools, context) {
  let systemMessage = `You are a helpful AI assistant integrated into a web browser extension called VOIX. You can help users interact with web pages through available tools.

Current page context:
${context || 'No specific context available.'}

Instructions:
- Help the user accomplish tasks on the current web page
- Use available tools when appropriate to perform actions
- Be concise and helpful in your responses
- If a user asks you to perform an action that requires a tool, use the appropriate tool
- If no relevant tools are available, explain what tools would be needed`;

  return systemMessage;
}


// Fallback mock responses (keeping the original logic as backup)
async function handleMockResponse(data) {
  const { messages, tools, context } = data;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  if (lastMessage.toLowerCase().includes('schedule')) {
    return {
      type: 'tool_call',
      tool_name: 'set_schedule',
      arguments: {
        schedule: [
          { starttime: "09:00", endtime: "11:00", type: "work" },
          { starttime: "11:30", endtime: "12:30", type: "meeting" },
          { starttime: "13:30", endtime: "17:00", type: "work" }
        ]
      }
    };
  }
  
  if (lastMessage.toLowerCase().includes('date')) {
    const dateRegex = /(\d{4}-\d{2}-\d{2})/;
    const match = lastMessage.match(dateRegex);
    const date = match ? match[1] : '2025-06-05';
    
    return {
      type: 'tool_call',
      tool_name: 'switch_date',
      arguments: { date }
    };
  }
  
  if (lastMessage.toLowerCase().includes('vacation') || lastMessage.toLowerCase().includes('absence')) {
    return {
      type: 'tool_call',
      tool_name: 'plan_absence',
      arguments: {
        type: 'vacation',
        from: '2025-06-15',
        to: '2025-06-20'
      }
    };
  }
  
  // Default response
  return {
    type: 'message',
    content: `I can help you with web automation tasks. ${tools.length > 0 ? `I found ${tools.length} tools available on this page: ${tools.map(t => t.name).join(', ')}.` : 'No tools are available on this page.'}\n\nTo use the AI features, please configure your OpenAI API key in the extension settings.`
  };
}

async function generateExamplePrompts({ tools, context }) {
  const settings = await getSettings();
  
  // If no API key, return fallback examples
  if (!settings.apiKey) {
    return {
      prompts: [
        "What tools are available on this page?",
        "Help me with this page",
        "Show me what I can do here"
      ]
    };
  }

  // Build detailed tool descriptions for better prompt generation
  const toolsDescription = tools.map(tool => {
    let desc = `${tool.name}: ${tool.description}`;
    if (tool.params && tool.params.length > 0) {
      const params = tool.params.map(p => `${p.name} (${p.type})`).join(', ');
      desc += ` [Parameters: ${params}]`;
    }
    return desc;
  }).join('\n');

  const systemPrompt = `Generate 3 example user instructions for an AI assistant with these tools and context:

Tools:
${toolsDescription}

Context:
${context}

Return only a JSON array of 3 short, natural user instructions that would use these tools. Each should be 5-15 words. /no_think`;

  const requestBody = {
    model: settings.model,
    messages: [{ role: 'user', content: systemPrompt }],
    max_tokens: 2096,
    temperature: 0.7
  };

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    const result = await response.json();
    let content = result.choices?.[0]?.message?.content;
    
    // Try to parse JSON array from response
    const jsonMatch = content.match(/\[.*?\]/s);
    if (jsonMatch) {
      const prompts = JSON.parse(jsonMatch[0]);
      return { prompts };
    }
    
    throw new Error('No JSON array found in response');
  } catch (error) {
    console.error('Failed to generate example prompts:', error);
    // Return fallback examples based on available tools
    const fallbackPrompts = [];
    if (tools.some(t => t.name.includes('schedule'))) {
      fallbackPrompts.push("Set my work schedule for today");
    }
    if (tools.some(t => t.name.includes('date'))) {
      fallbackPrompts.push("Switch to tomorrow's date");
    }
    if (tools.some(t => t.name.includes('absence'))) {
      fallbackPrompts.push("Plan my vacation next week");
    }
    
    if (fallbackPrompts.length === 0) {
      fallbackPrompts.push("What can you help me with?", "Show available tools", "Help me with this page");
    }
    
    return { prompts: fallbackPrompts.slice(0, 3) };
  }
}