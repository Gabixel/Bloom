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

	let { data }: PageProps = $props();

	let user = authData.userData();

	let errorMessage = $state("");

	let artistId: string | null | undefined = $state(null);

	let artistData: any = $state(null);

	// onMount(() => {});

	// $effect(() => {
	// 	console.log("PAGE ARTIST PARAMS", page.params.artist_id);
	// });

	$effect.pre(() => {
		if (page.params.artist_id != artistId) {
			artistId = page.params.artist_id!;
			errorMessage = "";
			artistData = null;
		} else {
			return;
		}

		if (artistId == null || artistId === "") {
			throwError("No artist provided");
			return;
		}
		// debugger;

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
		<h2>{artistData.name}</h2>
		<p
			style="display: flex; flex-direction: row;justify-content: center; align-items: center; gap:0.5ch;"
			title="Play count"
		>
			<svg
				style="display:inline-block;width:1.25rem;height:1.25rem;fill:currentColor;padding-top:0.1rem"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 640 640"
				><!--!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
					d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM252.3 211.1C244.7 215.3 240 223.4 240 232L240 408C240 416.7 244.7 424.7 252.3 428.9C259.9 433.1 269.1 433 276.6 428.4L420.6 340.4C427.7 336 432.1 328.3 432.1 319.9C432.1 311.5 427.7 303.8 420.6 299.4L276.6 211.4C269.2 206.9 259.9 206.7 252.3 210.9z"
				/></svg
			>
			<span>{artistData.playCount}</span>
		</p>
		<!-- WORK IN PROGRESS -->
	</div>
{/if}

<style>
</style>
