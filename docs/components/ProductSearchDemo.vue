<template>
  <div class="demo-container">
    <!-- Search and filter tools -->
    <tool name="search_products" description="Search for products by name or description">
      <prop name="query" type="string" required></prop>
    </tool>

    <tool name="filter_by_category" description="Filter products by category">
      <prop name="category" type="string" description="electronics, clothing, books, or all"></prop>
    </tool>

    <tool name="filter_by_price" description="Filter products by price range">
      <prop name="minPrice" type="number" description="Minimum price"></prop>
      <prop name="maxPrice" type="number" description="Maximum price"></prop>
    </tool>

    <tool name="sort_products" description="Sort product results">
      <prop name="sortBy" type="string" description="price-low, price-high, name, or rating"></prop>
    </tool>

    <tool name="clear_filters" description="Clear all filters and show all products">
    </tool>

    <!-- Context showing search state -->
    <context name="search_state" id="demo-search-context">
      {{ contextText }}
    </context>

    <!-- Product display -->
    <div id="demo-product-container">
      <div id="demo-search-info">{{ searchInfo }}</div>
      <div id="demo-product-grid">
        <div v-for="product in searchState.results" :key="product.id" class="product-card">
          <h4>{{ product.name }}</h4>
          <p class="category">{{ product.category }}</p>
          <p class="price">${{ product.price }}</p>
          <p class="rating">★ {{ product.rating }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const allProducts = [
  { id: 1, name: "Laptop Pro", category: "electronics", price: 999, rating: 4.5 },
  { id: 2, name: "Wireless Mouse", category: "electronics", price: 29, rating: 4.2 },
  { id: 3, name: "Winter Jacket", category: "clothing", price: 89, rating: 4.7 },
  { id: 4, name: "JavaScript Guide", category: "books", price: 39, rating: 4.8 },
  { id: 5, name: "Running Shoes", category: "clothing", price: 79, rating: 4.3 },
  { id: 6, name: "USB-C Cable", category: "electronics", price: 15, rating: 4.0 }
]

const searchState = ref({
  query: '',
  category: 'all',
  minPrice: 0,
  maxPrice: Infinity,
  sortBy: 'default',
  results: [...allProducts]
})

const searchInfo = computed(() => {
  const filters = []
  if (searchState.value.query) filters.push(`search: "${searchState.value.query}"`)
  if (searchState.value.category !== 'all') filters.push(`category: ${searchState.value.category}`)
  if (searchState.value.minPrice > 0 || searchState.value.maxPrice < Infinity) {
    filters.push(`price: $${searchState.value.minPrice}-$${searchState.value.maxPrice === Infinity ? '∞' : searchState.value.maxPrice}`)
  }
  if (searchState.value.sortBy !== 'default') filters.push(`sort: ${searchState.value.sortBy}`)
  
  return filters.length ? `Active filters: ${filters.join(', ')}` : 'Showing all products'
})

const contextText = computed(() => {
  const priceText = searchState.value.maxPrice === Infinity 
    ? (searchState.value.minPrice > 0 ? `$${searchState.value.minPrice}+` : 'all prices')
    : `$${searchState.value.minPrice}-$${searchState.value.maxPrice}`
    
  return `Current search: ${searchState.value.query || 'none'}
Category filter: ${searchState.value.category}
Price range: ${priceText}
Sort: ${searchState.value.sortBy}
Results: ${searchState.value.results.length} products

Available categories: electronics, clothing, books
Price range in results: $${Math.min(...searchState.value.results.map(p => p.price))}-$${Math.max(...searchState.value.results.map(p => p.price))}`
})

const applyFilters = () => {
  let filtered = [...allProducts]
  
  // Apply search
  if (searchState.value.query) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchState.value.query)
    )
  }
  
  // Apply category filter
  if (searchState.value.category !== 'all') {
    filtered = filtered.filter(p => p.category === searchState.value.category)
  }
  
  // Apply price filter
  filtered = filtered.filter(p => 
    p.price >= searchState.value.minPrice && p.price <= searchState.value.maxPrice
  )
  
  // Apply sorting
  switch (searchState.value.sortBy) {
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price)
      break
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price)
      break
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating)
      break
  }
  
  searchState.value.results = filtered
}

const handlers = {
  search_products: ({ query }) => {
    searchState.value.query = query.toLowerCase()
    applyFilters()
  },
  
  filter_by_category: ({ category }) => {
    searchState.value.category = category.toLowerCase()
    applyFilters()
  },
  
  filter_by_price: ({ minPrice = 0, maxPrice = Infinity }) => {
    searchState.value.minPrice = minPrice
    searchState.value.maxPrice = maxPrice
    applyFilters()
  },
  
  sort_products: ({ sortBy }) => {
    searchState.value.sortBy = sortBy
    applyFilters()
  },
  
  clear_filters: () => {
    searchState.value = {
      query: '',
      category: 'all',
      minPrice: 0,
      maxPrice: Infinity,
      sortBy: 'default',
      results: [...allProducts]
    }
    applyFilters()
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

#demo-search-info {
  margin: 1rem 0;
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-size: 0.9rem;
}

#demo-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.product-card {
  border: 1px solid var(--vp-c-divider);
  padding: 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.product-card h4 {
  margin: 0 0 0.5rem 0;
}

.product-card .category {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.product-card .price {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--vp-c-brand);
  margin: 0.5rem 0;
}

.product-card .rating {
  color: #ff9900;
  margin: 0;
}
</style>