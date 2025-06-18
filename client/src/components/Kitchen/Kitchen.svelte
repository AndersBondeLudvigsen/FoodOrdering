<script>
  
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  
  import * as toast from '../../util/toast.js';

  import "../../styels/kitchenpage.css";

  let liveOrders = $state([]);
  let loading = $state(true);
  
  const statuses = ['pending', 'in making', 'ready'];

  //  Bruger `$derived` til at beregne værdier baseret på anden state.
  let pendingOrders = $derived(liveOrders.filter(o => o.status === 'pending' || o.status === 'cancelled'));
  let inMakingOrders = $derived(liveOrders.filter(o => o.status === 'in making'));
  let readyOrders = $derived(liveOrders.filter(o => o.status === 'ready'));

  async function loadOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Login required");
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/kitchen", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load orders");
      
      const orders = await res.json();
      // Opdaterer  `state` .
      liveOrders = orders.map(o => ({
        id: o.id,
        status: o.status,
        createdAt: o.created_at,
        items: o.items.map(it => ({ id: it.menuItemId, quantity: it.quantity }))
      }));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggleStatus(order) {
    const idx = statuses.indexOf(order.status);
    if (idx < 0 || idx === statuses.length - 1) return;
    const next = statuses[idx + 1];
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://localhost:8080/kitchen/${order.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status: next })
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      
      order.status = next;
      
      toast.success(`Order #${order.id} → "${next}"`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function cancelOrder(order) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://localhost:8080/kitchen/${order.id}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!res.ok) throw new Error('Failed to cancel order');
      
      order.status = 'cancelled';
      
      toast.success(`Order #${order.id} cancelled`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  onMount(() => {
    (async () => {
      await loadOrders();
      loading = false;
    })();

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:8080', {
      withCredentials: true,
      auth: { token }
    });

    socket.on("new-order", order => {
      liveOrders.unshift({
        id: order.orderId,
        status: "pending",
        createdAt: order.createdAt,
        items: order.items.map(it => ({ id: it.id, quantity: it.quantity }))
      });
      toast.info(`New order #${order.orderId}`);
    });

    socket.on("order-status-update", ({ orderId, status }) => {
      const o = liveOrders.find(o => o.id === orderId);
      if (o) {
        o.status = status;
      }
    });
    return () => {
      socket.disconnect();
    };
  });
</script>

<h1>👩‍🍳 Kitchen Dashboard</h1>

{#if loading}
  <p>Loading orders…</p>
{:else}
  <div class="orders-board">
    <section class="column">
      <h2>Pending / Cancelled</h2>
      {#each pendingOrders as o (o.id)}
        <div class="order-card">
          <header class="order-header">
            <div>
              <strong>#{o.id}</strong>
              <time datetime={o.createdAt}>{new Date(o.createdAt).toLocaleTimeString()}</time>
            </div>
            <span class="status {o.status.replace(/\s+/g, '-')}">{o.status}</span>
          </header>
          <ul class="order-items">
            {#each o.items as it}
              <li>• Item {it.id} × {it.quantity}</li>
            {/each}
          </ul>
          <div class="actions">
            <button onclick={() => toggleStatus(o)} disabled={o.status !== 'pending'}>
              Next: In Making
            </button>
            <button onclick={() => cancelOrder(o)} disabled={o.status === 'cancelled'}>
              Cancel
            </button>
          </div>
        </div>
      {/each}
    </section>

    <section class="column">
      <h2>In Making</h2>
      {#each inMakingOrders as o (o.id)}
        <div class="order-card">
          <header class="order-header">
            <div>
              <strong>#{o.id}</strong>
              <time datetime={o.createdAt}>{new Date(o.createdAt).toLocaleTimeString()}</time>
            </div>
            <span class="status in-making">in making</span>
          </header>
          <ul class="order-items">
            {#each o.items as it}
              <li>• Item {it.id} × {it.quantity}</li>
            {/each}
          </ul>
          <div class="actions">
            <button onclick={() => toggleStatus(o)}>
              Next: Ready
            </button>
            <button onclick={() => cancelOrder(o)}>
              Cancel
            </button>
          </div>
        </div>
      {/each}
    </section>

    <section class="column">
      <h2>Ready to Pick Up</h2>
      {#each readyOrders as o (o.id)}
        <div class="order-card">
          <header class="order-header">
            <div>
              <strong>#{o.id}</strong>
              <time datetime={o.createdAt}>{new Date(o.createdAt).toLocaleTimeString()}</time>
            </div>
            <span class="status ready">ready</span>
          </header>
          <ul class="order-items">
            {#each o.items as it}
              <li>• Item {it.id} × {it.quantity}</li>
            {/each}
          </ul>
          <div class="actions">
          </div>
        </div>
      {/each}
    </section>
  </div>
{/if}