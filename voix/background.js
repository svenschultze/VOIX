import * as llm from './llm.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('VOIX installed');
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open the side panel
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Error opening side panel:', error);
    // Fallback to content script injection for older Chrome versions
    try {
      await chrome.tabs.sendMessage(tab.id, {type: 'TOGGLE_CHAT'});
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
      // Try to inject content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["inject.js"]
        });
      } catch (injectionError) {
        console.error('Error injecting content script:', injectionError);
      }
    }
  }
});

// Message routing: delegate LLM and connection logic to llm.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LLM_REQUEST') {
    console.log('Received LLM request:', message);
    llm.handleLLMRequest(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.type === 'TEST_CONNECTION') {
    llm.testConnection(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.type === 'GET_EXAMPLE_PROMPTS') {
    llm.generateExamplePrompts(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.type === 'WHISPER_TRANSCRIBE') {
    console.log('Received Whisper transcription request');
    llm.handleWhisperTranscription(message.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.type === 'REQUEST_MICROPHONE_PERMISSION') {
    console.log('Opening permissions tab for microphone access');
    openPermissionsTab()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function openPermissionsTab() {
  try {
    const permissionsUrl = chrome.runtime.getURL('permissions.html');
    await chrome.tabs.create({
      url: permissionsUrl,
      active: true
    });
  } catch (error) {
    console.error('Error opening permissions tab:', error);
    throw error;
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { type: 'PAGE_DATA_UPDATED' });
  }
});