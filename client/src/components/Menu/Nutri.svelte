<script>
	import '../../styels/nutri.css';

	// 1. Modtag 'id' prop 
	let { id } = $props();

	let showNutrition = $state(false);
	let nutritionData = $state(null);
	let loading = $state(false);
	let error = $state('');

	// 3. Brug $derived til beregnede værdier.
	let totals = $derived(
		(nutritionData?.foods ?? []).reduce(
			(acc, food) => {
				acc.calories += food.nf_calories || 0;
				acc.fat += food.nf_total_fat || 0;
				acc.protein += food.nf_protein || 0;
				acc.carbs += food.nf_total_carbohydrate || 0;
				return acc;
			},
			{ calories: 0, fat: 0, protein: 0, carbs: 0 }
		)
	);

	async function fetchNutrition() {
		loading = true;
		error = '';
		nutritionData = null;

		try {
			const token = localStorage.getItem('token');
			const res = await fetch(`http://localhost:8080/nutrisions/${id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || 'Kunne ikke hente ernæringsdata');
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

<button class="nutri-btn" onclick={fetchNutrition} disabled={loading}>
	{#if loading} Henter ernæring… {:else} Vis ernærings‐info {/if}
</button>

{#if error}
	<p class="nutri-error">{error}</p>
{/if}

{#if showNutrition && nutritionData?.foods?.length}
	<div class="nutri-container">
		<p><strong>Kalorier:</strong>{totals.calories.toFixed(0)}</p>
		<p><strong>Fedt:</strong>{totals.fat.toFixed(1)} g</p>
		<p><strong>Protein:</strong>{totals.protein.toFixed(1)} g</p>
		<p><strong>Kulhydrater:</strong>{totals.carbs.toFixed(1)} g</p>
	</div>
{:else if showNutrition}
	<p>Ingen ernæringsdata tilgængelig for denne ret.</p>
{/if}