<script>
  import { navigate } from 'svelte-routing';
  import * as toast from '../../util/toast.js';
  import { cart } from '../../stores/cart.js'; 

  import "../../styels/recommend.css"

  let input = '';
  let recs = [];
  let loading = false;

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

  async function submit() {
    loading = true;
    recs = []; 
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const res = await fetch('http://localhost:8080/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          likedIngredients: input
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Recommendation failed');
      }

      recs = body; 

    } catch (err) {
      toast.error(err.message);
      if (err.message.includes('Not logged in')) {
        navigate('/login');
      }
    } finally {
      loading = false;
    }
  }
</script>

<h1>Chef’s AI Helper</h1>

<div class="form-group">
  <label for="ingredients">Enter ingredients you like, separated by commas:</label>
  <input
    id="ingredients"
    bind:value={input}
    placeholder="e.g. chicken, garlic, mushroom"
  />
  <button on:click={submit} disabled={loading || !input.trim()}>
    {#if loading}Thinking…{:else}Recommend{/if}
  </button>
</div>

{#if recs.length}
  <h2>Recommendations</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Why</th>
          <th>Price</th>
          <th>Image</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each recs as item}
          <tr>
            <td>{item.id}</td>
            <td>{item.name}</td>
            <td>{item.why}</td>
            <td>
              {#if item.price !== null && typeof item.price !== 'undefined'}
                {parseFloat(item.price).toFixed(2)} DKK
              {:else}
                N/A
              {/if}
            </td>
            <td>
              {#if item.image_url}
                <img src={item.image_url} alt={item.name} class="menu-image" />
              {:else}
                No Image Available
              {/if}
            </td>
            <td>
              {#if item.available}
                <button class="add-btn" on:click={() => addToCart(item)}>
                  Add to Basket
                </button>
              {:else}
                <button class="add-btn" disabled>
                  Sold Out
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

{/if}
