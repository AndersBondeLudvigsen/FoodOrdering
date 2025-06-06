<!-- src/components/Pages/Menu.svelte -->
<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import * as toast from '../../util/toast.js';
  import { cart } from '../../stores/cart.js';
  import { favorites, toggleFavorite, loadFavorites } from '../../stores/favorites.js';

  import Nutri from './Nutri.svelte';

  let menu = [];
  let loading = true;
  let categories = [];
  let selectedCat = 'All';
  let searchTerm = '';

  let excluded = [];        
  let newAllergy = '';     

  onMount(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const res = await fetch('http://localhost:8080/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        toast.error('Session expired, please log in again');
        return navigate('/login');
      }
      if (!res.ok) {
        throw new Error('Failed to load menu');
      }
      menu = await res.json();

      const cats = menu
        .map(i => i.category || 'Uncategorized')
        .filter(Boolean);
      categories = ['All', ...Array.from(new Set(cats))];

      await loadFavorites();
    } catch (err) {
      toast.error(err.message);
      navigate('/login');
    } finally {
      loading = false;
    }
  });

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

  function addAllergy() {
    const trimmed = newAllergy.trim().toLowerCase();
    if (trimmed && !excluded.includes(trimmed)) {
      excluded = [...excluded, trimmed];
    }
    newAllergy = '';
  }

  function removeAllergy(ing) {
    excluded = excluded.filter(x => x !== ing);
  }

   function isSafe(item) {
   if (!item.ingredients || !Array.isArray(item.ingredients))
    return true;
   const lowerIngredients = item.ingredients.map(i => i.toLowerCase());
   return excluded.every(allergen => {
     const escaped = allergen.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
     const re = new RegExp(`\\b${escaped}\\b`);
     return !lowerIngredients.some(ingLine => re.test(ingLine));
   });
 }
</script>

<h1>Our Menu</h1>

{#if loading}
  <p>Loading…</p>
{:else}
  {#if menu.length === 0}
    <p>No items available right now.</p>
  {:else}
    <div class="allergy-controls">
      <label>
        Allergic to:
        <input
          type="text"
          placeholder="e.g. peanuts"
          bind:value={newAllergy}
          on:keydown={(e) => e.key === 'Enter' && addAllergy()}
        />
      </label>
      <button on:click={addAllergy} disabled={!newAllergy.trim()}>
        Add
      </button>
    </div>

    {#if excluded.length}
      <div class="excluded-list">
        <p><strong>Excluding:</strong></p>
        {#each excluded as ing}
          <span class="excluded-item">
            {ing}
            <button class="remove-btn" on:click={() => removeAllergy(ing)}>✕</button>
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
        <input
          type="text"
          placeholder="Start typing..."
          bind:value={searchTerm}
        />
      </label>
    </div>

    <div class="menu-grid">
      {#each menu
         .filter(item =>
           (selectedCat === 'All' || (item.category || 'Uncategorized') === selectedCat)
           && item.name.toLowerCase().includes(searchTerm.toLowerCase())
           && isSafe(item)
         ) as item}
        <div class="menu-card">
          {#if $favorites.includes(item.id)}
            <button class="star-button" on:click={() => toggleFavorite(item.id)}>
              <span class="star filled">★</span>
            </button>
          {:else}
            <button class="star-button" on:click={() => toggleFavorite(item.id)}>
              <span class="star outline">☆</span>
            </button>
          {/if}

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
            <Nutri id={item.id} />
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
{/if}

<style>
  .allergy-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .allergy-controls input {
    padding: 0.25rem;
    margin-left: 0.5rem;
  }
  .allergy-controls button {
    padding: 0.25rem 0.5rem;
    background: #e53e3e;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .allergy-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .excluded-list {
    margin-bottom: 1rem;
  }
  .excluded-item {
    display: inline-flex;
    align-items: center;
    background: #fed7d7;
    color: #742a2a;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .remove-btn {
    background: none;
    border: none;
    margin-left: 0.25rem;
    font-weight: bold;
    cursor: pointer;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .filter-label,
  .search-label {
    font-weight: bold;
  }
  .filter-label select,
  .search-label input {
    margin-left: 0.5rem;
    padding: 0.25rem;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
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

  .in-stock {
    color: green;
  }
  .sold-out {
    color: red;
  }

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

  /* Star button styles */
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
  .star {
    pointer-events: none;
  }
  .star.filled {
    color: gold;
  }
  .star.outline {
    color: gray;
  }
</style>
