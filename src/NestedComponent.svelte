<script>
  export let color = '#ffcc00';

  $: avatarColor = color.substring(1);
</script>

<img src={`https://api.adorable.io/avatars/face/eyes4/nose3/mouth7/${avatarColor}`} alt="Avatar" width="150" />
