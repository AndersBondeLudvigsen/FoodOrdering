<script>
  import { navigate } from 'svelte-routing';
  
  import * as toast from '../../util/toast.js';

  let username = $state('');
  let email = $state('');
  let password = $state('');
  let loading = $state(false); 

  async function submit(event) {
    event.preventDefault()
    loading = true; 
    try {
      const res = await fetch('http://localhost:8080/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const body = await res.json();
      if (!res.ok) { 
        throw new Error(body.message || 'Signup failed');
      }

      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      loading = false; 
    }
  }
</script>

<h1>Sign Up</h1>

<form onsubmit={submit} style="max-width:320px;margin:auto">
  <input bind:value={username} placeholder="Username" required disabled={loading} />
  <input type="email" bind:value={email} placeholder="Email" required disabled={loading} />
  <input type="password" bind:value={password} placeholder="Password" required disabled={loading} />
  
  <button type="submit" disabled={loading}>
    {#if loading}
      Signing up…
    {:else}
      Sign Up
    {/if}
  </button>
</form>

<p style="text-align:center; margin-top:1rem;">
  Already have an account?
  <a href="#" onclick={() => navigate('/login')}>
    Log in
  </a>
</p>