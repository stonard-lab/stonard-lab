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
        debug.log('Initializing product details page');
        
        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            throw new Error('No product ID found in URL');
        }
        
        debug.log(`Loading product with ID: ${productId}`);
        
        // Find product in the products array
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }
        
        debug.log('Found product:', product);
        
        // Update breadcrumbs
        updateBreadcrumbs(product);
        
        // Update product gallery
        updateProductGallery(product);
        
        // Update product info
        updateProductInfo(product);
        
        // Update variant selectors
        updateVariantSelectors(product);
        
        // Update product tabs
        updateProductTabs(product);
        
        // Load related products
        loadRelatedProducts(product);
        
        // Initialize event listeners
        initEventListeners();
        
        debug.log('Product details page initialized successfully');
    } catch (error) {
        debug.error('Error initializing product details page', error);
        // Show error message to user
        document.querySelector('.product-main').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Product</h2>
                <p>We couldn't load the product details. Please try again later.</p>
                <a href="products.html" class="btn btn-primary">Back to Products</a>
            </div>
        `;
    }
});

function updateBreadcrumbs(product) {
    try {
        const breadcrumbs = document.getElementById('breadcrumbs');
        const categoryLink = breadcrumbs.querySelector('#product-category');
        const productName = breadcrumbs.querySelector('#product-name-breadcrumb');
        
        categoryLink.textContent = product.category || 'Indian Clothes';
        categoryLink.href = `products.html?category=${encodeURIComponent(product.category || 'all')}`;
        productName.textContent = product.name;
        
        debug.log('Updated breadcrumbs');
    } catch (error) {
        debug.error('Error updating breadcrumbs', error);
    }
}

function updateProductGallery(product) {
    try {
        const thumbnailContainer = document.getElementById('thumbnail-container');
        const mainImage = document.getElementById('main-image');
        
        // Clear existing thumbnails
        thumbnailContainer.innerHTML = '';
        
        // Use product images or fallback to placeholder
        const images = product.images && product.images.length > 0 ? 
            product.images : ['images/placeholder.jpg'];
        
        // Create thumbnails
        images.forEach((img, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = img;
            thumbnail.alt = `${product.name} - View ${index + 1}`;
            thumbnail.className = 'thumbnail';
            thumbnail.dataset.imageSrc = img;
            
            // First image is active by default
            if (index === 0) {
                thumbnail.classList.add('active');
                mainImage.src = img;
                mainImage.alt = product.name;
            }
            
            thumbnail.addEventListener('click', () => {
                // Update active thumbnail
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
                
                // Update main image
                mainImage.src = thumbnail.dataset.imageSrc;
            });
            
            thumbnailContainer.appendChild(thumbnail);
        });
        
        // Add zoom functionality
        mainImage.addEventListener('click', () => {
            window.open(mainImage.src, '_blank');
        });
        
        debug.log('Updated product gallery with', images.length, 'images');
    } catch (error) {
        debug.error('Error updating product gallery', error);
    }
}

function updateProductInfo(product) {
    try {
        // Update basic info
        document.getElementById('product-title').textContent = product.name;
        
        // Update pricing
        const currentPriceEl = document.getElementById('current-price');
        const originalPriceEl = document.getElementById('original-price');
        
        if (product.salePrice) {
            currentPriceEl.textContent = `$${product.salePrice.toFixed(2)}`;
            originalPriceEl.textContent = `$${product.price.toFixed(2)}`;
        } else {
            currentPriceEl.textContent = `$${product.price.toFixed(2)}`;
            originalPriceEl.textContent = '';
        }
        
        // Update rating
        const reviewCountEl = document.getElementById('review-count');
        if (product.reviews && product.reviews.length > 0) {
            const avgRating = calculateAverageRating(product.reviews);
            updateStarRating(avgRating);
            reviewCountEl.textContent = `${product.reviews.length} Reviews`;
        } else {
            reviewCountEl.textContent = 'No reviews yet';
        }
        
        // Update stock status
        const stockStatusIcon = document.getElementById('stock-status-icon');
        const stockStatusText = document.getElementById('stock-status-text');
        
        if (product.stock > 10) {
            stockStatusText.textContent = 'In Stock';
            stockStatusIcon.className = 'fas fa-check-circle in-stock';
        } else if (product.stock > 0) {
            stockStatusText.textContent = `Only ${product.stock} Left!`;
            stockStatusIcon.className = 'fas fa-exclamation-circle low-stock';
        } else {
            stockStatusText.textContent = 'Out of Stock';
            stockStatusIcon.className = 'fas fa-times-circle out-of-stock';
        }
        
        debug.log('Updated product info');
    } catch (error) {
        debug.error('Error updating product info', error);
    }
}

function calculateAverageRating(reviews) {
    try {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return sum / reviews.length;
    } catch (error) {
        debug.error('Error calculating average rating', error);
        return 0;
    }
}

function updateStarRating(rating) {
    try {
        const starsContainer = document.querySelector('.stars');
        starsContainer.innerHTML = '';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            starsContainer.innerHTML += '<i class="fas fa-star"></i>';
        }
        
        // Add half star if needed
        if (hasHalfStar) {
            starsContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Add empty stars
        const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < remainingStars; i++) {
            starsContainer.innerHTML += '<i class="far fa-star"></i>';
        }
    } catch (error) {
        debug.error('Error updating star rating', error);
    }
}

function updateVariantSelectors(product) {
    try {
        // Size options
        const sizeOptionsContainer = document.getElementById('size-options');
        sizeOptionsContainer.innerHTML = '';
        
        if (product.customization?.size?.length > 0) {
            product.customization.size.forEach(size => {
                const sizeOption = document.createElement('div');
                sizeOption.className = 'size-option';
                sizeOption.textContent = size;
                sizeOption.dataset.size = size;
                
                sizeOption.addEventListener('click', () => {
                    document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
                    sizeOption.classList.add('selected');
                });
                
                sizeOptionsContainer.appendChild(sizeOption);
            });
            
            // Select first size by default
            if (sizeOptionsContainer.firstChild) {
                sizeOptionsContainer.firstChild.classList.add('selected');
            }
        } else {
            sizeOptionsContainer.innerHTML = '<p>One size</p>';
        }
        
        // Color options
        const colorOptionsContainer = document.getElementById('color-options');
        colorOptionsContainer.innerHTML = '';
        
        if (product.components?.length > 0) {
            const uniqueColors = [...new Set(product.components.map(c => c.color))];
            
            uniqueColors.forEach(color => {
                if (!color) return;
                
                const colorOption = document.createElement('div');
                colorOption.className = 'color-option';
                colorOption.style.backgroundColor = getColorCode(color);
                colorOption.dataset.color = color;
                
                colorOption.addEventListener('click', () => {
                    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    colorOption.classList.add('selected');
                });
                
                colorOptionsContainer.appendChild(colorOption);
            });
            
            // Select first color by default
            if (colorOptionsContainer.firstChild) {
                colorOptionsContainer.firstChild.classList.add('selected');
            }
        }
        
        debug.log('Updated variant selectors');
    } catch (error) {
        debug.error('Error updating variant selectors', error);
    }
}

function getColorCode(colorName) {
    // Simple mapping of color names to hex codes
    const colorMap = {
        'red': '#ff0000',
        'blue': '#0000ff',
        'green': '#008000',
        'yellow': '#ffff00',
        'black': '#000000',
        'white': '#ffffff',
        'pink': '#ffc0cb',
        'purple': '#800080',
        'orange': '#ffa500',
        'gold': '#ffd700',
        'silver': '#c0c0c0'
    };
    
    return colorMap[colorName.toLowerCase()] || '#cccccc';
}

function updateProductTabs(product) {
    try {
        // Product story
        document.getElementById('product-description').textContent = 
            product.description || 'No description available.';
        
        // Specifications
        const specsTable = document.getElementById('specifications-table');
        specsTable.innerHTML = '';
        
        const specs = [
            { name: 'Material', value: product.material || 'Not specified' },
            { name: 'Fabric', value: product.fabric || 'Not specified' },
            { name: 'Embellishment', value: product.embellishment || 'None' },
            { name: 'Care Instructions', value: product.careInstructions || 'Dry clean only' },
            { name: 'Country of Origin', value: product.origin || 'India' },
            { name: 'Weight', value: product.weight ? `${product.weight} kg` : 'Not specified' }
        ];
        
        specs.forEach(spec => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${spec.name}</td>
                <td>${spec.value}</td>
            `;
            specsTable.appendChild(row);
        });
        
        // Reviews
        const reviewsContainer = document.getElementById('reviews-container');
        reviewsContainer.innerHTML = '';
        
        if (product.reviews && product.reviews.length > 0) {
            product.reviews.forEach(review => {
                const reviewEl = document.createElement('div');
                reviewEl.className = 'review';
                reviewEl.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${review.author}</span>
                        <span class="review-date">${formatDate(review.date)}</span>
                    </div>
                    <div class="review-rating">
                        ${generateStarRating(review.rating)}
                    </div>
                    <p>${review.text}</p>
                `;
                reviewsContainer.appendChild(reviewEl);
            });
        } else {
            reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        }
        
        // Tab switching functionality
        document.querySelectorAll('.tab-header').forEach(header => {
            header.addEventListener('click', () => {
                const tabId = header.dataset.tab;
                
                // Update active tab header
                document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
                header.classList.add('active');
                
                // Update active tab content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        debug.log('Updated product tabs');
    } catch (error) {
        debug.error('Error updating product tabs', error);
    }
}

function formatDate(dateString) {
    try {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
        debug.error('Error formatting date', error);
        return '';
    }
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function loadRelatedProducts(currentProduct) {
    try {
        const relatedProductsContainer = document.getElementById('related-products');
        relatedProductsContainer.innerHTML = '';
        
        // Find products in the same category (excluding current product)
        const related = products.filter(p => 
            p.category === currentProduct.category && 
            p.id !== currentProduct.id
        ).slice(0, 4); // Limit to 4 related products
        
        if (related.length === 0) {
            relatedProductsContainer.innerHTML = '<p>No related products found.</p>';
            return;
        }
        
        related.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <a href="product-details.html?id=${product.id}">
                    <img src="${product.images?.[0] || 'images/placeholder.jpg'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">
                        ${product.salePrice ? 
                            `<span class="sale-price">$${product.salePrice.toFixed(2)}</span>
                             <span class="original-price">$${product.price.toFixed(2)}</span>` : 
                            `$${product.price.toFixed(2)}`
                        }
                    </p>
                </a>
            `;
            relatedProductsContainer.appendChild(productCard);
        });
        
        debug.log('Loaded', related.length, 'related products');
    } catch (error) {
        debug.error('Error loading related products', error);
    }
}

function initEventListeners() {
    try {
        // Quantity control
        document.querySelector('.quantity-btn.minus').addEventListener('click', () => {
            const input = document.getElementById('quantity-input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
            }
        });
        
        document.querySelector('.quantity-btn.plus').addEventListener('click', () => {
            const input = document.getElementById('quantity-input');
            input.value = parseInt(input.value) + 1;
        });
        
        // Add to cart
        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('quantity-input').value);
            const selectedSize = document.querySelector('.size-option.selected')?.dataset.size;
            const selectedColor = document.querySelector('.color-option.selected')?.dataset.color;
            
            // In a real app, you would add to cart here
            alert(`Added to cart: ${quantity} x ${document.getElementById('product-title').textContent}
                   ${selectedSize ? `, Size: ${selectedSize}` : ''}
                   ${selectedColor ? `, Color: ${selectedColor}` : ''}`);
        });
        
        // Wishlist toggle
        document.getElementById('wishlist-btn').addEventListener('click', function() {
            this.classList.toggle('active');
            this.querySelector('i').classList.toggle('far');
            this.querySelector('i').classList.toggle('fas');
            
            if (this.classList.contains('active')) {
                // In a real app, you would add to wishlist here
                alert('Added to wishlist!');
            } else {
                alert('Removed from wishlist!');
            }
        });
        
        // Write review button
        document.getElementById('write-review-btn')?.addEventListener('click', () => {
            alert('Review form would open here in a real implementation');
        });
        
        debug.log('Event listeners initialized');
    } catch (error) {
        debug.error('Error initializing event listeners', error);
    }
}