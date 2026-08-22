<script lang="ts">
	import { onMount, tick } from "svelte";
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
	import {
		AlbumIntersectionObserver,
		// searchData,
	} from "../../lib/album-search.svelte";
	import type { Snapshot } from "@sveltejs/kit";

	let {}: PageProps = $props();

	let _location = $state(location);

	let searchBar: HTMLInputElement = $state()!;
	let searchString: string = $state("");

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

	let albumList: AlbumItem[] | null = $state([]);

	let searchTimeout: NodeJS.Timeout | undefined = undefined;

	let albumCount = $state(-1);

	let errorMessage = $state("");

	let snapshotRestored = $state(false);
	let prevScrollY = $state(-1);
	type AlbumSnapshot = {
		searchString: typeof searchString;
		albumList: typeof albumList;
		albumCount: number;
		scrollY: number;
	};
	export const snapshot: Snapshot<AlbumSnapshot> = {
		capture: () => {
			return {
				searchString,
				albumList: (isActivelySearching ? [] : albumList) || [],
				albumCount: albumCount,
				scrollY: window.scrollY,
			};
		},
		restore: (value) => {
			searchString = value.searchString;
			albumList = value.albumList;
			albumCount = value.albumCount;
			prevScrollY = value.scrollY;

			snapshotRestored = true;
		},
	};
	function doScroll(y: number) {
		requestAnimationFrame(() => {
			window.scrollTo(0, y);
		});
	}

	async function listAlbums() {
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
					albumList = list;
				}

				// TODO: store somewhere when using search
				// (actually, we just need to remake/separate the search logic)
				let count = result.headers.get("x-total-count");

				if (count != null) {
					albumCount = Number(count);
				}
			})
			.catch((e) => {
				cconsole.error(e);
				errorMessage = JSON.stringify(e);
				albumList = null;
			});
	}

	let isActivelySearching = $state(false);
	onMount(() => {
		searchBar.addEventListener("input", () => {
			updateSearchWait();
		});

		searchBar.addEventListener("keyup", (e) => {
			if (e.key != "Enter") {
				return;
			}

			updateSearchWait(0);
		});
	});

	function updateSearchWait(delay = 1100) {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			let value = searchString;

			if (value == "") {
				// default listing
				listAlbums();
			} else {
				cconsole.log(`searching for '${value}'`);
				search(encodeURIComponent(value));
			}
		}, delay);
	}

	tick().then(() => {
		setTimeout(async () => {
			if (!snapshotRestored) {
				listAlbums();
				return;
			}

			if (albumCount == -1) {
				if (searchString == "") {
					await listAlbums();
				} else {
					await search(searchString);
				}
			}

			if (prevScrollY > -1) {
				doScroll(prevScrollY);
			}
		});
	});

	async function search(input: string) {
		isActivelySearching = true;

		let result = await authFetch(
			`/api/album?u=${user.username}&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
				`&_order=DESC&_sort=min_year&name=${input}`,
		).finally(() => {
			isActivelySearching = false;
		});

		/* /api/album?u=${user.username}&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
			`&_order=DESC&_sort=recently_added */

		if (result == null) {
			return [];
		}

		let searchList = await result.json();

		if (!Array.isArray(searchList)) {
			searchList = [];
		}

		if (albumList == null) {
			albumList = [];
		}
		albumList.length = 0;

		albumList.push(...searchList);

		// TODO: revisit total count / search count
		// we can't get the total db count when searching
		let count = result.headers.get("x-total-count");
		if (count != null) {
			albumCount = Number(count);
		} else {
			// bad
			albumCount = albumList.length;
		}

		return searchList;
	}

	function refreshInput(clearDataBeforeSearching = true) {
		if (clearDataBeforeSearching) {
			albumCount = -1;
			albumList!.length = 0;
		}
		searchBar.dispatchEvent(new Event("input", { bubbles: true }));
	}
</script>

<svelte:head>
	<title>Album List &#183; Bloom</title>
</svelte:head>

<input
	bind:this={searchBar}
	bind:value={searchString}
	type="search"
	class="album-search-bar"
	id="album-search-bar"
	placeholder="Search…"
	autocomplete="off"
/>

{#if albumCount >= 0}
	<button
		onclick={() => {
			refreshInput();
		}}>Refresh</button
	>
{/if}

{#if albumCount < 0}
	<p>{errorMessage === "" ? "Loading..." : errorMessage}</p>
{:else if albumList == null || albumList.length == 0}
	<p>No albums!</p>
{:else}
	<p>Total albums in DB: {albumCount}</p>
	{#each albumList as album (album.id)}
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
