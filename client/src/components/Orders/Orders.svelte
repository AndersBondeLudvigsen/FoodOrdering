<!-- src/components/Pages/MyOrders.svelte -->
<script>
    import { onMount }   from 'svelte';
    import { navigate }   from 'svelte-routing';
    import * as toast     from '../../util/toast.js';
  
    let orders = [];
  
    onMount(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load orders');
        orders = await res.json();
      } catch (err) {
        toast.error(err.message);
        navigate('/login');
      }
    });
  </script>
  
  <h1>My Orders</h1>
  
  {#if orders.length === 0}
    <p>You have no orders yet.</p>
  {:else}
    <ul>
      {#each orders as o}
        <li>
          <strong>Order #{o.id}</strong> – {new Date(o.created_at).toLocaleString()}  
          <div>Status: <em>{o.status}</em></div>
          <ul>
            {#each o.items as it}
              <li>Item {it.menuItemId} × {it.quantity}</li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  {/if}
  