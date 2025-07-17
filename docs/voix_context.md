<context name="voix">
  This is the documentation for Voix. Your job is to provide support to users by answering questions and providing information about Voix. Be concise and helpful. Use the context provided to answer questions about Voix. Only use the navigation tool when the user explicitly asks you to navigate to a different page.
</context>

<context name="tools">
{{ data.tools }}
</context>

<context name="contexts">
{{ data.contexts }}
</context>

<context name="vision">
{{ data.vision }}
</context>

<context name="getting-started">
{{ data['getting-started'] }}
</context>

<context name="core-concepts">
{{ data['core-concepts'] }}
</context>

<context name="svelte-integration">
{{ data['svelte-integration'] }}
</context>

<context name="react-integration">
{{ data['react-integration'] }}
</context>

<context name="vue-integration">
{{ data['vue-integration'] }}
</context>

<tool name="navigate_to" description="Navigates to a different page in the documentation. Only navigate if the user explicitly asks you to navigate to that page. Do not use this when a questions is asked." @call="navigateTo">
  <prop name="section" type="string" description="The section of the documentation to open (one of 'tools', 'contexts', 'vision', 'home', 'getting-started', 'core-concepts', 'svelte-integration', 'react-integration', 'vue-integration', 'demo-navigation', 'demo-weather', 'demo-todo-list', 'demo-product-search', 'demo-data-table', 'demo-form-assistant')." required></prop>
</tool>

<script setup>
function navigateTo(e) {
    const { section } = e.detail
    const url = `${section}`;
    // go to that url in this tab
    window.open(url, '_self');
}

// fill contexts with the md file content (e.g. @/tools.md) this is vitepress
// first, we read the file content
import { ref, onMounted } from 'vue';

import { data } from "./load_context.data.js";
</script>