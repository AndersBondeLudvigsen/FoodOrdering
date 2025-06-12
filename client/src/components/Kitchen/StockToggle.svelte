<script>
    import { io }     from 'socket.io-client';
    import * as toast  from '../../util/toast.js';

    import "../../styels/stocktoggle.css"
  
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
  