import { products } from './products.js';

// Debugging setup
const debug = {
    enabled: true,
    log: function(message, data = null) {
        if (this.enabled) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    },
    error: function(message, error) {
        if (this.enabled) {
            console.error(`[ERROR] ${message}`, error);
        }
    }
};

// Initialize state
const filters = {
    price: [],
    size: [],
    color: [],
    fabric: [],
    occasion: []
};

let sortBy = 'featured';
let visibleCount = 9;

// DOM elements
const productGrid = document.getElementById('product-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const productsCount = document.getElementById('products-count');
const currentSort = document.getElementById('current-sort');

// Debug initial state
debug.log('Initializing product listing with:', {
    productCount: products.length,
    initialFilters: filters,
    sortBy,
    visibleCount
});

// Utility: Parses price string range
function parsePrice(value) {
    try {
        if (value === '500+') return [500, Infinity];
        const parts = value.split('-').map(Number);
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
            throw new Error(`Invalid price range format: ${value}`);
        }
        return parts;
    } catch (error) {
        debug.error('Error parsing price range', error);
        return [0, Infinity]; // Default to all prices if parsing fails
    }
}

// Filters products based on current filters
function applyFilters(product) {
    try {
        const {
            price: priceFilters,
            size: sizeFilters,
            color: colorFilters,
            fabric: fabricFilters,
            occasion: occasionFilters
        } = filters;

        // Price filtering
        const price = product.price || 0;
        const matchPrice = !priceFilters.length || priceFilters.some(range => {
            const [min, max] = parsePrice(range);
            return price >= min && price <= max;
        });

        // Helper function for other filters
        const match = (filterKey, values = []) => {
            if (!filters[filterKey].length) return true;
            if (!values || !values.length) return false;
            
            return values.some(v => {
                if (!v) return false;
                return filters[filterKey].includes(v.toString().toLowerCase());
            });
        };

        const result = (
            matchPrice &&
            match('size', product.customization?.size || []) &&
            match('color', product.components?.map(c => c.color) || []) &&
            match('fabric', product.components?.map(c => c.fabric) || []) &&
            match('occasion', [product.occasion])
        );

        debug.log(`Product ${product.id} filter result:`, {
            product: product.name,
            filters,
            result
        });

        return result;
    } catch (error) {
        debug.error('Error applying filters to product', {
            product,
            error
        });
        return false; // Exclude product if filter application fails
    }
}

// Sorting logic
function sortProducts(data) {
    try {
        debug.log(`Sorting products by: ${sortBy}`);
        
        const sorted = [...data]; // Create a copy to avoid mutating original
        
        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price-desc':
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'newest':
                return sorted.sort((a, b) => 
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            case 'bestselling':
                return sorted.sort((a, b) => (b.sales || 0) - (a.sales || 0));
            default:
                return sorted; // featured or default
        }
    } catch (error) {
        debug.error('Error sorting products', error);
        return data; // Return unsorted if error occurs
    }
}

// Renders product cards with enhanced grid display
function renderProducts() {
    try {
        debug.log('Rendering products with current state:', {
            filters,
            sortBy,
            visibleCount
        });

        // Clear existing products
        productGrid.innerHTML = '';

        // Filter and sort products
        let filtered = products.filter(applyFilters);
        filtered = sortProducts(filtered);

        debug.log(`Filtered products count: ${filtered.length}`);

        // Update product count display
        productsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'Product' : 'Products'}`;
        
        // Show/hide load more button
        loadMoreBtn.style.display = visibleCount < filtered.length ? 'block' : 'none';

        // Get products to display
        const displayProducts = filtered.slice(0, visibleCount);

        // Render each product
        displayProducts.forEach(product => {
            try {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Handle missing or invalid data
                const productName = product.name || 'Unnamed Product';
                const productPrice = product.price ? product.price.toFixed(2) : '0.00';
                const productImage = product.images?.[0] || 'images/placeholder.jpg';
                const productUrl = `product_details.html?id=${product.id || ''}`;
                
                // Sale price handling
                let priceHtml;
                if (product.salePrice) {
                    priceHtml = `
                        <span class="sale-price">$${product.salePrice.toFixed(2)}</span>
                        <span class="original-price">$${productPrice}</span>
                    `;
                } else {
                    priceHtml = `<span class="current-price">$${productPrice}</span>`;
                }
                
                // Badges for special products
                let badgesHtml = '';
                if (product.isNew) {
                    badgesHtml += '<span class="product-badge new">New</span>';
                }
                if (product.isOnSale) {
                    badgesHtml += '<span class="product-badge sale">Sale</span>';
                }
                if (product.isBestseller) {
                    badgesHtml += '<span class="product-badge bestseller">Bestseller</span>';
                }

                card.innerHTML = `
                    <div class="product-image-container">
                        <a href="${productUrl}">
                            <img src="${productImage}" alt="${productName}" loading="lazy">
                            ${badgesHtml}
                        </a>
                        <div class="product-actions">
                            <button class="wishlist-btn" aria-label="Add to wishlist">
                                <i class="far fa-heart"></i>
                            </button>
                            <button class="quick-view-btn" aria-label="Quick view">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">
                            <a href="${productUrl}">${productName}</a>
                        </h3>
                        <div class="product-price">
                            ${priceHtml}
                        </div>
                        <button class="add-to-cart-btn">Add to Cart</button>
                    </div>
                `;

                productGrid.appendChild(card);
            } catch (error) {
                debug.error('Error rendering product card', {
                    product,
                    error
                });
            }
        });

        debug.log('Finished rendering products');
    } catch (error) {
        debug.error('Error in renderProducts', error);
        productGrid.innerHTML = '<p class="error-message">Error loading products. Please try again later.</p>';
    }
}

// Sets filters from checkboxes
function updateFilters() {
    try {
        debug.log('Updating filters from UI');
        
        Object.keys(filters).forEach(key => {
            filters[key] = Array.from(
                document.querySelectorAll(`input[name="${key}"]:checked`)
            ).map(input => input.value.toLowerCase());
        });

        debug.log('Updated filters:', filters);
    } catch (error) {
        debug.error('Error updating filters', error);
    }
}

// Initialize event listeners
function initEventListeners() {
    try {
        // Dropdown toggle
        document.querySelector('.sort-dropdown-toggle')?.addEventListener('click', () => {
            document.querySelector('.sort-dropdown-menu')?.classList.toggle('show');
        });

        // Sort item click
        document.querySelectorAll('.sort-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                sortBy = item.dataset.sort;
                currentSort.textContent = item.textContent;
                document.querySelector('.sort-dropdown-menu')?.classList.remove('show');
                renderProducts();
            });
        });

        // Load more functionality
        loadMoreBtn?.addEventListener('click', () => {
            visibleCount += 9;
            renderProducts();
        });

        // Apply filters
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            updateFilters();
            visibleCount = 9;
            renderProducts();
        });

        // Reset filters
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
            Object.keys(filters).forEach(key => filters[key] = []);
            visibleCount = 9;
            renderProducts();
        });

        // Expand/Collapse filters
        document.querySelectorAll('.filter-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                content.classList.toggle('collapsed');
                header.querySelector('i').classList.toggle('rotate');
            });
        });

        debug.log('Event listeners initialized');
    } catch (error) {
        debug.error('Error initializing event listeners', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    try {
        debug.log('DOM fully loaded and parsed');
        initEventListeners();
        renderProducts();
    } catch (error) {
        debug.error('Initialization error', error);
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parsePrice,
        applyFilters,
        sortProducts,
        renderProducts,
        updateFilters
    };
}