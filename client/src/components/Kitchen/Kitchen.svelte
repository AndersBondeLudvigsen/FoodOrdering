<script>
  import { onMount } from "svelte";
  import { io }      from "socket.io-client";
  import * as toast  from "../../util/toast.js";

  let liveOrders = [];
  let loading    = true;

  // 1) Fetch all pending orders from your new kitchen endpoint
  async function loadPendingOrders() {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to view the kitchen dashboard");
      return;
    }

    const res = await fetch("http://localhost:8080/kitchen/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      toast.error("Failed to load pending orders");
      console.error(await res.text());
      return;
    }

    const orders = await res.json();
    liveOrders = orders.map((o) => ({
      orderId:   o.id,
      createdAt: o.created_at,
      items:     o.items.map((it) => ({
        id:       it.menuItemId,
        quantity: it.quantity,
      })),
    }));
  }

  onMount(async () => {
    // Boot-strap the list from the database
    await loadPendingOrders();
    loading = false;

    // Then open the socket so we don’t miss any new orders
    const socket = io("http://localhost:8080", { withCredentials: true });
    socket.on("new-order", (order) => {
      liveOrders = [
        {
          orderId:   order.orderId,
          createdAt: order.createdAt,
          items:     order.items.map((it) => ({
            id:       it.id,
            quantity: it.quantity,
          })),
        },
        ...liveOrders,
      ];
      toast.info(`New order #${order.orderId}`);
    });
  });
</script>

<h1>👩‍🍳 Kitchen Dashboard</h1>

{#if loading}
  <p>Loading pending orders…</p>
{:else if liveOrders.length === 0}
  <p>No pending orders…</p>
{:else}
  <ul>
    {#each liveOrders as o}
      <li style="margin:1rem 0">
        <strong>Order #{o.orderId}</strong>
        <div>Placed @ {new Date(o.createdAt).toLocaleTimeString()}</div>
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
</style>
