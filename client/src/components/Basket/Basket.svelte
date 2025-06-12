<script>
  import { cart }   from '../../stores/cart.js';
  import * as toast from '../../util/toast.js';
  import "../../styels/basket.css"

  let items = [];
  let loading = false;
  cart.subscribe(v => (items = v));

  async function placeOrderAndPay() {
    if (!items.length) {
      toast.error('Your basket is empty');
      return;
    }
    loading = true;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in');

      localStorage.setItem('pending_order', JSON.stringify(items));

      const res = await fetch(
        'http://localhost:8080/checkout/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items: items.map(i => ({
              id:       i.id,
              name:     i.name,
              price:    i.price,
              quantity: i.quantity
            }))
          })
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

  {#if items.length === 0}
    <p>Your basket is empty.</p>
  {:else}
    <ul>
      {#each items as i}
        <li>
          <span>{i.name} × {i.quantity}</span>
          <span>{i.price * i.quantity} DKK</span>
        </li>
      {/each}
    </ul>
    <p class="total">
      Total: {items.reduce((s, i) => s + i.price * i.quantity, 0)} DKK
    </p>
    <button on:click={placeOrderAndPay} disabled={loading}>
      {#if loading}Redirecting…{:else}Place Order & Pay{/if}
    </button>
  {/if}
</div>
