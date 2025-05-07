<!-- src/components/Pages/Menu.svelte -->
<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  import * as toast   from '../../util/toast.js';

  let menu    = [];
  let loading = true;

  onMount(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const res = await fetch('http://localhost:8080/menu', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        toast.error('Session expired, please log in again');
        return navigate('/login');
      }
      if (!res.ok) {
        throw new Error('Failed to load menu');
      }

      menu = await res.json();
    } catch (err) {
      toast.error(err.message);
      navigate('/login');
    } finally {
      loading = false;
    }
  });
</script>

<h1>Our Menu</h1>

{#if loading}
  <p>Loading…</p>
{:else if menu.length === 0}
  <p>No items available right now.</p>
{:else}
  <div class="menu-grid">
    {#each menu as item}
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
      </div>
    {/each}
  </div>
{/if}

<style>
  /* your existing styles */
</style>
