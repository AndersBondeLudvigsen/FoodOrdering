<script>
  import { onMount }            from 'svelte';
  import { navigate, useLocation } from 'svelte-routing';
  import { get }                from 'svelte/store';
  import { io }                 from 'socket.io-client';
  import * as toast             from '../../util/toast.js';

  let orders  = [];
  let loading = true;
  const location = useLocation();

  onMount(async () => {
    const params    = new URLSearchParams(get(location).search);
    const sessionId = params.get('session_id');
    const token     = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in');
      return navigate('/login');
    }

    // 1) If Stripe just redirected back, finalize the order
    if (sessionId) {
      const pending = localStorage.getItem('pending_order');
      if (pending) {
        try {
          const items = JSON.parse(pending);
          const res   = await fetch('http://localhost:8080/orders', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to save order');
          }
          const { orderId } = await res.json();
          toast.success(`Order #${orderId} confirmed!`);
        } catch (err) {
          toast.error(err.message);
        } finally {
          localStorage.removeItem('pending_order');
        }
      }
    }

    // 2) Fetch all of my orders
    try {
      const res = await fetch('http://localhost:8080/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load orders');
      orders = await res.json();
    } catch (err) {
      toast.error(err.message);
      return navigate('/login');
    } finally {
      loading = false;
    }

    // 3) Live-update any further orders via sockets
    const socket = io('http://localhost:8080', { withCredentials: true });
    socket.on('new-order', data => {
      const payload  = JSON.parse(atob(token.split('.')[1]));
      if (data.userId === payload.id) {
        orders = [{
          id:         data.orderId,
          status:     'pending',
          created_at: data.createdAt,
          items:      data.items
        }, ...orders];
        toast.info(`New order #${data.orderId}`);
      }
    });
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
      <li style="margin-bottom:1.5rem">
        <strong>Order #{o.id}</strong> —
        {new Date(o.created_at).toLocaleString()}
        <div>Status: <em>{o.status}</em></div>
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
