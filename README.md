# VOIX

**VOIX is a lightweight browser framework that lets you add AI assistants to any website using just HTML. You define tools with `<tool>` tags and provide state with `<context>`, and the VOIX Chrome extension turns these into structured API calls the assistant can use—without touching your layout, styles, or data privacy.**

## 📖 Full Documentation

For complete documentation, visit: [https://svenschultze.github.io/VOIX/](https://svenschultze.github.io/VOIX/)

## 🚀 Key Features

  * **Easy Integration**: Add AI capabilities to any website with simple HTML tags. No complex setup or API integration is required.
  * **Powerful Tools**: Define custom tools that let AI interact with your application through a declarative, HTML-based API.
  * **Flexible Configuration**: Support for multiple AI providers including OpenAI, Anthropic, Azure, and local models with Ollama.
  * **Context Awareness**: Provide real-time application state to AI for intelligent, contextual responses.
  * **Framework Agnostic**: Works with React, Vue, Svelte, or vanilla JavaScript.
  * **Privacy First**: All data stays local in your browser. No tracking, no data collection, and complete user control.

## 🌐 The Vision

VOIX represents a fundamental shift in web-AI integration. Rather than each website building its own chatbot or API integrations, VOIX establishes a standard where:

### Websites Become Capability Providers
- Sites declare what they can do using `<tool>` and `<context>` tags
- No need for AI infrastructure or API keys
- Works like semantic HTML—simple, declarative, and standards-based

### Users Maintain Complete Control
- Choose any AI provider (OpenAI, Anthropic, local models)
- Conversations never touch the website's servers
- Switch providers anytime without losing functionality

### Innovation Remains Decentralized
- VOIX is a standard, not a product
- Anyone can build compatible interfaces
- Future browsers could integrate native support
- Enables an ecosystem like we have with web browsers today

Imagine a future where `<tool>` and `<context>` are HTML standards, where every browser supports AI interactions natively, and where privacy isn't a feature but an architectural guarantee. VOIX is the first step toward that future.

## ⚙️ How It Works

VOIX operates through a simple yet powerful architecture, connecting your website with an AI assistant via a Chrome extension.

1.  **Declare Capabilities on Your Website**: You declare what actions the AI can perform and provide it with the current state using simple HTML tags.

      * `<tool>` elements define actions the AI can take.
      * `<context>` elements provide the AI with information about the current state of the page.

2.  **Extension Discovery**: The VOIX Chrome extension scans the webpage for `<tool>` and `<context>` elements to understand the available actions and the current state.

3.  **User Interaction**: A user interacts with your site by typing or speaking natural language commands.

4.  **AI Understanding and Tool Execution**: The AI interprets the user's request, reads the available tools and context, and determines which tool to use with what parameters. It then triggers a `call` event on the appropriate tool element. Your JavaScript code listens for these events to execute the corresponding actions.

This architecture allows developers to add AI capabilities without needing to integrate complex APIs or SDKs. You control what the AI can do and what data it can access, and the user's conversation with the AI remains private.

## 📦 Installation and Setup

### Chrome Web Store Installation

1.  Visit the [VOIX Chrome Extension](https://chromewebstore.google.com/detail/voix/agmhpolimgfdfnlgciajhbkdapkophie) on the Chrome Web Store.
2.  Click "Add to Chrome".
3.  Confirm the installation when prompted.
4.  The VOIX icon will appear in your Chrome toolbar.

### Initial Setup

1.  **Open VOIX Settings**: Click the VOIX extension icon in your toolbar and select "Options."
2.  **Configure Your AI Provider**: Choose and configure an AI provider like OpenAI, Azure OpenAI, Anthropic, or a local model via Ollama by providing the necessary credentials (API key, Base URL, etc.).
3.  **Configure Voice Input (Optional)**: VOIX uses OpenAI's Whisper API for voice transcription, which you can configure in the settings.
4.  **Test Your Configuration**: Click "Test Connection" to verify your settings and then save them.

## core concepts

### Tools

Tools are HTML elements that declare actions an AI can perform on your website.

**Basic Structure**

```html
<tool name="toolName" description="What this tool does">
  <prop name="paramName" type="string" required/>
</tool>
```

**Attributes**

  * `name` (required): A unique identifier for the tool.
  * `description` (required): A clear explanation of the tool's function for the AI.

**Parameters (`<prop>`)**
You can define parameters for a tool using `<prop>` elements with the following attributes:

  * `name`: The parameter's identifier.
  * `type`: The data type (`string`, `number`, `boolean`).
  * `description`: An explanation of the parameter, including any formatting requirements.
  * `required`: Indicates if the parameter is mandatory.

**Handling Tool Calls**
When the AI decides to use a tool, a `call` event is dispatched on the tool's HTML element. You can listen for this event using JavaScript to execute the desired action.

```javascript
document.querySelector('[name=create_task]').addEventListener('call', (e) => {
  const { title } = e.detail;
  // Your code to create the task
});
```

### Context

Context elements provide the AI with plain text information about your application's current state.

**Basic Structure**

```html
<context name="contextName">
  Plain text content here
</context>
```

**Attribute**

  * `name` (required): A unique identifier for the context block.

**Best Practices**

  * **Keep it Simple**: Use plain, human-readable text. Avoid raw JSON or HTML.
  * **Be Concise**: Only provide information that is relevant to the AI's understanding of the current state.
  * **Update Frequently**: Keep the context current by updating it whenever your application's state changes.

## 🚀 Using VOIX

  * **Opening the Chat Panel**: Click the VOIX icon in your toolbar and select "Open side panel".
  * **Basic Chat**: Type your message in the input field and press Enter.
  * **Voice Input**: Click the microphone button to start and stop recording your voice command.
  * **Live Voice Mode**: Click the live voice button for continuous listening and responding.
  * **Thinking Mode**: Click the lightbulb button to see the AI's reasoning process.

## 🔒 Privacy & Security

  * API keys are stored locally in your browser.
  * Voice recordings and chat messages are sent directly to your configured AI provider.
  * VOIX does not collect or store any personal data.
  * Page content is only accessed when you interact with VOIX.