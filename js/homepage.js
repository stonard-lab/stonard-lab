import productsData from './products.js';

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    // Compute pricing display
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountBadge = product.discount
        ? `<div class="discount-badge">-${product.discount}%</div>`
        : '';

    div.innerHTML = `
        <a href="product_details.html?id=${product.id}">
            <div class="product-image-wrapper">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                ${discountBadge}
            </div>
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <div class="product-price">
                    ${hasDiscount
                        ? `<span class="sale-price">₹${product.price.toFixed(0)}</span>
                           <span class="original-price">₹${product.originalPrice.toFixed(0)}</span>`
                        : `<span class="original-price">₹${product.price.toFixed(0)}</span>`
                    }
                </div>
            </div>
        </a>
    `;
    return div;
}

function renderSection(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    products.forEach(p => container.appendChild(createProductCard(p)));
}

document.addEventListener('DOMContentLoaded', () => {
    const trending = productsData.slice(0, 6);
    const newArrivals = productsData.slice(-6).reverse();
    const bestSellers = productsData.slice(3, 9);

    renderSection('trending-products-container', trending);
    renderSection('new-arrivals-container', newArrivals);
    renderSection('best-sellers-container', bestSellers);
});
