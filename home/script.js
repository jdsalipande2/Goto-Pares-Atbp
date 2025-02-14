const supabaseUrl = "https://etmxbelqfwpbrvtucxhr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bXhiZWxxZndwYnJ2dHVjeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTk1NDIsImV4cCI6MjA1NDg5NTU0Mn0.XWOH2RMftx_JO-UCABTSnI4kv_-h8-Y-J8z6v_FJ5ro";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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
        cartItemsContainer.innerHTML += 
            <div class="cart-item">
                <span>${item.name} - ₱${item.price} x</span>
                <input type="number" value="${item.qty}" min="1" onchange="updateQty(${index}, this.value)">
                <button onclick="removeItem(${index})">❌</button>
            </div>
        ;
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

async function placeOrder() {
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const address = document.getElementById("address").value;

    if (!firstName || !lastName || !email || (!address && selectedMethod === "Delivery")) {
        alert("Please fill in all required fields before placing your order.");
        return;
    }

    const totalPrice = parseFloat(document.getElementById("total-price").textContent);
    
    const orderData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        address: address || null,
        order_method: selectedMethod,
        payment_method: selectedPayment,
        cart: JSON.stringify(cart),
        total_price: totalPrice
    };

    // Insert order data into Supabase
    const { data, error } = await supabaseClient
        .from("orders")
        .insert([orderData]);

    if (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order. Please try again.");
    } else {
        console.log("Order placed successfully:", data);
        alert("Order placed successfully!");

        // Show order summary
        document.getElementById("order-summary").innerHTML = 
            <h3>Thank you for ordering, ${firstName} ${lastName}!</h3>
            <p>Email: ${email}</p>
            <p>Address: ${address || "N/A"}</p>
            <p>Order Method: ${selectedMethod}</p>
            <p>Payment Method: ${selectedPayment}</p>
            <h4>Order Summary:</h4>
            <ul>
                ${cart.map(item => <li>${item.name} - ₱${item.price} x ${item.qty}</li>).join("")}
            </ul>
            <h3>Total: ₱${totalPrice}</h3>
            <button onclick="orderAgain()">Order Again</button>
        ;

        // Clear cart after placing order
        cart = [];
        updateCart();
        document.getElementById("checkout-form").style.display = "none";
    }
}

// Reset the order process
function orderAgain() {
    cart = [];
    updateCart();
    document.getElementById("order-summary").innerHTML = "";
    document.getElementById("checkout-form").style.display = "none";
}
