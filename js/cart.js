// cart.js

document.addEventListener("DOMContentLoaded", function () {
  const quantityBtns = document.querySelectorAll(".quantity-btn");
  const quantityInputs = document.querySelectorAll(".quantity-input");
  const subtotalEls = document.querySelectorAll(".cart-item-subtotal");
  const priceEls = document.querySelectorAll(".cart-item-price");
  const totalEl = document.querySelector(".grand-total .summary-value");

  function parsePrice(text) {
    return parseFloat(text.replace(/[^\d.]/g, ""));
  }

  function updateCartTotals() {
    let total = 0;
    document.querySelectorAll(".cart-item").forEach((item) => {
      const price = parsePrice(item.querySelector(".cart-item-price").textContent);
      const qty = parseInt(item.querySelector(".quantity-input").value);
      const subtotal = price * qty;
      item.querySelector(".cart-item-subtotal").textContent = `Subtotal: $${subtotal.toFixed(2)}`;
      total += subtotal;
    });
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  quantityBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = this.parentElement.querySelector(".quantity-input");
      let qty = parseInt(input.value);
      if (this.classList.contains("plus")) {
        qty++;
      } else if (this.classList.contains("minus") && qty > 1) {
        qty--;
      }
      input.value = qty;
      updateCartTotals();
    });
  });

  // Remove item
  document.querySelectorAll(".cart-item-remove").forEach((removeBtn) => {
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const item = removeBtn.closest(".cart-item");
      item.remove();
      updateCartTotals();
    });
  });

  // Promo code button (basic example)
  document.querySelector(".promo-code-input button")?.addEventListener("click", () => {
    const promoInput = document.getElementById("promo");
    if (promoInput.value.trim().toLowerCase() === "desi10") {
      alert("Promo applied! 10% discount");
      applyDiscount(0.1);
    } else {
      alert("Invalid promo code");
    }
  });

  function applyDiscount(discountRate) {
    let total = 0;
    document.querySelectorAll(".cart-item").forEach((item) => {
      const price = parsePrice(item.querySelector(".cart-item-price").textContent);
      const qty = parseInt(item.querySelector(".quantity-input").value);
      total += price * qty;
    });
    total = total * (1 - discountRate);
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  // Initial calc
  updateCartTotals();
});
