<script lang="ts">
	import { navigating, page, updated } from "$app/state";
	import { onMount, untrack } from "svelte";
	import { authData, destroyUserData } from "$lib/auth.svelte";
	import {
		authFetch,
		CLIENT_NAME_URL,
		getSeed,
		TEST_FETCH_TARGET_ADDRESS_SPACE,
	} from "$lib/navidrome.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import AlbumImage from "../lib/layouts/music/AlbumImage/AlbumImage.svelte";
	import { AlbumIntersectionObserver } from "../lib/album-search.svelte";
	import { goto } from "$app/navigation";

	cconsole.log("Hello from page.svelte");

	let _location = $state(location);

	let userData = authData.userData();

	onMount(() => {
		cconsole.log("page.svelte mounted!");
	});

	$effect(() => {
		let userData = authData.userData();
		untrack(() => {
			cconsole.log(userData);
		});

		authFetch(
			`/rest/getScanStatus?u=${userData.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
		).then(async (result) => {
			if (result == null) {
				return;
			}

			let final = await result.json();

			cconsole.log(final["subsonic-response"]);
		});
	});

	let recentAlbumList: any[] = $state([]);
	let hasRecentAlbums = $derived.by(() => recentAlbumList.length);

	authFetch(
		`/api/album?u=${userData.username}&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
			`&_order=DESC&_sort=play_date&recently_played=true` +
			// TODO: not sure if seed is needed (or if the current logic makes sense)
			`&_start=0&_end=10&seed=${getSeed()}`,
	).then(async (result) => {
		if (result == null) {
			return;
		}

		let final = await result.json();

		if (!Array.isArray(final)) {
			return;
		}

		recentAlbumList.push(...final);
	});
</script>

<svelte:head>
	<title>Home &#183; Bloom</title>
</svelte:head>

<div style="padding:1rem">
	<p>Welcome <strong>{authData.userData().name}</strong>!</p>

	<section
		class={["recently-listened-to", hasRecentAlbums && "visible"]}
		aria-hidden={hasRecentAlbums == 0}
	>
		{#if hasRecentAlbums}
			<p>Recently Played</p>

			<div class="list-flex">
				{#each recentAlbumList as album}
					{@render albumBlock(album)}
				{/each}
			</div>
		{/if}

		{#snippet albumBlock(album: any)}
			<div
				class="album-block"
				role="link"
				tabindex="0"
				onclick={(e) => {
					let hash = _location.hash.length > 0 ? _location.hash : "#";

					if (!hash.endsWith("/")) {
						hash += "/";
					}

					goto(`${hash}album/${album.id}`, {});
				}}
				onkeydown={() => {}}
			>
				<AlbumImage
					albumId={album.id}
					albumName={album.name}
					coverArtId={album.id}
					albumImageSize={null}
					intersectionObserver={AlbumIntersectionObserver}
				></AlbumImage>

				<p>{album.name}</p>
				<p>{album.albumArtist}</p>
			</div>
		{/snippet}
	</section>

	<button
		type="button"
		style="color:darkred;border-radius:0.25rem;background-color:#ffdddd;margin-top: 1rem;"
		onclick={async () => {
			destroyUserData();
		}}>logout</button
	>

	{#if false}
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch(
					`/rest/getLicense?u=${userData.username}&v=1.16.1&c=` +
						CLIENT_NAME_URL +
						"&t=",
					{
						...TEST_FETCH_TARGET_ADDRESS_SPACE,
					},
				);
				if (res == null) return;
				const parser = new DOMParser();

				cconsole.log(
					parser.parseFromString(await res.json(), "application/xml"),
				);
				// cconsole.log(await res.text())
			}}>ping</button
		>
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch(
					"/api/user/" + authData.userData().id,
					{
						...TEST_FETCH_TARGET_ADDRESS_SPACE,
					},
				);
				if (res == null) return;
				let json = res.json();
				cconsole.log(json);
			}}>user (me)</button
		>
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch("/api/user");
				if (res == null) return;
				let json = res.json();
				cconsole.log(json);
			}}>user list</button
		>
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch("/api/player/");
				if (res == null) return;
				let json = res.json();
				cconsole.log(json);
			}}>players list</button
		>
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch("/api/transcoding/");
				if (res == null) return;
				let json = res.json();
				cconsole.log(json);
			}}>transcoding list</button
		>
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch("/api/share/");
				if (res == null) return;
				let json = res.json();
				cconsole.log(json);
			}}>share</button
		>
	{/if}
</div>

<style>
	.recently-listened-to {
		background-color: #1d1d1d;

		padding: 1rem;
		margin: 0 -1rem;

		position: relative;

		isolation: isolate;
		overflow: clip;

		display: grid;
	}

	.recently-listened-to:not(.visible) {
		height: 0;
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
	}

	:global(body.fonts-loaded) .recently-listened-to.visible {
		max-height: 20rem;
	}

	:global(body:not(.resizing)) .recently-listened-to {
		transition: 0.5s ease;
		transition-property: padding-top, padding-bottom, max-height;
	}

	.recently-listened-to > p {
		z-index: 4;
	}

	.recently-listened-to .list-flex {
		z-index: 2;
	}

	.recently-listened-to::before,
	.recently-listened-to::after {
		z-index: 3;

		content: "";
		display: block;

		position: absolute;
		top: 0;
		bottom: 0;
		width: 0;

		box-shadow: 0 0 1rem 1rem #1d1d1d;
	}
	.recently-listened-to::before {
		left: 0;
	}
	.recently-listened-to::after {
		right: 0;
	}

	.recently-listened-to .list-flex :global(.album-image-wrapper) {
		overflow: hidden;
		border-radius: 0.3rem;
	}

	.recently-listened-to > p {
		margin: 0;
		margin-bottom: 1rem;
		font-weight: bold;

		padding-left: 0.5rem;
		border-left: 0.25em solid currentColor;
		border-radius: 0.2em;

		line-height: 1.5;
	}

	.recently-listened-to .list-flex {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: safe flex-start;
		align-items: stretch;

		gap: 1rem;

		overflow: scroll hidden;

		padding: 0 1rem;
		margin: 0 -1rem;

		touch-action: pan-x;
	}

	.album-block {
		display: flex;
		flex-direction: column;

		background-color: #ffffff10;

		cursor: pointer;

		padding: 1rem;

		justify-content: flex-start;
		align-items: flex-start;

		flex: 0 0 40vw;
		width: 40vw;
		min-width: 8rem;
		max-width: 10rem;

		overflow: hidden;
		border-radius: 0.6rem;
	}

	.album-block > p {
		margin: 0;
		width: 100%;

		white-space: nowrap;
		text-wrap: nowrap;
		line-break: loose;
		word-break: nowrap;
		line-height: 1.5;

		overflow: hidden;
		text-overflow: ellipsis;
	}
	.album-block > p:nth-child(2) {
		margin-top: 0.5rem;
	}

	.album-block p:nth-child(3) {
		opacity: 0.6;
	}
</style>
