<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types.ts";
	import {
		authFetch,
		CLIENT_NAME_URL,
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
		`/rest/getAlbum?id=${albumId}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
	);
	albumRequest.then(async (data) => {
		if (data == null) {
			return;
		}

		let response = (await data.json())["subsonic-response"];
		albumData = response["album"];
		cconsole.log(response);
	});

	async function playAudio(
		audioId: string,
		trackData: {
			title: string;
			artist: string;
			albumTitle: string;
			duration: number;
		},
		// TODO: future use(?)
		format: "mp3" | "flac" | string,
	) {
		/*let player = getAudioPlayer();*/

		// cconsole.log(player);

		const params = new URLSearchParams({
			id: audioId,
			u: user.username,
			t: authData.navidromeSubsonicToken(),
			s: authData.navidromeSubsonicSalt(),
			v: "1.16.1",
			c: CLIENT_NAME_URL,
			f: "json",
		});

		let url = getSubsonicApiPath(`/rest/stream.view?${params.toString()}`);

		createAudioPlayer(url, trackData);
	}
</script>

<svelte:head>
	{#if albumData != null}
		<title>Album "{albumData.name}" &#183; Bloom</title>
	{:else}
		<title>(Album loading) &#183; Bloom</title>
	{/if}
</svelte:head>

{#if albumData != null}
	<p>{albumData.name}</p>
	<p>{albumData.displayArtist}</p>

	<!-- TODO: paginate or something -->
	{#each albumData.song as songEntry}
		<p>
			<button
				type="button"
				onclick={() => {
					playAudio(
						songEntry.id,
						{
							title: songEntry.title,
							artist: songEntry.artist,
							albumTitle: albumData.name,
							duration: Number(songEntry.duration),
						},
						songEntry.suffix,
					);
				}}>[Play]</button
			>
			<span>
				{songEntry.title}
			</span>
		</p>
	{/each}
{/if}
