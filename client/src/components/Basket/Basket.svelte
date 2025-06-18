<script>
    import { cart, addToCart, decreaseQuantity, clearCart } from '../../stores/cart.js';

    import * as toast from '../../util/toast.js';
    
    import "../../styels/basket.css";

    let loading = $state(false);

    
    // total opdaterer sig automatisk, HVER gang `$cart` ændrer sig.
    let total = $derived(
        $cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    async function placeOrderAndPay() {
        if ($cart.length === 0) {
            toast.error('Your basket is empty');
            return;
        }
        loading = true;

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('You must be logged in');

            localStorage.setItem('pending_order', JSON.stringify($cart));

            const res = await fetch(
                'http://localhost:8080/checkout/create-checkout-session',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ items: $cart })
                }
            );
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Failed to start checkout');

            window.location.href = body.url;
        } catch (err) {
            toast.error(err.message);
        } finally {
            loading = false;
        }
    }
</script>

<div class="basket-container">
    <h1>Your Basket</h1>

    {#if $cart.length === 0}
        <p>Your basket is empty.</p>
    {:else}
        <ul>
            {#each $cart as item (item.id)}
                <li class="basket-item">
                    <span class="item-name">{item.name}</span>
                    <div class="item-quantity">
                        <button class="quantity-btn" onclick={() => decreaseQuantity(item.id)}>−</button>
                        <span>{item.quantity}</span>
                        <button class="quantity-btn" onclick={() => addToCart(item)}>+</button>
                    </div>
                </li>
            {/each}
        </ul>

        <p class="total">
            Total: {total.toFixed(2)} DKK
        </p>

        <button onclick={placeOrderAndPay} disabled={loading}>
            {#if loading}Redirecting…{:else}Place Order & Pay{/if}
        </button>
    {/if}

    <div class="basket-actions">
        <button style="background-color: red;" class="clear-btn" onclick={clearCart}>Tøm Kurv</button>
    </div>
</div>