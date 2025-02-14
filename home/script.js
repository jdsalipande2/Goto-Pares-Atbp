window.onload = function () {
    const supabaseUrl = "https://etmxbelqfwpbrvtucxhr.supabase.co"; 
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bXhiZWxxZndwYnJ2dHVjeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTk1NDIsImV4cCI6MjA1NDg5NTU0Mn0.XWOH2RMftx_JO-UCABTSnI4kv_-h8-Y-J8z6v_FJ5ro";
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
}

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
function addToCart(id, name, price) {
    let existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id, name, price, qty: 1 });
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

    document.getElementById("total-price").textContent = total.toFixed(2);
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
async function placeOrder() {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const contactNumber = document.getElementById("contact-number").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();

    if (!firstName || !lastName || !contactNumber || !email || !address) {
        alert("Please fill in all fields before placing your order.");
        return;
    }

    // Insert customer into Supabase
    let { data: customer, error } = await supabase
        .from("customers")
        .insert([{ 
            customer_fname: firstName,
            customer_lname: lastName,
            customer_email: email,
            customer_address: address,
            customer_contact: contactNumber
        }])
        .select();

    if (error) {
        console.error("Error inserting customer:", error);
        alert("Error saving customer details.");
        return;
    }

    const customerId = customer[0].customer_id;
    await saveOrder(customerId, firstName, lastName, email, contactNumber, address);
}

async function saveOrder(customerId, firstName, lastName, email, contactNumber, address) {
    const totalPrice = parseFloat(document.getElementById("total-price").textContent);

    // Insert order into Supabase
    let { data: order, error } = await supabase
        .from("orders")
        .insert([{ 
            customer_id: customerId,
            order_method: selectedMethod,
            payment_method: selectedPayment,
            total_price: totalPrice
        }])
        .select();

    if (error) {
        console.error("Error inserting order:", error);
        alert("Error saving order.");
        return;
    }

    const orderId = order[0].order_id;
    await saveOrderItems(orderId);

    let orderSummary = `<h3>Thank you for ordering, ${firstName} ${lastName}!</h3>`;
    orderSummary += `<p>Email: ${email}</p>`;
    orderSummary += `<p>Contact Number: ${contactNumber}</p>`;
    orderSummary += `<p>Address: ${address}</p>`;
    orderSummary += `<p>Order Method: ${selectedMethod}</p>`;
    orderSummary += `<p>Payment Method: ${selectedPayment}</p>`;
    orderSummary += `<h4>Order Summary:</h4><ul>`;

    cart.forEach(item => {
        orderSummary += `<li>${item.name} - ₱${item.price} x ${item.qty}</li>`;
    });

    orderSummary += `</ul><h3>Total: ₱${totalPrice.toFixed(2)}</h3>`;
    
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

async function saveOrderItems(orderId) {
    let orderItems = cart.map(item => ({
        order_id: orderId,
        item_id: item.id, 
        quantity: item.qty
    }));

    let { error } = await supabase.from("order_items").insert(orderItems);

    if (error) {
        console.error("Error inserting order items:", error);
        alert("Error saving order items.");
        return;
    }

    alert("Order placed successfully!");
}

// Reset the order process
function orderAgain() {
    cart = [];
    selectedMethod = "Delivery";
    selectedPayment = "Gcash";
    updateCart();
    document.getElementById("order-summary").innerHTML = "<h3>Order placed successfully!</h3>";
    document.getElementById("checkout-form").style.display = "none";
}
