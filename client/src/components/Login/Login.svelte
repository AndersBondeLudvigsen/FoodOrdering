<script>
  import { navigate } from 'svelte-routing';
  import * as toast   from '../../util/toast.js';
  import { token }    from '../../stores/auth.js';

  import "../../styels/login.css"

  let email    = '';
  let password = '';
  let loading  = false;

  async function submit() {
    loading = true;
    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Login failed');

      localStorage.setItem('token', body.token);
      token.set(body.token);

      toast.success('Logged in successfully!');

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

<p style="text-align:center; margin-top:1rem;">
  Forgot password?
  <a href="#" on:click|preventDefault={() => navigate('/forgot-password')}>
    Forgot password
  </a>
</p>

