<script>
	import { navigate } from 'svelte-routing';
	import { io } from 'socket.io-client';
	import { onMount } from 'svelte';


	import * as toast from '../../util/toast.js';

	import { addToCart } from '../../stores/cart.js';
	import { favorites, toggleFavorite, loadFavorites } from '../../stores/favorites.js';

	import Nutri from './Nutri.svelte';

	import '../../styels/menuPage.css';

	let menu = $state([]);
	let loading = $state(true);
	let categories = $state([]);
	let selectedCat = $state('All');
	let searchTerm = $state('');
	let excluded = $state([]);
	let newAllergy = $state('');

	
	onMount(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			toast.error('Not logged in');
			navigate('/login');
			return;
		}

		(async () => {
			try {
				const res = await fetch('http://localhost:8080/menu', {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.status === 401) {
					throw new Error('Session expired, please log in again');
				}
				if (!res.ok) {
					throw new Error('Failed to load menu');
				}
				const fetchedMenu = await res.json();
				menu = fetchedMenu; // Opdaterer state

				//  kategorier fra menuen
				const cats = fetchedMenu.map((i) => i.category || 'Uncategorized').filter(Boolean);
				categories = ['All', ...new Set(cats)];

				await loadFavorites();
			} catch (err) {
				toast.error(err.message);
				navigate('/login');
			} finally {
				loading = false;
			}
		})();

		const socket = io('http://localhost:8080');
		socket.on('menu-item-updated', ({ id, available }) => {
			const itemToUpdate = menu.find((item) => item.id === id);
			if (itemToUpdate) {
				itemToUpdate.available = available; 
				const statusText = available ? 'is back in stock' : 'is now sold out';
				toast.info(`${itemToUpdate.name} ${statusText}`);
			}
		});
		return () => {
			socket.disconnect();
		};
	});

	
	// filteredmenu bliver opdateret sammen afhængig af states
	let filteredMenu = $derived(
		menu.filter((item) => {
			const categoryMatch = selectedCat === 'All' || (item.category || 'Uncategorized') === selectedCat;
			const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
			const lowerIngredients = (item.ingredients ?? []).map((i) => i.toLowerCase());
			const isSafe = excluded.every((allergen) =>
				!lowerIngredients.some((ingLine) =>
					new RegExp(`\\b${allergen.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(ingLine)
				)
			);

			return categoryMatch && searchMatch && isSafe;
		})
	);

	function addAllergy() {
		const trimmed = newAllergy.trim().toLowerCase();
		if (trimmed && !excluded.includes(trimmed)) {
			excluded.push(trimmed); // Opdaterer $state array'et
		}
		newAllergy = '';
	}

	function removeAllergy(ing) {
		excluded = excluded.filter((x) => x !== ing); // Opdaterer $state array'et
	}
</script>

<h1>Our Menu</h1>

{#if loading}
	<p>Loading…</p>
{:else if menu.length === 0}
	<p>No items available right now.</p>
{:else}
	<div class="allergy-controls">
		<label>
			Allergic to:
			<input
				type="text"
				placeholder="e.g. peanuts"
				bind:value={newAllergy}
				onkeydown={(e) => e.key === 'Enter' && addAllergy()}
			/>
		</label>
		<button onclick={addAllergy} disabled={!newAllergy.trim()}> Add </button>
	</div>

	{#if excluded.length}
		<div class="excluded-list">
			<p><strong>Excluding:</strong></p>
			{#each excluded as ing}
				<span class="excluded-item">
					{ing}
					<button class="remove-btn" onclick={() => removeAllergy(ing)}>✕</button>
				</span>
			{/each}
		</div>
	{/if}

	<div class="controls">
		<label class="filter-label">
			Filter by category:
			<select bind:value={selectedCat}>
				{#each categories as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
		</label>
		<label class="search-label">
			Search by name:
			<input type="text" placeholder="Start typing..." bind:value={searchTerm} />
		</label>
	</div>

	<div class="menu-grid">
		{#each filteredMenu as item (item.id)}
			<div class="menu-card">
				<button class="star-button" onclick={() => toggleFavorite(item.id)}>
					<span class="star {$favorites.includes(item.id) ? 'filled' : 'outline'}">
						{$favorites.includes(item.id) ? '★' : '☆'}
					</span>
				</button>

				<img src={item.image_url} alt={item.name} class="thumb" />
				<h2>{item.name}</h2>
				<p><strong>Price:</strong> {item.price} DKK</p>
				<p>
					<strong>Status:</strong>
					<span class:in-stock={item.available} class:sold-out={!item.available}>
						{item.available ? 'In Stock' : 'Sold Out'}
					</span>
				</p>

				<details>
					<summary>Ingredients</summary>
					<ul>
						{#each item.ingredients as ing}
							<li>{ing}</li>
						{/each}
					</ul>
					<Nutri id={item.id} />
				</details>

				{#if item.available}
					<button class="add-btn" onclick={() => addToCart(item)}> Add to Basket </button>
				{:else}
					<button class="add-btn" disabled> Sold Out </button>
				{/if}
			</div>
		{/each}
	</div>
{/if}