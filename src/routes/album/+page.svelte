<script lang="ts">
	import { onMount } from "svelte";
	import type { PageProps } from "./$types.d.ts";
	import { authFetch, navidromeData } from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";

	let { data }: PageProps = $props();

	// let albumId = $state("");

	let _location = $state(location);

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		// const r = await
	}

	let user = authData.userData();

	let albumListRequest: Promise<Response> = $state.raw(
		authFetch(
			`/rest/getAlbumList2?type=newest&size=8&u=${user.username}&v=1.16.1&c=bloom-gabigroup` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
		),
	);

	// onMount(() => {
	// 	let user = authData.userData();

	// 	albumListRequest = authFetch(
	// 		`/rest/getAlbumList2?type=newest&size=8&u=${user.username}&v=1.16.1&c=bloom-gabigroup`
	// 		+ `&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`);
	// 	// .then(async (res) => {
	// 	// 	console.log(await res.json());
	// 	// });
	// });
</script>

{#await albumListRequest then result}
	{#await result.json() then albumListResponse}
		{#snippet renderAlbum(album: {
			id: string;
			name: string;
			coverArt: string;
			songCount: number;
			created: string;
		})}
			<div>
				<p><a href={`${_location.hash}/${album.id}`}>{album.name}</a></p>
				<img
					width="150"
					height="150"
					src={`${navidromeData.navidromeBaseUrl()}/rest/getCoverArt?id=${album.coverArt}&u=${user.username}&v=1.16.1&c=bloom-gabigroup` +
						`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json&size=300&square=true`}
				/>
			</div>
		{/snippet}

		{#if albumListResponse?.["subsonic-response"]?.albumList2?.album != null}
			{#each albumListResponse["subsonic-response"].albumList2.album as album}
				{@render renderAlbum(album)}
			{/each}
		{:else}
			<p>No albums!</p>
		{/if}
	{/await}
{/await}
<!-- 
<form onsubmit={onSubmit}>
	<input type="text" bind:value={albumId} placeholder="enter an album id" />
	<button>get</button>
</form> -->