<script lang="ts">
	import { page } from "$app/state";
	import ArtistPage from "./ArtistPage.svelte";
</script>

{#key page.params.artist_id}
	<ArtistPage></ArtistPage>
{/key}
