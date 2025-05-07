<script>
  import { navigate } from 'svelte-routing';
  import * as toast from '../../util/toast.js';

  
  let username = '';
  let email    = '';
  let password = '';

  async function submit() {
    try {
      const res = await fetch('http://localhost:8080/auth/signup', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ username, email, password })
      });

      const body = await res.json();
      if (res.status !== 201) throw new Error(body.message || 'Signup failed');

      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  }
</script>

<h1>Sign Up</h1>
<form on:submit|preventDefault={submit} style="max-width:320px;margin:auto">
  <input bind:value={username} placeholder="Username" required />
  <input type="email" bind:value={email} placeholder="Email"    required />
  <input type="password" bind:value={password} placeholder="Password" required />
  <button type="submit">Sign Up</button>
</form>
<p style="text-align:center">
  Already have an account?
  <a href="#" on:click|preventDefault={() => navigate('/login')}>
    Log in
  </a>
</p>