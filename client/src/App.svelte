<!-- src/App.svelte -->
<script>
  import { Router, Link, Route } from "svelte-routing";
  import MenuPage from "./components/Pages/Menu.svelte";
  import Login       from "./components/Login/Login.svelte";
  import Signup      from "./components/Signup/Signup.svelte";

  // for SSR support; you can ignore in a purely client-side setup
</script>

<Router>
  <nav>
    <Link to="/">Home</Link>
    <Link to="/login">Log In</Link>
    <Link to="/signup">Sign Up</Link>
  </nav>

  <div style="padding:1rem">
    <Route path="/" exact>
      <MenuPage />
    </Route>

    <Route path="/login">
      <Login />
    </Route>

    <Route path="/signup">
      <Signup />
    </Route>
  </div>
</Router>


