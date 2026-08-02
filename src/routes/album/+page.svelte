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
	import AlbumImage from "../../lib/layouts/music/AlbumImage/AlbumImage.svelte";
	import { searchData } from "../../lib/album-search.svelte";

	let {}: PageProps = $props();

	let _location = $state(location);

	let searchBar: HTMLInputElement = $state()!;

	let user = authData.userData();

	type AlbumItem = {
		id: string;
		name: string;
		coverArt: string;
		songCount: string;
		/** timestamp TZ */
		created: string;
		duration: string;
		artist: string;
		artistId: string;
	};

	let albumlist: AlbumItem[] | null = $state.raw(
		searchData.getLastSearchData().albumList,
	);

	let searchTimeout: NodeJS.Timeout | undefined = undefined;

	function listAlbums() {
		authFetch(
			`/rest/getAlbumList2?type=newest&size=16&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
		)
			.then(async (result) => {
				let list = (await result.json())["subsonic-response"]["albumList2"][
					"album"
				];

				console.log(list);

				if (Array.isArray(list)) {
					albumlist = list;
				}
			})
			.catch(() => {
				albumlist = null;
			});
	}

	onMount(() => {
		searchBar.addEventListener("input", () => {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				let value = searchBar.value;

				cconsole.log(`searching for '${value}'`);

				if (value == "") {
					// default listing
					listAlbums();
					return;
				}

				search(encodeURIComponent(value)).then((searchList) => {
					searchData.update({
						searchInput: value,
						albumList: searchList,
					});
				});
			}, 1100);
		});

		if (searchBar.value === "") {
			listAlbums();
		}
	});

	async function search(input: string) {
		let request = await authFetch(
			`/rest/search3?u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json&query=${input}&artistCount=0&songCount=0`,
		);

		let searchList = (await request.json())["subsonic-response"]["searchResult3"][
			"album"
		];

		if (Array.isArray(searchList)) {
			albumlist = searchList;
		}

		return searchList;
	}
</script>

<input
	bind:this={searchBar}
	type="search"
	value={searchData.getLastSearchData().searchInput}
	class="album-search-bar"
	id="album-search-bar"
	placeholder="Search…"
	autocomplete="off"
/>

{#if albumlist == null}
	<p>No albums!</p>
{:else}
	{#each albumlist as album (album.id)}
		{@render renderAlbum(album)}
	{/each}
{/if}

{#snippet renderAlbum(album: AlbumItem)}
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

	.album-search-bar {
		appearance: none;
		padding: 0.25rem;
		min-width: 0;
		max-width: none;
		width: 100%;
		margin-bottom: 1rem;
	}
</style>
