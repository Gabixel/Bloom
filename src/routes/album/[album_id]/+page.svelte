<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types.ts";
	import {
		authFetch,
		getSubsonicApiPath,
		navidromeData,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { getAudioPlayer } from "../../../lib/audio-player.svelte";

	let { data }: PageProps = $props();

	let user = authData.userData();

	let albumId = page.params.album_id;

	if (albumId == null || albumId === "") {
		throw new Error("No album provided");
	}

	let albumData: any = $state(null)!;
	let albumRequest: Promise<Response> = authFetch(
		`/rest/getAlbum?id=${albumId}&u=${user.username}&v=1.16.1&c=bloom-gabigroup` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
	);
	albumRequest.then(async (data) => {
		let response = (await data.json())["subsonic-response"];
		albumData = response["album"];
		console.log(response);
	});

	function playAudio(audioId: string) {
		let player = getAudioPlayer();

		console.log(player);

		const params = new URLSearchParams({
			id: audioId,
			u: user.username,
			t: authData.navidromeSubsonicToken(),
			s: authData.navidromeSubsonicSalt(),
			v: "1.16.1",
			c: "bloom-gabigroup",
			f: "json",
		});

		let url = getSubsonicApiPath(`/rest/stream.view?${params.toString()}`);

		player.preload = "metadata";
		player.src = url;

		player.play();
	}
</script>

{#if albumData != null}
	<p>{albumData.name}</p>
	<p>{albumData.displayArtist}</p>

	<!-- TODO: paginate or something -->
	{#each albumData.song as songEntry}
		<p>
			<button
				type="button"
				onclick={() => {
					playAudio(songEntry.id);
				}}>[Play]</button
			>
			<span>
				{songEntry.title}
			</span>
		</p>
	{/each}
{/if}
