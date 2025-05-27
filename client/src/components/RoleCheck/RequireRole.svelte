<script>
    import { onMount }  from 'svelte';
    import { navigate } from 'svelte-routing';
    import * as toast   from '../../util/toast.js';
  
    export let allowed = [];
    export let redirect = '/';
    export let role;
  
    let ok = false;
  
    onMount(() => {
      if (!allowed.includes(role)) {
        toast.error(`You don’t have access to this page`);
        navigate(redirect);
      } else {
        ok = true;
      }
    });
  </script>
  
  {#if ok}
    <slot />
  {/if}
  