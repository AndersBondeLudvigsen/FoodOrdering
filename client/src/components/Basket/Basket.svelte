<script>
  import { cart }   from '../../stores/cart.js';
  import * as toast from '../../util/toast.js';

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

      // 1) Stash the cart until after payment
      localStorage.setItem('pending_order', JSON.stringify(items));

      // 2) Kick off Stripe Checkout
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

      // 3) Redirect to Stripe
      window.location.href = body.url;
    } catch (err) {
      toast.error(err.message);
    } finally {
      loading = false;
    }
  }
</script>

<h1>Your Basket</h1>

{#if items.length === 0}
  <p>Your basket is empty.</p>
{:else}
  <ul>
    {#each items as i}
      <li>{i.name} × {i.quantity} — {i.price * i.quantity} DKK</li>
    {/each}
  </ul>
  <p><strong>Total:</strong> {items.reduce((s,i) => s + i.price * i.quantity, 0)} DKK</p>
  <button on:click={placeOrderAndPay} disabled={loading}>
    {#if loading}Redirecting…{:else}Place Order & Pay{/if}
  </button>
{/if}

<style>
  ul { list-style: none; padding: 0; }
  li { margin-bottom: 0.5rem; }
  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
