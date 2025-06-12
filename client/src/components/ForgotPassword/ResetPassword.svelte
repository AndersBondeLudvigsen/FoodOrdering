<script>
  import { onMount } from "svelte";
  import { navigate } from "svelte-routing"; // <--- RETTET LINJE: Importer navigate
  import { success, error } from "../../util/toast.js";

  let newPassword = "";
  let confirmPassword = "";
  let token = "";
  let loading = false;
  let message = "";
  let isError = false;

  onMount(() => {
    // Brug window.location.search direkte for at få query-strengen
    const params = new URLSearchParams(window.location.search);
    token = params.get("token");

    if (!token) {
      message = "No reset token found in URL.";
      isError = true;
    }
  });

  async function handleSubmit() {
    if (newPassword !== confirmPassword) {
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
        navigate("/login"); // Redirect to login page
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
  {#if isError}
    <p class="error">{message}</p>
  {:else}
    <form on:submit|preventDefault={handleSubmit}>
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

      <button type="submit" disabled={loading}>
        {#if loading}
          Resetting...
        {:else}
          Reset Password
        {/if}
      </button>
    </form>
  {/if}
