<template>
  <div class="demo-container">
    <!-- Navigation tools -->
    <tool name="go_to_page" description="Navigate to a specific page">
      <prop name="page" type="string" description="Page name: home, products, about, contact, or docs"></prop>
    </tool>

    <tool name="open_section" description="Open a specific section on the current page">
      <prop name="section" type="string" description="Section identifier"></prop>
    </tool>

    <tool name="toggle_menu" description="Toggle navigation menu">
      <prop name="menu" type="string" description="main, user, or mobile"></prop>
    </tool>

    <tool name="search_site" description="Search for content across the site">
      <prop name="query" type="string" required></prop>
    </tool>

    <tool name="go_back" description="Go back to the previous page">
    </tool>

    <!-- Navigation context -->
    <context name="navigation" id="demo-nav-context">
      {{ contextText }}
    </context>

    <!-- Page UI -->
    <div id="demo-app">
      <nav id="demo-nav">
        <div class="nav-brand">Demo Site</div>
        <ul class="nav-menu" :class="{ open: menuOpen }">
          <li v-for="pageName in Object.keys(pages)" :key="pageName">
            <a href="#" 
               @click.prevent="goToPage(pageName)"
               :class="{ active: currentPage === pageName }">
              {{ pageName.charAt(0).toUpperCase() + pageName.slice(1) }}
            </a>
          </li>
        </ul>
        <button id="demo-menu-toggle" @click="toggleMenu">☰</button>
      </nav>
      
      <div id="demo-page-content">
        <div class="breadcrumb">{{ history.join(' > ') }}</div>
        <div id="demo-content-area">
          <section v-for="section in pages[currentPage].sections" 
                   :key="section" 
                   :id="`demo-section-${section}`" 
                   class="page-section">
            <div v-html="pages[currentPage].content[section]"></div>
          </section>
        </div>
      </div>
      
      <div v-if="searchResults" id="demo-search-results">
        <h3 v-if="searchResults.results.length === 0">No results for "{{ searchResults.query }}"</h3>
        <div v-else>
          <h3>Search Results for "{{ searchResults.query }}"</h3>
          <ul>
            <li v-for="(result, index) in searchResults.results" :key="index">
              <strong>{{ pages[result.page].title }}</strong> - {{ result.section }}: {{ result.snippet }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const pages = {
  home: {
    title: 'Welcome',
    sections: ['hero', 'features', 'testimonials', 'cta'],
    content: {
      hero: '<h1>Welcome to Demo Site</h1><p>Your AI-powered navigation experience</p>',
      features: '<h2>Features</h2><ul><li>Smart Navigation</li><li>Voice Control</li><li>AI Assistant</li></ul>',
      testimonials: '<h2>What Users Say</h2><p>"Amazing experience!" - User A</p><p>"So intuitive!" - User B</p>',
      cta: '<h2>Get Started</h2><button>Sign up now</button>'
    }
  },
  products: {
    title: 'Products',
    sections: ['catalog', 'featured', 'new'],
    content: {
      catalog: '<h1>Product Catalog</h1><p>Browse our full range</p>',
      featured: '<h2>Featured Products</h2><div class="product-grid">Featured items here</div>',
      new: '<h2>New Arrivals</h2><div class="product-grid">Latest products</div>'
    }
  },
  about: {
    title: 'About Us',
    sections: ['story', 'team', 'mission'],
    content: {
      story: '<h1>Our Story</h1><p>Founded in 2020...</p>',
      team: '<h2>Our Team</h2><p>Meet the people behind the product</p>',
      mission: '<h2>Our Mission</h2><p>To make the web more accessible</p>'
    }
  },
  contact: {
    title: 'Contact',
    sections: ['form', 'info', 'map'],
    content: {
      form: '<h1>Get in Touch</h1><form>Contact form here</form>',
      info: '<h2>Contact Information</h2><p>Email: info@demo.com<br>Phone: 555-0123</p>',
      map: '<h2>Find Us</h2><div class="map">Map placeholder</div>'
    }
  },
  docs: {
    title: 'Documentation',
    sections: ['getting-started', 'api', 'examples'],
    content: {
      'getting-started': '<h1>Getting Started</h1><p>Quick start guide...</p>',
      api: '<h2>API Reference</h2><p>Complete API documentation</p>',
      examples: '<h2>Examples</h2><p>Code examples and demos</p>'
    }
  }
}

const currentPage = ref('home')
const menuOpen = ref(false)
const history = ref(['home'])
const searchResults = ref(null)

const contextText = computed(() => {
  const page = pages[currentPage.value]
  return `Current page: ${currentPage.value}
Available pages: ${Object.keys(pages).join(', ')}
Menu state: ${menuOpen.value ? 'open' : 'closed'}
Breadcrumb: ${history.value.join(' > ')}
Sections on page: ${page.sections.join(', ')}`
})

const goToPage = (page) => {
  if (pages[page]) {
    history.value.push(page)
    currentPage.value = page
  }
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const handlers = {
  go_to_page: ({ page }) => {
    goToPage(page)
  },
  
  open_section: ({ section }) => {
    const sectionEl = document.getElementById(`demo-section-${section}`)
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' })
      sectionEl.classList.add('highlight')
      setTimeout(() => sectionEl.classList.remove('highlight'), 2000)
    }
  },
  
  toggle_menu: ({ menu }) => {
    if (menu === 'main' || menu === 'mobile') {
      menuOpen.value = !menuOpen.value
    }
  },
  
  search_site: ({ query }) => {
    const results = []
    Object.entries(pages).forEach(([pageName, page]) => {
      Object.entries(page.content).forEach(([section, content]) => {
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ page: pageName, section, snippet: content.substring(0, 100) + '...' })
        }
      })
    })
    
    searchResults.value = { query, results }
    setTimeout(() => {
      searchResults.value = null
    }, 5000)
  },
  
  go_back: () => {
    if (history.value.length > 1) {
      history.value.pop()
      currentPage.value = history.value[history.value.length - 1]
    }
  }
}

const handleToolCall = (e) => {
  const toolName = e.target.getAttribute('name')
  if (handlers[toolName]) {
    handlers[toolName](e.detail)
  }
}

onMounted(() => {
  const tools = document.querySelectorAll('.demo-container tool[name]')
  tools.forEach(tool => {
    tool.addEventListener('call', handleToolCall)
  })
})

onUnmounted(() => {
  const tools = document.querySelectorAll('.demo-container tool[name]')
  tools.forEach(tool => {
    tool.removeEventListener('call', handleToolCall)
  })
})
</script>

<style scoped>
.demo-container {
  border: 2px solid var(--vp-c-brand);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  background: var(--vp-c-bg-soft);
}

#demo-app {
  max-width: 800px;
  margin: 0 auto;
}

#demo-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--vp-c-divider);
}

.nav-brand {
  font-size: 1.25rem;
  font-weight: bold;
}

.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1rem;
}

.nav-menu a {
  color: var(--vp-c-text-1);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.nav-menu a:hover,
.nav-menu a.active {
  background: var(--vp-c-bg-soft);
}

#demo-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--vp-c-text-1);
  font-size: 1.5rem;
  cursor: pointer;
}

.breadcrumb {
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  border-left: 1px solid var(--vp-c-divider);
  border-right: 1px solid var(--vp-c-divider);
}

#demo-content-area {
  padding: 2rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.page-section {
  margin: 2rem 0;
  padding: 1rem;
  border-radius: 8px;
  transition: background 0.3s;
}

.page-section.highlight {
  background: var(--vp-c-brand-light);
}

#demo-search-results {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-brand);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 1000;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--vp-c-bg);
    flex-direction: column;
    padding: 1rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0 0 8px 8px;
  }
  
  .nav-menu.open {
    display: flex;
  }
  
  #demo-menu-toggle {
    display: block;
  }
}
</style>