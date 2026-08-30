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
		albumImageSize,
		albumRequestSize,
		intersectionObserver,
	}: {
		coverArtId: string;
		albumId: string;
		albumName: string;
		albumImageSize?: number | null | undefined;
		albumRequestSize?: number | undefined;
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

				let size: string | null = "&size=";

				if (albumRequestSize != null) {
					size += albumRequestSize;
				} else {
					size += "400";
				}

				imageSrc =
					`${navidromeData.navidromeBaseUrl()}/rest/getCoverArt?id=${coverArtId}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
					`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
					`${size != null ? size : ""}` +
					`&square=true`;
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

<div
	class="album-image-wrapper"
	draggable="false"
	bind:this={albumDiv}
	style={`--size:${albumImageSize === null ? "unset" : (albumImageSize || 50) + "px"};aspect-ratio: 1/1;`}
	role="img"
	ondrag={(e) => e.preventDefault()}
>
	<!-- onselect={(e) => document.getSelection()?.empty()} -->
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
		width={albumImageSize === null
			? undefined
			: (albumImageSize || 50) + "px"}
		height={albumImageSize === null
			? undefined
			: (albumImageSize || 50) + "px"}
	/>
</div>

<style>
	img {
		display: block;
	}

	img:not(.loaded) {
		opacity: 0;
	}

	img {
		width: var(--size, 100%);
		transition: opacity 0.5s ease;
		user-select: none;
		pointer-events: none;

		image-rendering: optimizeQuality;
		image-rendering: optimizequality;
		image-rendering: smooth;
	}

	img.loaded {
		opacity: 1;
	}

	.album-image-wrapper {
		min-width: var(--size);
		width: var(--size, 100%);
		min-height: var(--size);
		height: var(--size);
		aspect-ratio: 1/1;
		object-fit: contain;
		user-select: none;

		background-color: #00000025;
	}
</style>
