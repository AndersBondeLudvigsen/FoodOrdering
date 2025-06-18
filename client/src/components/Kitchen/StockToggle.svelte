<script>
	import { io } from 'socket.io-client';
	import * as toast from '../../util/toast.js';
	import '../../styels/stocktoggle.css';
  import { onMount } from 'svelte';

	let menuId = $state('');
	let item = $state(null);
	let loading = $state(false);
	let toggling = $state(false);

	onMount(() => {
		const token = localStorage.getItem('token');
		const socket = io('http://localhost:8080', { auth: { token } });
		
		socket.on('menu-item-updated', ({ id, available }) => {
			if (item && item.id === id) {
				item.available = available;
			}
		});
		return () => {
			socket.disconnect();
		};
	});

	async function fetchItem() {
		if (!menuId) return;
		loading = true;
		item = null; 
		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`http://localhost:8080/menu/${menuId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error('Item not found');
			item = await res.json();
		} catch (err) {
			toast.error(err.message);
		} finally {
			loading = false;
		}
	}

	async function toggleAvailability() {
		if (!item) return;
		toggling = true;
		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`http://localhost:8080/kitchen/menu-items/${item.id}/availability`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body: JSON.stringify({ available: !item.available }),
			});
			if (!res.ok) throw new Error('Update failed');
		} catch (err) {
			toast.error(err.message);
		} finally {
			toggling = false;
		}
	}
</script>

<h1>Kitchen Stock Toggle</h1>

<div class="search">
	<input
		type="number"
		min="1"
		placeholder="Enter Menu ID"
		bind:value={menuId}
		onkeydown={(e) => e.key === 'Enter' && fetchItem()}
	/>
	<button onclick={fetchItem} disabled={!menuId || loading}>
		{loading ? 'Loading…' : 'Show menu item'}
	</button>
</div>

{#if item}
	<div class="detail">
		<h2>{item.name} (ID: {item.id})</h2>
		<p>
			Status:
			<strong class:in-stock={item.available} class:sold-out={!item.available}>
				{item.available ? 'In Stock' : 'Sold Out'}
			</strong>
		</p>
		<button onclick={toggleAvailability} disabled={toggling} class="toggle-btn">
			{#if toggling}
				Updating…
			{:else if item.available}
				Mark Sold Out
			{:else}
				Restock
			{/if}
		</button>
	</div>
{/if}