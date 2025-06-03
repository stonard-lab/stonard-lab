// js/main.js
import products from './products.js';

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

// Constants
const CART_KEY = 'desiwear_cart_v3';
const CART_COUNT_KEY = 'desiwear_cart_count';

// --- DOM Element References ---
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const mainHeader = document.querySelector('.main-header');

const searchForm = document.querySelector('.search-bar');
const searchInput = document.querySelector('.search-input');

const cartIconLink = document.querySelector('.cart-icon');
const cartItemCountSpan = document.querySelector('.cart-item-count');
const cartPopup = document.querySelector('.cart-popup');
const cartPopupItemsContainer = cartPopup?.querySelector('.cart-items');
const cartViewCartBtn = cartPopup?.querySelector('.btn-view-cart');
const cartCheckoutBtn = cartPopup?.querySelector('.btn-checkout');

const desktopNavLinks = document.querySelectorAll('.desktop-nav ul li a');
const mobileNavLinks = document.querySelectorAll('.mobile-nav ul li a');

// --- Cart Management Functions ---

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || { items: [], version: 3 };
        // Migration from older versions if needed
        if (!cart.version || cart.version < 3) {
            cart.items = cart.items || [];
            cart.version = 3;
            saveCart(cart);
        }
        return cart;
    } catch (error) {
        debug.error('Error loading cart', error);
        return { items: [], version: 3 };
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        // Update other tabs via BroadcastChannel
        notifyCartUpdate();
    } catch (error) {
        debug.error('Error saving cart', error);
    }
}

function notifyCartUpdate() {
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('cart_updates');
        channel.postMessage({ type: 'cart_updated', timestamp: Date.now() });
    }
}

function setupCartListener() {
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('cart_updates');
        channel.addEventListener('message', (event) => {
            if (event.data.type === 'cart_updated') {
                debug.log('Cart update received from other tab');
                updateCartDisplay();
            }
        });
    }

    // Fallback for browsers without BroadcastChannel
    window.addEventListener('storage', (event) => {
        if (event.key === CART_KEY) {
            debug.log('Cart update received via storage event');
            updateCartDisplay();
        }
    });
}

function updateCartDisplay() {
    const cart = getCart();
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart count in header
    if (cartItemCountSpan) {
        cartItemCountSpan.textContent = totalItems;
        cartItemCountSpan.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    
    // Update cart popup if exists
    updateCartPopup(cart);
    
    // Special handling for shopping cart page
    if (window.location.pathname.includes('shopping-cart.html')) {
        renderCartPage(cart);
    }
}

function updateCartPopup(cart = null) {
    if (!cartPopupItemsContainer) return;
    
    cart = cart || getCart();
    
    if (cart.items.length === 0) {
        cartPopupItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        if (cartViewCartBtn) cartViewCartBtn.style.display = 'none';
        if (cartCheckoutBtn) cartCheckoutBtn.style.display = 'none';
        return;
    }

    let itemsHtml = cart.items.slice(0, 3).map(item => {
        const product = products.find(p => p.id === item.productId) || item;
        return `
            <div class="cart-popup-item">
                <img src="images/products/${product.images?.[0] || 'placeholder.jpg'}" alt="${product.name}">
                <div class="cart-popup-item-details">
                    <div class="cart-popup-item-title">${product.name}</div>
                    <div class="cart-popup-item-price">$${(item.salePrice || item.price).toFixed(2)}</div>
                    <div class="cart-popup-item-quantity">Qty: ${item.quantity}</div>
                </div>
            </div>
        `;
    }).join('');

    if (cart.items.length > 3) {
        itemsHtml += `<div class="cart-popup-more">+ ${cart.items.length - 3} more items</div>`;
    }

    itemsHtml += `
        <div class="cart-popup-subtotal">
            <span>Subtotal:</span>
            <span>$${calculateCartSubtotal(cart.items).toFixed(2)}</span>
        </div>
    `;

    cartPopupItemsContainer.innerHTML = itemsHtml;
    if (cartViewCartBtn) cartViewCartBtn.style.display = 'inline-block';
    if (cartCheckoutBtn) cartCheckoutBtn.style.display = 'inline-block';
}

function calculateCartSubtotal(items) {
    return items.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId) || item;
        return total + (item.salePrice || item.price) * item.quantity;
    }, 0);
}

function addItemToCart(productId, quantity = 1, options = {}) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        debug.error('Product not found', productId);
        return false;
    }

    const cart = getCart();
    const existingItem = cart.items.find(item => 
        item.productId === productId && 
        item.size === (options.size || '') && 
        item.color === (options.color || '')
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            id: Date.now().toString(),
            productId,
            name: product.name,
            price: product.price,
            salePrice: product.salePrice,
            image: product.images[0],
            quantity,
            size: options.size || '',
            color: options.color || ''
        });
    }

    saveCart(cart);
    updateCartDisplay();

    // Show popup briefly when adding items
    if (cartPopup) {
        cartPopup.classList.add('visible');
        setTimeout(() => {
            cartPopup.classList.remove('visible');
        }, 2000);
    }

    return true;
}

// --- Product Display Functions ---

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <a href="product-details.html?id=${product.id}">
            <div class="product-image-container">
                <img src="images/products/${product.images[0]}" alt="${product.name}">
                ${product.discount ? `<span class="product-discount">${product.discount}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">$${product.price.toFixed(2)}</span>
                    ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
            </div>
        </a>
        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
            Add to Cart
        </button>
    `;

    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    addToCartBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItemToCart(product.id, 1);
    });

    return card;
}

// --- Event Listeners ---

function setupEventListeners() {
    // Mobile Navigation
    if (mobileNavToggle && mobileNav) {
        mobileNavToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            mainHeader?.classList.toggle('mobile-nav-open');
        });

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                document.body.classList.remove('no-scroll');
                mainHeader?.classList.remove('mobile-nav-open');
            });
        });
    }

    // Search Form
    searchForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput?.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    });

    // Cart Icon
    cartIconLink?.addEventListener('click', (e) => {
        e.preventDefault();
        cartPopup?.classList.toggle('visible');
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (!cartPopup?.contains(e.target) && !cartIconLink?.contains(e.target)) {
            cartPopup?.classList.remove('visible');
        }
    });

    // Navigation Links
    const handleNavClick = (e) => {
        if (e.currentTarget.href.includes('#')) {
            e.preventDefault();
        }
    };

    desktopNavLinks.forEach(link => link.addEventListener('click', handleNavClick));
    mobileNavLinks.forEach(link => link.addEventListener('click', handleNavClick));
}

// --- Page Initialization ---

function initializePage() {
    setupEventListeners();
    setupCartListener();
    updateCartDisplay();

    // Product listings
    const renderProductGrid = (containerId, productIds) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        productIds.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product) {
                container.appendChild(createProductCard(product));
            }
        });
    };

    // Homepage sections
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        renderProductGrid('trending-products-container', products.slice(0, 3).map(p => p.id));
        renderProductGrid('new-arrivals-container', products.slice(3, 6).map(p => p.id));
        renderProductGrid('best-sellers-container', products.slice(6, 9).map(p => p.id));
    }

    // Product details page
    if (window.location.pathname.includes('product-details.html')) {
        const productId = new URLSearchParams(window.location.search).get('id');
        const product = products.find(p => p.id === productId);
        // ... product details rendering logic
    }

    // Shopping cart page
    if (window.location.pathname.includes('shopping-cart.html')) {
        renderCartPage(getCart());
    }
}

function renderCartPage(cart) {
    const container = document.querySelector('.cart-content');
    if (!container) return;

    if (cart.items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <a href="products.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        return;
    }

    // Render full cart page with items
    container.innerHTML = `
        <div class="cart-items">
            ${cart.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="images/products/${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        ${item.size ? `<p>Size: ${item.size}</p>` : ''}
                        ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                        <div class="quantity-control">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" value="${item.quantity}" min="1">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    <div class="item-price">
                        $${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-item">&times;</button>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <!-- Summary content -->
        </div>
    `;

    // Add event listeners for quantity changes, removal, etc.
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initializePage);