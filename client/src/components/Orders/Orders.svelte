<!-- src/components/Orders/Orders.svelte -->
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
    const payload = JSON.parse(atob(token.split('.')[1]));

    // ─── 1) If Stripe just redirected back, finalize the pending order ───────────
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

    // ─── 2) Load all orders for this user (any status) ─────────────────────────
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

    // ─── 3) Socket setup: new orders & status updates ──────────────────────────
    const socket = io('http://localhost:8080', {
      withCredentials: true,
      auth: { token }
    });

    // New orders placed
    socket.on('new-order', data => {
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

    // Status updates for this user’s orders
    socket.on('order-status-update', ({ orderId, status, userId }) => {
      if (userId !== payload.id) return;
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        orders[idx].status = status;
        orders = [...orders];   // re-render
        toast.info(`Order #${orderId} is now "${status}"`);
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
