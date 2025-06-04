<script>
  import { onMount } from 'svelte';
  import * as toast   from '../../util/toast.js';

  // We'll use Chart.js (or another lightweight chart library)
  import Chart from 'chart.js/auto';

  let dailyChartCtx;
  let topItemsChartCtx;
  let hourlyChartCtx;

  // Holds fetched data
  let salesData = {
    daily:      [],
    topItems:   [],
    hourly:     []
  };

  async function loadSales() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/admin/sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load sales data');
      salesData = await res.json();
      renderCharts();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function renderCharts() {
    // 1) Daily Sales Line Chart
    const dailyLabels = salesData.daily.map(r => new Date(r.day).toLocaleDateString());
    const dailyValues = salesData.daily.map(r => parseFloat(r.total_sales));
    new Chart(dailyChartCtx, {
      type: 'line',
      data: {
        labels: dailyLabels,
        datasets: [{
          label: 'Daily Sales (DKK)',
          data: dailyValues,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Date' } },
          y: { title: { display: true, text: 'Sales (DKK)' } }
        }
      }
    });

    // 2) Top‐Selling Items Bar Chart
    const topLabels = salesData.topItems.map(r => r.name);
    const topValues = salesData.topItems.map(r => parseInt(r.total_quantity));
    new Chart(topItemsChartCtx, {
      type: 'bar',
      data: {
        labels: topLabels,
        datasets: [{
          label: 'Quantity Sold',
          data: topValues
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { title: { display: true, text: 'Quantity' } },
          y: { title: { display: true, text: 'Menu Item' } }
        }
      }
    });

    // 3) Peak Hours Pie Chart
    const hourLabels = salesData.hourly.map(r => `${r.hour}:00`);
    const hourValues = salesData.hourly.map(r => parseInt(r.order_count));
    new Chart(hourlyChartCtx, {
      type: 'pie',
      data: {
        labels: hourLabels,
        datasets: [{
          label: 'Orders by Hour',
          data: hourValues
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} orders`
            }
          }
        }
      }
    });
  }

  onMount(() => {
    loadSales();
  });
</script>

<style>
  .chart-container {
    width: 100%;
    max-width: 600px;
    margin-bottom: 2rem;
  }
</style>

<h1>Admin Sales Dashboard</h1>

<div class="chart-container">
  <canvas bind:this={dailyChartCtx}></canvas>
</div>

<div class="chart-container">
  <canvas bind:this={topItemsChartCtx}></canvas>
</div>

<div class="chart-container">
  <canvas bind:this={hourlyChartCtx}></canvas>
</div>
