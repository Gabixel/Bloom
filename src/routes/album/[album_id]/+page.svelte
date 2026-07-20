<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types.ts";
	import {
		authFetch,
		getSubsonicApiPath,
		navidromeData,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { createAudioPlayer } from "$lib/audio-player.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import { Dialog } from "@capacitor/dialog";

	const showAlert = async (str: string) => {
		await Dialog.alert({
			title: "Message",
			message: str,
		});
	};

	let { data }: PageProps = $props();

	let user = authData.userData();

	let albumId = page.params.album_id;

	if (albumId == null || albumId === "") {
		throw new Error("No album provided");
	}

	let albumData: any = $state(null)!;
	let albumRequest = authFetch(
		`/rest/getAlbum?id=${albumId}&u=${user.username}&v=1.16.1&c=bloom-gabigroup` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
	);
	albumRequest.then(async (data) => {
		let response = (await data.data)["subsonic-response"];
		albumData = response["album"];
		cconsole.log(response);
	});

	async function playAudio(audioId: string, format: "mp3" | "flac") {
		/*let player = getAudioPlayer();*/

		// cconsole.log(player);

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

		// await showAlert(`playing music: "${url}"`);

		// // const res = await fetch(url);

		// showAlert(JSON.stringify(res.status));
		// showAlert(JSON.stringify(res.headers.get("content-type")));

		// const blob = await res.blob();

		// showAlert(blob.type + " " + blob.size);

		// // const arrayBuffer = await res.arrayBuffer();

		createAudioPlayer(url);
		// .then(() => {
		// 	showAlert(`music started`);
		// })
		// .catch((e) => {
		// 	console.error(e);
		// 	showAlert(`error playing music: ${e} / ${JSON.stringify(e)}`);
		// });
		// .finally(() => {
		// 	showAlert("final music logic");
		// });

		/*player.preload = "metadata";
		player.src = url;

		player.play();*/
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
					playAudio(songEntry.id, songEntry.suffix);
				}}>[Play]</button
			>
			<span>
				{songEntry.title}
			</span>
		</p>
	{/each}
{/if}
