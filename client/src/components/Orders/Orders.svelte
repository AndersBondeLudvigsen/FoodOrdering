<script>
    import { onMount } from 'svelte';
    import { navigate, useLocation } from 'svelte-routing';
    import { io } from 'socket.io-client';
    import * as toast from '../../util/toast.js';

    import "../../styels/myOrders.css";

    let orders = $state([]);
    let loading = $state(true);

    // useLocation giver en store, vi kan abonnere på med '$'
    const location = useLocation();

    // Bruger $derived til at skabe lister til visning i de forskellige kolloner
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
        try {
            const res = await fetch('http://localhost:8080/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load orders');
            // Opdaterer $state variablen direkte
            orders = await res.json();
        } catch (err) {
            toast.error(err.message);
            navigate('/login');
        }
    }

    // Opsætter realtids-listeners og returnerer en cleanup-funktion
    function setupSocketListeners(token, userId) {
        const socket = io('http://localhost:8080', {
            withCredentials: true,
            auth: { token }
        });

        socket.on('new-order', data => {
            if (data.userId === userId) {
                orders.unshift({
                    id: data.orderId,
                    status: 'pending',
                    created_at: data.createdAt,
                    items: data.items
                });
                toast.info(`New order #${data.orderId}`);
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

    onMount(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('You must be logged in');
            return navigate('/login');
        }
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        let cleanupSocket = () => {}; 

        (async () => {
            // Bruger $location i stedet for get(location)
            const params = new URLSearchParams($location.search);
            const sessionId = params.get('session_id');

            if (sessionId) {
                await handleCheckoutSuccess(sessionId, token);
            }

            await fetchInitialOrders(token);
            
            cleanupSocket = setupSocketListeners(token, payload.id);

            loading = false;
        })();
               return () => cleanupSocket();
    });

    async function reorder(order) {
        const token = localStorage.getItem('token');
        if (!token) return toast.error('You must be logged in');
        
        try {
            const items = order.items.map(it => ({ id: it.menuItemId, quantity: it.quantity }));
            const res = await fetch('http://localhost:8080/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
            {#each pendingOrders as o (o.id)}
                <div class="order-card">
                    <header class="order-header">
                        <div><strong>#{o.id}</strong> <time datetime={o.created_at}>{new Date(o.created_at).toLocaleTimeString()}</time></div>
                        <span class="status {o.status.replace(/\s+/g, '-')}">{o.status}</span>
                    </header>
                    <ul class="order-items">
                        {#each o.items as it}<li>• {it.menuItemId} × {it.quantity}</li>{/each}
                    </ul>
                </div>
            {/each}
        </section>

        <section class="column">
            <h2>In Making</h2>
            {#each inMakingOrders as o (o.id)}
                <div class="order-card">
                    <header class="order-header">
                        <div><strong>#{o.id}</strong> <time datetime={o.created_at}>{new Date(o.created_at).toLocaleTimeString()}</time></div>
                        <span class="status in-making">in making</span>
                    </header>
                    <ul class="order-items">
                        {#each o.items as it}<li>• {it.menuItemId} × {it.quantity}</li>{/each}
                    </ul>
                </div>
            {/each}
        </section>

        <section class="column">
            <h2>Ready to Pick Up</h2>
            {#each readyOrders as o (o.id)}
                <div class="order-card">
                    <header class="order-header">
                        <div><strong>#{o.id}</strong> <time datetime={o.created_at}>{new Date(o.created_at).toLocaleTimeString()}</time></div>
                        <span class="status ready">ready</span>
                    </header>
                    <ul class="order-items">
                        {#each o.items as it}<li>• {it.menuItemId} × {it.quantity}</li>{/each}
                    </ul>
                    <button class="reorder-btn" onclick={() => reorder(o)}>Reorder</button>
                </div>
            {/each}
        </section>
    </div>
{/if}