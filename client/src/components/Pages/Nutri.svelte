<!-- src/components/Nutri.svelte -->
<script>
  export let id; // menu_item id

  let showNutrition = false;
  let nutritionData = null;
  let loading = false;
  let error = "";

  async function fetchNutrition() {
    loading = true;
    error = "";
    nutritionData = null;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8080/nutri/menu/${id}/nutrition`,
        {
          headers: {
            // Hvis dit endpoint kræver token (authenticateJWT), send det her:
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke hente ernæringsdata");
      }

      nutritionData = data;
      showNutrition = true;
    } catch (err) {
      console.error(err);
      error = err.message;
      showNutrition = false;
    } finally {
      loading = false;
    }
  }
</script>

<style>
  .nutri-container {
    margin-top: 0.75rem;
    background: #f3f4f6;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  .nutri-container p {
    margin: 0.25rem 0;
  }
  .nutri-error {
    color: #dc2626;
    margin-top: 0.5rem;
  }
  .nutri-btn {
    margin-top: 0.5rem;
    padding: 0.4rem 0.8rem;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .nutri-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>

<button class="nutri-btn" on:click={fetchNutrition} disabled={loading}>
  {#if loading} Henter ernæring… {:else} Vis ernærings‐info {/if}
</button>

{#if error}
  <p class="nutri-error">{error}</p>
{/if}

{#if showNutrition && nutritionData}
  <div class="nutri-container">
    {#if nutritionData.foods && nutritionData.foods.length}
      {@const foods = nutritionData.foods}
      {@const totalCalories = foods.reduce((sum, f) => sum + (f.nf_calories || 0), 0)}
      {@const totalFat      = foods.reduce((sum, f) => sum + (f.nf_total_fat || 0), 0)}
      {@const totalProtein  = foods.reduce((sum, f) => sum + (f.nf_protein || 0), 0)}
      {@const totalCarbs    = foods.reduce((sum, f) => sum + (f.nf_total_carbohydrate || 0), 0)}

      <p><strong>Kalorier:</strong> {totalCalories.toFixed(0)}</p>
      <p><strong>Fedt:</strong> {totalFat.toFixed(1)} g</p>
      <p><strong>Protein:</strong> {totalProtein.toFixed(1)} g</p>
      <p><strong>Kulhydrater:</strong> {totalCarbs.toFixed(1)} g</p>
    {:else}
      <p>Ingen ernæringsdata tilgængelig for denne ret.</p>
    {/if}
  </div>
{/if}
