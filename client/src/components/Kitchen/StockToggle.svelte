<script>
    import { io }     from 'socket.io-client';
    import * as toast  from '../../util/toast.js';
  
    let menuId      = '';
    let item        = null;
    let loading     = false;
    let toggling    = false;
  
    async function fetchItem() {
      if (!menuId) return;
      loading = true;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/menu/${menuId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Item not found');
        item = await res.json();
      } catch (err) {
        toast.error(err.message);
        item = null;
      } finally {
        loading = false;
      }
    }
  
    async function toggleAvailability() {
      if (!item) return;
      toggling = true;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `http://localhost:8080/kitchen/menu-items/${item.id}/availability`,
          {
            method:  'PATCH',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ available: !item.available })
          }
        );
        if (!res.ok) throw new Error('Update failed');
        const updated = await res.json();
        item.available = updated.available;
        toast.success(
          updated.available
            ? `${item.name} is back in stock`
            : `${item.name} marked sold out`
        );
      } catch (err) {
        toast.error(err.message);
      } finally {
        toggling = false;
      }
    }
  
    const socket = io('http://localhost:8080', {
      withCredentials: true,
      auth: { token: localStorage.getItem('token') }
    });
    socket.on('menu-item-updated', ({ id, available }) => {
      if (item && item.id === id) {
        item.available = available;
      }
    });
  </script>
  
  <h1>Kitchen Stock Toggle</h1>
  
  <div class="search">
    <input
      type="number"
      min="1"
      placeholder="Enter Menu ID"
      bind:value={menuId}
      on:keydown={e => e.key === 'Enter' && fetchItem()}
    />
    <button on:click={fetchItem} disabled={!menuId || loading}>
      {loading ? 'Loading…' : 'Fetch Item'}
    </button>
  </div>
  
  {#if item}
    <div class="detail">
      <h2>{item.name} (ID: {item.id})</h2>
      <p>
        Status:
        <strong class={item.available ? 'in-stock' : 'sold-out'}>
          {item.available ? 'In Stock' : 'Sold Out'}
        </strong>
      </p>
      <button
        on:click={toggleAvailability}
        disabled={toggling}
        class="toggle-btn"
      >
        {toggling
          ? 'Updating…'
          : item.available
            ? 'Mark Sold Out'
            : 'Restock'}
      </button>
    </div>
  {/if}
  
  <style>
    .search { display:flex; gap:0.5rem; margin-bottom:1rem; }
    .search input { flex:1; padding:0.5rem; }
    .search button { padding:0.5rem 1rem; }
  
    .detail {
      border: 1px solid #ddd;
      padding: 1rem;
      border-radius: 6px;
      max-width: 400px;
    }
    .in-stock { color: green; }
    .sold-out { color: red; }
  
    .toggle-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .toggle-btn[disabled] { opacity: 0.6; }
  </style>
  