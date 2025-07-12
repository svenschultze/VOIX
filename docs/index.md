---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "VOIX"
  image: voix_icon_128px.png
  text: "Documentation"
  tagline: VOIX is a lightweight browser framework that lets you add AI assistants to any website using just HTML. You define tools with &lt;tool&gt; tags and provide state with &lt;context&gt;, and the VOIX Chrome extension turns these into structured API calls the assistant can use—without touching your layout, styles, or data privacy.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Vision
      link: /vision
    - theme: alt
      text: Developer Guide
      link: /core-concepts

features:
  - icon: 🚀
    title: Easy Integration
    details: Add AI capabilities to any website with simple HTML tags. No complex setup or API integration required.
    link: /getting-started
  - icon: 🛠️
    title: Powerful Tools
    details: Define custom tools that let AI interact with your application through a declarative, HTML-based API.
    link: /tools
  - icon: 🔧
    title: Flexible Configuration
    details: Support for multiple AI providers including OpenAI, Anthropic, Azure, and local models with Ollama.
    link: /getting-started
  - icon: 📊
    title: Context Awareness
    details: Provide real-time application state to AI for intelligent, contextual responses.
    link: /context
  - icon: 🎯
    title: Framework Agnostic
    details: Works with React, Vue, Svelte, or vanilla JavaScript. Complete examples for all major frameworks.
    link: /core-concepts
  - icon: 🔒
    title: Privacy First
    details: All data stays local in your browser. No tracking, no data collection, complete user control.
    link: /core-concepts
---

