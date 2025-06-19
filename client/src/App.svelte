<script>
    import { Router, Link, Route, navigate } from "svelte-routing";
    import { onMount } from 'svelte';
    import { token, user } from "./stores/auth.js";


    import MenuPage from "./components/Menu/Menu.svelte";
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
    import Footer from "./components/Footer/Footer.svelte";
    import ResetPassword from "./components/ForgotPassword/ResetPassword.svelte";
    import ForgotPassword from "./components/ForgotPassword/ForgotPassword.svelte";

    import "./styels/layout.css";

    function logout() {
        token.set(null);
        navigate("/login", { replace: true });
    }

    $: role = $user?.role;


    onMount(() => {
              const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
        setTimeout(() => {
            if (!$token && !publicPaths) {
                navigate('/login', { replace: true });
            }
        }, 0);
    });
</script>

<main style="padding:1rem">
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
                                           <button on:click={logout}>Log Out</button>

                {/if}
                {#if role === 'kitchen'}
                    <Link to="/">Kitchen</Link>
                    <Link to="/stock-toggle">Stock Toggle</Link>
                     <button on:click={logout}>Log Out</button>

                {/if}
                {#if role === 'admin'}
                    <Link to="/">Admin Dashboard</Link>
                    <Link to="/sales">Sales</Link>
                     <button on:click={logout}>Log Out</button>

                {/if}

            </nav>

        {/if}

        
        
        {#if !$token}
            <Route path="/login"><Login /></Route>
            <Route path="/signup"><Signup /></Route>
            <Route path="/forgot-password"><ForgotPassword /></Route>
            <Route path="/reset-password"><ResetPassword /></Route>
            <Route path="*"><Login /></Route>
            
        {:else if role === 'customer'}
            <Route path="/"><MenuPage /></Route>
            <Route path="/basket"><Basket /></Route>
            <Route path="/orders"><MyOrders /></Route>
            <Route path="/recommend"><Recommend /></Route>
            <Route path="/favorites"><Favorites /></Route>
            <Route path="/change-password"><ChangePassword /></Route>
            <Route path="*"><MenuPage /></Route>

        {:else if role === 'kitchen'}
            <Route path="/"><Kitchen /></Route>
            <Route path="/stock-toggle"><StockToggle /></Route>
            <Route path="*"><Kitchen /></Route>

        {:else if role === 'admin'}
            <Route path="/"><AdminDashboard /></Route>
            <Route path="/sales"><SalesDashBoard /></Route>
            <Route path="*"><AdminDashboard /></Route>
        {/if}
    </Router>
</main>

<Footer />
