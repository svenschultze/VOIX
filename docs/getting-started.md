# Getting Started with VOIX

## Installation

### Chrome Web Store Installation

1. Visit the [VOIX Chrome Extension](https://chromewebstore.google.com/detail/voix/agmhpolimgfdfnlgciajhbkdapkophie) on the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation when prompted
4. The VOIX icon will appear in your Chrome toolbar

### After Installation

Once installed, VOIX will automatically:
- Add a side panel that can be opened on any website
- Detect VOIX-compatible elements on web pages
- Enable voice input and AI chat functionality

## Initial Setup

### 1. Open VOIX Settings

Click the VOIX extension icon in your toolbar and select "Options" or right-click the extension icon and choose "Options".

### 2. Configure Your AI Provider

VOIX supports multiple AI providers. Choose one and configure it:

#### OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **API Key**: Your OpenAI API key (starts with `sk-`)
- **Model**: `gpt-4` or `gpt-3.5-turbo`
- **Max Tokens**: 1000 (adjust as needed)
- **Temperature**: 0.7 (balanced creativity)

#### Azure OpenAI
- **Base URL**: `https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT`
- **API Key**: Your Azure OpenAI key
- **Model**: Your deployment name
- **Max Tokens**: 1000
- **Temperature**: 0.7

#### Anthropic (Claude)
- **Base URL**: `https://api.anthropic.com/v1`
- **API Key**: Your Anthropic API key
- **Model**: `claude-3-opus` or `claude-3-sonnet`
- **Max Tokens**: 1000
- **Temperature**: 0.7

#### Local (Ollama)
- **Base URL**: `http://localhost:11434/v1`
- **API Key**: Not required (leave empty)
- **Model**: `llama3`, `mistral`, or your installed model
- **Max Tokens**: 1000
- **Temperature**: 0.7

### 3. Configure Voice Input (Optional)

VOIX uses OpenAI's Whisper API for voice transcription:

- **Language**: Select your preferred language or use "Auto-detect"
- **Model**: `whisper-1` (default)
- **Response Format**: `json` (recommended)
- **Temperature**: 0 (most accurate)
- **Custom Prompt**: Optional context for better transcription

### 4. Test Your Configuration

1. Click "Test Connection" to verify your API settings
2. You should see a success message if everything is configured correctly
3. Save your settings

## Using VOIX

### Opening the Chat Panel

There are two ways to open VOIX:

1. **Side Panel** (Recommended):
   - Click the VOIX icon in your toolbar
   - Select "Open side panel"
   - The chat interface will appear on the right side of your browser

2. **Floating Chat**:
   - Some websites may show a floating VOIX button
   - Click it to open the chat interface

### Basic Chat

1. Type your message in the input field
2. Press Enter or click the send button
3. VOIX will respond based on the current page context

### Voice Input

1. Click the microphone button 🎤
2. Speak your message
3. Click the microphone again to stop recording
4. Your speech will be transcribed and sent

### Live Voice Mode

1. Click the live voice button 🎯
2. VOIX will continuously listen and respond
3. Click again to disable live mode

### Thinking Mode

1. Click the lightbulb button 💡
2. VOIX will show its reasoning process
3. Useful for complex tasks or debugging

## Interacting with VOIX-Compatible Websites

VOIX automatically detects compatible elements on websites:

### Tools
When a website has `<tool>` elements, VOIX can:
- Execute actions on the page
- Fill forms
- Click buttons
- Extract data

### Context
VOIX reads `<context>` elements to understand:
- Current page state
- User information
- Application data

### Resources
VOIX can access `<resource>` elements for:
- Additional documentation
- API references
- Help content

## Troubleshooting

### Connection Issues

If you see "Failed to connect to API":
1. Check your API key is correct
2. Verify the base URL matches your provider
3. Ensure you have an active internet connection
4. Check if your API key has sufficient credits

### Voice Input Not Working

1. Ensure microphone permissions are granted
2. Check your browser's microphone settings
3. Verify Whisper API settings are configured
4. Test with a different browser tab

### VOIX Not Detecting Tools

1. Refresh the page
2. Check if the website has proper `<tool>` elements
3. Open developer console for any errors
4. Ensure JavaScript is enabled

## Privacy & Security

- API keys are stored locally in your browser
- Voice recordings are sent to your configured Whisper API
- Chat messages are sent to your configured AI provider
- VOIX does not collect or store any personal data
- Page content is only accessed when you interact with VOIX

## Next Steps

- Learn about [Core Concepts](./core-concepts.md) to understand how VOIX works
- Explore [Tools](./tools.md) to build VOIX-compatible websites
- Check out [Examples](./examples.md) for implementation ideas