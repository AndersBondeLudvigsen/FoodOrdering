<script>
  import { onMount } from 'svelte';
  import * as toast from '../../util/toast.js';
  import Chart from 'chart.js/auto'; // Ensure Chart.js is installed: npm install chart.js

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

<style>
  /* General dashboard styling */
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    font-weight: 700;
  }
  .dashboard-section {
    max-width: 1000px; /* Slightly wider for better chart display */
    margin: 2rem auto;
    padding: 30px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); /* More prominent shadow */
  }

  /* Chart containers */
  .chart-container {
    width: 100%;
    max-width: 800px; /* Adjust max width as needed */
    height: 400px; /* Fixed height for consistent chart size */
    margin: 0 auto 3rem auto; /* Center charts and add more space below */
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #fcfcfc;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); /* Inner shadow for depth */
    display: flex; /* To center canvas vertically if needed */
    align-items: center;
    justify-content: center;
  }

  /* Item Sales Search Section */
  .item-search-section {
    margin-top: 4rem;
    padding-top: 3rem;
    border-top: 2px solid #eee; /* Thicker border */
    text-align: center;
  }
  .item-search-section h2 {
    color: #555;
    margin-bottom: 2rem;
    font-size: 2rem;
    font-weight: 600;
  }
  .search-input-group {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 3rem;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
  }
  .search-input-group input {
    flex-grow: 1;
    max-width: 400px; /* Increased max width for input */
    padding: 12px 18px;
    border: 1px solid #ccc;
    border-radius: 8px; /* Slightly more rounded corners */
    font-size: 1.1em;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);
  }
  .search-input-group input:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }
  .search-input-group button {
    padding: 12px 25px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1em;
    transition: background-color 0.3s ease, transform 0.1s ease;
  }
  .search-input-group button:hover:not(:disabled) {
    background-color: #0056b3;
    transform: translateY(-1px); /* Slight lift on hover */
  }
  .search-input-group button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .item-sales-results {
    background-color: #e8f5e9; /* Light green background */
    border: 1px solid #c8e6c9;
    border-radius: 10px;
    padding: 30px;
    margin-top: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .item-sales-results h3 {
    color: #2e7d32; /* Dark green for item name */
    margin-top: 0;
    margin-bottom: 25px;
    font-size: 1.8rem;
    font-weight: 600;
    text-align: center;
  }
  .item-sales-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* Slightly larger cards */
    gap: 25px;
    justify-content: center; /* Center cards horizontally */
  }
  .sales-card {
    background-color: #f7fcf7; /* Lighter green for cards */
    border: 1px solid #d4edda;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 3px 8px rgba(0,0,0,0.08); /* More prominent shadow */
    transition: transform 0.2s ease;
  }
  .sales-card:hover {
      transform: translateY(-5px); /* Lift card on hover */
  }
  .sales-card h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #4CAF50; /* Green for time period titles */
    font-size: 1.3em;
    font-weight: 600;
  }
  .sales-card p {
    margin: 8px 0;
    font-size: 1.1em;
    color: #444;
  }
  .sales-card .quantity {
    font-weight: bold;
    color: #007bff; /* Blue for quantity */
    font-size: 1.2em;
  }
  .sales-card .revenue {
    font-weight: bold;
    color: #28a745; /* Green for revenue */
    font-size: 1.2em;
  }
  .no-results {
    text-align: center;
    color: #d9534f; /* Red color for warning */
    margin-top: 20px;
    padding: 15px;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    font-weight: bold;
  }
  .error-message {
    text-align: center;
    color: #dc3545;
    margin-top: 20px;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }
    .dashboard-section {
      margin: 1rem auto;
      padding: 20px;
    }
    .chart-container {
      height: 300px; /* Slightly smaller height on smaller screens */
      padding: 15px;
    }
    .item-search-section h2 {
      font-size: 1.5rem;
    }
    .search-input-group {
      flex-direction: column; /* Stack input and button vertically */
      align-items: center;
    }
    .search-input-group input,
    .search-input-group button {
      max-width: 90%;
      width: 100%;
    }
    .item-sales-grid {
      grid-template-columns: 1fr; /* Stack cards vertically */
    }
  }

  @media (max-width: 480px) {
    .dashboard-section {
      padding: 15px;
    }
    .chart-container {
      height: 250px;
    }
    .item-sales-results h3 {
      font-size: 1.5rem;
    }
  }
</style>

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