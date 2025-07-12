import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "VOIX Documentation",
  base: '/VOIX/',
  description: "VOIX is a lightweight browser framework that lets you add AI assistants to any website using just HTML. You define tools with <tool> tags and provide state with <context>, and the VOIX Chrome extension turns these into structured API calls the assistant can use—without touching your layout, styles, or data privacy.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/voix_icon_128px.png',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Developer Guide', link: '/core-concepts' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'Developer Guide',
        items: [
          { text: 'Core Concepts', link: '/core-concepts' },
          { text: 'Tools', link: '/tools' },
          { text: 'Context', link: '/context' }
        ]
      },
      {
        text: 'Resources',
        items: [
          { text: 'Examples', link: '/examples' }
        ]
      },
      {
        text: 'Demos',
        items: [
          { text: 'Todo List', link: '/demo-todo-list' },
          { text: 'Product Search', link: '/demo-product-search' },
          { text: 'Form Assistant', link: '/demo-form-assistant' },
          { text: 'Navigation Helper', link: '/demo-navigation' },
          { text: 'Data Table', link: '/demo-data-table' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/svenschultze/voix-chrome' }
    ]
  }
})
