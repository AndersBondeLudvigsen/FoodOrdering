<!-- client/src/routes/favorites.svelte -->
<script>
  import { onMount } from 'svelte';
  import { favorites, toggleFavorite } from '../../stores/favorites.js';

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
          <button class="add-btn" on:click={() => {/* your addToCart logic if desired */}}>
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

<style>
  .favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .menu-card {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .thumb {
    width: 100%;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .in-stock { color: green; }
  .sold-out { color: red; }

  details {
    margin-top: 0.5rem;
    width: 100%;
  }
  summary {
    cursor: pointer;
    font-weight: bold;
  }
  details ul {
    padding-left: 1rem;
    margin: 0.5rem 0 0;
  }
  details li {
    list-style: disc;
    font-size: 0.9em;
  }

  .add-btn {
    margin-top: auto;
    padding: 0.5rem 1rem;
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .add-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  .add-btn:hover:enabled {
    background: #1e874b;
  }

  /* Star button in top-right */
  .star-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    padding: 0;
  }
  .star.filled {
    color: gold;
  }
</style>
