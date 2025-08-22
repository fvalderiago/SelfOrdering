let dietaryMap = {};

function loadDietaryMap() {
  return fetch('/api/dietary-map')
    .then(res => res.json())
    .then(map => {
      dietaryMap = map;
    })
    .catch(err => {
      console.error("Failed to load dietary map:", err);
    });
}


function getCart() {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    }

    function updateCartBadge() {
      const count = getCart().reduce((sum, item) => sum + item.qty, 0);
      document.getElementById("cart-count").innerText = count;
    }

    function renderCart() {
      const cart = getCart();
      const tbody = document.getElementById("cart-body");
      let total = 0;
      tbody.innerHTML = "";

      cart.forEach((item, index) => {
        const row = document.createElement("tr");
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const dietaryText = (item.dietary || [])
          .map(id => dietaryMap[id] || `ID ${id}`)
          .join(", ") || "None";

        row.innerHTML = `
          <td>${item.name}</td>
          <td>${dietaryText}</td>
          <td>$${item.price}</td>
          <td>${item.qty}</td>
          <td>$${itemTotal.toFixed(2)}</td>
          <td><button class="remove-btn" onclick="removeFromCart(${index})">Remove</button></td>
        `;

        tbody.appendChild(row);
      });

      document.getElementById("cart-total").innerText = "Total: $" + total.toFixed(2);
    }

    function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  }

  function setCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }


    function removeFromCart(index) {
      const cart = getCart();
      cart.splice(index, 1);
      setCart(cart);
      renderCart();
      updateCartBadge();
    }

    function getTableIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.get("table");
    }

    function checkout() {
      const cart = getCart();

      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      const specialInstructions = document.getElementById("special-instructions").value;
      const tableId = getTableIdFromUrl();

      fetch('/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, specialInstructions, tableId  })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          localStorage.removeItem("cart");
          updateCartBadge();
          alert("Order placed successfully!");
          // window.location.href = "/track-order";
          
          // Save receipt
          localStorage.setItem("receipt", JSON.stringify(result.receipt));

          // Auto-download PDF
          window.location.href = `/receipt/${result.receipt.orderId}/pdf`;

          // Redirect to tracking after download
          setTimeout(() => {
            window.location.href = "/track-order";
          }, 2000);
        } else {
          alert("Error placing order.");
        }
      })
      .catch(err => {
        console.error("Checkout error:", err);
        alert("Error processing checkout.");
      });
    }

   document.addEventListener("DOMContentLoaded", async () => {
      await loadDietaryMap();
      renderCart();
      updateCartBadge();
    });