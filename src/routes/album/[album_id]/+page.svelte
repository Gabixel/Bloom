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
	import AlbumImage from "$lib/layouts/music/AlbumImage/AlbumImage.svelte";
	import { AlbumIntersectionObserver } from "$lib/album-search.svelte";
	import { Capacitor } from "@capacitor/core";

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

		let lrcUrl = getSubsonicApiPath(
			`/rest/getLyricsBySongId.view?${lrcParams.toString()}&id=${audioId}&f=json`,
		);
		printDebugLyrics(lrcUrl);

		if (Capacitor.getPlatform() === "web") {
			return;
		}

		createAudioPlayer(url, trackData);
	}

	async function printDebugLyrics(lrcUrl: string) {
		try {
			let data = await fetch(lrcUrl);

			if (!data.ok) {
				return;
			}

			let result = await data.json();

			let resultList =
				result["subsonic-response"]["lyricsList"]["structuredLyrics"];

			if (resultList.length == 0) {
				cconsole.log("resultList is empty");
				return;
			}

			cconsole.log("existing lyrics and synced?", resultList[0].synced);
		} catch (e) {}
	}

	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;

		if (m < 60) {
			return `${m}:${String(s).padStart(2, "0")}`;
		}

		const h = Math.floor(m / 60);
		return `${h}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	}
	// TODO
	function getAudioQuality(song: any) {
		const format = song.suffix?.toLowerCase();

		const losslessFormats = ["flac", "wav", "alac", "aiff", "ape", "wv"];

		if (losslessFormats.includes(format)) {
			const parts = [format.toUpperCase()];

			if (song.bitDepth > 0 && song.samplingRate > 0) {
				const sampleRate =
					song.samplingRate >= 1000
						? `${song.samplingRate / 1000} kHz`
						: `${song.samplingRate} Hz`;

				parts.push(`${song.bitDepth}-bit / ${sampleRate}`);
			}

			return parts.join(" · ");
		}

		if (song.bitRate > 0) {
			return `${format?.toUpperCase() ?? "Audio"} · ${song.bitRate} kbps`;
		}

		return format?.toUpperCase() ?? "Unknown";
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
	<div
		class="album-details"
		style="display:flex;align-items:center;margin-bottom:1rem"
	>
		<AlbumImage
			albumId={albumData.id}
			albumName={albumData.name}
			coverArtId={albumData.id}
			intersectionObserver={AlbumIntersectionObserver}
		></AlbumImage>
		<div style="margin-left:1rem;">
			<p>{albumData.name}</p>
			<p>
				{albumData.displayArtist}
				{#if albumData.year != null}
					- {albumData.year}
				{/if}
				{#if albumData.genre != null}
					- {albumData.genre}
				{/if}
				{#if Array.isArray(albumData.releaseTypes) && albumData.releaseTypes.includes("Single")}
					/ Single
				{/if}
			</p>
			{#if albumData.duration != null}
				<p>
					<span>{formatDuration(albumData.duration)}</span>
				</p>
			{/if}
		</div>
	</div>

	<div class="tracks">
		<!-- TODO: paginate or something -->
		{#each albumData.song as songEntry}
			<p class="track-item">
				<span class="track-text">
					{#if songEntry.track != null}
						<span>{songEntry.track} -</span>
					{/if}
					<span>{songEntry.title}</span>
					{#if songEntry.explicitStatus === "explicit"}
						<span>[Explicit]</span>
					{/if}
					{#if songEntry.duration != null}
						<span>({formatDuration(songEntry.duration)})</span>
					{/if}
					<span>[{getAudioQuality(songEntry)}]</span>
				</span>
				<button
					class="track-play-btn"
					aria-label="Play song"
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
					}}
				>
				</button>
				<button
					aria-label="Track settings"
					class="track-settings-btn"
					onclick={() => {
						console.log("TODO");
					}}>⫶</button
				>
			</p>
		{/each}
	</div>
{/if}

<style>
	p {
		margin: 0;
	}

	.tracks p.track-item {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-start;
		align-items: stretch;

		color: inherit;

		text-align: start;

		padding: 0;
		margin: 0;

		/* text-decoration: none; */

		position: relative;
	}

	.tracks p.track-item .track-text {
		position: relative;
		display: block;
		pointer-events: none;
		z-index: 10;

		margin: auto 0;
		padding: 1rem;
	}

	.tracks p.track-item button.track-settings-btn {
		z-index: 10;
		display: block;

		appearance: none;
		border: 0;

		margin: 0;
		margin-left: auto;

		cursor: pointer;

		background: none;

		padding: 0.5rem 1rem;
	}

	.tracks p.track-item button.track-play-btn {
		z-index: 2;
		display: block;

		appearance: none;
		border: 0;
		margin: 0;
		padding: 0;

		position: absolute;
		inset: 0;

		cursor: pointer;

		background-color: #00000040;
		width: 100%;
	}

	.tracks p.track-item:nth-child(odd) button.track-play-btn {
		background-color: #00000020;
	}

	.tracks p.track-item button.track-play-btn {
		outline: 2px solid #ffffff00;
	}
	.tracks p.track-item button.track-play-btn:not(:hover):not(:focus-visible) {
		transition: outline-color 0.45s ease;
	}
	.tracks p.track-item button.track-play-btn:hover,
	.tracks p.track-item button.track-play-btn:focus-visible {
		transition-duration: 0;
	}

	.tracks p.track-item button.track-play-btn:hover {
		outline-color: #ffffff20;
	}
	.tracks p.track-item button.track-play-btn:focus-visible {
		outline-color: #ffffff50;
	}
</style>
