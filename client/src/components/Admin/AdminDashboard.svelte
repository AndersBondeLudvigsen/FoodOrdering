<!-- src/components/Admin/AdminDashboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { token }    from '../../stores/auth.js';
  import * as toast   from '../../util/toast.js';

  // Create modal state
  let showCreateModal = false;
  let createForm = {
    name: '', price: 0, category: '',
    image_url: '', available: true,
    ingredientsText: ''
  };

  // Delete modal state
  let showDeleteModal = false;
  let items = [];

  // Update modal state
  let showUpdateModal = false;
  let updateForm = {
    id: null,
    name: '', price: 0, category: '',
    image_url: '', available: true,
    ingredientsText: ''
  };

  // Open create modal
  function openCreate() {
    createForm = { name:'', price:0, category:'', image_url:'', available:true, ingredientsText:'' };
    showCreateModal = true;
  }

  // Submit new menu item
  async function submitCreate() {
    const ingredients = createForm.ingredientsText
      .split(',').map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch('http://localhost:8080/admin/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$token}`
        },
        body: JSON.stringify({
          name: createForm.name,
          price: +createForm.price,
          category: createForm.category,
          image_url: createForm.image_url,
          available: createForm.available,
          ingredients
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create menu item');
      }
      const { menuItemId } = await res.json();
      toast.success(`Created menu item #${menuItemId}`);
      showCreateModal = false;
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Open delete modal and load items
  async function openDelete() {
    try {
      const res = await fetch('http://localhost:8080/admin/menu-items', {
        headers: { 'Authorization': `Bearer ${$token}` }
      });
      if (!res.ok) throw new Error('Failed to load items');
      items = await res.json();
      showDeleteModal = true;
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Delete a specific menu item
  async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/menu-items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${$token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted menu item');
      items = items.filter(i => i.id !== id);
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Open update modal and populate form
  function openUpdate(item) {
    updateForm = {
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category || '',
      image_url: item.image_url || '',
      available: item.available,
      ingredientsText: item.ingredients.join(', ')
    };
    showUpdateModal = true;
  }

  // Submit update
  async function submitUpdate() {
    const ingredients = updateForm.ingredientsText
      .split(',').map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch(`http://localhost:8080/admin/menu-items/${updateForm.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$token}`
        },
        body: JSON.stringify({
          name: updateForm.name,
          price: +updateForm.price,
          category: updateForm.category,
          image_url: updateForm.image_url,
          available: updateForm.available,
          ingredients
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update menu item');
      }
      toast.success('Menu item updated');
      showUpdateModal = false;
    } catch (err) {
      toast.error(err.message);
    }
  }
</script>

<h1>Admin Dashboard</h1>
<button on:click={openCreate}>➕ Add Menu Item</button>
<button on:click={openDelete} style="margin-left:1rem">All Menu Items</button>

<!-- Create Modal -->
{#if showCreateModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h2>New Menu Item</h2>
      <label>Name<input bind:value={createForm.name} /></label>
      <label>Price<input type="number" step="0.01" bind:value={createForm.price} /></label>
      <label>Category<input bind:value={createForm.category} /></label>
      <label>Image URL<input bind:value={createForm.image_url} /></label>
      <label>Available?<input type="checkbox" bind:checked={createForm.available} /></label>
      <label>Ingredients<input bind:value={createForm.ingredientsText} placeholder="e.g. Cheese, Tomato" /></label>
      <button on:click={submitCreate}>Create</button>
      <button on:click={() => showCreateModal = false}>Cancel</button>
    </div>
  </div>
{/if}

<!-- Delete/Update Modal -->
{#if showDeleteModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h2>All Menu Items</h2>
      <ul>
        {#each items as item}
          <li style="margin-bottom:0.5rem">
            {item.name} — ${parseFloat(item.price).toFixed(2)}
            <button on:click={() => openUpdate(item)} style="margin-left:1rem">Update</button>
            <button on:click={() => deleteItem(item.id)} style="margin-left:1rem">Delete</button>
          </li>
        {/each}
      </ul>
      <button on:click={() => showDeleteModal = false}>Close</button>
    </div>
  </div>
{/if}

<!-- Update Modal -->
{#if showUpdateModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h2>Edit Menu Item</h2>
      <label>Name<input bind:value={updateForm.name} /></label>
      <label>Price<input type="number" step="0.01" bind:value={updateForm.price} /></label>
      <label>Category<input bind:value={updateForm.category} /></label>
      <label>Image URL<input bind:value={updateForm.image_url} /></label>
      <label>Available?<input type="checkbox" bind:checked={updateForm.available} /></label>
      <label>Ingredients<input bind:value={updateForm.ingredientsText} placeholder="e.g. Cheese, Tomato" /></label>
      <button on:click={submitUpdate}>Save</button>
      <button on:click={() => showUpdateModal = false}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.4); display: flex;
    align-items: center; justify-content: center;
  }
  .modal {
    background: white; padding: 1.5rem; border-radius: 0.5rem;
    max-width: 400px; width: 90%; overflow-y: auto; max-height: 90%;
  }
  label { display: block; margin-top: 0.75rem; }
  input { width: 100%; margin-top: 0.25rem; }
  button { margin-top: 1rem; margin-right: 0.5rem; }
</style>
