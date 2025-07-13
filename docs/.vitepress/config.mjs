import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "VOIX Documentation",
  base: '/VOIX/',
  description: "VOIX is a lightweight browser framework that lets you add AI assistants to any website using just HTML. You define tools with <tool> tags and provide state with <context>, and the VOIX Chrome extension turns these into structured API calls the assistant can use—without touching your layout, styles, or data privacy.",
  head: [
    ['link', { rel: 'icon', href: '/VOIX/favicon.ico' }]
  ],
  themeConfig: {
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/svenschultze/VOIX/edit/master/docs/:path',
    },
    logo: '/voix_icon_128px.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Vision', link: '/vision' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Developer Guide', link: '/core-concepts' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'The VOIX Vision', link: '/vision' },
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
        text: 'Framework Integrations',
        items: [
          { text: 'Vue.js Integration', link: '/vue-integration' },
          { text: 'React Integration', link: '/react-integration' },
          { text: 'Svelte Integration', link: '/svelte-integration' },
          { text: 'Angular Integration', link: '/angular-integration' }
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
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Sven Schultze'
    },

    localeLinks: {
      text: 'English',
      items: [
        { text: 'German', link: '/de/' }
      ]
    },
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    de: {
      label: 'German',
      lang: 'de',
      link: '/de/',
      themeConfig: {
        nav: [
          { text: 'Startseite', link: '/de/' },
          { text: 'Vision', link: '/de/vision' },
          { text: 'Erste Schritte', link: '/de/getting-started' },
          { text: 'Entwicklerhandbuch', link: '/de/core-concepts' },
        ],
        sidebar: [
          {
            text: 'Einführung',
            items: [
              { text: 'Die VOIX-Vision', link: '/de/vision' },
              { text: 'Erste Schritte', link: '/de/getting-started' }
            ]
          },
          {
            text: 'Entwicklerhandbuch',
            items: [
              { text: 'Kernkonzepte', link: '/de/core-concepts' },
              { text: 'Werkzeuge', link: '/de/tools' },
              { text: 'Kontext', link: '/de/context' }
            ]
          },
          {
            text: 'Framework-Integrationen',
            items: [
              { text: 'Vue.js-Integration', link: '/de/vue-integration' },
              { text: 'React-Integration', link: '/de/react-integration' },
              { text: 'Svelte-Integration', link: '/de/svelte-integration' },
              { text: 'Angular-Integration', link: '/de/angular-integration' }
            ]
          },
          {
            text: 'Demos',
            items: [
              { text: 'To-Do-Liste', link: '/de/demo-todo-list' },
              { text: 'Produktsuche', link: '/de/demo-product-search' },
              { text: 'Formularassistent', link: '/de/demo-form-assistant' },
              { text: 'Navigationshelfer', link: '/de/demo-navigation' },
              { text: 'Datentabelle', link: '/de/demo-data-table' }
            ]
          }
        ],
      }
    }
  },
})
