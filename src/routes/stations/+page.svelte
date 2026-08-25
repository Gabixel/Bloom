<script lang="ts">
	import { onMount } from "svelte";
	import { authFetch } from "../../lib/navidrome.svelte";

	let loaded = $state(false);
	let stations: NavidromeRadioObject[] = $state([]);

	onMount(() => {
		authFetch(`/api/radio?` + `&_order=ASC&_sort=name&_start=0`).then(
			async (result) => {
				if (result == null) {
					return;
				}

				let list = await result.json();

				if (!Array.isArray(list)) {
					return;
				}

				console.log(list);

				loaded = true;
				stations = list;
			},
		);
	});
</script>

<div>
	{#each stations as r (r.id)}
		<div>
			<p>{r.name} / {r.streamUrl}</p>
		</div>
	{/each}
	{#if loaded && stations.length == 0}
		<p>No radio stations found!</p>
	{/if}
	{#if !loaded}
		<p>Loading...</p>
	{/if}
</div>

<style>
</style>
