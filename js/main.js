// js/main.js
import products from './products.js';

// Debug utility
const debug = {
    enabled: true,
    log(message, data = '') {
        if (this.enabled) console.log(`[DEBUG] ${message}`, data);
    },
    error(message, error) {
        if (this.enabled) console.error(`[ERROR] ${message}`, error);
    }
};

// Constants & Selectors
const CART_KEY = 'desiwear_cart_v3';

const selectors = {
    mobileNavToggle: '.mobile-nav-toggle',
    mobileNav: '.mobile-nav',
    mainHeader: '.main-header',
    searchForm: '.search-bar',
    searchInput: '.search-input',
    cartIconLink: '.cart-icon',
    cartItemCountSpan: '.cart-item-count',
    cartPopup: '.cart-popup',
    cartPopupItemsContainer: '.cart-popup .cart-items',
    cartViewCartBtn: '.cart-popup .btn-view-cart',
    cartCheckoutBtn: '.cart-popup .btn-checkout',
    desktopNavLinks: '.desktop-nav ul li a',
    mobileNavLinks: '.mobile-nav ul li a',
    cartContentContainer: '.cart-content',
};

// Cache DOM elements
const DOM = {};
for (const key in selectors) {
    DOM[key] = document.querySelector(selectors[key]);
}

// BroadcastChannel for cross-tab cart sync
const cartChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('cart_updates') : null;

// ----- CART MANAGEMENT -----

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return { items: [], version: 3 };

        const cart = JSON.parse(raw);

        if (!cart.version || cart.version < 3) {
            cart.items = cart.items || [];
            cart.version = 3;
            saveCart(cart);
        }

        return cart;
    } catch (error) {
        debug.error('Failed to load cart from localStorage', error);
        return { items: [], version: 3 };
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        notifyCartUpdate();
    } catch (error) {
        debug.error('Failed to save cart to localStorage', error);
    }
}

function notifyCartUpdate() {
    if (cartChannel) {
        cartChannel.postMessage({ type: 'cart_updated', timestamp: Date.now() });
    }
}

function setupCartListener() {
    if (cartChannel) {
        cartChannel.addEventListener('message', (event) => {
            if (event.data?.type === 'cart_updated') {
                debug.log('Received cart update from another tab');
                updateCartDisplay();
            }
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === CART_KEY) {
            debug.log('Received cart update via storage event');
            updateCartDisplay();
        }
    });
}

function calculateCartSubtotal(items) {
    return items.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId) || {};
        const price = item.salePrice ?? item.price ?? 0;
        return total + price * item.quantity;
    }, 0);
}

function updateCartPopup(cart = null) {
    if (!DOM.cartPopupItemsContainer) return;

    cart = cart || getCart();

    if (cart.items.length === 0) {
        DOM.cartPopupItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        if (DOM.cartViewCartBtn) DOM.cartViewCartBtn.style.display = 'none';
        if (DOM.cartCheckoutBtn) DOM.cartCheckoutBtn.style.display = 'none';
        return;
    }

    const itemsHtml = cart.items.slice(0, 3).map(item => {
        const product = products.find(p => p.id === item.productId) || {};
        const imgSrc = product.images?.[0] ?? 'placeholder.jpg';
        const price = (item.salePrice ?? item.price ?? 0).toFixed(2);

        return `
            <div class="cart-popup-item">
                <img src="images/products/${imgSrc}" alt="${product.name ?? item.name}">
                <div class="cart-popup-item-details">
                    <div class="cart-popup-item-title">${product.name ?? item.name}</div>
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

    DOM.cartPopupItemsContainer.innerHTML = itemsHtml + moreHtml + subtotalHtml;

    if (DOM.cartViewCartBtn) DOM.cartViewCartBtn.style.display = 'inline-block';
    if (DOM.cartCheckoutBtn) DOM.cartCheckoutBtn.style.display = 'inline-block';
}

function updateCartDisplay() {
    const cart = getCart();
    const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    if (DOM.cartItemCountSpan) {
        DOM.cartItemCountSpan.textContent = totalItems;
        DOM.cartItemCountSpan.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    updateCartPopup(cart);

    if (window.location.pathname.includes('shopping-cart.html')) {
        renderCartPage(cart);
    }
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
        item.size === (options.size ?? '') &&
        item.color === (options.color ?? '')
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
            image: product.images?.[0] ?? 'placeholder.jpg',
            quantity,
            size: options.size ?? '',
            color: options.color ?? ''
        });
    }

    saveCart(cart);
    updateCartDisplay();

    if (DOM.cartPopup) {
        DOM.cartPopup.classList.add('visible');
        setTimeout(() => DOM.cartPopup?.classList.remove('visible'), 2000);
    }

    return true;
}

// ----- PRODUCT DISPLAY -----

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
        <a href="product-details.html?id=${product.id}" class="product-link">
            <div class="product-image-container">
                <img src="images/products/${product.images?.[0] ?? 'placeholder.jpg'}" alt="${product.name}">
                ${product.discount ? `<span class="product-discount">${product.discount}</span>` : ''}
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

// ----- EVENT LISTENERS -----

function setupEventListeners() {
    const { mobileNavToggle, mobileNav, mainHeader, searchForm, searchInput, cartIconLink, cartPopup, desktopNavLinks, mobileNavLinks } = DOM;

    mobileNavToggle?.addEventListener('click', () => {
        mobileNav?.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
        mainHeader?.classList.toggle('mobile-nav-open');
    });

    mobileNav?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            document.body.classList.remove('no-scroll');
            mainHeader?.classList.remove('mobile-nav-open');
        });
    });

    searchForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput?.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    });

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

    const handleNavClick = (e) => {
        if (e.currentTarget.href.includes('#')) e.preventDefault();
    };

    desktopNavLinks?.forEach(link => link.addEventListener('click', handleNavClick));
    mobileNavLinks?.forEach(link => link.addEventListener('click', handleNavClick));
}

// ----- PAGE INITIALIZATION -----

function renderProductGrid(containerId, productIds) {
    const container = document.getElementById(containerId);
    if (!container) return;

    productIds.forEach(id => {
        const product = products.find(p => p.id === id);
        if (product) {
            container.appendChild(createProductCard(product));
        }
    });
}

function renderCartPage(cart) {
    debug.log('Rendering cart page', cart);
    // Implement cart rendering logic if needed
}

function initializeApp() {
    setupEventListeners();
    setupCartListener();
    updateCartDisplay();
}

initializeApp();

export { getCart, saveCart, updateCartDisplay, addItemToCart, createProductCard, renderProductGrid };
