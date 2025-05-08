<!-- src/components/Pages/MyOrders.svelte -->
<script>
    import { onMount }          from 'svelte';
    import { navigate, useLocation } from 'svelte-routing';
    import { get }              from 'svelte/store';
    import * as toast           from '../../util/toast.js';
  
    let orders = [];
    let loading = true;
    const location = useLocation();
  
    onMount(async () => {
      // 1) Check for Stripe redirect and show success toast
      const loc = get(location);
      const params = new URLSearchParams(loc.search);
      const sessionId = params.get('session_id');
      if (sessionId) {
        toast.success('Payment succeeded! Your order is confirmed.');
      }
  
      // 2) Fetch the user’s orders
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');
  
        const res = await fetch('http://localhost:8080/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load orders');
        orders = await res.json();
      } catch (err) {
        toast.error(err.message);
        navigate('/login');
      } finally {
        loading = false;
      }
    });
  </script>
  
  <h1>My Orders</h1>
  
  {#if loading}
    <p>Loading your orders…</p>
  {:else if orders.length === 0}
    <p>You have no orders yet.</p>
  {:else}
    <ul>
      {#each orders as o}
        <li style="margin-bottom:1.5rem;">
          <strong>Order #{o.id}</strong> — {new Date(o.created_at).toLocaleString()}
          <div>
            Status: <em>{o.status}</em>
            {#if o.paid}
              &nbsp;|&nbsp; Paid at {new Date(o.paid_at).toLocaleString()}
            {/if}
          </div>
          <ul>
            {#each o.items as it}
              <li>Item #{it.menuItemId} × {it.quantity}</li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  {/if}
  
  <style>
    ul { list-style: none; padding: 0; }
    li > ul { margin-top: 0.5rem; padding-left: 1rem; }
  </style>
  