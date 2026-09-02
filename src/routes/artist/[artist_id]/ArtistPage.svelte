<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types.ts";
	import { authFetch } from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import AlbumImage from "$lib/layouts/music/AlbumImage/AlbumImage.svelte";
	import { AlbumIntersectionObserver } from "$lib/album-search.svelte";
	import LoadingIcon from "$lib/layouts/ui/LoadingIcon.svelte";
	import { cconsole } from "../../../lib/logger.svelte.ts";
	import { onMount, untrack } from "svelte";

	// let { data }: PageProps = $props();

	let user = authData.userData();

	let errorMessage = $state("");

	let artistId: string | null = page.params.artist_id || null;

	let artistData: any = $state(null);

	// onMount(() => {});

	// $effect(() => {
	// 	console.log("PAGE ARTIST PARAMS", page.params.artist_id);
	// });

	$effect.pre(() => {
		if (artistId == null || artistId === "") {
			throwError("No artist provided");
			return;
		}

		untrack(() => {
			if (errorMessage != "") {
				return;
			}

			authFetch(`/api/artist/${artistId!}`).then((data) => {
				if (page.params.artist_id != artistId) {
					return;
				}

				if (data == null) {
					throwError("Data is empty");
					return;
				}

				data.json().then((response) => {
					console.log("artist data:", response);

					if (response["error"] != null) {
						console.error(response["error"]);
						throwError(response["error"]);
						return;
					}

					if (response["missing"] == true) {
						throwError(
							`Artist "${response["name"]}" is missing (pending deletion)`,
						);
						return;
					}

					artistData = response;
				});
			});
		});
	});

	function throwError(message: string) {
		errorMessage = message;
		cconsole.error(message);
	}
</script>

{#if errorMessage != ""}
	<p style="margin:1rem;text-align:center;">{errorMessage}</p>
{:else if artistData == null}
	<LoadingIcon></LoadingIcon>
{/if}

{#if artistData != null}
	<div style="text-align:center;">
		<!-- {#if artistData.mediumImageUrl}
		{/if} -->
		<h2>{artistData.name}</h2>
		{@render artistStats()}
		{#if artistData.biography && artistData.biography != ""}
			<p class="biography">
				{artistData.biography}
			</p>
		{/if}
	</div>
{/if}

{#snippet artistStats()}
	<p>
		{#if artistData.playCount && artistData.playCount > 0}
			<span class="item-stat" title="Play count">
				{@html `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" ><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM252.3 211.1C244.7 215.3 240 223.4 240 232L240 408C240 416.7 244.7 424.7 252.3 428.9C259.9 433.1 269.1 433 276.6 428.4L420.6 340.4C427.7 336 432.1 328.3 432.1 319.9C432.1 311.5 427.7 303.8 420.6 299.4L276.6 211.4C269.2 206.9 259.9 206.7 252.3 210.9z" /></svg>`}

				<span> {artistData.playCount} </span>
			</span>
		{/if}
	</p>
	<p class="with-separator">
		{#if artistData.songCount && artistData.songCount > 0}
			<span class="item-stat" title="Song count">
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3" ><path d="M287-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47q-66 0-113-47Z" /></svg>`}

				<span> {artistData.songCount} </span>
			</span>
		{/if}
		{#if artistData.albumCount && artistData.albumCount > 0}
			<span class="item-stat" title="Album count">
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3" ><path d="M480-300q75 0 127.5-52.5T660-480q0-75-52.5-127.5T480-660q-75 0-127.5 52.5T300-480q0 75 52.5 127.5T480-300Zm-28.5-151.5Q440-463 440-480t11.5-28.5Q463-520 480-520t28.5 11.5Q520-497 520-480t-11.5 28.5Q497-440 480-440t-28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>`}

				<span> {artistData.albumCount} </span>
			</span>
		{/if}
	</p>
	{#if artistData.starred === true}
		<!-- TODO: like/dislike requests -->
		<p style="font-weight: bold;">You like this artist!</p>
	{/if}
{/snippet}

<style>
	.item-stat {
		display: inline-flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 0.5ch;
	}

	.item-stat :global(svg) {
		display: inline-block;
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
		padding-top: 0.1rem;
	}

	.with-separator > *:not(:first-child:last-child):not(:last-child)::after {
		content: "·";
		display: inline-block;
		margin-inline: 0.5ch;
		font-weight: bold;
		font-size: 50%;
	}

	.biography {
		padding: 0 10vw;
		font-size: 1.15em;
	}
</style>
