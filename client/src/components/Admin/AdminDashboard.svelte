<script>
  
  import { token }    from '../../stores/auth.js';
  import * as toast   from '../../util/toast.js';

  import "../../styels/adminDashboard.css"



  let showCreateModal = false;
  let createForm = { name: '', price: 0, category: '', image_url: '', available: true, ingredientsText: '' };
  function openCreate() {
    createForm = { name:'', price:0, category:'', image_url:'', available:true, ingredientsText:'' };
    showCreateModal = true;
  }
  async function submitCreate() {
    const ingredients = createForm.ingredientsText.split(',').map(s=>s.trim()).filter(Boolean);
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
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message || 'Failed to create menu item');
      }
      const { menuItemId } = await res.json();
      toast.success(`Created menu item #${menuItemId}`);
      showCreateModal = false;
    } catch(err) {
      toast.error(err.message);
    }
  }

  let showDeleteModal = false;
  let items = [];
  async function openDelete() {
    try {
      const res = await fetch('http://localhost:8080/admin/menu-items', {
        headers: { 'Authorization': `Bearer ${$token}` }
      });
      if (!res.ok) throw new Error('Failed to load items');
      items = await res.json();
      showDeleteModal = true;
    } catch(err) {
      toast.error(err.message);
    }
  }
  async function deleteItem(id) {
    if(!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/menu-items/${id}`, {
        method:'DELETE',
        headers: {'Authorization': `Bearer ${$token}`}
      });
      if(!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted');
      items = items.filter(i=>i.id!==id);
    } catch(err){
      toast.error(err.message);
    }
  }

  let showUpdateModal = false;
  let updateForm = { id:null, name:'', price:0, category:'', image_url:'', available:true, ingredientsText:'' };
  function openUpdate(item) {
    updateForm = {
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category||'',
      image_url: item.image_url||'',
      available: item.available,
      ingredientsText: item.ingredients.join(', ')
    };
    showUpdateModal = true;
  }
  async function submitUpdate() {
    const ingredients = updateForm.ingredientsText.split(',').map(s=>s.trim()).filter(Boolean);
    try {
      const res = await fetch(`http://localhost:8080/admin/menu-items/${updateForm.id}`, {
        method:'PATCH',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${$token}`
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
      if(!res.ok){
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message||'Failed to update menu item');
      }
      toast.success('Menu item updated');
      showUpdateModal = false;
      const index = items.findIndex(i => i.id === updateForm.id);
if (index !== -1) {
  items[index] = {
    ...items[index],
    name: updateForm.name,
    price: +updateForm.price,
    category: updateForm.category,
    image_url: updateForm.image_url,
    available: updateForm.available,
    ingredients
  };
  items = [...items]; // trigger reactivity
}
    } catch(err){
      toast.error(err.message);
    }
  }

  let showUsersModal = false;
  let users = [];
  let showUserUpdateModal = false;
  let userForm = { id:null, username:'', email:'', role:'', password:'' };
  async function openUsers() {
    try {
      const res = await fetch('http://localhost:8080/admin/users', {
        headers: {'Authorization':`Bearer ${$token}`}
      });
      if(!res.ok) throw new Error('Failed to load users');
      users = await res.json();
      showUsersModal = true;
    } catch(err){
      toast.error(err.message);
    }
  }
  function openUserUpdate(user) {
    userForm = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      password: ''
    };
    showUserUpdateModal = true;
  }
  async function submitUserUpdate() {
    const body = {};
    if(userForm.username) body.username = userForm.username;
    if(userForm.email)    body.email    = userForm.email;
    if(userForm.role)     body.role     = userForm.role;
    if(userForm.password) body.password = userForm.password;
    try {
      const res = await fetch(`http://localhost:8080/admin/users/${userForm.id}`, {
        method:'PATCH',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${$token}`
        },
        body: JSON.stringify(body)
      });
      if(!res.ok){
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message||'Failed to update user');
      }
      toast.success('User updated');
      showUserUpdateModal = false;
      await openUsers();
    } catch(err){
      toast.error(err.message);
    }
  }


  $: {
  const anyModalOpen = showCreateModal || showDeleteModal || showUpdateModal || showUsersModal || showUserUpdateModal;
  if (typeof window !== 'undefined') {
    document.body.classList.toggle('modal-open', anyModalOpen);
  }
}

</script>

<h1>Admin Dashboard</h1>
<div class="admin-actions">
  <button class="admin-btn" on:click={openCreate}>➕ Add Menu Item</button>
  <button class="admin-btn" on:click={openDelete}>📋 All Menu Items</button>
  <button class="admin-btn" on:click={openUsers}>👥 Manage Users</button>
</div>
{#if showCreateModal}
  <div class="admin-modal-backdrop">
    <div class="admin-modal">
      <h2>New Menu Item</h2>
      <label>Name<input bind:value={createForm.name} /></label>
      <label>Price<input type="number" step="0.01" bind:value={createForm.price} /></label>
      <label>Category<input bind:value={createForm.category} /></label>
      <label>Image URL<input bind:value={createForm.image_url} /></label>
      <label>Available?<input type="checkbox" bind:checked={createForm.available} /></label>
      <label>Ingredients<input bind:value={createForm.ingredientsText} placeholder="e.g. Cheese, Tomato" /></label>
      <div class="admin-modal-actions">
        <button on:click={submitCreate}>Create</button>
        <button on:click={()=>showCreateModal=false}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

{#if showDeleteModal}
  <div class="admin-modal-backdrop">
    <div class="admin-modal">
      <h2>All Menu Items</h2>
      <ul>
        {#each items as item}
          <li>
            {item.name} — ${parseFloat(item.price).toFixed(2)}
            <button on:click={()=>openUpdate(item)}>Edit</button>
            <button on:click={()=>deleteItem(item.id)}>Delete</button>
          </li>
        {/each}
      </ul>
      <div class="admin-modal-actions">
        <button on:click={()=>showDeleteModal=false}>Close</button>
      </div>
    </div>
  </div>
{/if}

{#if showUpdateModal}
  <div class="admin-modal-backdrop">
    <div class="admin-modal">
      <h2>Edit Menu Item</h2>
      <label>Name<input bind:value={updateForm.name} /></label>
      <label>Price<input type="number" step="0.01" bind:value={updateForm.price} /></label>
      <label>Category<input bind:value={updateForm.category} /></label>
      <label>Image URL<input bind:value={updateForm.image_url} /></label>
      <label>Available?<input type="checkbox" bind:checked={updateForm.available} /></label>
      <label>Ingredients<input bind:value={updateForm.ingredientsText} placeholder="e.g. Cheese, Tomato" /></label>
      <div class="admin-modal-actions">
        <button on:click={submitUpdate}>Save</button>
        <button on:click={()=>showUpdateModal=false}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

{#if showUsersModal}
  <div class="admin-modal-backdrop">
    <div class="admin-modal">
      <h2>All Users</h2>
      <ul>
        {#each users as u}
          <li>
            {u.username} ({u.email}) — Role: {u.role}
            <button on:click={()=>openUserUpdate(u)}>Edit</button>
          </li>
        {/each}
      </ul>
      <div class="admin-modal-actions">
        <button on:click={()=>showUsersModal=false}>Close</button>
      </div>
    </div>
  </div>
{/if}

{#if showUserUpdateModal}
  <div class="admin-modal-backdrop">
    <div class="admin-modal">
      <h2>Edit User</h2>
      <label>Username<input bind:value={userForm.username} /></label>
      <label>Email<input bind:value={userForm.email} /></label>
      <label>Role
        <select bind:value={userForm.role}>
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label>New Password<input type="password" bind:value={userForm.password} placeholder="Leave blank to keep" /></label>
      <div class="admin-modal-actions">
        <button on:click={submitUserUpdate}>Save</button>
        <button on:click={()=>showUserUpdateModal=false}>Cancel</button>
      </div>
    </div>
  </div>
{/if}
