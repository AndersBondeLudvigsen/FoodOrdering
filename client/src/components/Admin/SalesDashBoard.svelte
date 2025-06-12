<script>
  import { onMount } from 'svelte';
  import * as toast from '../../util/toast.js';
  import Chart from 'chart.js/auto'; // Ensure Chart.js is installed: npm install chart.js

  import "../../styels/salesdashboard.css"



  let dailyChartCtx; // Canvas context for daily sales chart
  let topItemsChartCtx; // Canvas context for top-selling items chart
  let hourlyChartCtx; // Canvas context for peak hours chart

  // Declare local variables to hold Chart.js instances
  let dailyChartInstance = null;
  let topItemsChartInstance = null;
  let hourlyChartInstance = null;

  // Holds fetched data for the main dashboard charts
  let salesData = {
    daily: [],
    topItems: [],
    hourly: []
  };

  // State for the new item sales search feature
  let itemSearchInput = ''; // Input field for searching menu item name
  let itemSalesResult = null; // Stores the sales data for the searched item
  let itemSearchLoading = false; // Loading state for item search

  // Function to fetch overall sales data for the dashboard charts
  async function loadSales() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not logged in. Please log in to view sales data.');
        // Optionally redirect to login: navigate('/login');
        return;
      }

      const res = await fetch('http://localhost:8080/admin/sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || 'Failed to load overall sales data.');
      }
      salesData = await res.json();
      renderCharts(); // Render charts once data is loaded
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Function to search for sales data of a specific menu item
  async function searchItemSales() {
    itemSearchLoading = true;
    itemSalesResult = null; // Clear previous result
    const trimmedInput = itemSearchInput.trim();

    if (!trimmedInput) {
      toast.error('Please enter a menu item name to search.');
      itemSearchLoading = false;
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not logged in. Please log in to search sales data.');
        // Optionally redirect to login: navigate('/login');
        return;
      }

      const res = await fetch(`http://localhost:8080/admin/sales/item-by-name?name=${encodeURIComponent(trimmedInput)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorBody = await res.json();
        // If item is not found, display a specific message
        if (res.status === 404) {
            itemSalesResult = 'not_found'; // Special state to indicate item not found
        } else {
            throw new Error(errorBody.message || 'Failed to search item sales data.');
        }
      } else {
          itemSalesResult = await res.json();
      }
    } catch (err) {
      toast.error(err.message);
      itemSalesResult = 'error'; // Indicate a general error
    } finally {
      itemSearchLoading = false;
    }
  }

  // Function to render or re-render all Chart.js charts
  function renderCharts() {
    // Destroy existing chart instances before creating new ones
    if (dailyChartInstance) {
        dailyChartInstance.destroy();
        dailyChartInstance = null; // Clear reference
    }
    if (topItemsChartInstance) {
        topItemsChartInstance.destroy();
        topItemsChartInstance = null; // Clear reference
    }
    if (hourlyChartInstance) {
        hourlyChartInstance.destroy();
        hourlyChartInstance = null; // Clear reference
    }

    // 1) Daily Sales Line Chart
    const dailyLabels = salesData.daily.map(r => new Date(r.day).toLocaleDateString('da-DK')); // Format date for Danish locale
    const dailyValues = salesData.daily.map(r => parseFloat(r.total_sales));
    dailyChartInstance = new Chart(dailyChartCtx, { // Assign to local instance variable
      type: 'line',
      data: {
        labels: dailyLabels,
        datasets: [{
          label: 'Dagligt Salg (DKK)',
          data: dailyValues,
          borderColor: '#3498db', // Blue color
          backgroundColor: 'rgba(52, 152, 219, 0.2)', // Light blue fill
          tension: 0.3, // Curve the line
          fill: true // Fill area under the line
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Allow charts to resize more freely
        plugins: {
            title: {
                display: true,
                text: 'Samlet Dagligt Salg de Sidste 30 Dage',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                color: '#333'
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#555'
                }
            }
        },
        scales: {
          x: {
              title: { display: true, text: 'Dato', color: '#666' },
              ticks: { color: '#666' },
              grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: {
              title: { display: true, text: 'Salg (DKK)', color: '#666' },
              beginAtZero: true,
              ticks: { color: '#666' },
              grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });

    // 2) Top-Selling Items Bar Chart
    const topLabels = salesData.topItems.map(r => r.name);
    const topValues = salesData.topItems.map(r => parseInt(r.total_quantity));
    topItemsChartInstance = new Chart(topItemsChartCtx, { // Assign to local instance variable
      type: 'bar',
      data: {
        labels: topLabels,
        datasets: [{
          label: 'Antal Solgte',
          data: topValues,
          backgroundColor: '#28a745', // Green color
          borderColor: '#218838',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Makes it a horizontal bar chart
        plugins: {
            title: {
                display: true,
                text: 'Top 5 Mest Solgte Retter (Sidste 30 Dage)',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                color: '#333'
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#555'
                }
            }
        },
        scales: {
          x: {
              title: { display: true, text: 'Antal', color: '#666' },
              beginAtZero: true,
              ticks: { color: '#666' },
              grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: {
              title: { display: true, text: 'Menu Ret', color: '#666' },
              ticks: { color: '#666' },
              grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });

    // 3) Peak Hours Pie Chart
    const hourLabels = salesData.hourly.map(r => `${r.hour}:00`);
    const hourValues = salesData.hourly.map(r => parseInt(r.order_count));
    // Generate distinct colors for pie chart segments
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#E7E9ED', '#A1CC3A', '#C9CB39', '#5B33FF',
        '#6A5ACD', '#DC143C', '#20B2AA', '#BA55D3', '#00FFFF'
    ];
    hourlyChartInstance = new Chart(hourlyChartCtx, { // Assign to local instance variable
      type: 'pie',
      data: {
        labels: hourLabels,
        datasets: [{
          label: 'Ordrer pr. Time',
          data: hourValues,
          backgroundColor: backgroundColors.slice(0, hourValues.length), // Use enough colors
          hoverOffset: 8 // Increase hover effect
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Ordre Fordeling pr. Time (Sidste 7 Dage)',
            font: {
                size: 18,
                weight: 'bold'
            },
            color: '#333'
          },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} ordrer`
            },
            backgroundColor: 'rgba(0,0,0,0.7)',
            titleColor: '#fff',
            bodyColor: '#fff'
          },
          legend: {
            display: true,
            position: 'right', // Place legend on the right for pie chart
            labels: {
                color: '#555'
            }
          }
        }
      }
    });
  }

  // Load sales data when the component is mounted
  onMount(() => {
    loadSales();
  });
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
        on:keydown={(e) => { if (e.key === 'Enter') searchItemSales(); }}
      />
      <button on:click={searchItemSales} disabled={itemSearchLoading || !itemSearchInput.trim()}>
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