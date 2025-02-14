let cart = [];
let selectedMethod = "Delivery";
let selectedPayment = "Gcash";

// Select Order Method (Delivery/Pick-up)
function selectMethod(method) {
    selectedMethod = method;
    document.getElementById("delivery").classList.toggle("selected", method === "Delivery");
    document.getElementById("pickup").classList.toggle("selected", method === "Pick-up");
}

// Add items to the cart
function addToCart(name, price) {
    let existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    updateCart();
}

// Update the cart display
function updateCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <span>${item.name} - ₱${item.price} x</span>
                <input type="number" value="${item.qty}" min="1" onchange="updateQty(${index}, this.value)">
                <button onclick="removeItem(${index})">❌</button>
            </div>
        `;
    });

    document.getElementById("total-price").textContent = total;
}

// Update quantity of an item
function updateQty(index, qty) {
    if (qty < 1) qty = 1;
    cart[index].qty = parseInt(qty);
    updateCart();
}

// Remove an item from the cart
function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// Proceed to checkout - display the form inside the cart
function proceedToCheckout() {
    const checkoutForm = document.getElementById("checkout-form");
    checkoutForm.style.display = (checkoutForm.style.display === "none" || checkoutForm.style.display === "") 
        ? "block" 
        : "none";
}

// Select Payment Method (Gcash/Cash)
function selectPayment(method) {
    selectedPayment = method;
    document.getElementById("gcash").classList.toggle("selected", method === "Gcash");
    document.getElementById("cash").classList.toggle("selected", method === "Cash");
}

// Place Order and Show Order Summary (inside cart)
function placeOrder() {
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const address = document.getElementById("address").value;

    if (!firstName || !lastName || !email || !address) {
        alert("Please fill in all fields before placing your order.");
        return;
    }

    let orderSummary = `<h3>Thank you for ordering, ${firstName} ${lastName}!</h3>`;
    orderSummary += `<p>Email: ${email}</p>`;
    orderSummary += `<p>Address: ${address}</p>`;
    orderSummary += `<p>Order Method: ${selectedMethod}</p>`;
    orderSummary += `<p>Payment Method: ${selectedPayment}</p>`;
    orderSummary += `<h4>Order Summary:</h4><ul>`;

    cart.forEach(item => {
        orderSummary += `<li>${item.name} - ₱${item.price} x ${item.qty}</li>`;
    });

    orderSummary += `</ul><h3>Total: ₱${document.getElementById('total-price').textContent}</h3>`;
    
    // Add "Order Again" button
    orderSummary += `<button onclick="orderAgain()">Order Again</button>`;

    // Show summary inside cart
    document.getElementById("order-summary").innerHTML = orderSummary;

    // Clear cart after placing order
    cart = [];
    updateCart();

    // Hide checkout form after placing order
    document.getElementById("checkout-form").style.display = "none";
}

// Reset the order process
function orderAgain() {
    cart = [];
    updateCart();
    document.getElementById("order-summary").innerHTML = "";
    document.getElementById("checkout-form").style.display = "none";
}
