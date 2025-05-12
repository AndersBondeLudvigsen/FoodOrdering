<!-- src/App.svelte -->
<script>
  import { Router, Link, Route, navigate } from "svelte-routing";
  import { token, user }                   from "./stores/auth.js";

  import MenuPage       from "./components/Pages/Menu.svelte";
  import Login          from "./components/Login/Login.svelte";
  import Signup         from "./components/Signup/Signup.svelte";
  import Basket         from "./components/Basket/Basket.svelte";
  import MyOrders       from "./components/Orders/Orders.svelte";
  import Recommend      from "./components/Recommend/Recommend.svelte";
  import Kitchen        from "./components/Kitchen/Kitchen.svelte";
  import ChangePassword from "./components/ChangePassword/ChangePassword.svelte";
  import AdminDashboard from "./components/Admin/AdminDashboard.svelte";

  function logout() {
    token.set(null);
    navigate("/login");
  }
</script>

<Router>
  {#if $token}
    <nav>
      <Link to="/">Home</Link>
      <Link to="/basket">Basket</Link>
      <Link to="/orders">My Orders</Link>
      <Link to="/recommend">Recommend</Link>
      {#if $user?.role === 'kitchen' }
      <Link to="/kitchen">Kitchen</Link>
      {/if}
      <Link to="/change-password">Change Password</Link>
      {#if $user?.role === 'admin'}
        <Link to="/admin">Admin Dashboard</Link>
      {/if}
      <button on:click={logout} style="margin-left:1rem">Log Out</button>
    </nav>
  {/if}

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

    <Route path="/basket">
      <Basket />
    </Route>

    <Route path="/orders">
      <MyOrders />
    </Route>

    <Route path="/recommend">
      <Recommend />
    </Route>

   
    {#if $user?.role === 'kitchen'}
      <Route path="/kitchen">
        <Kitchen />
      </Route>
    {/if}
    <Route path="/change-password">
      <ChangePassword />
    </Route>

    {#if $user?.role === 'admin'}
      <Route path="/admin">
        <AdminDashboard />
      </Route>
    {/if}
  </div>
</Router>