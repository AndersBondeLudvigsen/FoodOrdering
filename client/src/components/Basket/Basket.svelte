<!-- src/components/Pages/Basket.svelte -->
<script>
    import { cart }     from '../../util/cart.js';
    import { navigate } from 'svelte-routing';
    import * as toast   from '../../util/toast.js';
  
    let items = [];
    cart.subscribe(v => items = v);
  
    async function placeOrder() {
      if (items.length === 0) {
        toast.error('Your basket is empty');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/orders', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Order failed');
        }
        const { orderId } = await res.json();
        toast.success(`Order #${orderId} placed!`);
        cart.set([]);            // clear basket
        navigate('/orders');     // show them their orders
      } catch (err) {
        toast.error(err.message);
      }
    }
  </script>
  
  <h1>Your Basket</h1>
  
  {#if items.length === 0}
    <p>Your basket is empty.</p>
  {:else}
    <ul>
      {#each items as i}
        <li>
          {i.name} × {i.quantity} — {i.price * i.quantity} DKK
        </li>
      {/each}
    </ul>
    <p><strong>Total:</strong> {items.reduce((s,i)=>s+i.price*i.quantity,0)} DKK</p>
    <button on:click={placeOrder}>Place Order</button>
  {/if}
  
  <style>
    button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover { background: #1e874b }
  </style>
  