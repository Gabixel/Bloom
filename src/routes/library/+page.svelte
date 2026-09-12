<script lang="ts">
	import LoadingIcon from "$lib/layouts/ui/LoadingIcon.svelte";
	import { onMount } from "svelte";
	import { authFetch } from "../../lib/navidrome.svelte";
	import { cconsole } from "../../lib/logger.svelte";

	let playlistCount = $state(-1);
	let playlistList: any[] | null = $state(null);
	onMount(() => {
		listPlaylists();
	});

	async function listPlaylists() {
		await authFetch(`/api/playlist?_order=DESC&_sort=name`)
			.then(async (result) => {
				if (result == null) {
					return;
				}

				let list = await result.json();

				console.log(list);

				// TODO: store somewhere when using search
				// (actually, we just need to remake/separate the search logic)
				let count = result.headers.get("x-total-count");

				if (count != null) {
					playlistCount = Number(count);
				}

				if (Array.isArray(list)) {
					playlistList = list;
					// updateListSplit();
				}
			})
			.catch((e) => {
				cconsole.error(e);
				// errorMessage = JSON.stringify(e);
				playlistList = null;
			});
	}
</script>

<div style="text-align: center; padding: 1ch">
	<a
		style="display: inline-block;width: 80%;padding:2rem;background-color: #00000030;font-weight: bold;"
		href="#/album"
	>
		See all albums in the server &rarr;
	</a>
</div>

<div style="text-align: center; padding: 1ch">
	<h1>My Library</h1>

	<h2>Soon!</h2>

	{#if playlistList == null}
		<LoadingIcon></LoadingIcon>
	{:else}
		{#each playlistList as playlistItem}
			<p><a href={`#/playlist/${playlistItem.id}`}>{playlistItem.name}</a></p>
		{/each}
	{/if}
</div>

<style>
</style>
