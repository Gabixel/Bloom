<script lang="ts">
	import { onMount } from "svelte";
	import type { PageProps } from "./$types.d.ts";
	import {
		authFetch,
		CLIENT_NAME_URL,
		navidromeData,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { goto } from "$app/navigation"; // TODO: preloadData? (sounds risky)
	import { cconsole } from "../../lib/logger.svelte";
	import AlbumImage from "../../lib/layouts/music/AlbumImage.svelte";

	let { data }: PageProps = $props();

	// let albumId = $state("");

	let _location = $state(location);

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		// const r = await
	}

	let user = authData.userData();

	let albumListRequest = authFetch(
		`/rest/getAlbumList2?type=newest&size=16&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
	);

	let errorCount = 0;

	// onMount(() => {
	// 	let user = authData.userData();

	// 	albumListRequest = authFetch(
	// 		`/rest/getAlbumList2?type=newest&size=8&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}`
	// 		+ `&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`);
	// 	// .then(async (res) => {
	// 	// 	cconsole.log(await res.json());
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
			<div
				role="link"
				class="album-element"
				tabindex="0"
				onclick={() => {
					goto(`${_location.hash}/${album.id}`, {});
				}}
				onkeydown={() => {
					// TODO: check for enter key specifically
					goto(`${_location.hash}/${album.id}`, {});
				}}
			>
				<AlbumImage
					albumName={album.name}
					coverArtId={album.coverArt}
					albumId={album.id}
				></AlbumImage>
				<!-- <p><a href={`${_location.hash}/${album.id}`}>{album.name}</a></p> -->
				<span>{album.name}</span>
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

<style>
	.album-element {
		cursor: pointer;
		background-color: #00000020;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: 2ch;
	}
	.album-element:nth-child(odd) {
		background-color: #00000040;
	}
	.album-element:hover {
		background-color: #00000060;
	}
</style>
