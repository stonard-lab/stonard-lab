// check-out.js
document.addEventListener("DOMContentLoaded", () => {
  const steps = [
    "step-shipping",
    "step-shipping-method",
    "step-payment",
    "step-review"
  ];

  let currentStep = 0;

  const showStep = (index) => {
    steps.forEach((id, i) => {
      document.getElementById(id).classList.toggle("hidden", i !== index);
    });
    document.querySelectorAll(".checkout-progress .step").forEach((stepEl, i) => {
      stepEl.classList.toggle("active", i === index);
    });
  };

  showStep(currentStep);

  document.getElementById("shippingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    currentStep = 1;
    showStep(currentStep);
  });

  document.getElementById("shippingMethodForm").addEventListener("submit", (e) => {
    e.preventDefault();
    currentStep = 2;
    showStep(currentStep);
  });

  document.getElementById("paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    currentStep = 3;
    showStep(currentStep);
    populateOrderReview();
  });

  document.getElementById("placeOrder").addEventListener("click", () => {
    const termsChecked = document.querySelector("#step-review input[type='checkbox']").checked;
    if (!termsChecked) {
      alert("Please accept the Terms & Conditions.");
      return;
    }
    alert("Order placed successfully!");
    // Handle real order submission logic here
  });

  function populateOrderReview() {
    const summary = document.getElementById("orderSummary");
    summary.innerHTML = `
      <p><strong>Shipping to:</strong> Sample Address</p>
      <p><strong>Shipping Method:</strong> Standard (₹50)</p>
      <p><strong>Payment Method:</strong> Credit Card ending in ****1234</p>
      <p><strong>Items:</strong></p>
      <ul>
        <li>1x Silk Anarkali - ₹3499</li>
        <li>1x Embroidered Lehenga - ₹5999</li>
      </ul>
      <p><strong>Subtotal:</strong> ₹9498</p>
      <p><strong>Shipping:</strong> ₹50</p>
      <p><strong>Total:</strong> ₹9548</p>
    `;

    document.getElementById("summaryDetails").innerHTML = `
      <p>Items: 2</p>
      <p>Subtotal: ₹9498</p>
      <p>Shipping: ₹50</p>
      <p><strong>Total: ₹9548</strong></p>
    `;
  }
});
