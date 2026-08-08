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
	import { AlbumIntersectionObserver, searchData } from "../../lib/album-search.svelte";

	let {}: PageProps = $props();

	let _location = $state(location);

	let searchBar: HTMLInputElement = $state()!;

	let user = authData.userData();

	type AlbumItem = {
		id: string;
		name: string;
		//coverArt: string;
		songCount: string;
		/** timestamp TZ */
		//created: string;
		createdAt: string;
		duration: string;
		//artist: string;
		albumArtist: string;
		albumArtistId: string;
		date: string | null;
		discs: any | null;
		explicitStatus: string | null; // TODO
		compilation: boolean;
		maxYear: number | null;
		minYear: number | null;
		minOriginalYear: number | null;
		maxOriginalYear: number | null;
		mbzAlbumType: string | null;
		size: number;
		playCount: number;
		// ...more
	};

	let albumlist: AlbumItem[] | null = $state.raw(
		searchData.getLastSearchData().albumList,
	);

	let searchTimeout: NodeJS.Timeout | undefined = undefined;

	let albumCount = $state(-1);

	async function listAlbums() {
		/*await authFetch(
			`/rest/getAlbumList2?type=newest&size=16&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
		)
			.then(async (result) => {
				if (result == null) {
					return;
				}

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
			});*/
		await authFetch(
			`/api/album?u=${user.username}&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
				`&_order=DESC&_sort=recently_added`,
		)
			.then(async (result) => {
				if (result == null) {
					return;
				}

				let list = await result.json();

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
					listAlbums().then(() => {
						searchData.update({
							searchInput: value,
							albumList: [],
						});
					});
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

	onMount(() => {
		checkAlbumCount();
	});

	async function search(input: string) {
		// TODO: use Navidrome search (we're missing artist name for now)
		let result = await authFetch(
			`/rest/search3?u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json&query=${input}&artistCount=0&songCount=0`,
		);

		if (result == null) {
			return [];
		}

		let searchList = (await result.json())["subsonic-response"]["searchResult3"][
			"album"
		];

		if (!Array.isArray(searchList)) {
			searchList = [];
		}

		albumlist = searchList;

		return searchList;
	}

	async function checkAlbumCount() {
		// TODO: actually use this somehow for the search
		let res = await authFetch(
			`/api/album?u=${user.username}&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
				`&_order=DESC&_sort=recently_added&_start=0&_end=1`,
		);

		if (res == null) {
			return;
		}

		let count = res.headers.get("x-total-count");

		if (count == null) {
			return;
		}

		albumCount = Number(count);
	}
</script>

<svelte:head>
	<title>Album list &#183; Bloom</title>
</svelte:head>

<input
	bind:this={searchBar}
	type="search"
	value={searchData.getLastSearchData().searchInput}
	class="album-search-bar"
	id="album-search-bar"
	placeholder="Search…"
	autocomplete="off"
/>

<p>Total albums in DB: {albumCount >= 0 ? albumCount : "Loading..."}</p>

{#if albumlist == null || albumlist.length == 0}
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
		<!-- TODO: we need an "infinite scroller" and paginate at the same time (with some skeletons) -->
		<AlbumImage
			albumName={album.name}
			coverArtId={album.id}
			albumId={album.id}
			intersectionObserver={AlbumIntersectionObserver}
		></AlbumImage>
		<!-- <p><a href={`${_location.hash}/${album.id}`}>{album.name}</a></p> -->
		<div>
			<p>{album.name}</p>
			<p class="album-artist">
				{album.albumArtist}
				{album.date != null ? "· " + album.date : ""}
			</p>
		</div>
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

	.album-element p {
		margin: 0;
	}

	p.album-artist {
		color: #aaa;
		font-size: 0.9rem;
	}

	.album-element > div {
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
