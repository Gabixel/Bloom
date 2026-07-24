<script lang="ts">
	import { cconsole } from "$lib/logger.svelte";
	import { Capacitor } from "@capacitor/core";
	import AlbumImageAndroid from "./AlbumImageAndroid.svelte";
	import AlbumImageWeb from "./AlbumImageWeb.svelte";

	// TODO: export type
	let props: {
		coverArtId: string;
		albumId: string;
		albumName: string;
		// TODO: pass an IntersectionObserver
	} = $props();

	const platform = Capacitor.getPlatform();
</script>

{#if platform === "android"}
	<AlbumImageAndroid {...props}></AlbumImageAndroid>
{:else if platform === "ios"}
	<span><!-- TODO: iOS --></span>
{:else}
	<AlbumImageWeb {...props}></AlbumImageWeb>
{/if}

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
		min-width: 70px;
		width: 70px;
		min-height: 70px;
		height: 70px;

		background-color: #00000025;
	}
</style>
