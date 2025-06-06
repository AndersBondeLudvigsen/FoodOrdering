<script>
  import { Router, Link, Route, navigate } from "svelte-routing";
  import { token, user } from "./stores/auth.js";
  import RequireRole from "./components/RoleCheck/RequireRole.svelte";

  import MenuPage from "./components/Pages/Menu.svelte";
  import Login from "./components/Login/Login.svelte";
  import Signup from "./components/Signup/Signup.svelte";
  import Basket from "./components/Basket/Basket.svelte";
  import MyOrders from "./components/Orders/Orders.svelte";
  import Recommend from "./components/Recommend/Recommend.svelte";
  import Kitchen from "./components/Kitchen/Kitchen.svelte";
  import StockToggle from "./components/Kitchen/StockToggle.svelte";
  import ChangePassword from "./components/ChangePassword/ChangePassword.svelte";
  import AdminDashboard from "./components/Admin/AdminDashboard.svelte";
  import SalesDashBoard from "./components/Admin/SalesDashBoard.svelte";
  import Favorites from "./components/Favorites/Favorites.svelte";


  function logout() {
    token.set(null);
    navigate("/login");
  }

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
        <Link to="/favorites">Favorites</Link>

      {/if}

      {#if role === 'kitchen'}
        <Link to="/kitchen">Kitchen</Link>
        <Link to="/kitchen/stock-toggle">Stock Toggle</Link>
      {/if}

      {#if role === 'admin'}
        <Link to="/admin">Admin Dashboard</Link>
        <Link to="/admin/sales"> Sales</Link>
      {/if}

      <button on:click={logout} style="margin-left:1rem">
        Log Out
      </button>
    </nav>
  {/if}

  <div style="padding:1rem">
    <Route path="/login">
      <Login />
    </Route>
    <Route path="/signup">
      <Signup />
    </Route>

    <Route path="/" exact>
      {#if !$token}
        <Login />
      {:else if role === 'customer'}
        <MenuPage />
      {:else if role === 'kitchen'}
        <Kitchen />
      {:else if role === 'admin'}
        <AdminDashboard />
      {:else}
        <Login /> 
      {/if}
    </Route>

    {#if $token} 
         <Route path="/basket">
        <RequireRole {role} allowed={['customer']} redirect="/" >
          <Basket />
        </RequireRole>
      </Route>
      <Route path="/orders">
        <RequireRole {role} allowed={['customer']} redirect="/" >
          <MyOrders />
        </RequireRole>
      </Route>
      <Route path="/recommend">
        <RequireRole {role} allowed={['customer']} redirect="/" >
          <Recommend />
        </RequireRole>
      </Route>

        <Route path="/favorites">
        <RequireRole {role} allowed={['customer']} redirect="/" >
          <Favorites/>
        </RequireRole>
      </Route>

      <Route path="/kitchen">
        <RequireRole {role} allowed={['kitchen']} redirect="/" >
          <Kitchen />
        </RequireRole>
      </Route>
      <Route path="/kitchen/stock-toggle">
        <RequireRole {role} allowed={['kitchen']} redirect="/" >
          <StockToggle />
        </RequireRole>
      </Route>

      <Route path="/admin">
        <RequireRole {role} allowed={['admin']} redirect="/" >
          <AdminDashboard />
        </RequireRole>
      </Route>


       <Route path="/admin/sales">
        <RequireRole {role} allowed={['admin']} redirect="/" >
          <SalesDashBoard />
        </RequireRole>
      </Route>

      <Route path="/change-password">
        <RequireRole {role} allowed={['customer']} redirect="/" >
          <ChangePassword />
        </RequireRole>
      </Route>
    {/if}
  </div>
</Router>
