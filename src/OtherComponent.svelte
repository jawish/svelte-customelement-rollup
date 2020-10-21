<script>
  import NestedComponent from './NestedComponent.svelte';

  export let name = 'Mark';
  export let color = '#ffcc00';
</script>

<style>
  h3 {
    background: linear-gradient(to right, #ce3737 0%, #1C6EA4 33%, #20a83e 67%, #ce3737 100%);
    background-size: 200% auto;
    background-position: 0 center;
    
    color: #000;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    
    text-align: center;
    width: fit-content;
    animation: shine 1s linear infinite;
  }
  @keyframes shine {
    to {
      background-position: 200% center;
    }
  }
</style>


<div>
  <h3>Hello, {name}!</h3>

  <NestedComponent {color} />
</div>
