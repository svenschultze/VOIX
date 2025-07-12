---
layout: doc
---

<script setup>
import NavigationDemo from './components/NavigationDemo.vue'
</script>

# Navigationshelfer-Demo

Diese Demo zeigt, wie VOIX Benutzern bei der Navigation durch eine mehrseitige Anwendung helfen kann. Die KI kann die Seitenstruktur verstehen und Benutzern helfen, das zu finden, wonach sie suchen.

## Wie es funktioniert

Der Navigationshelfer bietet Werkzeuge zum Wechseln zwischen Seiten, zum Öffnen/Schließen von Menüs und zum Finden bestimmter Abschnitte.

## Code

```html
<!-- Navigationswerkzeuge -->
<tool name="go_to_page" description="Zu einer bestimmten Seite navigieren">
  <prop name="page" type="string" description="Seitenname: home, products, about, contact oder docs"/>
</tool>

<tool name="open_section" description="Einen bestimmten Abschnitt auf der aktuellen Seite öffnen">
  <prop name="section" type="string" description="Abschnittsbezeichner"/>
</tool>

<tool name="toggle_menu" description="Navigationsmenü umschalten">
  <prop name="menu" type="string" description="main, user oder mobile"/>
</tool>

<tool name="search_site" description="Inhalte auf der gesamten Website suchen">
  <prop name="query" type="string" required/>
</tool>

<tool name="go_back" description="Zur vorherigen Seite zurückkehren">
</tool>

<!-- Navigationskontext -->
<context name="navigation" id="nav-context">
  Aktuelle Seite: home
  Verfügbare Seiten: home, products, about, contact, docs
  Menüstatus: geschlossen
  Brotkrümel: home
  Abschnitte auf der Seite: hero, features, testimonials, cta
</context>

<!-- Seiten-UI -->
<div id="app-container">
  <nav id="main-nav">
    <div class="nav-brand">Demo-Seite</div>
    <ul class="nav-menu" id="nav-menu">
      <li><a href="#" data-page="home" class="active">Startseite</a></li>
      <li><a href="#" data-page="products">Produkte</a></li>
      <li><a href="#" data-page="about">Über uns</a></li>
      <li><a href="#" data-page="contact">Kontakt</a></li>
      <li><a href="#" data-page="docs">Doku</a></li>
    </ul>
    <button id="menu-toggle">☰</button>
  </nav>
  
  <div id="page-content">
    <div class="breadcrumb" id="breadcrumb">Startseite</div>
    <div id="content-area"></div>
  </div>
  
  <div id="search-results" style="display: none;"></div>
</div>

<script>
// Seiteninhalt
const pages = {
  home: {
    title: 'Willkommen',
    sections: ['hero', 'features', 'testimonials', 'cta'],
    content: {
      hero: '<h1>Willkommen auf der Demo-Seite</h1><p>Ihre KI-gestützte Navigationserfahrung</p>',
      features: '<h2>Funktionen</h2><ul><li>Intelligente Navigation</li><li>Sprachsteuerung</li><li>KI-Assistent</li></ul>',
      testimonials: '<h2>Was Benutzer sagen</h2><p>"Erstaunliche Erfahrung!" - Benutzer A</p><p>"So intuitiv!" - Benutzer B</p>',
      cta: '<h2>Jetzt loslegen</h2><button>Jetzt anmelden</button>'
    }
  },
  products: {
    title: 'Produkte',
    sections: ['catalog', 'featured', 'new'],
    content: {
      catalog: '<h1>Produktkatalog</h1><p>Durchsuchen Sie unser gesamtes Sortiment</p>',
      featured: '<h2>Ausgewählte Produkte</h2><div class="product-grid">Ausgewählte Artikel hier</div>',
      new: '<h2>Neuheiten</h2><div class="product-grid">Neueste Produkte</div>'
    }
  },
  about: {
    title: 'Über uns',
    sections: ['story', 'team', 'mission'],
    content: {
      story: '<h1>Unsere Geschichte</h1><p>Gegründet im Jahr 2020...</p>',
      team: '<h2>Unser Team</h2><p>Lernen Sie die Menschen hinter dem Produkt kennen</p>',
      mission: '<h2>Unsere Mission</h2><p>Das Web zugänglicher machen</p>'
    }
  },
  contact: {
    title: 'Kontakt',
    sections: ['form', 'info', 'map'],
    content: {
      form: '<h1>Kontakt aufnehmen</h1><form>Kontaktformular hier</form>',
      info: '<h2>Kontaktinformationen</h2><p>E-Mail: info@demo.com<br>Telefon: 555-0123</p>',
      map: '<h2>Finden Sie uns</h2><div class="map">Kartenplatzhalter</div>'
    }
  },
  docs: {
    title: 'Dokumentation',
    sections: ['getting-started', 'api', 'examples'],
    content: {
      'getting-started': '<h1>Erste Schritte</h1><p>Schnellstartanleitung...</p>',
      api: '<h2>API-Referenz</h2><p>Vollständige API-Dokumentation</p>',
      examples: '<h2>Beispiele</h2><p>Codebeispiele und Demos</p>'
    }
  }
};

// Zustand
let currentPage = 'home';
let menuOpen = false;
let history = ['home'];

// Werkzeug-Handler
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

// Event-Listener anhängen
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Navigationslinks
document.querySelectorAll('[data-page]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    handlers.go_to_page({ page: e.target.dataset.page });
  });
});

// Menü-Umschalter
document.getElementById('menu-toggle').addEventListener('click', () => {
  handlers.toggle_menu({ menu: 'main' });
});

// Seite rendern
function renderPage() {
  const page = pages[currentPage];
  const content = document.getElementById('content-area');
  
  content.innerHTML = page.sections.map(section => 
    `<section id="section-${section}" class="page-section">
      ${page.content[section]}
    </section>`
  ).join('');
  
  // Aktiven Zustand der Navigation aktualisieren
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === currentPage);
  });
  
  // Brotkrümel aktualisieren
  document.getElementById('breadcrumb').textContent = history.join(' > ');
}

// Suchergebnisse anzeigen
function showSearchResults(results, query) {
  const resultsEl = document.getElementById('search-results');
  
  if (results.length === 0) {
    resultsEl.innerHTML = `<h3>Keine Ergebnisse für "${query}"</h3>`;
  } else {
    resultsEl.innerHTML = `
      <h3>Suchergebnisse für "${query}"</h3>
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

// Kontext aktualisieren
function updateContext() {
  const page = pages[currentPage];
  document.getElementById('nav-context').textContent = `
Aktuelle Seite: ${currentPage}
Verfügbare Seiten: ${Object.keys(pages).join(', ')}
Menüstatus: ${menuOpen ? 'offen' : 'geschlossen'}
Brotkrümel: ${history.join(' > ')}
Abschnitte auf der Seite: ${page.sections.join(', ')}
  `;
}

// Erstes Rendern
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

## Probieren Sie es aus

<NavigationDemo />

## Beispielinteraktionen

Versuchen Sie dies mit VOIX:

- "Gehe zur Produktseite"
- "Zeig mir die Dokumentation"
- "Öffne den Team-Abschnitt"
- "Suche nach API"
- "Geh zurück"
- "Menü umschalten"

Die KI liest den Navigationskontext, um verfügbare Seiten und den aktuellen Standort zu verstehen.