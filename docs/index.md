---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "VOIX"
  image: ./logo.png
  text: "Documentation"
  tagline: VOIX is a lightweight browser framework that lets you add AI assistants to any website using just HTML. You define tools with <code>&lt;tool&gt;</code> tags and provide state with <code>&lt;context&gt;</code>, and the VOIX Chrome extension turns these into structured API calls the assistant can use—without touching your layout, styles, or data privacy.
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
  - icon: 💡
    title: Simplified AI Integration
    details: Expose your website's functionality to AI assistants using simple HTML tags. No backend changes, no complex SDKs, and no API maintenance.
    link: /getting-started
  - icon: 🔒
    title: Privacy by Design
    details: Users connect their own AI models. All data processing and conversation history stay private within the user's browser, never touching the website's servers.
    link: /vision
  - icon: 👑
    title: User Sovereignty
    details: Users are in complete control. They choose their AI provider (OpenAI, Anthropic, local models), their interface, and how they interact with your site.
    link: /vision
  - icon: 🌐
    title: Open & Decentralized
    details: VOIX is a proposed open standard, not a platform. This fosters a competitive ecosystem of user agents and prevents vendor lock-in for developers and users.
    link: /vision
---

<style>
code {
  border-radius: 4px;
  padding: 3px 6px;
  background-color: var(--vp-code-bg);
  transition: color 0.25s, background-color 0.5s;
  color: var(--vp-code-color);
  font-size: 0.9em;
}
</style>