<script>
  import { onMount }            from 'svelte';
  import { navigate, useLocation } from 'svelte-routing';
  import { get }                from 'svelte/store';
  import { io }                 from 'socket.io-client';
  import * as toast             from '../../util/toast.js';

  import "../../styels/myOrders.css"

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

    const socket = io('http://localhost:8080', {
      withCredentials: true,
      auth: { token }
    });

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

    socket.on('order-status-update', ({ orderId, status, userId }) => {
      if (userId !== payload.id) return;
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        orders[idx].status = status;
        orders = [...orders];
        toast.info(`Order #${orderId} is now "${status}"`);
      }
    });
  });

  async function reorder(order) {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in');
      return;
    }
    try {
      const items = order.items.map(it => ({ id: it.menuItemId, quantity: it.quantity }));
      const res = await fetch('http://localhost:8080/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reorder');
      }
      const { orderId } = await res.json();
      toast.success(`Reorder #${orderId} placed!`);
    } catch (err) {
      toast.error(err.message);
    }
  }
</script>

<h1>My Orders</h1>

{#if loading}
  <p>Loading your orders…</p>
{:else if orders.length === 0}
  <p>You have no orders yet.</p>
{:else}
  <div class="orders-board">
    <section class="column">
      <h2>Pending / Cancelled</h2>
      {#each orders.filter(o => o.status === 'pending' || o.status === 'cancelled') as o}
        <div class="order-card">
          <header class="order-header">
            <div>
              <strong>#{o.id}</strong>
              <time datetime={o.created_at}>{new Date(o.created_at).toLocaleTimeString()}</time>
            </div>
            <span class="status {o.status.replace(/\s+/g, '-')}">{o.status}</span>
          </header>
          <ul class="order-items">
            {#each o.items as it}
              <li>• {it.menuItemId} × {it.quantity}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </section>

    <section class="column">
      <h2>In Making</h2>
      {#each orders.filter(o => o.status === 'in making') as o}
        <div class="order-card">
          <header class="order-header">
            <div>
              <strong>#{o.id}</strong>
              <time datetime={o.created_at}>{new Date(o.created_at).toLocaleTimeString()}</time>
            </div>
            <span class="status in-making">in making</span>
          </header>
          <ul class="order-items">
            {#each o.items as it}
              <li>• {it.menuItemId} × {it.quantity}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </section>

    <section class="column">
      <h2>Ready to Pick Up</h2>
      {#each orders.filter(o => o.status === 'ready') as o}
        <div class="order-card">
          <header class="order-header">
            <div>
              <strong>#{o.id}</strong>
              <time datetime={o.created_at}>{new Date(o.created_at).toLocaleTimeString()}</time>
            </div>
            <span class="status ready">ready</span>
          </header>
          <ul class="order-items">
            {#each o.items as it}
              <li>• {it.menuItemId} × {it.quantity}</li>
            {/each}
          </ul>
          <button class="reorder-btn" on:click={() => reorder(o)}>
            Reorder
          </button>
        </div>
      {/each}
    </section>
  </div>
{/if}
