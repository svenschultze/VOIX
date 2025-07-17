// LLM logic for VOIX extension

export async function getSettings() {
  const defaultSettings = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    temperature: '0.7',
    // Whisper settings
    whisperLanguage: 'en',
    whisperModel: 'whisper-1',
    whisperResponseFormat: 'json',
    whisperBaseUrl: '',
    whisperApiKey: '',
  };
  try {
    const settings = await chrome.storage.sync.get(defaultSettings);
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return defaultSettings;
  }
}

export async function testConnection(testData) {
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

export async function handleWhisperTranscription(data) {
  try {
    const settings = await getSettings();
    if (!settings.apiKey) {
      throw new Error('API key not configured. Please configure your OpenAI API key in the extension settings.');
    }

    // Convert base64 back to blob
    const audioData = atob(data.audioBlob);
    const audioArray = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }
    const audioBlob = new Blob([audioArray], { type: 'audio/webm' });

    // Create FormData for the API request
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', settings.whisperModel || 'whisper-1');
    formData.append('response_format', 'json');
    
    // Add language if not auto-detect
    if (settings.whisperLanguage && settings.whisperLanguage !== 'auto') {
      formData.append('language', settings.whisperLanguage);
    }

    const apiKey = settings.whisperApiKey || settings.apiKey;
    const baseUrl = settings.whisperBaseUrl || settings.baseUrl;

    // Make request to OpenAI Whisper API
    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Whisper API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    // Handle different response formats
    let transcriptionText = '';
    if (settings.whisperResponseFormat === 'json' || settings.whisperResponseFormat === 'verbose_json') {
      transcriptionText = result.text;
    } else {
      // For text, srt, vtt formats, the response is the text directly
      transcriptionText = typeof result === 'string' ? result : result.text || '';
    }
    
    if (!transcriptionText) {
      throw new Error('No transcription text received from Whisper API');
    }

    return {
      success: true,
      text: transcriptionText.trim()
    };

  } catch (error) {
    console.error('Whisper transcription error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Persistent conversation history (per extension session)
let conversationHistory = [];

export function resetConversationHistory() {
  conversationHistory = [];
}

export async function handleLLMRequest(message) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('No active tab found');

    // Fetch tools and context from the MCP server (inject.js)
    const pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
    const tools = pageData && pageData.tools ? pageData.tools : [];
    const context = (pageData && Array.isArray(pageData.context))
      ? pageData.context.map(c => `${c.name}: ${c.content}`).join('\n')
      : '';

    const settings = await getSettings();
    if (!settings.apiKey) {
      throw new Error('API key not configured. Please go to extension settings to configure your OpenAI API key.');
    }
    const systemMessage = createSystemMessage(tools, context);

    // Initialize conversation history if empty
    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
      conversationHistory = [{ role: 'system', content: systemMessage }];
    }
    // Always update the system message at the start
    conversationHistory[0] = { role: 'system', content: systemMessage };

    // Add the new user message
    if (message && message.role === 'user') {
      conversationHistory.push(message);
    } else if (typeof message === 'string') {
      conversationHistory.push({ role: 'user', content: message });
    }

    const requestBody = {
      model: settings.model,
      messages: conversationHistory,
      temperature: parseFloat(settings.temperature) || 0.7
    };
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
    // Add assistant message to conversation history
    conversationHistory.push(assistantMessage);

    // TOOL EXECUTION LOGIC
    if (assistantMessage.tool_calls && Array.isArray(assistantMessage.tool_calls) && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await chrome.tabs.sendMessage(tab.id, {
            type: 'MCP_CALL_TOOL',
            toolName,
            arguments: args
          });
          console.log(`Tool ${toolName} executed with result:`, toolResult);
          // Add tool result as a tool message to the conversation
          conversationHistory.push({
            role: 'tool',
            name: toolName,
            tool_call_id: toolCall.id,
            content: `Executed tool: ${toolName}: ${JSON.stringify(toolResult)}`,
          });
          toolResults.push({
            tool_call_id: toolCall.id,
            name: toolName,
            arguments: args,
            result: toolResult
          });
        } catch (err) {
          conversationHistory.push({
            role: 'tool',
            name: toolCall.function.name,
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: err.message })
          });
          toolResults.push({
            tool_call_id: toolCall.id,
            error: err.message
          });
        }
      }
      // If the assistant message is empty (trimmed) but tool calls are present, do the followup message thing
      if (!assistantMessage.content || assistantMessage.content.trim() === '') {
        // Add a user follow-up message to summarize the tool results
        conversationHistory.push({
          role: 'user',
          content: 'Please explain what you just did and summarize the results. /no_think'
        });
        const followupMessages = [conversationHistory[0], ...conversationHistory.slice(-20)];
        const followupRequest = {
          model: settings.model,
          messages: followupMessages,
          temperature: parseFloat(settings.temperature) || 0.7
        };
        const followupResponse = await fetch(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify(followupRequest)
        });
        const followupResult = await followupResponse.json();
        const followupMessage = followupResult.choices?.[0]?.message;
        if (followupMessage) conversationHistory.push(followupMessage);
        return {
            ...followupMessage,
            tool_results: toolResults
        }
      }
      // For now, just return the tool results along with the assistant message
      return {
        ...assistantMessage,
        tool_results: toolResults
      };
    }

    return assistantMessage;
  } catch (error) {
    console.error('LLM request error:', error);
    return handleMockResponse({ messages: conversationHistory });
  }
}

function formatToolsForAPI(tools) {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || tool.schema
    }
  }));
}

function createSystemMessage(tools, context) {
  let systemMessage = `You are a helpful AI assistant. You can help users interact with web pages through available tools.\n\nCurrent page context:\n${context || 'No specific context available.'}\n\nInstructions:\n- Help the user accomplish tasks on the current web page\n- Use available tools when appropriate to perform actions\n- Be concise and helpful in your responses\n- If a user asks you to perform an action that requires a tool, use the appropriate tool. Whenever you use a tool, you ALWAYS provide a brief summary of what you did.`
  return systemMessage;
}

// Fallback mock responses
async function handleMockResponse(data) {
  const { messages, tools, context } = data;
  await new Promise(resolve => setTimeout(resolve, 1000));
  const lastMessage = messages[messages.length - 1]?.content || '';
  if (lastMessage.toLowerCase().includes('schedule')) {
    return {
      type: 'tool_call',
      tool_name: 'set_schedule',
      arguments: {
        schedule: [
          { starttime: '09:00', endtime: '11:00', type: 'work' },
          { starttime: '11:30', endtime: '12:30', type: 'meeting' },
          { starttime: '13:30', endtime: '17:00', type: 'work' }
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
  return {
    type: 'message',
    content: `I can help you with web automation tasks. ${tools.length > 0 ? `I found ${tools.length} tools available on this page: ${tools.map(t => t.name).join(', ')}.` : 'No tools are available on this page.'}\n\nTo use the AI features, please configure your OpenAI API key in the extension settings.`
  };
}

export async function generateExamplePrompts({ tools, context }) {
  const settings = await getSettings();
  if (!settings.apiKey) {
    return {
      prompts: [
        'What tools are available on this page?',
        'Help me with this page',
        'Show me what I can do here'
      ]
    };
  }
  const toolsDescription = tools.map(tool => {
    let desc = `${tool.name}: ${tool.description}`;
    if (tool.params && tool.params.length > 0) {
      const params = tool.params.map(p => `${p.name} (${p.type})`).join(', ');
      desc += ` [Parameters: ${params}]`;
    }
    return desc;
  }).join('\n');
  const systemPrompt = `Generate 3 example user instructions for an AI assistant with these tools and context:\n\nTools:\n${toolsDescription}\n\nContext:\n${context}\n\nReturn only a JSON array of 3 short, natural user instructions that would use these tools. Each should be 5-15 words. /no_think`;
  const requestBody = {
    model: settings.model,
    messages: [{ role: 'user', content: systemPrompt }],
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
    const jsonMatch = content.match(/\[.*?\]/s);
    if (jsonMatch) {
      const prompts = JSON.parse(jsonMatch[0]);
      return { prompts };
    }
    throw new Error('No JSON array found in response');
  } catch (error) {
    const fallbackPrompts = [];
    if (tools.some(t => t.name.includes('schedule'))) {
      fallbackPrompts.push('Set my work schedule for today');
    }
    if (tools.some(t => t.name.includes('date'))) {
      fallbackPrompts.push("Switch to tomorrow's date");
    }
    if (tools.some(t => t.name.includes('absence'))) {
      fallbackPrompts.push('Plan my vacation next week');
    }
    if (fallbackPrompts.length === 0) {
      fallbackPrompts.push('What can you help me with?', 'Show available tools', 'Help me with this page');
    }
    return { prompts: fallbackPrompts.slice(0, 3) };
  }
}
