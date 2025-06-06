<script>
  import { navigate } from 'svelte-routing';
  import * as toast from '../../util/toast.js';
  import { cart } from '../../stores/cart.js'; 

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

      const res = await fetch('http://localhost:8080/recommend', {
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

<style>
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }
  h2 {
    text-align: center;
    color: #555;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    max-width: 400px;
    margin: 1rem auto;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  label {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }
  input {
    padding: 0.75rem;
    margin: 0.5rem 0 1rem 0;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; 
  }
  input:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  button {
    align-self: flex-end;
    padding: 0.75rem 1.5rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s ease-in-out;
  }
  button:hover:not(:disabled) {
    background: #2980b9;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #aab;
  }

  /* Specific styles for the add-to-basket button */
  .add-btn {
    padding: 8px 12px; /* Smaller padding for table button */
    font-size: 0.9em;
    background-color: #28a745; /* Green color for add to cart */
  }
  .add-btn:hover:not(:disabled) {
    background-color: #218838;
  }
  .add-btn[disabled] {
    background-color: #dc3545; /* Red for sold out/disabled */
    color: white;
  }

  .table-container {
    max-width: 800px;
    margin: 2rem auto;
    overflow-x: auto;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #eee;
    padding: 12px 15px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
    color: #444;
    text-transform: uppercase;
    font-size: 0.9em;
  }
  tr:nth-child(even) {
    background-color: #f8f8f8;
  }
  tr:hover {
    background-color: #f0f0f0;
  }
  .menu-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
    margin: 0 auto;
  }

  @media (max-width: 600px) {
    .form-group, .table-container {
      margin-left: 1rem;
      margin-right: 1rem;
    }
    th, td {
      padding: 8px 10px;
      font-size: 0.9em;
    }
    .menu-image {
      width: 60px;
      height: 60px;
    }
    .add-btn {
      padding: 6px 10px;
      font-size: 0.8em;
    }
  }
</style>