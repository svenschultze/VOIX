---
layout: doc
---

<script setup>
import ProductSearchDemo from './.vitepress/components/ProductSearchDemo.vue'
</script>

# Product Search Demo

This demo shows how to implement a searchable product catalog with filters. Users can search, filter by category and price, and sort results using natural language.

## How It Works

The demo provides tools for searching and filtering products, with context showing current search state and results.

## Code

```html
<!-- Search and filter tools -->
<tool name="search_products" description="Search for products by name or description">
  <prop name="query" type="string" required/>
</tool>

<tool name="filter_by_category" description="Filter products by category">
  <prop name="category" type="string" description="electronics, clothing, books, or all"/>
</tool>

<tool name="filter_by_price" description="Filter products by price range">
  <prop name="minPrice" type="number" description="Minimum price"/>
  <prop name="maxPrice" type="number" description="Maximum price"/>
</tool>

<tool name="sort_products" description="Sort product results">
  <prop name="sortBy" type="string" description="price-low, price-high, name, or rating"/>
</tool>

<tool name="clear_filters" description="Clear all filters and show all products">
</tool>

<!-- Context showing search state -->
<context name="search_state" id="search-context">
  Current search: none
  Category filter: all
  Price range: all prices
  Sort: default
  Results: 6 products
</context>

<!-- Product display -->
<div id="product-container">
  <div id="search-info"></div>
  <div id="product-grid"></div>
</div>

<script>
// Sample products
const allProducts = [
  { id: 1, name: "Laptop Pro", category: "electronics", price: 999, rating: 4.5 },
  { id: 2, name: "Wireless Mouse", category: "electronics", price: 29, rating: 4.2 },
  { id: 3, name: "Winter Jacket", category: "clothing", price: 89, rating: 4.7 },
  { id: 4, name: "JavaScript Guide", category: "books", price: 39, rating: 4.8 },
  { id: 5, name: "Running Shoes", category: "clothing", price: 79, rating: 4.3 },
  { id: 6, name: "USB-C Cable", category: "electronics", price: 15, rating: 4.0 }
];

// Current state
let searchState = {
  query: '',
  category: 'all',
  minPrice: 0,
  maxPrice: Infinity,
  sortBy: 'default',
  results: [...allProducts]
};

// Tool handlers
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

// Attach event listeners
document.querySelectorAll('tool[name]').forEach(tool => {
  const name = tool.getAttribute('name');
  tool.addEventListener('call', (e) => {
    handlers[name]?.(e.detail);
  });
});

// Apply filters and update display
function applyFilters() {
  let filtered = [...allProducts];
  
  // Apply search
  if (searchState.query) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchState.query)
    );
  }
  
  // Apply category filter
  if (searchState.category !== 'all') {
    filtered = filtered.filter(p => p.category === searchState.category);
  }
  
  // Apply price filter
  filtered = filtered.filter(p => 
    p.price >= searchState.minPrice && p.price <= searchState.maxPrice
  );
  
  // Apply sorting
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

// Update UI
function updateUI() {
  // Update search info
  const searchInfo = document.getElementById('search-info');
  const filters = [];
  if (searchState.query) filters.push(`search: "${searchState.query}"`);
  if (searchState.category !== 'all') filters.push(`category: ${searchState.category}`);
  if (searchState.minPrice > 0 || searchState.maxPrice < Infinity) {
    filters.push(`price: $${searchState.minPrice}-$${searchState.maxPrice === Infinity ? '∞' : searchState.maxPrice}`);
  }
  if (searchState.sortBy !== 'default') filters.push(`sort: ${searchState.sortBy}`);
  
  searchInfo.textContent = filters.length ? `Active filters: ${filters.join(', ')}` : 'Showing all products';
  
  // Update product grid
  const grid = document.getElementById('product-grid');
  grid.innerHTML = searchState.results.map(product => `
    <div class="product-card">
      <h4>${product.name}</h4>
      <p class="category">${product.category}</p>
      <p class="price">$${product.price}</p>
      <p class="rating">★ ${product.rating}</p>
    </div>
  `).join('');
  
  // Update context
  const priceText = searchState.maxPrice === Infinity 
    ? (searchState.minPrice > 0 ? `$${searchState.minPrice}+` : 'all prices')
    : `$${searchState.minPrice}-$${searchState.maxPrice}`;
    
  document.getElementById('search-context').textContent = `
Current search: ${searchState.query || 'none'}
Category filter: ${searchState.category}
Price range: ${priceText}
Sort: ${searchState.sortBy}
Results: ${searchState.results.length} products

Available categories: electronics, clothing, books
Price range in results: $${Math.min(...searchState.results.map(p => p.price))}-$${Math.max(...searchState.results.map(p => p.price))}
  `;
}

// Initial display
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

## Try It

<ProductSearchDemo />

## Example Interactions

Try these with VOIX:

- "Search for laptop"
- "Show only electronics"
- "Filter products under $50"
- "Sort by price low to high"
- "Show books between $20 and $50"
- "Clear all filters"

The AI reads the context to understand available categories and current filters.