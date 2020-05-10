<script>
import NestedComponent from './NestedComponent.svelte';

  export let name = 'Mark';
  export let color = '#ffcc00';
</script>

<div>
  <h3>Hello, {name}!</h3>

  <NestedComponent {color} />
</div>
