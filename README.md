# DOM MCP Agent Chrome Extension

## Overview

DOM MCP Agent is a powerful Chrome extension that integrates AI assistance directly into web pages using the Model Context Protocol (MCP). It provides an intelligent chat interface that can interact with web page elements and execute custom tools defined within the DOM.

## Features

### 🤖 AI-Powered Chat Interface
- **Floating or Docked Chat**: Choose between a floating window or side-panel docked to left/right
- **Drag & Drop**: Easily reposition the chat window by dragging
- **Resizable**: Adjust chat window size to your preference
- **Keyboard Shortcut**: Toggle chat with `Ctrl+Shift+A`

### 🔧 DOM Tool Integration
- **Custom Tool Discovery**: Automatically scans web pages for `<tool>` elements
- **Dynamic Tool Execution**: Execute tools defined in the DOM via AI commands
- **Context Awareness**: Uses `<context>` elements to understand page-specific information
- **Event-Driven Architecture**: Tools respond to custom events for seamless integration

### ⚙️ Flexible AI Configuration
- **Multiple AI Providers**: Supports OpenAI, Azure OpenAI, Anthropic, and local models (Ollama)
- **Customizable Settings**: Configure API endpoints, models, temperature, and token limits
- **Connection Testing**: Built-in connection testing for API validation
- **Fallback Responses**: Mock responses when API is unavailable

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The DOM MCP Agent icon should appear in your toolbar

## Configuration

1. Right-click the extension icon and select "Options"
2. Configure your AI provider settings:
   - **Base URL**: API endpoint (e.g., `https://api.openai.com/v1`)
   - **API Key**: Your authentication key
   - **Model**: AI model to use (e.g., `gpt-4`)
   - **Max Tokens**: Response length limit
   - **Temperature**: Response creativity (0-1)

### Quick Presets
- **OpenAI**: Standard OpenAI API configuration
- **Azure OpenAI**: Azure-hosted OpenAI services
- **Local (Ollama)**: Local AI models via Ollama
- **Anthropic**: Anthropic's Claude models

## Usage

### Basic Chat
1. Click the extension icon or press `Ctrl+Shift+A` to open the chat
2. Type your message and press Enter or click Send
3. The AI will respond based on the current page context

### DOM Tool Integration

The extension automatically discovers tools defined in HTML using special elements:

#### Tool Definition
```html
<tool name="set_schedule" description="Set a work schedule">
  <prop name="date" type="string" description="Schedule date" required>2025-06-05</prop>
  <array name="schedule" description="Time blocks">
    <dict>
      <prop name="starttime" type="string" required>09:00</prop>
      <prop name="endtime" type="string" required>17:00</prop>
      <prop name="type" type="string">work</prop>
    </dict>
  </array>
</tool>
```

#### Context Definition
```html
<context name="current_user">
  User: John Doe
  Role: Developer
  Current page: Project Dashboard
</context>
```

#### Tool Event Handling
```javascript
document.querySelector('tool[name="set_schedule"]').addEventListener('call', (event) => {
  const { schedule, date } = event.detail;
  // Execute your custom logic here
  console.log(`Setting schedule for ${date}:`, schedule);
});
```

## File Structure

```
voix-chrome/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for API calls
├── content.js            # Main chat interface
├── mcp-server.js         # DOM tool discovery and execution
├── options.html          # Settings page UI
├── options.js            # Settings page logic
├── chat.css             # Chat interface styles
├── icon.png             # Extension icon
└── test.html            # Test page for development
```

## Architecture

### Components

1. **Background Script** (`background.js`)
   - Handles API communication with AI providers
   - Manages extension settings
   - Processes tool calls and responses

2. **Content Script** (`content.js`)
   - Renders the chat interface
   - Manages UI interactions and positioning
   - Handles drag, drop, and resize functionality

3. **MCP Server** (`mcp-server.js`)
   - Discovers tools and context in the DOM
   - Parses tool schemas and parameters
   - Dispatches tool execution events

4. **Options Page** (`options.html`, `options.js`)
   - Configuration interface for AI settings
   - Connection testing and preset management

### Data Flow

1. User opens chat and sends a message
2. Content script gathers page context and available tools
3. Background script sends request to AI provider
4. AI responds with text or tool call instructions
5. If tool call: MCP server executes the tool via DOM events
6. Response is displayed in the chat interface

## Development

### Testing
Open `test.html` in your browser to test tool discovery and execution with sample tools.

### Adding Custom Tools
1. Define tools in your HTML using the `<tool>` element syntax
2. Add event listeners to handle tool execution
3. Optionally add `<context>` elements for page-specific information

### Extending Functionality
- Modify `mcp-server.js` to support additional tool schema formats
- Update `content.js` to add new UI features
- Extend `background.js` to support additional AI providers

## Permissions

The extension requires the following permissions:
- `activeTab`: Interact with the current tab
- `storage`: Save user settings
- `scripting`: Inject content scripts
- `tabs`: Access tab information
- `<all_urls>`: Work on all websites

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

## Troubleshooting

### Chat Not Appearing
- Check if the extension is enabled in `chrome://extensions/`
- Try refreshing the page and clicking the extension icon again
- Check browser console for error messages

### API Connection Issues
- Verify your API key and base URL in the extension options
- Use the "Test Connection" button to validate settings
- Check network connectivity and firewall settings

### Tools Not Detected
- Ensure tools are defined with proper `<tool>` element syntax
- Check that tools have the required `name` attribute
- Verify JavaScript console for parsing errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests, please create an issue in the project repository.