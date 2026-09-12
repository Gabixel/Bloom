<script lang="ts">
	import { page } from "$app/state";
	import PlaylistPage from "./PlaylistPage.svelte";
</script>

{#key page.params.playlist_id}
	<PlaylistPage></PlaylistPage>
{/key}
