<!-- src/components/Pages/Menu.svelte -->
<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import * as toast from '../../util/toast.js';
  import { cart } from '../../stores/cart.js';
  import { favorites, toggleFavorite, loadFavorites } from '../../stores/favorites.js';

  import Nutri from './Nutri.svelte';
  import "../../styels/menuPage.css"

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


