    <script>
        import { onMount } from 'svelte';
        import { navigate, useLocation } from 'svelte-routing';
        import { io } from 'socket.io-client';
        
        import * as toast from '../../util/toast.js';

        import "../../styels/myOrders.css";

        let orders = $state([]);
        let loading = $state(true);

        const location = useLocation();
        
        let pendingOrders = $derived(orders.filter(o => o.status === 'pending' || o.status === 'cancelled'));
        let inMakingOrders = $derived(orders.filter(o => o.status === 'in making'));
        let readyOrders = $derived(orders.filter(o => o.status === 'ready'));

        async function handleCheckoutSuccess(sessionId, token) {
            const pending = localStorage.getItem('pending_order');
            if (!pending) return;

            try {
                const items = JSON.parse(pending);
                const res = await fetch('http://localhost:8080/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

        async function fetchInitialOrders(token) {
            const res = await fetch('http://localhost:8080/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load orders');
            orders = await res.json();
        }
        
        async function reorder(order) {
            const token = localStorage.getItem('token');
            if (!token) return toast.error('You must be logged in');
            
            try {
                const items = order.items.map(it => ({ id: it.menuItemId, quantity: it.quantity }));
                await fetch('http://localhost:8080/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ items })
                });
            } catch (err) {
                toast.error(err.message || 'Failed to reorder');
            }
        }

        // --- WebSocket Håndtering ---
        function setupSocketListeners(token, userId) {
            const socket = io('http://localhost:8080', { auth: { token } });

            socket.on('new-order', data => {
                if (data.userId === userId) {
                    orders.unshift({
                        id: data.orderId, status: 'pending', created_at: data.createdAt, items: data.items
                    });
                    toast.info(`New order #${data.orderId} received!`);
                }
            });

            socket.on('order-status-update', ({ orderId, status, userId: updatedUserId }) => {
                if (updatedUserId !== userId) return;
                const orderToUpdate = orders.find(o => o.id === orderId);
                if (orderToUpdate) {
                    orderToUpdate.status = status;
                    toast.info(`Order #${orderId} is now "${status}"`);
                }
            });
            
            return () => socket.disconnect();
        }

        // --- Side Initialisering ---
        async function initializePage(token, userId) {
            try {
                const params = new URLSearchParams($location.search);
                const sessionId = params.get('session_id');
                if (sessionId) {
                    await handleCheckoutSuccess(sessionId, token);
                    navigate('/orders', { replace: true });
                }
                await fetchInitialOrders(token);
                return setupSocketListeners(token, userId);
            } catch (err) {
                toast.error(err.message);
                navigate('/login');
                return () => {};
            } finally {
                loading = false;
            }
        }

        onMount(() => {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('You must be logged in');
                navigate('/login');
                return;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            let cleanupFunction = () => {};

            initializePage(token, payload.id).then(cleanup => {
                cleanupFunction = cleanup;
            });

            return () => cleanupFunction();
        });
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
                {#each pendingOrders as order (order.id)}
                    <div class="order-card">
                        <header class="order-header">
                            <div>
                                <strong>#{order.id}</strong>
                                <time datetime={order.created_at}>{new Date(order.created_at).toLocaleTimeString()}</time>
                            </div>
                            <span class="status {order.status.replace(/\s+/g, '-')}">{order.status}</span>
                        </header>
                        <ul class="order-items">
                            {#each order.items as item}
                                <li>• Vare ID {item.menuItemId} × {item.quantity}</li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </section>

            <section class="column">
                <h2>In Making</h2>
                {#each inMakingOrders as order (order.id)}
                    <div class="order-card">
                        <header class="order-header">
                            <div>
                                <strong>#{order.id}</strong>
                                <time datetime={order.created_at}>{new Date(order.created_at).toLocaleTimeString()}</time>
                            </div>
                            <span class="status in-making">in making</span>
                        </header>
                        <ul class="order-items">
                            {#each order.items as item}
                                <li>• Vare ID {item.menuItemId} × {item.quantity}</li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </section>

            <section class="column">
                <h2>Ready to Pick Up</h2>
                {#each readyOrders as order (order.id)}
                    <div class="order-card">
                        <header class="order-header">
                            <div>
                                <strong>#{order.id}</strong>
                                <time datetime={order.created_at}>{new Date(order.created_at).toLocaleTimeString()}</time>
                            </div>
                            <span class="status ready">ready</span>
                        </header>
                        <ul class="order-items">
                            {#each order.items as item}
                                <li>• Vare ID {item.menuItemId} × {item.quantity}</li>
                            {/each}
                        </ul>
                        <button class="reorder-btn" onclick={() => reorder(order)}>
                            Reorder
                        </button>
                    </div>
                {/each}
            </section>
        </div>
    {/if}