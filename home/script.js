document.addEventListener("DOMContentLoaded", function () {
    const SUPABASE_URL = "https://etmxbelqfwpbrvtucxhr.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bXhiZWxxZndwYnJ2dHVjeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzMTk1NDIsImV4cCI6MjA1NDg5NTU0Mn0.XWOH2RMftx_JO-UCABTSnI4kv_-h8-Y-J8z6v_FJ5ro";
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let cart = [];
    let selectedMethod = "Delivery";
    let selectedPayment = "Gcash";

    function selectMethod(method) {
        selectedMethod = method;
        document.getElementById("delivery").classList.toggle("selected", method === "Delivery");
        document.getElementById("pickup").classList.toggle("selected", method === "Pick-up");
    }

    function addToCart(name, price) {
        let existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.qty++;
        } else {
            cart.push({ name, price, qty: 1 });
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
        if (qty < 1) qty = 1;
        cart[index].qty = parseInt(qty);
        updateCart();
    }

    function removeItem(index) {
        cart.splice(index, 1);
        updateCart();
    }

    function proceedToCheckout() {
        const checkoutForm = document.getElementById("checkout-form");
        checkoutForm.style.display = checkoutForm.style.display === "none" || checkoutForm.style.display === "" ? "block" : "none";
    }

    function selectPayment(method) {
        selectedPayment = method;
        document.getElementById("gcash").classList.toggle("selected", method === "Gcash");
        document.getElementById("cash").classList.toggle("selected", method === "Cash");
    }

    async function placeOrder() {
        const firstName = document.getElementById("first-name").value;
        const lastName = document.getElementById("last-name").value;
        const contact = document.getElementById("contact").value;
        const email = document.getElementById("email").value;
        const address = document.getElementById("address").value;

        if (!firstName || !lastName || !contact || !email || !address) {
            alert("Please fill in all fields before placing your order.");
            return;
        }

        try {
            const { data: customer, error: customerError } = await supabase
                .from("customers")
                .insert([{ 
                    customer_fname: firstName, 
                    customer_lname: lastName, 
                    customer_contact: contact,
                    customer_email: email, 
                    customer_address: address 
                }])
                .select()
                .single();

            if (customerError) throw customerError;
            
            const customerId = customer.customer_id;

            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert([{ 
                    customer_id: customerId, 
                    order_method: selectedMethod, 
                    payment_method: selectedPayment,
                    total_price: document.getElementById('total-price').textContent 
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            const orderId = order.order_id;

            for (const item of cart) {
                const { error: orderItemError } = await supabase
                    .from("order_items")
                    .insert([{ 
                        order_id: orderId, 
                        item_name: item.name, 
                        item_price: item.price, 
                        quantity: item.qty 
                    }]);
                
                if (orderItemError) throw orderItemError;
            }

            let orderSummary = `<h3>Thank you for ordering, ${firstName} ${lastName}!</h3>`;
            orderSummary += `<p>Email: ${email}</p>`;
            orderSummary += `<p>Contact: ${contact}</p>`;
            orderSummary += `<p>Address: ${address}</p>`;
            orderSummary += `<p>Order Method: ${selectedMethod}</p>`;
            orderSummary += `<p>Payment Method: ${selectedPayment}</p>`;
            orderSummary += `<h4>Order Summary:</h4><ul>`;

            cart.forEach(item => {
                orderSummary += `<li>${item.name} - ₱${item.price} x ${item.qty}</li>`;
            });

            orderSummary += `</ul><h3>Total: ₱${document.getElementById('total-price').textContent}</h3>`;
            orderSummary += `<button onclick="orderAgain()">Order Again</button>`;

            document.getElementById("order-summary").innerHTML = orderSummary;
            cart = [];
            updateCart();
            document.getElementById("checkout-form").style.display = "none";

        } catch (error) {
            console.error("Error placing order:", error);
            alert("An error occurred while placing your order. Please try again.");
        }
    }

    function orderAgain() {
        cart = [];
        updateCart();
        document.getElementById("order-summary").innerHTML = "";
        document.getElementById("checkout-form").style.display = "none";
    }
});
