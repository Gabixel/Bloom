<script lang="ts">
	import { onMount, tick } from "svelte";
	import type { PageProps } from "./$types.d.ts";
	import {
		authFetch,
		CLIENT_NAME,
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
		starred?: boolean | undefined;
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

<div>
	<div style="padding:1rem;padding-bottom:1.5rem">
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
			<p>Total albums in DB: {albumCount}</p>

			<button
				onclick={() => {
					refreshInput();
				}}>Refresh</button
			>
		{/if}
	</div>

	{#if albumCount < 0}
		<p>{errorMessage === "" ? "Loading..." : errorMessage}</p>
	{:else if albumList == null || albumList.length == 0}
		<p>No albums!</p>
	{:else}
		{#each albumList as album (album.id)}
			{@render renderAlbum(album)}
		{/each}
	{/if}
</div>

{#snippet heartFull()}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
		><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
			d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"
		/></svg
	>
{/snippet}
{#snippet heart()}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
		><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
			d="M442.9 144C415.6 144 389.9 157.1 373.9 179.2L339.5 226.8C335 233 327.8 236.7 320.1 236.7C312.4 236.7 305.2 233 300.7 226.8L266.3 179.2C250.3 157.1 224.6 144 197.3 144C150.3 144 112.2 182.1 112.2 229.1C112.2 279 144.2 327.5 180.3 371.4C221.4 421.4 271.7 465.4 306.2 491.7C309.4 494.1 314.1 495.9 320.2 495.9C326.3 495.9 331 494.1 334.2 491.7C368.7 465.4 419 421.3 460.1 371.4C496.3 327.5 528.2 279 528.2 229.1C528.2 182.1 490.1 144 443.1 144zM335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1C576 297.7 533.1 358 496.9 401.9C452.8 455.5 399.6 502 363.1 529.8C350.8 539.2 335.6 543.9 320 543.9C304.4 543.9 289.2 539.2 276.9 529.8C240.4 502 187.2 455.5 143.1 402C106.9 358.1 64 297.7 64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1L320 171.8L335 151.1z"
		/></svg
	>
{/snippet}

{#snippet renderAlbum(album: AlbumItem)}
	<div
		role="link"
		class={["album-element", album.starred && "starred"]}
		tabindex="0"
		onclick={(e) => {
			goto(`${_location.hash}/${album.id}`, {});
		}}
		onkeydown={() => {}}
	>
		<!-- onkeydown={() => {
			// TODO: check for enter key specifically
			goto(`${_location.hash}/${album.id}`, {});
		}} -->
		<!-- TODO: we need an "infinite scroller" and paginate at the same time (with some skeletons) -->
		<AlbumImage
			albumName={album.name}
			coverArtId={album.id}
			albumId={album.id}
			intersectionObserver={AlbumIntersectionObserver}
		></AlbumImage>
		<!-- <p><a href={`${_location.hash}/${album.id}`}>{album.name}</a></p> -->
		<div>
			<p class="album-name">{album.name}</p>
			<p class="album-artist">
				{album.albumArtist}
				{album.date != null ? "· " + album.date : ""}
			</p>
		</div>
		<button
			class="like-button"
			onclick={(e) => {
				// e.preventDefault();
				e.stopImmediatePropagation();

				const operation = album.starred ? "unstar" : "star";

				authFetch(
					`/rest/${operation}?id=${album.id}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME}` +
						`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
				).then(() => {
					album.starred = !album.starred;

					/*
					{
					    "subsonic-response": {
					        "status": "ok",
					        "version": "...",
					        "type": "navidrome",
					        "serverVersion": "... (...)",
					        "openSubsonic": true
					    }
					}
				 	*/
				});
			}}
		>
			{#if album.starred === true}
				{@render heartFull()}
			{:else}
				{@render heart()}
			{/if}
		</button>
	</div>
{/snippet}

<style>
	.album-element {
		cursor: pointer;
		background-color: #00000020;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: stretch;
		gap: 2ch;

		padding: 0.6rem 0.85rem;
		padding-right: 0;

		position: relative;

		overflow: clip;
		isolation: isolate;
	}
	.album-element:nth-child(odd) {
		background-color: #00000040;
	}

	.album-element:hover {
		background-color: #00000060;
	}

	.album-element.starred::before {
		content: "";
		display: block;
		position: absolute;
		right: 0;
		top: 10%;
		bottom: 10%;
		box-shadow: 0.6rem 0 2.3rem 0.6rem var(--bloom-theme-dark);
	}

	.album-element p {
		margin: 0;

		white-space: nowrap;
		text-wrap: nowrap;
		line-break: loose;
		word-break: nowrap;
		line-height: 1.5;

		overflow: hidden;
		text-overflow: ellipsis;
	}

	.album-element > div {
		overflow: hidden;

		height: max-content;
		margin: auto 0;
	}

	p.album-artist {
		color: #aaa;
		font-size: 0.9rem;
	}

	.like-button {
		appearance: none;
		background: none;
		padding: 0;
		border: none;

		margin: 0;
		margin-left: auto;

		cursor: pointer;

		padding: 0.5rem 0.8rem;
		/*border-top: 0.6rem solid transparent;
		border-bottom: 0.6rem solid transparent;*/
		margin-top: -0.6rem;
		margin-bottom: -0.6rem;

		/*height: stretch;*/
	}
	.like-button svg {
		width: 1.4rem;
		height: 1.4rem;
		fill: #fff;
	}

	.album-element.starred .like-button svg {
		fill: var(--bloom-theme);
	}
	/*:global(.album-element img) {
		margin: 0.6rem 0;
	}*/

	.album-search-bar {
		appearance: none;
		padding: 0.4rem;
		min-width: 0;
		max-width: none;
		width: 100%;
	}
</style>
