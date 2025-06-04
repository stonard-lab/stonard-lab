// js/main.js
import products from './products.js'; // This import needs to match your products.js export type

// Debug utility
const debug = {
    enabled: true, // Set to false for production
    log(message, data = '') {
        if (this.enabled) console.log(`[DEBUG] ${message}`, data);
    },
    error(message, error) {
        if (this.enabled) console.error(`[ERROR] ${message}`, error);
    },
    warn(message, data = '') { // Added warn for non-critical issues
        if (this.enabled) console.warn(`[WARN] ${message}`, data);
    }
};

// Constants & Selectors
const CART_KEY = 'desiwear_cart_v3';

// Use a more robust approach for selectors, especially for collections
const selectors = {
    // Single elements
    mobileNavToggle: '.hamburger-menu', // Assuming this is your mobile toggle button
    mobileNav: '.mobile-nav',
    mainHeader: '.header', // Updated to match HTML
    searchToggle: '.search-toggle', // New: for the search icon to toggle input
    searchInput: '.search-input',
    cartButton: '.cart-button', // Updated to target the clickable cart icon link
    cartCountSpan: '.cart-count', // Updated to match HTML span
    cartPopupSummary: '.cart-popup-summary', // Updated to match HTML
    cartItemsList: '.cart-items-list', // Updated to match HTML
    cartViewCartBtn: '.cart-actions .btn-primary', // Updated to match HTML structure
    cartCheckoutBtn: '.cart-actions .btn-secondary', // Updated to match HTML structure
    // Collection elements (will use querySelectorAll)
    desktopNavLinks: '.main-nav.desktop-nav ul li a', // More specific selector
    mobileNavLinks: '.mobile-nav ul li a',
    allAddToCartButtons: '.add-to-cart-btn', // Selector for all Add to Cart buttons
};

// Cache DOM elements
const DOM = {};
for (const key in selectors) {
    // Determine if it's a single element or a collection selector
    const isCollection = ['desktopNavLinks', 'mobileNavLinks', 'allAddToCartButtons'].includes(key);
    DOM[key] = isCollection ? document.querySelectorAll(selectors[key]) : document.querySelector(selectors[key]);

    // Optional: Log if an expected single element is not found
    if (!isCollection && !DOM[key]) {
        debug.warn(`Selector "${selectors[key]}" for DOM.${key} not found.`);
    }
}
debug.log('DOM elements cached:', DOM);


// BroadcastChannel for cross-tab cart sync
// Check for BroadcastChannel support to avoid errors in older browsers
const cartChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('cart_updates') : null;
if (!cartChannel) {
    debug.warn('BroadcastChannel not supported. Cart sync will rely only on StorageEvent.');
}


// ----- CART MANAGEMENT -----

/**
 * Retrieves the cart from localStorage.
 * Handles initial setup and versioning.
 * @returns {Object} The cart object.
 */
function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) {
            debug.log('Cart not found in localStorage. Initializing new cart.');
            return { items: [], version: 3 };
        }

        let cart = JSON.parse(raw);

        // Ensure cart structure and version are correct
        if (!cart || typeof cart !== 'object' || !Array.isArray(cart.items) || cart.version !== 3) {
            debug.log('Cart format outdated or corrupted. Migrating/resetting cart.', cart);
            cart = { items: cart.items || [], version: 3 }; // Keep items if they exist
            saveCart(cart); // Save the migrated cart
        }
        debug.log('Cart loaded successfully:', cart);
        return cart;
    } catch (error) {
        debug.error('Failed to load or parse cart from localStorage. Returning empty cart.', error);
        return { items: [], version: 3 };
    }
}

/**
 * Saves the cart to localStorage and notifies other tabs.
 * @param {Object} cart - The cart object to save.
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        debug.log('Cart saved to localStorage:', cart);
        notifyCartUpdate();
    } catch (error) {
        debug.error('Failed to save cart to localStorage', error);
    }
}

/**
 * Notifies other tabs that the cart has been updated via BroadcastChannel.
 */
function notifyCartUpdate() {
    if (cartChannel) {
        cartChannel.postMessage({ type: 'cart_updated', timestamp: Date.now() });
        debug.log('Cart update broadcasted.');
    }
}

/**
 * Sets up listeners for cart updates from other tabs or windows.
 */
function setupCartListener() {
    if (cartChannel) {
        cartChannel.addEventListener('message', (event) => {
            if (event.data?.type === 'cart_updated') {
                debug.log('Received cart update from BroadcastChannel.');
                updateCartDisplay();
            }
        });
    }

    // Fallback for browsers without BroadcastChannel (or cross-origin if main.js is on different subdomains)
    window.addEventListener('storage', (event) => {
        if (event.key === CART_KEY && event.newValue !== event.oldValue) {
            debug.log('Received cart update via StorageEvent.');
            updateCartDisplay();
        }
    });
    debug.log('Cart listeners setup.');
}

/**
 * Calculates the subtotal of items in the cart.
 * @param {Array} items - An array of cart items.
 * @returns {number} The calculated subtotal.
 */
function calculateCartSubtotal(items) {
    return items.reduce((total, item) => {
        // Use the product's price for calculation if available, otherwise fall back
        const product = products.find(p => p.id === item.productId);
        const price = product?.salePrice ?? product?.price ?? item.price ?? 0; // Prioritize actual product price

        if (isNaN(price) || isNaN(item.quantity)) {
            debug.warn('Invalid price or quantity encountered in cart item for subtotal calculation:', item);
            return total; // Skip invalid items
        }
        return total + (price * item.quantity);
    }, 0);
}

/**
 * Updates the visual display of the cart popup.
 * @param {Object} [cart=null] - The cart object. If null, it will be fetched.
 */
function updateCartPopup(cart = null) {
    cart = cart || getCart();
    debug.log('Updating cart popup display with cart:', cart);

    if (!DOM.cartItemsList || !DOM.cartViewCartBtn || !DOM.cartCheckoutBtn) {
        debug.warn('Required cart popup DOM elements not found.');
        return;
    }

    if (cart.items.length === 0) {
        DOM.cartItemsList.innerHTML = '<p>Your cart is empty.</p>';
        DOM.cartViewCartBtn.style.display = 'none';
        DOM.cartCheckoutBtn.style.display = 'none';
        return;
    }

    const itemsHtml = cart.items.slice(0, 3).map(item => {
        const product = products.find(p => p.id === item.productId);
        const productName = product?.name ?? item.name ?? 'Unknown Product';
        const imgSrc = product?.images?.[0] ? `images/products/${product.images[0]}` : 'images/placeholder.webp'; // Use placeholder
        const price = (product?.salePrice ?? product?.price ?? item.price ?? 0).toFixed(2); // Use product's price

        return `
            <div class="cart-popup-item">
                <img src="${imgSrc}" alt="${productName}">
                <div class="cart-popup-item-details">
                    <div class="cart-popup-item-title">${productName}</div>
                    <div class="cart-popup-item-price">₹${price}</div>
                    <div class="cart-popup-item-quantity">Qty: ${item.quantity}</div>
                </div>
            </div>
        `;
    }).join('');

    const moreCount = cart.items.length - 3;
    const moreHtml = moreCount > 0 ? `<div class="cart-popup-more">+ ${moreCount} more item${moreCount > 1 ? 's' : ''}</div>` : '';

    const subtotalHtml = `
        <div class="cart-popup-subtotal">
            <span>Subtotal:</span>
            <span>₹${calculateCartSubtotal(cart.items).toFixed(2)}</span>
        </div>
    `;

    DOM.cartItemsList.innerHTML = itemsHtml + moreHtml + subtotalHtml;
    DOM.cartViewCartBtn.style.display = 'inline-block';
    DOM.cartCheckoutBtn.style.display = 'inline-block';
}

/**
 * Updates the main cart icon count and triggers popup update.
 * Also triggers cart page rendering if on shopping-cart.html.
 */
function updateCartDisplay() {
    const cart = getCart();
    const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    debug.log('Updating cart display: Total items =', totalItems);

    if (DOM.cartCountSpan) {
        DOM.cartCountSpan.textContent = totalItems;
        DOM.cartCountSpan.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    updateCartPopup(cart);

    // Check if on the shopping cart page and trigger its rendering
    if (window.location.pathname.includes('shopping-cart.html')) {
        // This function would typically be defined in shopping-cart.js
        // and accessible globally or imported if shopping-cart.js is also a module.
        // For now, it's a placeholder, assuming shopping-cart.js will handle this.
        if (typeof window.renderCartPage === 'function') {
             window.renderCartPage(cart);
        } else {
             debug.warn('renderCartPage function not found. Cart page rendering might not be dynamic.');
        }
    }
}

/**
 * Adds an item to the cart.
 * @param {string} productId - The ID of the product to add.
 * @param {number} [quantity=1] - The quantity to add.
 * @param {Object} [options={}] - Additional options like size and color.
 * @returns {boolean} True if the item was added, false otherwise.
 */
function addItemToCart(productId, quantity = 1, options = {}) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        debug.error('Product not found for adding to cart:', productId);
        return false;
    }

    const cart = getCart();

    const existingItem = cart.items.find(item =>
        item.productId === productId &&
        item.size === (options.size ?? '') && // Ensure size and color match for existing item
        item.color === (options.color ?? '')
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        debug.log(`Increased quantity for existing item ${productId}. New quantity: ${existingItem.quantity}`);
    } else {
        cart.items.push({
            id: Date.now().toString(), // Unique ID for this cart item instance
            productId: product.id,
            name: product.name,
            price: product.price,
            salePrice: product.salePrice,
            image: product.images?.[0] ?? 'placeholder.webp', // Ensure image path is relative to images/products
            quantity: quantity,
            size: options.size ?? '',
            color: options.color ?? ''
        });
        debug.log(`Added new item to cart: ${product.name} (ID: ${productId})`);
    }

    saveCart(cart);
    updateCartDisplay();

    // Show cart popup temporarily
    if (DOM.cartPopupSummary) {
        DOM.cartPopupSummary.classList.add('visible');
        setTimeout(() => DOM.cartPopupSummary?.classList.remove('visible'), 2000);
        debug.log('Cart popup visibility toggled.');
    }

    return true;
}

/**
 * Removes an item from the cart.
 * @param {string} productId - The ID of the product to remove.
 * @param {Object} [options={}] - Options like size and color to uniquely identify the item.
 */
function removeItemFromCart(productId, options = {}) {
    const cart = getCart();
    const initialLength = cart.items.length;

    cart.items = cart.items.filter(item => !(
        item.productId === productId &&
        item.size === (options.size ?? '') &&
        item.color === (options.color ?? '')
    ));

    if (cart.items.length < initialLength) {
        debug.log(`Item removed from cart: ${productId}`, options);
        saveCart(cart);
        updateCartDisplay();
    } else {
        debug.warn(`Attempted to remove item ${productId} but no matching item found.`, options);
    }
}

/**
 * Updates the quantity of an item in the cart.
 * @param {string} productId - The ID of the product.
 * @param {number} newQuantity - The new quantity for the item.
 * @param {Object} [options={}] - Options like size and color to uniquely identify the item.
 */
function updateItemQuantity(productId, newQuantity, options = {}) {
    if (newQuantity <= 0) {
        removeItemFromCart(productId, options);
        return;
    }

    const cart = getCart();
    const item = cart.items.find(i =>
        i.productId === productId &&
        i.size === (options.size ?? '') &&
        i.color === (options.color ?? '')
    );

    if (item) {
        item.quantity = newQuantity;
        debug.log(`Updated quantity for item ${productId} to ${newQuantity}`, options);
        saveCart(cart);
        updateCartDisplay();
    } else {
        debug.warn(`Attempted to update quantity for item ${productId} but no matching item found.`, options);
    }
}


// ----- PRODUCT DISPLAY (for product listings, e.g., on products.html or homepage) -----

/**
 * Creates a DOM element for a single product card.
 * @param {Object} product - The product data object.
 * @returns {HTMLElement} The created product card element.
 */
function createProductCard(product) {
    if (!product || !product.id) {
        debug.error('Invalid product data provided to createProductCard:', product);
        return document.createElement('div'); // Return an empty div to prevent errors
    }

    const card = document.createElement('article'); // Use article for semantic correctness
    card.className = 'product-card';

    // Construct image source, assuming 'images/products/' is the base path
    const imgSrc = product.images?.[0] ? `images/products/${product.images[0]}` : 'images/placeholder.webp';

    card.innerHTML = `
        <a href="product-details.html?id=${product.id}" class="product-link">
            <div class="product-image-container">
                <img src="${imgSrc}" alt="${product.name}">
                ${product.discount ? `<span class="product-badge">${product.discount}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">₹${product.price.toFixed(2)}</span>
                    ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
            </div>
        </a>
        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
    `;

    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior if inside <a>
            e.stopPropagation(); // Stop event bubbling to parent elements (like product link)
            debug.log('Add to Cart button clicked for product ID:', product.id);
            addItemToCart(product.id, 1);
        });
    } else {
        debug.warn('Add to Cart button not found in generated product card for ID:', product.id);
    }

    return card;
}

/**
 * Renders a grid of product cards into a specified container.
 * @param {string} containerId - The ID of the HTML element where products should be rendered.
 * @param {Array<string>} productIds - An array of product IDs to display.
 */
function renderProductGrid(containerId, productIds) {
    const container = document.getElementById(containerId);
    if (!container) {
        debug.error('Product grid container not found:', containerId);
        return;
    }
    container.innerHTML = ''; // Clear existing content

    productIds.forEach(id => {
        const product = products.find(p => p.id === id);
        if (product) {
            container.appendChild(createProductCard(product));
        } else {
            debug.warn(`Product with ID "${id}" not found in data for grid rendering.`);
        }
    });
    debug.log(`Product grid rendered in #${containerId} with ${productIds.length} products.`);
}


// ----- EVENT LISTENERS -----

function setupEventListeners() {
    debug.log('Setting up global event listeners.');

    // Mobile Navigation Toggle
    if (DOM.mobileNavToggle && DOM.mobileNav && DOM.mainHeader) {
        DOM.mobileNavToggle.addEventListener('click', () => {
            DOM.mobileNav.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            DOM.mainHeader.classList.toggle('mobile-nav-open');
            debug.log('Mobile nav toggled.');
        });
    } else {
        debug.warn('Mobile navigation toggle elements not found.');
    }

    // Mobile Nav Links (for closing nav after click)
    // FIX: Using DOM.mobileNavLinks (querySelectorAll) directly
    if (DOM.mobileNavLinks && DOM.mobileNav && DOM.mainHeader) {
        DOM.mobileNavLinks.forEach(link => { // FIX: desktopNavLinks was used here in original
            link.addEventListener('click', () => {
                DOM.mobileNav.classList.remove('active');
                document.body.classList.remove('no-scroll');
                DOM.mainHeader.classList.remove('mobile-nav-open');
                debug.log('Mobile nav link clicked, closing nav.');
            });
        });
    } else {
        debug.warn('Mobile navigation links not found.');
    }

    // Search Bar Toggle
    if (DOM.searchToggle && DOM.searchInput) {
        DOM.searchToggle.addEventListener('click', () => {
            DOM.searchInput.classList.toggle('active');
            DOM.searchInput.focus();
            debug.log('Search input toggled.');
        });
    } else {
        debug.warn('Search toggle or input not found.');
    }

    // Search Form Submission
    // Note: The original code used searchForm which isn't defined in selectors
    // Assuming searchInput is the one to listen on for 'enter' or a separate search button click
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if input is part of a form
                const query = DOM.searchInput.value.trim();
                if (query) {
                    window.location.href = `products.html?q=${encodeURIComponent(query)}`; // Redirect to products page with query
                    debug.log('Search initiated for query:', query);
                } else {
                    debug.log('Search input is empty.');
                }
            }
        });
    } else {
        debug.warn('Search input for submission not found.');
    }


    // Cart Popup Toggle
    if (DOM.cartButton && DOM.cartPopupSummary) { // Updated to cartButton and cartPopupSummary
        DOM.cartButton.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.cartPopupSummary.classList.toggle('visible');
            e.stopPropagation(); // Prevent document click from immediately closing it
            debug.log('Cart popup toggled by cart button.');
        });

        // Close cart popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!DOM.cartPopupSummary.contains(e.target) && !DOM.cartButton.contains(e.target)) {
                DOM.cartPopupSummary.classList.remove('visible');
            }
        });
    } else {
        debug.warn('Cart button or popup summary not found.');
    }


    // Handle Nav Links (prevent default if href is just '#')
    const handleNavClick = (e) => {
        if (e.currentTarget.getAttribute('href') === '#') { // Check explicit '#'
            e.preventDefault();
            debug.log('Prevented default for # link:', e.currentTarget);
        }
    };

    // FIX: Use forEach on NodeLists from querySelectorAll
    if (DOM.desktopNavLinks) {
        DOM.desktopNavLinks.forEach(link => link.addEventListener('click', handleNavClick));
    } else {
        debug.warn('Desktop navigation links not found.');
    }

    if (DOM.mobileNavLinks) {
        DOM.mobileNavLinks.forEach(link => link.addEventListener('click', handleNavClick));
    } else {
        debug.warn('Mobile navigation links not found.');
    }

    // Add event listeners to all 'Add to Cart' buttons present on the page load
    // This assumes they are static or generated before this script runs.
    // For dynamically loaded content, you'd need event delegation.
    if (DOM.allAddToCartButtons) {
        DOM.allAddToCartButtons.forEach(button => {
            if (!button.dataset.listenerAttached) { // Prevent attaching multiple listeners
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const productId = button.dataset.productId;
                    if (productId) {
                        addItemToCart(productId, 1);
                        debug.log('Global Add to Cart button clicked for ID:', productId);
                    } else {
                        debug.warn('Add to Cart button missing data-product-id:', button);
                    }
                });
                button.dataset.listenerAttached = 'true'; // Mark as attached
            }
        });
        debug.log('Initial Add to Cart buttons listeners attached.');
    } else {
        debug.warn('No initial Add to Cart buttons found to attach listeners.');
    }
}

// ----- PAGE INITIALIZATION -----

/**
 * Initializes the main application logic.
 */
function initializeApp() {
    debug.log('Initializing application.');
    setupEventListeners();
    setupCartListener();
    updateCartDisplay(); // Initial cart display update on load
    debug.log('Application initialization complete.');
}

// Ensure the DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);


// Export functions if other modules need to use them (e.g., product-details.js for add to cart)
export { getCart, saveCart, updateCartDisplay, addItemToCart, removeItemFromCart, updateItemQuantity, createProductCard, renderProductGrid, debug };