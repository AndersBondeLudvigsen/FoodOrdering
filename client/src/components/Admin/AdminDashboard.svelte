<script>
	// Importerer en Svelte store, som fungerer fint sammen med Svelte 5
	import { token } from '../../stores/auth.js';
	import * as toast from '../../util/toast.js';

	import "../../styels/adminDashboard.css";

	
	// Alle reaktive variabler $state.
	let showCreateModal = $state(false);
	let createForm = $state({ name: '', price: 0, category: '', image_url: '', available: true, ingredientsText: '' });

	let showDeleteModal = $state(false);
	let items = $state([]);

	let showUpdateModal = $state(false);
	let updateForm = $state({ id: null, name: '', price: 0, category: '', image_url: '', available: true, ingredientsText: '' });

	let showUsersModal = $state(false);
	let users = $state([]);

	let showUserUpdateModal = $state(false);
	let userForm = $state({ id: null, username: '', email: '', role: '', password: '' });

	

	function openCreate() {
		createForm = { name: '', price: 0, category: '', image_url: '', available: true, ingredientsText: '' };
		showCreateModal = true;
	}

	async function submitCreate() {
		const ingredients = createForm.ingredientsText.split(',').map(s => s.trim()).filter(Boolean);
		try {
			const res = await fetch('http://localhost:8080/admin/menu-items', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${$token}` 
				},
				body: JSON.stringify({
					...createForm,
					price: +createForm.price,
					ingredients
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || 'Kunne ikke oprette menupunkt');
			}
			const { menuItemId } = await res.json();
			toast.success(`Oprettede menupunkt #${menuItemId}`);
			showCreateModal = false;
		} catch (err) {
			toast.error(err.message);
		}
	}

	async function openDelete() {
		try {
			const res = await fetch('http://localhost:8080/menu', {
				headers: { 'Authorization': `Bearer ${$token}` }
			});
			if (!res.ok) throw new Error('Kunne ikke hente menupunkter');
			items = await res.json();
			showDeleteModal = true;
		} catch (err) {
			toast.error(err.message);
		}
	}

	async function deleteItem(id) {
		try {
			const res = await fetch(`http://localhost:8080/admin/menu-items/${id}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${$token}` }
			});
			if (!res.ok) throw new Error('Sletning fejlede');
			toast.success('Slettet');
			items = items.filter(i => i.id !== id); // Fjerner elementet reaktivt
		} catch (err) {
			toast.error(err.message);
		}
	}

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

	async function submitUpdate() {
		const ingredients = updateForm.ingredientsText.split(',').map(s => s.trim()).filter(Boolean);
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
				throw new Error(err.message || 'Kunne ikke opdatere menupunkt');
			}
			toast.success('Menupunkt opdateret');
			showUpdateModal = false;

			// Opdater elementet direkte i 'items'-arrayet for UI-opdatering
			const index = items.findIndex(i => i.id === updateForm.id);
			if (index !== -1) {
				items[index] = {
					...items[index],
					...updateForm,
					price: +updateForm.price,
					ingredients
				};
			}
		} catch (err) {
			toast.error(err.message);
		}
	}

	async function openUsers() {
		try {
			const res = await fetch('http://localhost:8080/admin/users', {
				headers: { 'Authorization': `Bearer ${$token}` }
			});
			if (!res.ok) throw new Error('Kunne ikke hente brugere');
			users = await res.json();
			showUsersModal = true;
		} catch (err) {
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
		if (userForm.username) body.username = userForm.username;
		if (userForm.email) body.email = userForm.email;
		if (userForm.role) body.role = userForm.role;
		if (userForm.password) body.password = userForm.password;

		try {
			const res = await fetch(`http://localhost:8080/admin/users/${userForm.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${$token}`
				},
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || 'Kunne ikke opdatere bruger');
			}
			toast.success('Bruger opdateret');
			showUserUpdateModal = false;
			await openUsers();
		} catch (err) {
			toast.error(err.message);
		}
	}

	
	//  kører, når en af dens afhængigheder (modal-variablerne) ændres.
	$effect(() => {
		const anyModalOpen = showCreateModal || showDeleteModal || showUpdateModal || showUsersModal || showUserUpdateModal;
		if (typeof window !== 'undefined') {
			document.body.classList.toggle('modal-open', anyModalOpen);
		}
	});

</script>

<h1>Admin Dashboard</h1>
<div class="admin-actions">
	<button class="admin-btn" onclick={openCreate}>➕ Add Menu Item</button>
	<button class="admin-btn" onclick={openDelete}>📋 All Menu Items</button>
	<button class="admin-btn" onclick={openUsers}>👥 Manage Users</button>
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
				<button onclick={submitCreate}>Create</button>
				<button onclick={()=>showCreateModal=false}>Cancel</button>
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
						{item.name} — {parseFloat(item.price).toFixed(2)} DKK
						<button class="admin-btn edit" onclick={() => openUpdate(item)}>Edit</button>
						<button class="admin-btn danger" onclick={() => deleteItem(item.id)}>Delete</button>
					</li>
				{/each}
			</ul>
			<div class="admin-modal-actions">
				<button onclick={()=>showDeleteModal=false}>Close</button>
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
				<button onclick={submitUpdate}>Save</button>
				<button onclick={()=>showUpdateModal=false}>Cancel</button>
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
						<button onclick={()=>openUserUpdate(u)}>Edit</button>
					</li>
				{/each}
			</ul>
			<div class="admin-modal-actions">
				<button onclick={()=>showUsersModal=false}>Close</button>
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
					<option value="kitchen">kitchen</option>
				</select>
			</label>
			<label>New Password<input type="password" bind:value={userForm.password} placeholder="Leave blank to keep" /></label>
			<div class="admin-modal-actions">
				<button onclick={submitUserUpdate}>Save</button>
				<button onclick={()=>showUserUpdateModal=false}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
