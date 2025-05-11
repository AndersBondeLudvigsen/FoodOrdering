<!-- src/components/Login/Login.svelte -->
<script>
  import { navigate } from 'svelte-routing';
  import * as toast   from '../../util/toast.js';
  import { token }    from '../../stores/auth.js';

  let email    = '';
  let password = '';
  let loading  = false;

  async function submit() {
    loading = true;
    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // no credentials: we’re doing header-based auth
        body:    JSON.stringify({ email, password })
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Login failed');

      // 1) Store the JWT in localStorage
      localStorage.setItem('token', body.token);
      token.set(body.token);

      toast.success('Logged in successfully!');

      // 2) Navigate to the protected menu page
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      loading = false;
    }
  }
</script>

<h1>Log In</h1>

<form on:submit|preventDefault={submit} style="max-width:320px;margin:auto">
  <input
    type="email"
    bind:value={email}
    placeholder="Email"
    required
  />
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    required
  />
  <button type="submit" disabled={loading}>
    {#if loading}
      Logging in…
    {:else}
      Log In
    {/if}
  </button>
</form>

<p style="text-align:center; margin-top:1rem;">
  Don’t have an account?
  <a href="#" on:click|preventDefault={() => navigate('/signup')}>
    Sign up
  </a>
</p>

<style>
  input, button {
    display: block;
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    box-sizing: border-box;
  }
  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
