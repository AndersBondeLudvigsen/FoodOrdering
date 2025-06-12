<script>
  import { onMount } from 'svelte';
  import { favorites, toggleFavorite } from '../../stores/favorites.js';
  import { cart } from '../../stores/cart.js';
  import * as toast from '../../util/toast.js';

  import "../../styels/favorites.css"

  let starredIds = [];
  favorites.subscribe(ids => (starredIds = ids));

  let allMenuItems = [];    // All items fetched from /menu_items
  let favoriteItems = [];   // Only those with IDs in starredIds

  async function loadMenu() {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8080/menu', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      allMenuItems = await res.json();
      favoriteItems = allMenuItems.filter(mi => starredIds.includes(mi.id));
    }
  }

  // Whenever favorites change, recompute the list:
  favorites.subscribe(ids => {
    favoriteItems = allMenuItems.filter(mi => ids.includes(mi.id));
  });

  onMount(async () => {
    await loadMenu();
  });

  // When the user clicks the star, this will un‐favorite on the backend & update the store:
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
        return [...current, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
      }
    });
    toast.success(`${item.name} added to basket`);
  }
</script>

<h1>Your Starred Dishes</h1>

{#if favoriteItems.length === 0}
  <p>You haven’t starred any dishes yet.</p>
{:else}
  <div class="favorites-grid">
    {#each favoriteItems as item}
      <div class="menu-card">
        <!-- Clicking this button will call toggleFavorite(item.id) -->
        <button class="star-button" on:click={() => handleUnfavorite(item.id)}>
          <span class="star filled">★</span>
        </button>

        <img src={item.image_url} alt={item.name} class="thumb" />
        <h2>{item.name}</h2>
        <p><strong>Price:</strong> {item.price} DKK</p>
        <p>
          <strong>Status:</strong>
          <span class={item.available ? 'in-stock' : 'sold-out'}>
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
        {#if item.available}
          <button class="add-btn" on:click={() => addToCart(item)}>
  Add to Basket
</button>

        {:else}
          <button class="add-btn" disabled>
            Sold Out
          </button>
        {/if}
      </div>
    {/each}
  </div>
{/if}
