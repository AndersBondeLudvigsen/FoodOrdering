<!-- src/components/Kitchen/Kitchen.svelte -->
<script>
  import { onMount } from 'svelte';
  import { io }      from 'socket.io-client';
  import * as toast  from '../../util/toast.js';

  let liveOrders = [];
  let loading    = true;
  const statuses = ['pending','in making','ready'];

  // 1) Load all orders *up to* “ready”
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

  // 2) Toggle status on the server (and broadcast)
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
      liveOrders = [...liveOrders];  // trigger re-render
      toast.success(`Order #${order.id} → "${next}"`);
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

    // Status changes (so multiple cooks' actions sync)
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
{:else if liveOrders.length === 0}
  <p>No orders yet…</p>
{:else}
  <ul>
    {#each liveOrders as o}
      <li style="margin:1rem 0; border:1px solid #ddd; padding:0.5rem; border-radius:4px">
        <strong>Order #{o.id}</strong>
        <div>Placed @ {new Date(o.createdAt).toLocaleTimeString()}</div>
        <div>Status: <em>{o.status}</em></div>
        <button
          on:click={() => toggleStatus(o)}
          disabled={o.status === 'ready'}
          style="margin:0.5rem 0"
        >
          Next: {statuses[statuses.indexOf(o.status)+1] || '—'}
        </button>
        <ul>
          {#each o.items as it}
            <li>Item {it.id} × {it.quantity}</li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul { list-style: none; padding: 0; }
  li > ul { margin-top: 0.5rem; padding-left: 1rem; }
  button[disabled] { opacity: 0.5; cursor: not-allowed; }
</style>
