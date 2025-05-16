<!-- src/components/Pages/Menu.svelte -->
<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import * as toast   from '../../util/toast.js';
  import { cart }     from '../../stores/cart.js';

  let menu        = [];
  let loading     = true;
  let categories  = [];
  let selectedCat = 'All';
  let searchTerm  = '';

  onMount(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const res = await fetch('http://localhost:8080/menu', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        toast.error('Session expired, please log in again');
        return navigate('/login');
      }
      if (!res.ok) {
        throw new Error('Failed to load menu');
      }

      menu = await res.json();

      // Derive unique categories (fall back to "Uncategorized")
      const cats = menu
        .map(i => i.category || 'Uncategorized')
        .filter(Boolean);
      categories = ['All', ...Array.from(new Set(cats))];
    } catch (err) {
      toast.error(err.message);
      navigate('/login');
    } finally {
      loading = false;
    }
  });

  function logout() {
    localStorage.removeItem('token');
    toast.info('Logged out');
    navigate('/login');
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

<h1>Our Menu</h1>
<button class="logout-btn" on:click={logout}>Log Out</button>

{#if loading}
  <p>Loading…</p>
{:else}
  {#if menu.length === 0}
    <p>No items available right now.</p>
  {:else}
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
         ) as item}
        <div class="menu-card">
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
{/if}

<style>
  .logout-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    margin-bottom: 1rem;
    cursor: pointer;
    border-radius: 4px;
  }
  .logout-btn:hover {
    background: #c0392b;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .filter-label, .search-label {
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
</style>
