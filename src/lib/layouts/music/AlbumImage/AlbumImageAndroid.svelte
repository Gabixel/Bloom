<script lang="ts">
	import { onMount } from "svelte";
	import {
		authFetch,
		CLIENT_NAME_URL,
		navidromeData,
		TEST_FETCH_TARGET_ADDRESS_SPACE,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import { Capacitor } from "@capacitor/core";

	// TODO: optimize
	let user = authData.userData();

	// TODO: inherit from parent
	let {
		coverArtId,
		albumId,
		albumName,
		albumImageSize,
		intersectionObserver,
	}: {
		coverArtId: string;
		albumId: string;
		albumName: string;
		albumImageSize?: number | null | undefined;
		intersectionObserver: IntersectionObserver;
	} = $props();

	let isBusy = $state(true);

	// TODO: share with other images?
	const controller = new AbortController();
	const signal = controller.signal;

	let imageSrc: string | null = $state(null);
	let coverAltText: string = $derived.by(() => {
		return `Covert art of album \"${albumName}\"`;
	});

	let albumDiv: HTMLElement = $state()!;

	onMount(() => {
		intersectionObserver.observe(albumDiv);

		albumDiv.addEventListener(
			"album-visible",
			() => {
				if (controller.signal.aborted) {
					return;
				}

				loadImageBlob();
			},
			{
				once: true,
			},
		);

		return () => {
			intersectionObserver.unobserve(albumDiv);
			controller.abort();
		};
	});

	function loadImageBlob() {
		let size: string | null = "&size=";

		if (albumImageSize !== null) {
			size += albumImageSize || 50;
		} else {
			size = null;
		}

		let url =
			`${navidromeData.navidromeBaseUrl()}/rest/getCoverArt?id=${coverArtId}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json` +
			`${size != null ? size : ""}` +
			`&square=true`;

		fetch(url, {
			method: "get",
			priority: "low",
			...TEST_FETCH_TARGET_ADDRESS_SPACE,
			signal,
		})
			.then((response) => {
				if (!response.ok) {
					return;
				}

				return response.blob();
			})
			// TODO: cache blob
			.then((blob) => {
				if (blob == null) {
					cconsole.error("blob is", typeof blob);
					return;
				}

				imageSrc = URL.createObjectURL(blob);
			})
			.catch((err) => cconsole.error("album cover fetch failed:", err));
	}
</script>

<div
	class="album-image-wrapper"
	bind:this={albumDiv}
	style={`--size:${albumImageSize === null ? "unset" : (albumImageSize || 50) + "px"};width:var(--size);aspect-ratio: 1/1;`}
>
	<img
		src={imageSrc}
		alt={coverAltText}
		aria-busy={isBusy}
		onload={() => {
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
	img:not([src]),
	img:not(.loaded) {
		opacity: 0;
	}

	img {
		transition: opacity 0.5s ease;
		user-select: none;
	}

	img[src].loaded {
		opacity: 1;
	}

	.album-image-wrapper {
		min-width: var(--size);
		width: var(--size);
		min-height: var(--size);
		height: var(--size);
		aspect-ratio: 1/1;
		object-fit: contain;

		background-color: #00000025;
	}
</style>
