---
layout: doc
---

<script setup>
import ProductSearchDemo from '../components/ProductSearchDemo.vue'
</script>

# Produktsuche-Demo

Diese Demo zeigt, wie man einen durchsuchbaren Produktkatalog mit Filtern implementiert. Benutzer können mit natürlicher Sprache suchen, nach Kategorie und Preis filtern und Ergebnisse sortieren.

## Wie es funktioniert

Die Demo bietet Werkzeuge zum Suchen und Filtern von Produkten, wobei der Kontext den aktuellen Suchzustand und die Ergebnisse anzeigt.

## Code

```html
<!-- Such- und Filterwerkzeuge -->
<tool name="search_products" description="Produkte nach Name oder Beschreibung suchen">
  <prop name="query" type="string" required/>
</tool>

<tool name="filter_by_category" description="Produkte nach Kategorie filtern">
  <prop name="category" type="string" description="electronics, clothing, books oder all"/>
</tool>

<tool name="filter_by_price" description="Produkte nach Preisspanne filtern">
  <prop name="minPrice" type="number" description="Mindestpreis"/>
  <prop name="maxPrice" type="number" description="Höchstpreis"/>
</tool>

<tool name="sort_products" description="Produktergebnisse sortieren">
  <prop name="sortBy" type="string" description="price-low, price-high, name oder rating"/>
</tool>

<tool name="clear_filters" description="Alle Filter löschen und alle Produkte anzeigen">
</tool>

<!-- Kontext, der den Suchzustand anzeigt -->
<context name="search_state" id="search-context">
  Aktuelle Suche: keine
  Kategoriefilter: alle
  Preisspanne: alle Preise
  Sortierung: Standard
  Ergebnisse: 6 Produkte
</context>

<!-- Produktanzeige -->
<div id="product-container">
  <div id="search-info"></div>
  <div id="product-grid"></div>
</div>

<script>
// Beispielprodukte
const allProducts = [
  { id: 1, name: "Laptop Pro", category: "electronics", price: 999, rating: 4.5 },
  { id: 2, name: "Wireless Mouse", category: "electronics", price: 29, rating: 4.2 },
  { id: 3, name: "Winter Jacket", category: "clothing", price: 89, rating: 4.7 },
  { id: 4, name: "JavaScript Guide", category: "books", price: 39, rating: 4.8 },
  { id: 5, name: "Running Shoes", category: "clothing", price: 79, rating: 4.3 },
  { id: 6, name: "USB-C Cable", category: "electronics", price: 15, rating: 4.0 }
];

// Aktueller Zustand
let searchState = {
  query: '',
  category: 'all',
  minPrice: 0,
  maxPrice: Infinity,
  sortBy: 'default',
  results: [...allProducts]
};

// Werkzeug-Handler
const handlers = {
  search_products: ({ query }) => {
    searchState.query = query.toLowerCase();
    applyFilters();
  },
  
  filter_by_category: ({ category }) => {
    searchState.category = category.toLowerCase();
    applyFilters();
  },
  
  filter_by_price: ({ minPrice = 0, maxPrice = Infinity }) => {
    searchState.minPrice = minPrice;
    searchState.maxPrice = maxPrice;
    applyFilters();
  },
  
  sort_products: ({ sortBy }) => {
    searchState.sortBy = sortBy;
    applyFilters();
  },
  
  clear_filters: () => {
    searchState = {
      query: '',
      category: 'all',
      minPrice: 0,
      maxPrice: Infinity,
      sortBy: 'default',
      results: [...allProducts]
    };
    applyFilters();
  }
};

// Event-Listener anhängen
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Filter anwenden und Anzeige aktualisieren
function applyFilters() {
  let filtered = [...allProducts];
  
  // Suche anwenden
  if (searchState.query) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchState.query)
    );
  }
  
  // Kategoriefilter anwenden
  if (searchState.category !== 'all') {
    filtered = filtered.filter(p => p.category === searchState.category);
  }
  
  // Preisfilter anwenden
  filtered = filtered.filter(p => 
    p.price >= searchState.minPrice && p.price <= searchState.maxPrice
  );
  
  // Sortierung anwenden
  switch (searchState.sortBy) {
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
  }
  
  searchState.results = filtered;
  updateUI();
}

// UI aktualisieren
function updateUI() {
  // Suchinformationen aktualisieren
  const searchInfo = document.getElementById('search-info');
  const filters = [];
  if (searchState.query) filters.push(`Suche: "${searchState.query}"`);
  if (searchState.category !== 'all') filters.push(`Kategorie: ${searchState.category}`);
  if (searchState.minPrice > 0 || searchState.maxPrice < Infinity) {
    filters.push(`Preis: ${searchState.minPrice}€-${searchState.maxPrice === Infinity ? '∞' : searchState.maxPrice}€`);
  }
  if (searchState.sortBy !== 'default') filters.push(`Sortierung: ${searchState.sortBy}`);
  
  searchInfo.textContent = filters.length ? `Aktive Filter: ${filters.join(', ')}` : 'Alle Produkte werden angezeigt';
  
  // Produktgitter aktualisieren
  const grid = document.getElementById('product-grid');
  grid.innerHTML = searchState.results.map(product => `
    <div class="product-card">
      <h4>${product.name}</h4>
      <p class="category">${product.category}</p>
      <p class="price">${product.price}€</p>
      <p class="rating">★ ${product.rating}</p>
    </div>
  `).join('');
  
  // Kontext aktualisieren
  const priceText = searchState.maxPrice === Infinity 
    ? (searchState.minPrice > 0 ? `${searchState.minPrice}€+` : 'alle Preise')
    : `${searchState.minPrice}€-${searchState.maxPrice}€`;
    
  document.getElementById('search-context').textContent = `
Aktuelle Suche: ${searchState.query || 'keine'}
Kategoriefilter: ${searchState.category}
Preisspanne: ${priceText}
Sortierung: ${searchState.sortBy}
Ergebnisse: ${searchState.results.length} Produkte

Verfügbare Kategorien: electronics, clothing, books
Preisspanne in den Ergebnissen: ${Math.min(...searchState.results.map(p => p.price))}€-${Math.max(...searchState.results.map(p => p.price))}€
  `;
}

// Erstmalige Anzeige
updateUI();
</script>

<style>
#search-info {
  margin: 1rem 0;
  padding: 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.9rem;
}

#product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.product-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  background: white;
}

.product-card h4 {
  margin: 0 0 0.5rem 0;
}

.product-card .category {
  color: #666;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.product-card .price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #0066cc;
  margin: 0.5rem 0;
}

.product-card .rating {
  color: #ff9900;
  margin: 0;
}
</style>
```

## Probieren Sie es aus

<ProductSearchDemo />

## Beispielinteraktionen

Versuchen Sie dies mit VOIX:

- "Suche nach Laptop"
- "Zeige nur Elektronik"
- "Filtere Produkte unter 50 €"
- "Sortiere nach Preis von niedrig nach hoch"
- "Zeige Bücher zwischen 20 € und 50 €"
- "Alle Filter löschen"

Die KI liest den Kontext, um verfügbare Kategorien und aktuelle Filter zu verstehen.

<!--@include: @/voix_context.md -->