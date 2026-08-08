<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types.ts";
	import {
		authFetch,
		CLIENT_NAME,
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
		`/rest/getAlbum?id=${albumId}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME}` +
			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
	);
	albumRequest.then(async (data) => {
		if (data == null) {
			return;
		}

		let response = (await data.json())["subsonic-response"];
		albumData = response["album"];
		console.log("album data:", response);

		// checkAlbumLyrics(albumData.id)
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
			u: user.username,
			t: authData.navidromeSubsonicToken(),
			s: authData.navidromeSubsonicSalt(),
			v: "1.16.1",
			c: CLIENT_NAME,
			f: "json",
		});
		const streamParams = new URLSearchParams({
			id: audioId,
			...Object.fromEntries(params),
		});
		const lrcParams = new URLSearchParams({
			artist: trackData.artist,
			title: trackData.title,
			...Object.fromEntries(params),
		});

		let url = getSubsonicApiPath(`/rest/stream.view?${streamParams.toString()}`);

		//let lrcUrl = getSubsonicApiPath(`/rest/getLyrics?${lrcParams.toString()}`);
		let lrcUrl = getSubsonicApiPath(
			`/rest/getLyricsBySongId.view?${lrcParams.toString()}&id=${audioId}&f=json`,
		);
		printDebugLyrics(lrcUrl);

		createAudioPlayer(url, trackData);
	}

	// async function checkAlbumLyrics(albumId: string) {
	// 	const lrcParams = new URLSearchParams({
	// 		u: user.username,
	// 		t: authData.navidromeSubsonicToken(),
	// 		s: authData.navidromeSubsonicSalt(),
	// 		v: "1.16.1",
	// 		c: CLIENT_NAME,
	// 		f: "json",
	// 	});

	// 	let lrcRes = await authFetch("/api/song?album_id=" + albumId);
	// 	if (lrcRes != null) {
	// 		let json = await lrcRes.json();
	// 		cconsole.log("album songs", json);
	// 	}
	// 	// let lrcUrl = getSubsonicApiPath(
	// 	// 	`/rest/getLyricsBySongId.view?${lrcParams.toString()}&id=${audioId}&f=json`,
	// 	// );
	// }

	async function printDebugLyrics(lrcUrl: string) {
		try {
			let data = await fetch(lrcUrl);

			if (!data.ok) {
				return;
			}

			let result = await data.json();

			let resultList = result["subsonic-response"]["lyricsList"][
				"structuredLyrics"
			];

			if (resultList.length == 0) {
				cconsole.log("resultList is empty");
				return;
			}

			cconsole.log("existing lyrics and synced?", resultList[0].synced);
		} catch (e) {}
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
