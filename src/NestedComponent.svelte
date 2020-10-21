<script>
  export let color = '#ffcc00';

  $: avatarColor = color.substring(1);
</script>

<style>
  img {
    box-shadow:#008cff 3px 3px 0px 0px
  }
</style>

<img src={`https://api.adorable.io/avatars/face/eyes4/nose3/mouth7/${avatarColor}`} alt="Avatar" width="150" />
