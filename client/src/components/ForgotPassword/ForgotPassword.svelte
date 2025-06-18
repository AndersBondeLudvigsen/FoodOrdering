<script>
    import { success, error } from '../../util/toast.js';
    import { navigate } from 'svelte-routing';

    let email = $state('');
    let loading = $state(false);

    async function handleSubmit(event) {
        event.preventDefault();
        loading = true;
        try {
            const res = await fetch('http://localhost:8080/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                success(data.message);
                email = ''; 
                navigate('/login');
            } else {
                error(data.message);
            }
        } catch (err) {
            error('Failed to connect to server.');
        } finally {
            loading = false;
        }
    }

    function goBackToLogin() {
        navigate('/login');
    }
</script>

<div class="container">
    <h1>Forgot Password</h1>
    <form onsubmit={handleSubmit}>
        <label for="email">Email:</label>
        <input type="email" id="email" bind:value={email} required disabled={loading} />
        <button type="submit" disabled={loading}>
            {#if loading}
                Sending...
            {:else}
                Send Reset Link
            {/if}
        </button>
    </form>

    <button onclick={goBackToLogin} class="back-button" disabled={loading}>
        Back to Login
    </button>
</div>