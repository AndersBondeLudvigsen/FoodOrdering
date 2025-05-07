<!-- src/App.svelte -->
<script>
  import { Router, Link, Route } from "svelte-routing";
  import MenuPage   from "./components/Pages/Menu.svelte";
  import Login      from "./components/Login/Login.svelte";
  import Signup     from "./components/Signup/Signup.svelte";
  import Basket     from "./components/Basket/Basket.svelte";
  import MyOrders   from "./components/Orders/Orders.svelte";
  import Recommend from "./components/Recommend/Recommend.svelte";
</script>

<Router>
  <nav>
    <Link to="/">Home</Link>
    <Link to="/login">Log In</Link>
    <Link to="/signup">Sign Up</Link>
    <Link to="/basket">Basket</Link>
    <Link to="/orders">My Orders</Link>
    <Link to="/recommend"> Recommend</Link>
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

    <Route path="/basket">
      <Basket />
    </Route>

    <Route path="/orders">
      <MyOrders />
    </Route>

    <Route path="/recommend">
    <Recommend />
    </Route>
  </div>
</Router>
