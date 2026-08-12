<script lang="ts">
	import { onMount } from "svelte";
	import {
		authFetch,
		CLIENT_NAME_URL,
		navidromeData,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { cconsole } from "$lib/logger.svelte";

	// TODO: optimize
	let user = authData.userData();

	// TODO: inherit from parent
	let {
		coverArtId,
		albumId,
		albumName,
		intersectionObserver,
	}: {
		coverArtId: string;
		albumId: string;
		albumName: string;
		intersectionObserver: IntersectionObserver;
	} = $props();

	let isBusy = $state(true);

	const controller = new AbortController();
	const signal = controller.signal;

	let albumDiv: HTMLElement = $state()!;

	let imageSrc: string | null = $state(null);
	let coverAltText: string = $derived.by(() => {
		return `Covert art of album \"${albumName}\"`;
	});

	onMount(() => {
		intersectionObserver.observe(albumDiv);

		albumDiv.addEventListener(
			"album-visible",
			() => {
				if (controller.signal.aborted) {
					return;
				}

				imageSrc =
					`${navidromeData.navidromeBaseUrl()}/rest/getCoverArt?id=${coverArtId}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
					`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json&size=70&square=true`;
			},
			{
				once: true,
			},
		);

		return () => {
			intersectionObserver.unobserve(albumDiv);
		};
	});
</script>

<div class="album-image-wrapper" bind:this={albumDiv}>
	<img
		src={imageSrc}
		alt={coverAltText}
		fetchpriority="low"
		onload={() => {
			if (imageSrc === null) {
				return;
			}

			isBusy = false;
		}}
		class={[!isBusy && "loaded"]}
		onerror={(e) => {
			cconsole.error("image error", e);
		}}
		data-album-id={albumId}
		draggable="false"
		width="70"
		height="70"
	/>
</div>

<style>
	img:not(.loaded) {
		opacity: 0;
	}

	img {
		transition: opacity 0.5s ease;
		user-select: none;
	}

	img.loaded {
		opacity: 1;
	}

	.album-image-wrapper {
		min-width: 70px;
		width: 70px;
		min-height: 70px;
		height: 70px;

		background-color: #00000025;
	}
</style>
