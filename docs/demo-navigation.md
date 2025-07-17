---
layout: doc
---

<script setup>
import NavigationDemo from './components/NavigationDemo.vue'
</script>

# Navigation Helper Demo

This demo shows how VOIX can help users navigate through a multi-page application. The AI can understand page structure and help users find what they're looking for.

## How It Works

The navigation helper provides tools for moving between pages, opening/closing menus, and finding specific sections.

## Code

```html
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
<context name="navigation" id="nav-context">
  Current page: home
  Available pages: home, products, about, contact, docs
  Menu state: closed
  Breadcrumb: home
  Sections on page: hero, features, testimonials, cta
</context>

<!-- Page UI -->
<div id="app-container">
  <nav id="main-nav">
    <div class="nav-brand">Demo Site</div>
    <ul class="nav-menu" id="nav-menu">
      <li><a href="#" data-page="home" class="active">Home</a></li>
      <li><a href="#" data-page="products">Products</a></li>
      <li><a href="#" data-page="about">About</a></li>
      <li><a href="#" data-page="contact">Contact</a></li>
      <li><a href="#" data-page="docs">Docs</a></li>
    </ul>
    <button id="menu-toggle">☰</button>
  </nav>
  
  <div id="page-content">
    <div class="breadcrumb" id="breadcrumb">home</div>
    <div id="content-area"></div>
  </div>
  
  <div id="search-results" style="display: none;"></div>
</div>

<script>
// Page content
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
};

// State
let currentPage = 'home';
let menuOpen = false;
let history = ['home'];

// Tool handlers
const handlers = {
  go_to_page: ({ page }) => {
    if (pages[page]) {
      history.push(page);
      currentPage = page;
      renderPage();
      updateContext();
    }
  },
  
  open_section: ({ section }) => {
    const sectionEl = document.getElementById(`section-${section}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' });
      sectionEl.classList.add('highlight');
      setTimeout(() => sectionEl.classList.remove('highlight'), 2000);
    }
  },
  
  toggle_menu: ({ menu }) => {
    if (menu === 'main' || menu === 'mobile') {
      menuOpen = !menuOpen;
      document.getElementById('nav-menu').classList.toggle('open', menuOpen);
      updateContext();
    }
  },
  
  search_site: ({ query }) => {
    const results = [];
    Object.entries(pages).forEach(([pageName, page]) => {
      Object.entries(page.content).forEach(([section, content]) => {
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ page: pageName, section, snippet: content.substring(0, 100) + '...' });
        }
      });
    });
    
    showSearchResults(results, query);
  },
  
  go_back: () => {
    if (history.length > 1) {
      history.pop();
      currentPage = history[history.length - 1];
      renderPage();
      updateContext();
    }
  }
};

// Attach event listeners
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Navigation links
document.querySelectorAll('[data-page]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    handlers.go_to_page({ page: e.target.dataset.page });
  });
});

// Menu toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  handlers.toggle_menu({ menu: 'main' });
});

// Render page
function renderPage() {
  const page = pages[currentPage];
  const content = document.getElementById('content-area');
  
  content.innerHTML = page.sections.map(section => 
    `<section id="section-${section}" class="page-section">
      ${page.content[section]}
    </section>`
  ).join('');
  
  // Update nav active state
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === currentPage);
  });
  
  // Update breadcrumb
  document.getElementById('breadcrumb').textContent = history.join(' > ');
}

// Show search results
function showSearchResults(results, query) {
  const resultsEl = document.getElementById('search-results');
  
  if (results.length === 0) {
    resultsEl.innerHTML = `<h3>No results for "${query}"</h3>`;
  } else {
    resultsEl.innerHTML = `
      <h3>Search Results for "${query}"</h3>
      <ul>
        ${results.map(r => 
          `<li><strong>${pages[r.page].title}</strong> - ${r.section}: ${r.snippet}</li>`
        ).join('')}
      </ul>
    `;
  }
  
  resultsEl.style.display = 'block';
  setTimeout(() => {
    resultsEl.style.display = 'none';
  }, 5000);
}

// Update context
function updateContext() {
  const page = pages[currentPage];
  document.getElementById('nav-context').textContent = `
Current page: ${currentPage}
Available pages: ${Object.keys(pages).join(', ')}
Menu state: ${menuOpen ? 'open' : 'closed'}
Breadcrumb: ${history.join(' > ')}
Sections on page: ${page.sections.join(', ')}
  `;
}

// Initial render
renderPage();
updateContext();
</script>

<style>
#app-container {
  max-width: 800px;
  margin: 0 auto;
}

#main-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #333;
  color: white;
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
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.nav-menu a:hover,
.nav-menu a.active {
  background: #555;
}

#menu-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.breadcrumb {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  font-size: 0.875rem;
  color: #666;
}

#content-area {
  padding: 2rem 1rem;
}

.page-section {
  margin: 2rem 0;
  padding: 1rem;
  border-radius: 8px;
  transition: background 0.3s;
}

.page-section.highlight {
  background: #ffffcc;
}

#search-results {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #333;
    flex-direction: column;
    padding: 1rem;
  }
  
  .nav-menu.open {
    display: flex;
  }
  
  #menu-toggle {
    display: block;
  }
}
</style>
```

## Try It

<NavigationDemo />

## Example Interactions

Try these with VOIX:

- "Go to the products page"
- "Show me the documentation"
- "Open the team section"
- "Search for API"
- "Go back"
- "Toggle the menu"

The AI reads the navigation context to understand available pages and current location.
