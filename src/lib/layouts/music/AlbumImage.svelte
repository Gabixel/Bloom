<script lang="ts">
	import { onMount } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import {
		authFetch,
		CLIENT_NAME_URL,
		navidromeData,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import { Capacitor } from "@capacitor/core";

	// TODO: optimize
	let user = authData.userData();

	let {
		coverArtId,
		albumId,
		albumName,
		// TODO: pass an IntersectionObserver
	}: {
		coverArtId: string;
		albumId: string;
		albumName: string;
	} = $props();

	let isBusy = $state(true);

	const controller = new AbortController();
	const signal = controller.signal;

	let imageSrc: string = $state("");
	let coverAltText: string = $derived.by(() => {
		return `Covert art of album \"${albumName}\"`;
	});

	let isWeb = ["ios", "android"].includes(Capacitor.getPlatform()) === false;

	onMount(() => {
		let url =
			`${navidromeData.navidromeBaseUrl()}/rest/getCoverArt?id=${coverArtId}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json&size=70&square=true`;

		if (isWeb) {
			imageSrc = url;
			isBusy = false;
			return;
		}

		fetch(url, {
			method: "get",
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
			.catch((err) => cconsole.error("album cover fetch failed:", err))
			.finally(() => {
				isBusy = false;
			});

		return () => {
			!isWeb && controller.abort();
			isBusy = false;
		};
	});
</script>

<img
	src={imageSrc}
	alt=""
	aria-busy={isBusy}
	onerror={(e) => {
		cconsole.error("image error", e);
	}}
	data-album-id={albumId}
	draggable="false"
	width="70"
	height="70"
/>
