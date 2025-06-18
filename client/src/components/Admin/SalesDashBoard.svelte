<script>
	import * as toast from '../../util/toast.js';
	import Chart from 'chart.js/auto';

	import "../../styels/salesdashboard.css";


	let dailyChartCtx;
	let topItemsChartCtx;
	let hourlyChartCtx;

	let salesData = $state({
		daily: [],
		topItems: [],
		hourly: []
	});

	let itemSearchInput = $state('');
	let itemSalesResult = $state(null);
	let itemSearchLoading = $state(false);


	
	async function loadSales() {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				toast.error('Du er ikke logget ind. Log venligst ind for at se salgsdata.');
				return;
			}

			const res = await fetch('http://localhost:8080/admin/sales', {
				headers: { 'Authorization': `Bearer ${token}` }
			});

			if (!res.ok) {
				const errorBody = await res.json();
				throw new Error(errorBody.message || 'Kunne ikke hente overordnede salgsdata.');
			}

			// Opdatering af $state-salesData og den ville nu automatisk udløse $effect nedenfor.
			salesData = await res.json();
		} catch (err) {
			toast.error(err.message);
		}
	}

	async function searchItemSales() {
		itemSearchLoading = true;
		itemSalesResult = null;
		const trimmedInput = itemSearchInput.trim();
		// DENNE OPDATERE MIN STATE

		if (!trimmedInput) {
			toast.error('Indtast venligst navnet på en ret for at søge.');
			itemSearchLoading = false;
			return;
		}

		try {
			const token = localStorage.getItem('token');
			if (!token) {
				toast.error('Du er ikke logget ind. Log venligst ind for at søge.');
				return;
			}

			const res = await fetch(`http://localhost:8080/admin/sales/item-by-name?name=${encodeURIComponent(trimmedInput)}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});

			if (!res.ok) {
				const errorBody = await res.json();
				if (res.status === 404) {
					itemSalesResult = 'not_found';
				} else {
					throw new Error(errorBody.message || 'Kunne ikke søge efter salgsdata for retten.');
				}
			} else {
				itemSalesResult = await res.json();
			}
		} catch (err) {
			toast.error(err.message);
			itemSalesResult = 'error';
		} finally {
			itemSearchLoading = false;
		}
	}


	// Denne effect kører, når `salesData` eller canvas-konteksterne ændres.
	$effect(() => {
		let dailyChartInstance = null;
		let topItemsChartInstance = null;
		let hourlyChartInstance = null;

		if (dailyChartCtx && topItemsChartCtx && hourlyChartCtx && salesData.daily.length > 0) {
			
			//  Dagligt Salg - Linjediagram
			const dailyLabels = salesData.daily.map(r => new Date(r.day).toLocaleDateString('da-DK'));
			const dailyValues = salesData.daily.map(r => parseFloat(r.total_sales));
			dailyChartInstance = new Chart(dailyChartCtx, {
				type: 'line',
				data: {
					labels: dailyLabels,
					datasets: [{
						label: 'Dagligt Salg (DKK)',
						data: dailyValues,
						borderColor: '#3498db',
						backgroundColor: 'rgba(52, 152, 219, 0.2)',
						tension: 0.3,
						fill: true
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: { display: true, text: 'Samlet Dagligt Salg de Sidste 30 Dage', font: { size: 18, weight: 'bold' }, color: '#333' },
						legend: { display: true, position: 'top', labels: { color: '#555' } }
					},
					scales: {
						x: { title: { display: true, text: 'Dato', color: '#666' }, ticks: { color: '#666' }, grid: { color: 'rgba(0,0,0,0.05)' } },
						y: { title: { display: true, text: 'Salg (DKK)', color: '#666' }, beginAtZero: true, ticks: { color: '#666' }, grid: { color: 'rgba(0,0,0,0.05)' } }
					}
				}
			});

			//  Top Sælgende Retter - Søjlediagram
			const topLabels = salesData.topItems.map(r => r.name);
			const topValues = salesData.topItems.map(r => parseInt(r.total_quantity));
			topItemsChartInstance = new Chart(topItemsChartCtx, {
				type: 'bar',
				data: {
					labels: topLabels,
					datasets: [{
						label: 'Antal Solgte',
						data: topValues,
						backgroundColor: '#28a745',
						borderColor: '#218838',
						borderWidth: 1
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					indexAxis: 'y',
					plugins: {
						title: { display: true, text: 'Top 5 Mest Solgte Retter (Sidste 30 Dage)', font: { size: 18, weight: 'bold' }, color: '#333' },
						legend: { display: true, position: 'top', labels: { color: '#555' } }
					},
					scales: {
						x: { title: { display: true, text: 'Antal', color: '#666' }, beginAtZero: true, ticks: { color: '#666' }, grid: { color: 'rgba(0,0,0,0.05)' } },
						y: { title: { display: true, text: 'Menu Ret', color: '#666' }, ticks: { color: '#666' }, grid: { color: 'rgba(0,0,0,0.05)' } }
					}
				}
			});

			//  Travle Timer - Lagkagediagram
			const hourLabels = salesData.hourly.map(r => `${r.hour}:00`);
			const hourValues = salesData.hourly.map(r => parseInt(r.order_count));
			const backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#A1CC3A', '#C9CB39', '#5B33FF'];
			hourlyChartInstance = new Chart(hourlyChartCtx, {
				type: 'pie',
				data: {
					labels: hourLabels,
					datasets: [{
						label: 'Ordrer pr. Time',
						data: hourValues,
						backgroundColor: backgroundColors.slice(0, hourValues.length),
						hoverOffset: 8
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						title: { display: true, text: 'Ordre Fordeling pr. Time (Sidste 7 Dage)', font: { size: 18, weight: 'bold' }, color: '#333' },
						tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed} ordrer` }, backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#fff', bodyColor: '#fff' },
						legend: { display: true, position: 'right', labels: { color: '#555' } }
					}
				}
			});
		}

		// dette køres, før effekten kører igen, eller når komponenten unmountes.
		return () => {
			dailyChartInstance?.destroy();
			topItemsChartInstance?.destroy();
			hourlyChartInstance?.destroy();
		};
	});

	// henter mine data, når komponenten initialiseres.
	loadSales();

</script>

<div class="dashboard-section">
	<h1>Admin Salgs Dashboard</h1>

	<div class="chart-container">
		<canvas bind:this={dailyChartCtx}></canvas>
	</div>

	<div class="chart-container">
		<canvas bind:this={topItemsChartCtx}></canvas>
	</div>

	<div class="chart-container">
		<canvas bind:this={hourlyChartCtx}></canvas>
	</div>

	<div class="item-search-section">
		<h2>Søg Salgsdata for Specifik Ret</h2>
		<div class="search-input-group">
			<input
				type="text"
				bind:value={itemSearchInput}
				placeholder="Indtast retens navn (f.eks. 'Clam chowder')"
				onkeydown={(e) => { if (e.key === 'Enter') searchItemSales(); }}
			/>
			<button onclick={searchItemSales} disabled={itemSearchLoading || !itemSearchInput.trim()}>
				{#if itemSearchLoading}Søger...{:else}Søg Ret{/if}
			</button>
		</div>

		{#if itemSalesResult === 'not_found'}
			<p class="no-results">Ingen data fundet for '{itemSearchInput}'. Kontroller stavemåden.</p>
		{:else if itemSalesResult === 'error'}
			<p class="error-message">Der opstod en fejl under søgningen. Prøv igen senere.</p>
		{:else if itemSalesResult}
			<div class="item-sales-results">
				<h3>Salgsdata for: {itemSalesResult.itemName} (ID: {itemSalesResult.id})</h3>
				<div class="item-sales-grid">
					<div class="sales-card">
						<h4>I Dag</h4>
						<p>Antal Solgt: <span class="quantity">{itemSalesResult.today.total_quantity_sold}</span></p>
						<p>Omsætning: <span class="revenue">{parseFloat(itemSalesResult.today.total_revenue).toFixed(2)} DKK</span></p>
					</div>
					<div class="sales-card">
						<h4>Denne Uge</h4>
						<p>Antal Solgt: <span class="quantity">{itemSalesResult.thisWeek.total_quantity_sold}</span></p>
						<p>Omsætning: <span class="revenue">{parseFloat(itemSalesResult.thisWeek.total_revenue).toFixed(2)} DKK</span></p>
					</div>
					<div class="sales-card">
						<h4>Denne Måned</h4>
						<p>Antal Solgt: <span class="quantity">{itemSalesResult.thisMonth.total_quantity_sold}</span></p>
						<p>Omsætning: <span class="revenue">{parseFloat(itemSalesResult.thisMonth.total_revenue).toFixed(2)} DKK</span></p>
					</div>
					<div class="sales-card">
						<h4>Total</h4>
						<p>Antal Solgt: <span class="quantity">{itemSalesResult.allTime.total_quantity_sold}</span></p>
						<p>Omsætning: <span class="revenue">{parseFloat(itemSalesResult.allTime.total_revenue).toFixed(2)} DKK</span></p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
