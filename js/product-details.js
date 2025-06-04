// js/product-details.js with console.log statements

import products from './products.js';

// Helper function to render star ratings
function renderStaticRating(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star"></i>'; // Full star
        } else if (i - 0.5 === rating) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>'; // Half star
        } else {
            starsHtml += '<i class="far fa-star"></i>'; // Empty star
        }
    }
    return starsHtml;
}

// Helper function to capitalize first letter for specifications
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded: Starting product details script.');

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productDetailsContainer = document.getElementById('product-details-container');
    const productPageTitle = document.getElementById('productPageTitle');

    console.log('Extracted Product ID from URL:', productId);

    if (!productId) {
        productDetailsContainer.innerHTML = '<p class="error-message">Product ID not found in URL.</p>';
        productPageTitle.textContent = 'Product Not Found - DesiWear';
        console.error('Error: Product ID is missing from the URL.');
        return;
    }

    const product = productsData.find(p => p.id === productId);

    if (product) {
        console.log('Product found:', product);

        // Update page title
        productPageTitle.textContent = `${product.name} - DesiWear`;
        document.getElementById('product-name').textContent = product.name;
        console.log('Product name and page title set:', product.name);

        // 1. Breadcrumbs
        const breadcrumbCategory = document.getElementById('breadcrumb-category');
        const breadcrumbProductName = document.getElementById('breadcrumb-product-name');
        if (product.categories && product.categories.length > 0) {
            breadcrumbCategory.innerHTML = `<a href="products.html?category=${encodeURIComponent(product.categories[0])}">${product.categories[0]}</a>`;
            console.log('Breadcrumb category set:', product.categories[0]);
        } else {
            breadcrumbCategory.style.display = 'none'; // Hide if no category
            console.log('No product category found, hiding breadcrumb category.');
        }
        breadcrumbProductName.textContent = product.name;
        console.log('Breadcrumb product name set:', product.name);

        // 2. Price
        const priceContainer = document.getElementById('product-price');
        let priceHtml = `<span class="current-price">₹${product.price.toFixed(2)}</span>`;
        if (product.originalPrice) {
            priceHtml += `<span class="original-price">₹${product.originalPrice.toFixed(2)}</span>`;
        }
        priceContainer.innerHTML = priceHtml;
        console.log('Product price set. Current: ₹' + product.price.toFixed(2) + (product.originalPrice ? ', Original: ₹' + product.originalPrice.toFixed(2) : ''));


        // 3. Rating (using example data for now as not in product object)
        const averageRating = 4.5;
        const numberOfReviews = 120;
        document.getElementById('product-rating-stars').innerHTML = renderStaticRating(averageRating);
        document.getElementById('product-review-count').textContent = `(${numberOfReviews} reviews)`;
        console.log('Product rating set. Avg:', averageRating, 'Reviews:', numberOfReviews);

        // 4. Availability (using placeholder, add 'inStock' property to product data if needed)
        document.getElementById('product-availability-status').textContent = 'In Stock';
        console.log('Product availability set to "In Stock".');

        // 5. Image Gallery
        const thumbnailsContainer = document.getElementById('product-thumbnails');
        const mainImageContainer = document.getElementById('product-main-image');

        if (product.images && product.images.length > 0) {
            const defaultImage = product.images[0]; // Use the first image for all thumbnails and initial main display
            console.log('Image gallery: Default image selected:', defaultImage);

            // Set initial main image
            mainImageContainer.innerHTML = `<img src="${defaultImage}" alt="${product.name}" class="product-main-image-display">`;
            console.log('Main product image set.');

            // Create 4 thumbnails using the same image
            thumbnailsContainer.innerHTML = ''; // Clear previous content
            for (let i = 0; i < 4; i++) { // Wireframe shows 4 thumbnails
                const thumbnailWrapper = document.createElement('div');
                thumbnailWrapper.classList.add('thumbnail-wrapper');
                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = defaultImage; // Use the same image for all thumbnails
                thumbnailImg.alt = `${product.name} thumbnail ${i + 1}`;
                thumbnailImg.classList.add('product-thumbnail-image');
                thumbnailWrapper.appendChild(thumbnailImg);
                thumbnailsContainer.appendChild(thumbnailWrapper);

                // Add active class to the first thumbnail
                if (i === 0) {
                    thumbnailWrapper.classList.add('active');
                }

                thumbnailWrapper.addEventListener('click', () => {
                    console.log(`Thumbnail ${i + 1} clicked. Setting main image to ${defaultImage}`);
                    document.querySelectorAll('.thumbnail-wrapper').forEach(t => t.classList.remove('active'));
                    thumbnailWrapper.classList.add('active');
                    mainImageContainer.innerHTML = `<img src="${defaultImage}" alt="${product.name}" class="product-main-image-display">`;
                });
            }
            console.log('Thumbnails created and click listeners attached.');
        } else {
            console.warn('No images found for this product.');
            mainImageContainer.innerHTML = '<p>No image available</p>';
        }

        // 6. Options (Size and Color) - Populate with example data for now
        const sizeSelect = document.getElementById('size');
        const colorSelect = document.getElementById('color');

        // Example sizes (you'd ideally fetch these from product data)
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        sizeSelect.innerHTML = '<option value="">Select Size</option>'; // Reset
        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelect.appendChild(option);
        });
        console.log('Size options populated:', sizes);

        // Example colors (you'd ideally fetch these from product data)
        const colors = ['Red', 'Blue', 'Green', 'Gold'];
        colorSelect.innerHTML = '<option value="">Select Color</option>'; // Reset
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorSelect.appendChild(option);
        });
        console.log('Color options populated:', colors);


        // 7. Quantity
        const quantityInput = document.getElementById('quantity');
        const quantityDecreaseBtn = document.querySelector('.quantity-decrease');
        const quantityIncreaseBtn = document.querySelector('.quantity-increase');

        quantityDecreaseBtn.addEventListener('click', () => {
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
                console.log('Quantity decreased to:', quantityInput.value);
            }
        });

        quantityIncreaseBtn.addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
            console.log('Quantity increased to:', quantityInput.value);
        });
        console.log('Quantity controls initialized.');

        // 8. Tab Functionality (Product Story, Specifications, Shipping & Returns, Customer Reviews)
        const tabButtons = document.querySelectorAll('.product-tabs-section .tab-button');
        const tabContents = document.querySelectorAll('.product-tabs-section .tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                console.log('Tab button clicked:', tabId);

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                console.log(`Tab '${tabId}' activated.`);
            });
        });
        console.log('Tab functionality initialized.');

        // Populate Tab Content: Product Story
        document.getElementById('story').innerHTML = `<p>${product.description || 'No detailed product story available.'}</p>`;
        console.log('Product story tab content populated.');

        // Populate Tab Content: Specifications
        const specificationsList = [];
        if (product.fabric) {
            for (const key in product.fabric) {
                specificationsList.push(`<li><strong>${capitalizeFirstLetter(key)}:</strong> ${product.fabric [key]}</li>`);
            }
        }
        if (product.type) specificationsList.push(`<li><strong>Type:</strong> ${product.type}</li>`);
        if (product.style && product.style.length > 0) {
            specificationsList.push(`<li><strong>Style:</strong> ${product.style.join(', ')}</li>`);
        }
        if (product.occasions && product.occasions.length > 0) {
            specificationsList.push(`<li><strong>Occasions:</strong> ${product.occasions.join(', ')}</li>`);
        }
        if (product.festivals && product.festivals.length > 0) {
            specificationsList.push(`<li><strong>Festivals:</strong> ${product.festivals.join(', ')}</li>`);
        }
        if (product.color) specificationsList.push(`<li><strong>Color:</strong> ${product.color}</li>`);
        if (product.work && product.work.length > 0) {
            specificationsList.push(`<li><strong>Work:</strong> ${product.work.join(', ')}</li>`);
        }
        if (product.components && product.components.length > 0) {
            specificationsList.push(`<li><strong>Components:</strong> ${product.components.join(', ')}</li>`);
        }
        if (product.customization) specificationsList.push(`<li><strong>Customization:</strong> ${product.customization}</li>`);

        document.getElementById('specifications').innerHTML = specificationsList.length > 0 ? `<ul>${specificationsList.join('')}</ul>` : '<p>No specific details available for this product.</p>';
        console.log('Specifications tab content populated.');

        // Populate Tab Content: Shipping & Returns
        document.getElementById('shipping').innerHTML = `
            <p><strong>Shipping:</strong> We offer standard and express shipping options. Estimated delivery times vary based on location.</p>
            <p>Standard Shipping: 7-10 business days</p>
            <p>Express Shipping: 3-5 business days</p>
            <p><strong>Returns:</strong> We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original condition with tags attached. Please refer to our full <a href="returns-exchanges.html">Returns & Exchanges Policy</a> for more details.</p>
        `; // Placeholder content
        console.log('Shipping & Returns tab content populated.');


        // 9. Customer Reviews Tab Content
        const overallRatingStarsTab = document.getElementById('overall-rating-stars-tab');
        const overallReviewCountTab = document.getElementById('overall-review-count-tab');
        const customerReviewsList = document.getElementById('customer-reviews-list');

        renderStaticRating(4.8, overallRatingStarsTab); // Example overall rating
        overallReviewCountTab.textContent = `(35 Reviews)`; // Example count

        const reviews = [
            { author: 'Priya S.', rating: 5, comment: 'Absolutely stunning! The quality is exceptional and the fit was perfect. Received so many compliments.' },
            { author: 'Ananya P.', rating: 4, comment: 'Beautiful lehenga, even better in person. Shipping was quicker than expected. Highly recommend!' },
            { author: 'Rina K.', rating: 5, comment: 'DesiWear truly understands traditional elegance. My saree was a showstopper at the Diwali celebration!' },
            { author: 'Mohan L.', rating: 3.5, comment: 'The product is good, but the color was slightly different than shown online. Still happy with the purchase.' },
        ];
        console.log('Customer reviews data (example):', reviews);

        if (reviews.length > 0) {
            customerReviewsList.innerHTML = reviews.map(review => `
                <div class="customer-review-item">
                    <div class="review-header">
                        <span class="review-author">${review.author}</span>
                        <div class="star-rating small">${renderStaticRating(review.rating)}</div>
                    </div>
                    <p class="review-comment">${review.comment}</p>
                </div>
            `).join('');
            console.log('Customer reviews list populated.');
        } else {
            customerReviewsList.innerHTML = '<p>No customer reviews available yet.</p>';
            console.log('No customer reviews to display.');
        }


        // 10. "You Might Also Like" Section
        const relatedProductsContainer = document.getElementById('related-products');
        // Filter out the current product and take a few others as "related"
        const filteredProducts = productsData.filter(p => p.id !== productId);
        const productsToShow = filteredProducts.slice(0, 5); // Show first 5 unrelated products
        console.log('Related products to display:', productsToShow.map(p => p.name));

        if (productsToShow.length > 0) {
            relatedProductsContainer.innerHTML = productsToShow.map(relatedProduct => `
                <article class="product-card">
                    ${relatedProduct.discount ? `<div class="product-badge">${relatedProduct.discount}</div>` : ''}
                    <img src="${relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : 'images/placeholder.webp'}" alt="${relatedProduct.name}" class="product-image">
                    <div class="product-details">
                        <h3 class="product-card-title">${relatedProduct.name}</h3>
                        <div class="price">
                            <span class="current-price">₹${relatedProduct.price.toFixed(2)}</span>
                            ${relatedProduct.originalPrice ? `<span class="original-price">₹${relatedProduct.originalPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <a href="product-details.html?id=${relatedProduct.id}" class="btn btn-primary btn-small">View Details</a>
                    </div>
                </article>
            `).join('');
            console.log('Related products section populated.');
        } else {
            relatedProductsContainer.innerHTML = '<p>No related products found.</p>';
            console.log('No related products to display.');
        }

        console.log('Product details page rendering complete for ID:', productId);

    } else {
        productDetailsContainer.innerHTML = '<p class="error-message">Product not found.</p>';
        productPageTitle.textContent = 'Product Not Found - DesiWear';
        console.error(`Error: Product with ID "${productId}" not found in productsData.`);
    }
});