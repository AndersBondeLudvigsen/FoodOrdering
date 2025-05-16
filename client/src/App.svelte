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
  import StockToggle    from "./components/Kitchen/StockToggle.svelte";
  import ChangePassword from "./components/ChangePassword/ChangePassword.svelte";
  import AdminDashboard from "./components/Admin/AdminDashboard.svelte";

  // log out clears the token & sends you to login
  function logout() {
    token.set(null);
    navigate("/login");
  }

  // make role easy to check in the template
  $: role = $user?.role;
</script>

<Router>
  {#if $token}
    <nav>
      {#if role === 'customer'}
        <Link to="/">Home</Link>
        <Link to="/basket">Basket</Link>
        <Link to="/orders">My Orders</Link>
        <Link to="/recommend">Recommend</Link>
        <Link to="/change-password">Change Password</Link>
      {/if}

      {#if role === 'kitchen'}
        <Link to="/kitchen">Kitchen</Link>
        <Link to="/kitchen/stock-toggle">Stock Toggle</Link>
      {/if}

      {#if role === 'admin'}
        <Link to="/admin">Admin Dashboard</Link>
      {/if}

      <!-- everyone who’s logged in can change password -->
      <button on:click={logout} style="margin-left:1rem">
        Log Out
      </button>
    </nav>
  {/if}

  <div style="padding:1rem">
    <!-- Login/Signup always available as routes -->
    <Route path="/login">
      <Login />
    </Route>
    <Route path="/signup">
      <Signup />
    </Route>

    <!-- All the rest only if you’re logged in -->
    {#if $token}
      {#if role === 'customer'}
        <Route path="/" exact>
          <MenuPage />
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
      {/if}

      {#if role === 'kitchen'}
        <Route path="/kitchen">
          <Kitchen />
        </Route>
        <Route path="/kitchen/stock-toggle">
          <StockToggle />
        </Route>
      {/if}

      {#if role === 'admin'}
        <Route path="/admin">
          <AdminDashboard />
        </Route>
      {/if}

      <!-- Change Password for everyone who’s logged in -->
      <Route path="/change-password">
        <ChangePassword />
      </Route>
    {/if}
    
  </div>
</Router>
