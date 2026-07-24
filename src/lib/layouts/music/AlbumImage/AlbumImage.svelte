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
	/* TODO: style children */
</style>
