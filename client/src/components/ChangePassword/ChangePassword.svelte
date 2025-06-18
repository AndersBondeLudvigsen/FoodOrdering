<script>
    import { navigate } from 'svelte-routing';
    import * as toast from '../../util/toast.js';
    import { token } from '../../stores/auth.js';
    

    import "../../styels/changepassword.css"
 
    let oldPassword = $state('');
    let newPassword = $state('');
    let confirmPassword = $state('');
    let loading = $state(false);
 
    async function submit() {
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (!newPassword) {
            toast.error('New password cannot be empty');
            return;
        }
 
        loading = true;
        try {
            //jeg henter værdi fra min store
            const jwt = $token;
            const res = await fetch('http://localhost:8080/auth/change-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Failed to change password');
 
            toast.success('Password changed successfully');
            navigate('/');
        } catch (err) {
            toast.error(err.message);
        } finally {
            loading = false;
        }
    }
</script>
 
<h1>Change Password</h1>
 
<form on:submit|preventDefault={submit} style="max-width:360px; margin:auto">
    <input
        type="password"
        bind:value={oldPassword}
        placeholder="Current password"
        required
    />
    <input
        type="password"
        bind:value={newPassword}
        placeholder="New password"
        required
    />
    <input
        type="password"
        bind:value={confirmPassword}
        placeholder="Confirm new password"
        required
    />
    <button type="submit" disabled={loading}>
        {#if loading}
            Saving…
        {:else}
            Change Password
        {/if}
    </button>
</form>