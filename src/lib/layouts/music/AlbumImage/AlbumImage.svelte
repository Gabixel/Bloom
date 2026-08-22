<script lang="ts">
	import { cconsole } from "$lib/logger.svelte";
	import { Capacitor } from "@capacitor/core";
	import AlbumImageAndroid from "./AlbumImageAndroid.svelte";
	import AlbumImageWeb from "./AlbumImageWeb.svelte";
	import { onMount } from "svelte";

	// TODO: export type
	let props: {
		coverArtId: string;
		albumId: string;
		albumName: string;
		albumImageSize?: number | null | undefined;
		intersectionObserver: IntersectionObserver;
	} = $props();

	const platform = Capacitor.getPlatform();

	// onMount(() => {})
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
