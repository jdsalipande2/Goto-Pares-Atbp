const supabaseUrl = 'https://zrkgymfoqhmmrwjzpvif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya2d5bWZvcWhtbXJ3anpwdmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1ODE3OTUsImV4cCI6MjA1NTE1Nzc5NX0.Zucx_Ic6s8yoZv6aAAxoRlHGfI4JXiP1-pjYUPtJAAE'
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
    qty = parseInt(qty);
    if (isNaN(qty) || qty < 1) qty = 1;
    cart[index].qty = qty;
    updateCart();
}

// Remove an item from the cart
function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// Proceed to checkout - display the form inside the cart
function proceedToCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty. Add items before proceeding to checkout.");
        return;
    }
    document.getElementById("checkout-form").style.display = 
        (document.getElementById("checkout-form").style.display === "none" || 
         document.getElementById("checkout-form").style.display === "") 
        ? "block" : "none";
}

// Select Payment Method (Gcash/Cash)
function selectPayment(method) {
    selectedPayment = method;
    document.getElementById("gcash").classList.toggle("selected", method === "Gcash");
    document.getElementById("cash").classList.toggle("selected", method === "Cash");
}

// Place Order and Show Order Summary
async function placeOrder() {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const contactNumber = document.getElementById("contact-number").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!firstName || !lastName || !contactNumber || !email || (selectedMethod === "Delivery" && !address)) {
        alert("Please fill in all required fields before placing your order.");
        return;
    }

    if (!/^\d{10,11}$/.test(contactNumber)) {
        alert("Please enter a valid contact number.");
        return;
    }

    const orderMethodId = selectedMethod === "Delivery" ? 1 : 2;
    const paymentMethodId = selectedPayment === "Gcash" ? 1 : 2;

    // Calculate Total Price
    let totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const orderData = {
        customer_fname: firstName,
        customer_lname: lastName,
        customer_contact: contactNumber,
        customer_email: email,
        customer_address: orderMethodId === 1 ? address : null,
        order_method_id: orderMethodId,
        payment_method_id: paymentMethodId,
        items: cart,  // Keep as an array; Supabase can handle JSON
        total_price: totalPrice,
        order_date: new Date().toISOString()
    };

    // Save to Supabase
    const { data, error } = await supabase.from("orders").insert([orderData]);

    if (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order. Please try again.");
        return;
    }

    alert("Order placed successfully!");

    // Show Order Summary
    let orderSummary = `<h3>Thank you for ordering, ${firstName} ${lastName}!</h3>`;
    orderSummary += `<p>Contact Number: ${contactNumber}</p>`;
    orderSummary += `<p>Email: ${email}</p>`;
    if (selectedMethod === "Delivery") orderSummary += `<p>Address: ${address}</p>`;
    orderSummary += `<p>Order Method: ${selectedMethod}</p>`;
    orderSummary += `<p>Payment Method: ${selectedPayment}</p>`;
    orderSummary += `<h4>Order Summary:</h4><ul>`;

    cart.forEach(item => {
        orderSummary += `<li>${item.name} - ₱${item.price} x ${item.qty}</li>`;
    });

    orderSummary += `</ul><h3>Total: ₱${totalPrice}</h3>`;
    orderSummary += `<button onclick="orderAgain()">Order Again</button>`;

    document.getElementById("order-summary").innerHTML = orderSummary;

    cart = [];
    updateCart();
    document.getElementById("checkout-form").style.display = "none";
}

// Reset the order process
function orderAgain() {
    cart = [];
    updateCart();
    document.getElementById("order-summary").innerHTML = "";
    document.getElementById("checkout-form").style.display = "none";
}
