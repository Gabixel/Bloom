<script lang="ts">
	import { page } from "$app/state";
	import AlbumPage from "./AlbumPage.svelte";
</script>

{#key page.params.album_id}
	<AlbumPage></AlbumPage>
{/key}
