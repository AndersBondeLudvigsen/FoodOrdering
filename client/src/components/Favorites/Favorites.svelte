<script>
    import { onMount } from 'svelte';
    import { favorites, toggleFavorite, loadFavorites } from '../../stores/favorites.js';
    import { addToCart } from '../../stores/cart.js';
    import * as toast from '../../util/toast.js';

    import "../../styels/favorites.css";

    let allFavoriteDetails = $state([]);
    let isLoading = $state(true);

    
    // henter favoritter fra min store.
    let displayedFavorites = $derived(
        allFavoriteDetails.filter(item => $favorites.includes(item.id))
    );
    
    onMount(async () => {
        isLoading = true;
        try {
            await loadFavorites(); 

            const token = localStorage.getItem('token');
            if (!token) {
                allFavoriteDetails = [];
                return;
            }
            const res = await fetch('http://localhost:8080/favorites', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                allFavoriteDetails = await res.json();
            } else {
                toast.error("Could not load your favorite dishes.");
                allFavoriteDetails = [];
            }
        } catch (err) {
            toast.error("An error occurred while loading your favorites.");
            allFavoriteDetails = [];
        } finally {
            isLoading = false;
        }
    });

    function handleUnfavorite(itemId) {
        toggleFavorite(itemId);
    }

  
</script>

<h1>Your Starred Dishes</h1>

{#if isLoading}
    <p>Loading your favorites...</p>
{:else if displayedFavorites.length === 0}
    <p>You haven’t starred any dishes yet.</p>
{:else}
    <div class="favorites-grid">
        {#each displayedFavorites as item (item.id)}
            <div class="menu-card">
                <button class="star-button" onclick={() => handleUnfavorite(item.id)}>
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
                <details>
                    <summary>Ingredients</summary>
                    <ul>
                        {#each item.ingredients as ing}
                            <li>{ing}</li>
                        {/each}
                    </ul>
                </details>
                <button class="add-btn" onclick={() => addToCart(item)} disabled={!item.available}>
                    Add to Basket
                </button>
            </div>
        {/each}
    </div>
{/if}