// shopping-cart.js
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

document.addEventListener('DOMContentLoaded', () => {
    try {
        debug.log('Initializing shopping cart page');
        
        // Load cart from localStorage
        const cart = loadCart();
        
        if (cart.items.length > 0) {
            renderCart(cart);
        } else {
            showEmptyCart();
        }
        
        // Initialize event listeners
        initEventListeners();
        
        debug.log('Shopping cart page initialized successfully');
    } catch (error) {
        debug.error('Error initializing shopping cart page', error);
        showError();
    }
});

function loadCart() {
    try {
        const cartJson = localStorage.getItem('desiwearCart');
        if (cartJson) {
            return JSON.parse(cartJson);
        }
        return { items: [] };
    } catch (error) {
        debug.error('Error loading cart from localStorage', error);
        return { items: [] };
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem('desiwearCart', JSON.stringify(cart));
    } catch (error) {
        debug.error('Error saving cart to localStorage', error);
    }
}

function renderCart(cart) {
    try {
        const cartContent = document.getElementById('cart-content');
        
        // Calculate totals
        const { subtotal, itemCount } = calculateTotals(cart.items);
        const shipping = calculateShipping(subtotal);
        const tax = calculateTax(subtotal);
        const total = subtotal + shipping + tax;
        
        // Create cart HTML
        cartContent.innerHTML = `
            <div class="cart-items">
                <div class="cart-items-header">
                    ${renderCartItems(cart.items)}
                </div>
                <div class="cart-actions">
                    <button class="btn btn-outline btn-update-cart" id="update-cart-btn">Update Cart</button>
                    <a href="products.html" class="btn btn-continue-shopping">Continue Shopping</a>
                </div>
            </div>
            <div class="cart-summary">
                <h3 class="cart-summary-title">Order Summary</h3>
                <div class="summary-row">
                    <span class="summary-label">Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})</span>
                    <span class="summary-value">$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Shipping</span>
                    <span class="summary-value">$${shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Tax</span>
                    <span class="summary-value">$${tax.toFixed(2)}</span>
                </div>
                <div class="summary-row grand-total">
                    <span class="summary-label">Total</span>
                    <span class="summary-value">$${total.toFixed(2)}</span>
                </div>
                
                <div class="shipping-link" id="shipping-estimate-link">Estimate shipping</div>
                
                <div class="promo-code">
                    <div class="summary-label">Promo Code</div>
                    <div class="promo-code-input">
                        <input type="text" placeholder="Enter promo code" id="promo-code-input">
                        <button id="apply-promo-btn">Apply</button>
                    </div>
                </div>
                
                <button class="btn btn-primary checkout-btn" id="checkout-btn">Proceed to Checkout</button>
                
                <div class="trust-badges">
                    <div class="trust-badge">
                        <i class="fas fa-lock"></i>
                        <span>Secure Checkout</span>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-shield-alt"></i>
                        <span>SSL Encrypted</span>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <i class="fab fa-cc-visa payment-method"></i>
                    <i class="fab fa-cc-mastercard payment-method"></i>
                    <i class="fab fa-cc-paypal payment-method"></i>
                    <i class="fab fa-cc-amex payment-method"></i>
                </div>
                
                <div class="return-policy">
                    <a href="returns.html">Easy returns within 14 days</a>
                </div>
            </div>
        `;
        
        debug.log('Rendered cart with', cart.items.length, 'items');
    } catch (error) {
        debug.error('Error rendering cart', error);
        throw error;
    }
}

function renderCartItems(items) {
    try {
        return items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return '';
            
            return `
                <div class="cart-item" data-item-id="${item.id}">
                    <img src="${product.images[0]}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">
                            <a href="product-details.html?id=${product.id}">${product.name}</a>
                        </h3>
                        <div class="cart-item-attributes">
                            ${item.size ? `Size: ${item.size} | ` : ''}
                            ${item.color ? `Color: ${item.color}` : ''}
                        </div>
                        <div class="cart-item-remove" data-item-id="${item.id}">
                            <i class="fas fa-trash-alt"></i> Remove
                        </div>
                    </div>
                    <div class="cart-item-price">
                        $${(item.salePrice || item.price).toFixed(2)}
                    </div>
                    <div class="cart-item-quantity">
                        <div class="quantity-control">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-item-id="${item.id}">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    <div class="cart-item-subtotal">
                        $${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        debug.error('Error rendering cart items', error);
        return '';
    }
}

function calculateTotals(items) {
    let subtotal = 0;
    let itemCount = 0;
    
    items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            subtotal += (item.salePrice || item.price) * item.quantity;
            itemCount += item.quantity;
        }
    });
    
    return { subtotal, itemCount };
}

function calculateShipping(subtotal) {
    // Free shipping for orders over $100
    return subtotal > 100 ? 0 : 9.99;
}

function calculateTax(subtotal) {
    // Simple 10% tax calculation
    return subtotal * 0.1;
}

function showEmptyCart() {
    const cartContent = document.getElementById('cart-content');
    cartContent.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon">
                <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="empty-cart-message">
                Your cart is empty
            </div>
            <a href="products.html" class="btn btn-primary">Continue Shopping</a>
        </div>
    `;
}

function showError() {
    const cartContent = document.getElementById('cart-content');
    cartContent.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="empty-cart-message">
                Error loading your cart. Please try again.
            </div>
            <a href="products.html" class="btn btn-primary">Continue Shopping</a>
        </div>
    `;
}

function initEventListeners() {
    try {
        // Delegate events for dynamic elements
        document.addEventListener('click', (e) => {
            // Remove item
            if (e.target.closest('.cart-item-remove')) {
                const itemId = e.target.closest('.cart-item-remove').dataset.itemId;
                removeItemFromCart(itemId);
            }
            
            // Quantity minus
            if (e.target.classList.contains('minus')) {
                const input = e.target.nextElementSibling;
                if (parseInt(input.value) > 1) {
                    input.value = parseInt(input.value) - 1;
                    updateItemQuantity(input.dataset.itemId, parseInt(input.value));
                }
            }
            
            // Quantity plus
            if (e.target.classList.contains('plus')) {
                const input = e.target.previousElementSibling;
                input.value = parseInt(input.value) + 1;
                updateItemQuantity(input.dataset.itemId, parseInt(input.value));
            }
        });
        
        // Input change for quantity
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                updateItemQuantity(e.target.dataset.itemId, parseInt(e.target.value));
            }
        });
        
        // Update cart button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'update-cart-btn') {
                const cart = loadCart();
                renderCart(cart);
            }
        });
        
        // Checkout button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'checkout-btn') {
                window.location.href = 'checkout.html';
            }
        });
        
        // Apply promo code
        document.addEventListener('click', (e) => {
            if (e.target.id === 'apply-promo-btn') {
                const promoCode = document.getElementById('promo-code-input').value;
                if (promoCode) {
                    alert(`Promo code "${promoCode}" applied! (This would be processed in a real implementation)`);
                }
            }
        });
        
        // Shipping estimate
        document.addEventListener('click', (e) => {
            if (e.target.id === 'shipping-estimate-link') {
                alert('Shipping estimate modal would open here');
            }
        });
        
        debug.log('Event listeners initialized');
    } catch (error) {
        debug.error('Error initializing event listeners', error);
    }
}

function removeItemFromCart(itemId) {
    try {
        const cart = loadCart();
        cart.items = cart.items.filter(item => item.id !== itemId);
        saveCart(cart);
        
        // Update cart count in header
        updateCartCount(cart.items.reduce((total, item) => total + item.quantity, 0));
        
        if (cart.items.length === 0) {
            showEmptyCart();
        } else {
            renderCart(cart);
        }
        
        debug.log('Removed item from cart', itemId);
    } catch (error) {
        debug.error('Error removing item from cart', error);
    }
}

function updateItemQuantity(itemId, newQuantity) {
    try {
        const cart = loadCart();
        const item = cart.items.find(item => item.id === itemId);
        
        if (item) {
            item.quantity = newQuantity;
            saveCart(cart);
            
            // Update cart count in header
            updateCartCount(cart.items.reduce((total, item) => total + item.quantity, 0));
            
            debug.log('Updated item quantity', { itemId, newQuantity });
        }
    } catch (error) {
        debug.error('Error updating item quantity', error);
    }
}

function updateCartCount(count) {
    try {
        // This would update the cart count in the header
        const cartCountElements = document.querySelectorAll('.cart-item-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
        });
    } catch (error) {
        debug.error('Error updating cart count', error);
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCart,
        saveCart,
        calculateTotals,
        calculateShipping,
        calculateTax
    };
}