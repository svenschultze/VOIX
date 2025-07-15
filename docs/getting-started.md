# Getting Started with VOIX

## Installation

### Chrome Web Store Installation

1. Visit the [VOIX Chrome Extension](https://chromewebstore.google.com/detail/voix/agmhpolimgfdfnlgciajhbkdapkophie) on the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation when prompted
4. The VOIX icon will appear in your Chrome toolbar

### 1. Open VOIX Settings

Click the VOIX extension icon in your toolbar and select "Options" or right-click the extension icon and choose "Options".

### 2. Configure Your AI Provider

VOIX supports multiple AI providers. Choose one and configure it:

#### OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **API Key**: Your OpenAI API key (starts with `sk-`)
- **Model**: `gpt-4` or `gpt-3.5-turbo`

#### OpenAI-compatible (e.g. Azure OpenAI)
- **Base URL**: Your OpenAI-compatible endpoint (e.g. `https://api.example.org/v1`)
- **API Key**: Your API key
- **Model**: Your model name

#### Local (Ollama)
- **Base URL**: `http://localhost:11434/v1`
- **API Key**: Not required (leave empty)
- **Model**: `qwen3`, `mistral`, or your installed model

### 3. Configure Voice Input (Optional)

VOIX uses OpenAI's Whisper API for voice transcription:

- **Language**: Select your preferred language or use "Auto-detect"
- **Model**: `whisper-1` (default)
- **Base URL**: Leave empty to use the same as your AI provider, otherwise specify another OpenAI-compatible endpoint
- **API Key**: Your API key (if using a separate endpoint)

### 4. Test Your Configuration

1. Click "Test Connection" to verify your API settings
2. You should see a success message if everything is configured correctly
3. Save your settings

## Using VOIX

### Opening the Chat Panel
- Click the VOIX icon in your toolbar
- The chat interface will appear on the right side of your browser

### Basic Chat

1. Type your message in the input field
2. Press Enter or click the send button
3. VOIX will respond based on the current page context

### Voice Input

1. Click the microphone button 🎤
2. Speak your message
3. Click the microphone again to stop recording
4. Your speech will be transcribed

### Live Voice Mode

1. Click the live voice button 🎯
2. VOIX will continuously listen and respond
3. Click again to disable live mode

### Thinking Mode

1. Click the lightbulb button 💡
2. If compatible, the AI will respond after reasoning for some time
3. Useful for complex tasks

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


> [!INFO]
> **This documentation itself is an example of a VOIX-compatible page**, using `<tool>` to allow chat based navigation and `<context>` elements to provide the full API documentation. Try it out by asking questions like:
> ```plaintext
> "How do I use tools in VOIX?"
> "Navigate to the context documentation"
> "How do I integrate VOIX with Svelte?"
> ```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md) to understand how VOIX works
- Explore [Demos](./demo-weather.md) to see VOIX in action

<!--@include: @/voix_context.md -->