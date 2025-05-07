<!-- src/components/Pages/Recommend.svelte -->
<script>
    import { onMount }   from 'svelte';
    import { navigate }   from 'svelte-routing';
    import * as toast     from '../../util/toast.js';
  
    let input    = '';
    let recs     = [];
    let loading  = false;
  
    async function submit() {
      loading = true;
      recs = [];
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not logged in');
  
        const res = await fetch('http://localhost:8080/recommend', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
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
        if (!res.ok) throw new Error(body.message || 'Recommendation failed');
  
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
    <ul class="recs">
      {#each recs as { name, why }}
        <li>
          <strong>{name}</strong>: {why}
        </li>
      {/each}
    </ul>
  {/if}
  
  <style>
    .form-group {
      display: flex;
      flex-direction: column;
      max-width: 400px;
      margin: 1rem auto;
    }
    input {
      padding: 0.5rem;
      margin: 0.5rem 0;
      font-size: 1rem;
    }
    button {
      align-self: flex-start;
      padding: 0.5rem 1rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .recs {
      max-width: 600px;
      margin: 1rem auto;
      padding-left: 1rem;
    }
    .recs li {
      margin-bottom: 0.75rem;
    }
  </style>
  