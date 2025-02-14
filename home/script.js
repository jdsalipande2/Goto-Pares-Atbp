const supabaseUrl = "https://etmxbelqfwpbrvtucxhr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bXhiZWxxZndwYnJ2dHVjeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTk1NDIsImV4cCI6MjA1NDg5NTU0Mn0.XWOH2RMftx_JO-UCABTSnI4kv_-h8-Y-J8z6v_FJ5ro";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let cart = [];
let selectedMethod = 1; // Default to Delivery (order_method_id = 1)
let selectedPayment = 1; // Default to Gcash (payment_method_id = 1)

function selectMethod(method, methodId) {
    selectedMethod = methodId;
    document.getElementById("delivery").classList.toggle("selected", method === "Delivery");
    document.getElementById("pickup").classList.toggle("selected", method === "Pick-up");
}

function addToCart(menu_id, name, price) {
    let existingItem = cart.find(item => item.menu_id === menu_id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ menu_id, name, price, qty: 1 });
    }
    updateCart();
}

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

function updateQty(index, qty) {
    cart[index].qty = parseInt(qty) || 1;
    updateCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

async function placeOrder() {
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value || null;
    
    if (!firstName || !lastName || !email || (!address && selectedMethod === 1)) {
        alert("Please fill in all required fields before placing your order.");
        return;
    }
    
    const totalPrice = parseFloat(document.getElementById("total-price").textContent);
    
    // Insert customer data
    const { data: customerData, error: customerError } = await supabaseClient
        .from("customers")
        .insert([{ customer_fname: firstName, customer_lname: lastName, customer_email: email, customer_phone: phone, customer_address: address }])
        .select("customer_id")
        .single();
    
    if (customerError) {
        console.error("Customer insertion error:", customerError);
        alert("Failed to save customer details.");
        return;
    }
    
    const customerId = customerData.customer_id;
    
    // Insert order data
    const { data: orderData, error: orderError } = await supabaseClient
        .from("orders")
        .insert([{ total_price: totalPrice, customer_id: customerId, order_method_id: selectedMethod, payment_method_id: selectedPayment }])
        .select("orders_id")
        .single();
    
    if (orderError) {
        console.error("Order insertion error:", orderError);
        alert("Failed to place order.");
        return;
    }
    
    const orderId = orderData.orders_id;
    
    // Insert order items
    const orderItems = cart.map(item => ({
        orders_id: orderId,
        menu_id: item.menu_id,
        quantity: item.qty,
        item_price: item.price
    }));
    
    const { error: orderItemsError } = await supabaseClient.from("order_items").insert(orderItems);
    
    if (orderItemsError) {
        console.error("Order items insertion error:", orderItemsError);
        alert("Failed to save order items.");
        return;
    }
    
    alert("Order placed successfully!");
    cart = [];
    updateCart();
    document.getElementById("checkout-form").style.display = "none";
}
