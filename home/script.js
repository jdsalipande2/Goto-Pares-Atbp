const { createClient } = supabase; 
const SUPABASE_URL = "https://etmxbelqfwpbrvtucxhr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bXhiZWxxZndwYnJ2dHVjeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTk1NDIsImV4cCI6MjA1NDg5NTU0Mn0.XWOH2RMftx_JO-UCABTSnI4kv_-h8-Y-J8z6v_FJ5ro";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let selectedMethod = "Delivery";
let selectedPayment = "Gcash";

function selectMethod(method) {
    selectedMethod = method;
    ["delivery", "pickup"].forEach(id => 
        document.getElementById(id).classList.toggle("selected", id === method.toLowerCase())
    );
}

function addToCart(name, price) {
    let existingItem = cart.find(item => item.name.toLowerCase() === name.toLowerCase());
    existingItem ? existingItem.qty++ : cart.push({ name, price, qty: 1 });
    updateCart();
}

function updateCart() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.name} - ₱${item.price} x</span>
            <input type="number" value="${item.qty}" min="1" onchange="updateQty(${index}, this.value)">
            <button onclick="removeItem(${index})">❌</button>
        </div>
    `).join("");

    document.getElementById("total-price").textContent = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateQty(index, qty) {
    qty = parseInt(qty);
    qty <= 0 ? removeItem(index) : (cart[index].qty = qty, updateCart());
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

function proceedToCheckout() {
    document.getElementById("checkout-form").classList.toggle("show");
}

function selectPayment(method) {
    selectedPayment = method;
    ["gcash", "cash"].forEach(id => 
        document.getElementById(id).classList.toggle("selected", id === method.toLowerCase())
    );
}

async function placeOrder() {
    let fields = ["first-name", "last-name", "contact", "email", "address"];
    let values = fields.map(id => document.getElementById(id).value.trim());

    if (values.includes("")) return alert("Please fill in all fields before placing your order.");

    let [firstName, lastName, contact, email, address] = values;
    let totalAmount = parseFloat(document.getElementById("total-price").textContent);

    if (!/^\d{11}$/.test(contact)) return alert("Invalid contact number.");
    if (!/\S+@\S+\.\S+/.test(email)) return alert("Invalid email address.");

    try {
        let { data: customer, error: customerError } = await supabase
            .from("customers")
            .select("customer_id")
            .eq("customer_email", email)
            .maybeSingle();

        if (customerError) throw customerError;

        let customerId = customer ? customer.customer_id : null;
        if (!customerId) {
            let { data: newCustomer, error: customerInsertError } = await supabase
                .from("customers")
                .insert([{ 
                    customer_fname: firstName, customer_lname: lastName, 
                    customer_contact: contact, customer_email: email, 
                    customer_address: address 
                }])
                .select();

            if (customerInsertError || !newCustomer?.length) throw customerInsertError;
            customerId = newCustomer[0].customer_id;
        }

        let { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([{ customer_id: customerId, order_method: selectedMethod, payment_method: selectedPayment, total_price: totalAmount }])
            .select();

        if (orderError || !order?.length) throw orderError;
        let orderId = order[0].order_id;

        let orderItems = cart.map(({ name, price, qty }) => ({
            order_id: orderId, item_name: name, item_price: price, item_qty: qty
        }));

        let { error: itemError } = await supabase.from("order_items").insert(orderItems);
        if (itemError) throw itemError;

        document.getElementById("order-summary").innerHTML = `
            <h3>Thank you for ordering, ${firstName} ${lastName}!</h3>
            <p>Contact: ${contact}</p>
            <p>Email: ${email}</p>
            <p>Address: ${address}</p>
            <p>Order Method: ${selectedMethod}</p>
            <p>Payment Method: ${selectedPayment}</p>
            <h4>Order Summary:</h4>
            <ul>${cart.map(item => `<li>${item.name} - ₱${item.price} x ${item.qty}</li>`).join("")}</ul>
            <h3>Total: ₱${totalAmount}</h3>
            <button onclick="orderAgain()">Order Again</button>
        `;

        cart = [];
        updateCart();
        document.getElementById("checkout-form").style.display = "none";

    } catch (error) {
        console.error("Order failed:", error);
        alert("An error occurred. Please try again.");
    }
}

function orderAgain() {
    cart = [];
    updateCart();
    document.getElementById("order-summary").innerHTML = "";
    document.getElementById("checkout-form").style.display = "none";
}
