<script>
    import { onMount } from "svelte";
    import { navigate } from "svelte-routing";
    
    import { success, error } from "../../util/toast.js";

    let newPassword = $state("");
    let confirmPassword = $state("");
    let token = $state("");
    let loading = $state(false);
    let errorMessage = $state(""); 

    // 2. (Valgfrit, men anbefalet) Brug $derived for øjeblikkelig validering
    let passwordsDoNotMatch = $derived(
        confirmPassword && newPassword !== confirmPassword
    );

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");

        if (!urlToken) {
            errorMessage = "No reset token found in URL. Please request a new link.";
        } else {
            token = urlToken;
        }
    });

    async function handleSubmit(event) {
        event.preventDefault();
        if (passwordsDoNotMatch) { 
            error("Passwords do not match.");
            return;
        }
        if (!token) {
            error("No valid reset token.");
            return;
        }

        loading = true;
        try {
            const res = await fetch("http://localhost:8080/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                success(data.message);
                navigate("/login");
            } else {
                error(data.message);
            }
        } catch (err) {
            error("Failed to connect to server.");
        } finally {
            loading = false;
        }
    }
</script>

<h1>Reset Password</h1>

{#if errorMessage}
    <p class="error">{errorMessage}</p>
{:else}
    <form onsubmit={handleSubmit}>
        <label for="newPassword">New Password:</label>
        <input
            type="password"
            id="newPassword"
            bind:value={newPassword}
            required
            disabled={loading}
        />

        <label for="confirmPassword">Confirm New Password:</label>
        <input
            type="password"
            id="confirmPassword"
            bind:value={confirmPassword}
            required
            disabled={loading}
        />
        
        {#if passwordsDoNotMatch}
            <p class="error" style="margin-top: 5px;">Passwords do not match!</p>
        {/if}

        <button type="submit" disabled={loading || passwordsDoNotMatch}>
            {#if loading}
                Resetting...
            {:else}
                Reset Password
            {/if}
        </button>
    </form>
{/if}