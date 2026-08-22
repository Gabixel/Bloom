<script lang="ts">
	import { navigating, page, updated } from "$app/state";
	import { onMount, untrack } from "svelte";
	import { authData, destroyUserData } from "$lib/auth.svelte";
	import {
		authFetch,
		CLIENT_NAME_URL,
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
	});

	let recentAlbumList: any[] = $state([]);

	// TODO: seed?
	authFetch(
		`/api/album?u=${userData.username}&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
			`&_order=DESC&_sort=play_date&recently_played=true` +
			`&_start=0&_end=10`,
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

	{#if recentAlbumList.length > 0}
		<section class="recently-listened-to">
			<p>Recently Played</p>

			<div class="list-flex">
				{#each recentAlbumList as album}
					<div
						class="album-block"
						role="link"
						tabindex="0"
						onclick={(e) => {
							let hash =
								_location.hash.length > 0
									? _location.hash
									: "#";

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
					</div>
				{/each}
			</div>
		</section>
	{/if}

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
					"/rest/getLicense?u=gabixel&v=1.16.1&c=" +
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
		background-color: #00000060;

		padding: 1rem;
		margin: 0 -1rem;
	}

	.recently-listened-to .list-flex :global(.album-image-wrapper) {
		overflow: hidden;
		border-radius: 0.3rem;
	}

	.recently-listened-to .list-flex :global(.album-image-wrapper),
	.recently-listened-to .list-flex :global(.album-image-wrapper img) {
		width: 100%;
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
		align-items: flex-start;

		gap: 1rem;

		overflow: scroll hidden;

		padding: 0 1rem;
		margin: 0 -1rem;
	}

	.recently-listened-to .album-block {
		display: flex;
		flex-direction: column;

		background-color: #ffffff10;

		padding: 1rem;

		gap: 1rem;

		justify-content: flex-start;
		align-items: flex-start;

		flex: 0 0 40vw;
		width: 40vw;
		min-width: 40vw;
		max-width: 40vw;

		overflow: hidden;
		border-radius: 0.6rem;
	}

	.recently-listened-to .album-block p {
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
</style>
