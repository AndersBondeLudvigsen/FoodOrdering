<!-- src/components/Kitchen/Kitchen.svelte -->
<script>
  import { onMount } from 'svelte';
  import { io }      from 'socket.io-client';
  import * as toast  from '../../util/toast.js';

  let liveOrders = [];
  let loading    = true;
  const statuses = ['pending','in making','ready'];

  // Fetch up‐to‐“ready” orders
  async function loadOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Login required");
      return;
    }
    const res = await fetch("http://localhost:8080/kitchen/orders", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      toast.error("Failed to load orders");
      return;
    }
    const orders = await res.json();
    liveOrders = orders.map(o => ({
      id:        o.id,
      status:    o.status,
      createdAt: o.created_at,
      items:     o.items.map(it => ({ id: it.menuItemId, quantity: it.quantity }))
    }));
  }

  // Advance an order’s status
  async function toggleStatus(order) {
    const idx  = statuses.indexOf(order.status);
    if (idx < 0 || idx === statuses.length - 1) return;
    const next = statuses[idx + 1];
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://localhost:8080/kitchen/orders/${order.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status: next })
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      order.status = next;
      liveOrders = [...liveOrders];
      toast.success(`Order #${order.id} → "${next}"`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Cancel an order
  async function cancelOrder(order) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `http://localhost:8080/kitchen/orders/${order.id}/cancel`,
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
      liveOrders = [...liveOrders];
      toast.success(`Order #${order.id} cancelled`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  onMount(async () => {
    await loadOrders();
    loading = false;

    const token  = localStorage.getItem('token');
    const socket = io('http://localhost:8080', {
      withCredentials: true,
      auth: { token }
    });

    // New orders
    socket.on("new-order", order => {
      liveOrders = [
        {
          id:        order.orderId,
          status:    "pending",
          createdAt: order.createdAt,
          items:     order.items.map(it => ({ id: it.id, quantity: it.quantity }))
        },
        ...liveOrders
      ];
      toast.info(`New order #${order.orderId}`);
    });

    // Status changes
    socket.on("order-status-update", ({ orderId, status }) => {
      const o = liveOrders.find(o => o.id === orderId);
      if (o) {
        o.status = status;
        liveOrders = [...liveOrders];
      }
    });
  });
</script>

<h1>👩‍🍳 Kitchen Dashboard</h1>

{#if loading}
  <p>Loading orders…</p>
{:else}
  <div class="orders-board">
    <!-- Pending / Cancelled -->
    <section class="column">
      <h2>Pending / Cancelled</h2>
      {#each liveOrders.filter(o => o.status === 'pending' || o.status === 'cancelled') as o}
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
            <button on:click={() => toggleStatus(o)} disabled={o.status !== 'pending'}>
              Next: In Making
            </button>
            <button on:click={() => cancelOrder(o)} disabled={o.status === 'cancelled'}>
              Cancel
            </button>
          </div>
        </div>
      {/each}
    </section>

    <!-- In Making -->
    <section class="column">
      <h2>In Making</h2>
      {#each liveOrders.filter(o => o.status === 'in making') as o}
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
            <button on:click={() => toggleStatus(o)}>
              Next: Ready
            </button>
            <button on:click={() => cancelOrder(o)}>
              Cancel
            </button>
          </div>
        </div>
      {/each}
    </section>

    <!-- Ready to Pick Up -->
    <section class="column">
      <h2>Ready to Pick Up</h2>
      {#each liveOrders.filter(o => o.status === 'ready') as o}
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
            <!-- no Next or Cancel here, kitchen is done -->
          </div>
        </div>
      {/each}
    </section>
  </div>
{/if}

<style>
  .orders-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
  }

  .column {
    background: #f9f9f9;
    border-radius: 6px;
    padding: 0.5rem;
  }
  .column h2 {
    text-align: center;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .order-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }
  .order-header time {
    margin-left: 0.5rem;
    font-size: 0.85em;
    color: #555;
  }

  .status {
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.8em;
    text-transform: capitalize;
    color: white;
  }
  .status.pending    { background: orange; }
  .status.cancelled  { background: #e53e3e; }
  .status.in-making  { background: #3182ce; }
  .status.ready      { background: #38a169; }

  .order-items {
    margin: 0.5rem 0;
    padding-left: 1rem;
  }
  .order-items li {
    margin: 0.25rem 0;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .actions button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .actions button:nth-child(1) {
    background: #3182ce;
    color: white;
  }
  .actions button:nth-child(2) {
    background: #e53e3e;
    color: white;
  }
</style>
