<script>
    import { onMount } from 'svelte';
    // We only need the store itself and the toggle function
    import { favorites, toggleFavorite, loadFavorites } from '../../stores/favorites.js';
    import { cart } from '../../stores/cart.js';
    import * as toast from '../../util/toast.js';

    import "../../styels/favorites.css";

    // This will hold the full details of the favorite items fetched from the server.
    let favoriteItems = [];
    let isLoading = true;

    // A reactive statement that filters the displayed list whenever the underlying
    // $favorites store (the Set of IDs) changes. This happens instantly when a user
    // unfavorites an item, without needing a new network call.
    $: if (favoriteItems.length > 0) {
        favoriteItems = favoriteItems.filter(item => $favorites.includes(item.id));
    }
    
    // onMount now fetches ONLY the user's favorite items directly.
    onMount(async () => {
        isLoading = true;
        try {
            // First, ensure the favorite IDs are loaded into the store
            await loadFavorites(); 

            // Then, fetch the detailed favorite items from the dedicated endpoint
            const token = localStorage.getItem('token');
            if (!token) {
                favoriteItems = [];
                return;
            }
            const res = await fetch('http://localhost:8080/favorites', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                favoriteItems = await res.json();
            } else {
                toast.error("Could not load your favorite dishes.");
                favoriteItems = [];
            }
        } catch (err) {
            toast.error("An error occurred while loading your favorites.");
            favoriteItems = [];
        } finally {
            isLoading = false;
        }
    });

    // The toggleFavorite function is already optimized in your store,
    // so we just call it directly. The reactive statement above will handle the UI update.
    function handleUnfavorite(itemId) {
        toggleFavorite(itemId);
    }

    function addToCart(item) {
        cart.update(current => {
            const idx = current.findIndex(i => i.id === item.id);
            if (idx > -1) {
                current[idx].quantity += 1;
                return current;
            } else {
                return [...current, { ...item, quantity: 1 }];
            }
        });
        toast.success(`${item.name} added to basket`);
    }
</script>

<h1>Your Starred Dishes</h1>

{#if isLoading}
    <p>Loading your favorites...</p>
{:else if favoriteItems.length === 0}
    <p>You haven’t starred any dishes yet.</p>
{:else}
    <div class="favorites-grid">
        {#each favoriteItems as item}
            <div class="menu-card">
                <!-- Clicking this button calls the optimized toggleFavorite function -->
                <button class="star-button" on:click={() => handleUnfavorite(item.id)}>
                    <span class="star filled">★</span>
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
                <!-- Ingredients and Add to Cart button remain the same -->
                <details>
                    <summary>Ingredients</summary>
                    <ul>
                        {#each item.ingredients as ing}
                            <li>{ing}</li>
                        {/each}
                    </ul>
                </details>
                <button class="add-btn" on:click={() => addToCart(item)} disabled={!item.available}>
                    Add to Basket
                </button>
            </div>
        {/each}
    </div>
{/if}

