<script lang="ts">
	import { page } from "$app/state";
	import type { PageProps } from "./$types.ts";
	import {
		authFetch,
		CLIENT_NAME,
		CLIENT_NAME_URL,
		getSubsonicApiPath,
		navidromeData,
		TEST_FETCH_TARGET_ADDRESS_SPACE,
	} from "$lib/navidrome.svelte";
	import { authData } from "$lib/auth.svelte";
	import { playTrack } from "$lib/audio-player.svelte";
	import { cconsole } from "$lib/logger.svelte";
	// import AlbumImage from "$lib/layouts/music/AlbumImage/AlbumImage.svelte";
	// import { AlbumIntersectionObserver } from "$lib/album-search.svelte";
	import { Capacitor } from "@capacitor/core";
	import LoadingIcon from "$lib/layouts/ui/LoadingIcon.svelte";
	import { untrack } from "svelte";

	// let { data }: PageProps = $props();

	let user = authData.userData();

	let errorMessage = $state("");

	let playlistId: string | null = page.params.playlist_id || null;

	let playlistData: any = $state(null);
	// let playlistTracks: any[] | null = $state(null);

	let songList: any[] = $state([])!;

	// let highestTrackNumberOfDiscs = $state([]);

	let isAnyTrackNumbered = $state(false);

	$effect.pre(() => {
		if (playlistId == null || playlistId === "") {
			throwError("No playlist provided");
			return;
		}

		untrack(() => {
			if (errorMessage != "") {
				return;
			}

			authFetch(`/api/playlist/${playlistId}`).then((data) => {
				if (page.params.playlist_id != playlistId) {
					return;
				}

				if (data == null) {
					throwError("Data is empty");
					return;
				}

				data.json().then((response) => {
					console.log("playlist data:", response);

					if (response["error"] != null) {
						throwError(response["error"].message);
						return;
					}

					if (typeof response == "undefined") {
						throwError("Album data is malformed/empty");
						return;
					}

					// albumData = response["album"];
					playlistData = response;

					// Get tracks
					// TODO: unsure about the redundant id usage (from Navidrome)
					// TODO: extend start/end range (virtual scroll?)
					authFetch(`/api/playlist/${playlistId}/tracks?_start=0&_end=100&_order=ASC&_sort=id&playlist_id=${playlistId}`).then((response) => {
						if (page.params.playlist_id != playlistId) {
							return;
						}

						if (!response) {
							return;
						}

						response.json().then((data) => {
							// playlistTracks = data;
							songList = data;
							console.log("playlist song list:", $state.snapshot(songList));
						});
					});
				});
			});
		});
	});

	function throwError(message: string) {
		errorMessage = message;
		cconsole.error(message);
	}

	async function playAudio(
		audioId: string,
		trackData: {
			id: string;
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

		let url = getSubsonicApiPath(
			`/rest/stream.view?${streamParams.toString()}`,
		);

		let lrcUrl = getSubsonicApiPath(
			`/rest/getLyricsBySongId.view?${lrcParams.toString()}&id=${audioId}&f=json`,
		);

		if (Capacitor.getPlatform() === "web") {
			return;
		}

		printDebugLyrics(lrcUrl);

		playTrack(url, {
			...trackData,
			// TODO: improve
			image:
				`${navidromeData.navidromeBaseUrl()}/rest/getCoverArt?id=${trackData.id}&u=${user.username}&v=1.16.1&c=${CLIENT_NAME_URL}` +
				`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json&size=400&square=true`,
		});
	}

	async function printDebugLyrics(lrcUrl: string) {
		try {
			let data = await fetch(lrcUrl, {
				...TEST_FETCH_TARGET_ADDRESS_SPACE,
				priority: "low",
			});

			if (!data.ok) {
				return null;
			}

			let result = await data.json();

			let resultList =
				result["subsonic-response"]["lyricsList"]["structuredLyrics"];

			if (resultList.length == 0) {
				cconsole.log("resultList is empty");
				return null;
			}

			cconsole.log("existing lyrics and synced?", resultList[0].synced);

			if (!resultList[0].synced) {
				return null;
			}

			return resultList[0];
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
	{#if playlistData != null}
		<title>Playlist "{playlistData.name}" &#183; Bloom</title>
	{:else}
		<title>(Playlist loading) &#183; Bloom</title>
	{/if}
</svelte:head>

{#snippet albumDetails()}
	<h1 style="font-weight:bold;text-rendering:optimizeLegibility;">
		{playlistData.name}
	</h1>
	<!-- TODO: display playlist author -->
	<!-- TODO: display creation date? -->
	<p
		style="display: flex; flex-direction: row; justify-content: center; gap: 0.5ch"
	>
		{#if playlistData.duration != null}
			<span>{formatDuration(Math.round(playlistData.duration))}</span>
		{/if}
	</p>
	{#if playlistData.comment && playlistData.comment != ""}
		<p style="font-size: 0.9em">
			{playlistData.comment}
		</p>
	{/if}
{/snippet}

{#snippet track(songEntry: any)}
	<div class="track-item">
		<div class="track-text">
			<!--{#if isAnyTrackNumbered}-->
			<span style="font-weight:bold;white-space:nowrap;">
				{songEntry.id ?? "--"}
			</span>

			<div
				style="margin: 0 1rem; display: flex; flex-direction:column; justify-content: flex-start; align-items: flex-start"
			>
				<span>
					<span>{songEntry.title}</span>
					{#if songEntry.explicitStatus === "explicit"}
						<span class="explicit" aria-label="Explicit track"
							>E</span
						>
					{/if}
				</span>
				<span style="font-size:0.8em;color:#ffffff80"
					>{songEntry.artist}</span
				>
				<span style="font-size:0.7em;color:#ffffff80"
					>{#if songEntry.duration != null}
						<!-- TODO: wtf is happening to duration here without rounding (same to playlist's total one) -->
						<span>{formatDuration(Math.round(songEntry.duration))}</span>
					{/if}
					<span>- {getAudioQuality(songEntry)}</span>
				</span>
			</div>
		</div>
		<button
			class="track-play-btn"
			aria-label={`Play track: "${songEntry.title}"`}
			onclick={() => {
				playAudio(
					songEntry.id,
					{
						id: songEntry.id,
						title: songEntry.title,
						artist: songEntry.artist,
						// albumTitle: albumData.name,
						albumTitle: "",
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
			}}
		>
			<span>&vellip;</span>
		</button>
	</div>
{/snippet}

{#if errorMessage != ""}
	<p style="margin:1rem;text-align:center;">{errorMessage}</p>
{:else if playlistData == null}
	<LoadingIcon></LoadingIcon>
{/if}

{#if playlistData != null}
	<div>
		<div class="album-details">
			<!-- <AlbumImage
				albumId={albumData.id}
				albumName={albumData.name}
				coverArtId={albumData.id}
				albumImageSize={null}
				albumRequestSize={Math.min(
					window.innerHeight,
					window.innerWidth,
				)}
				intersectionObserver={AlbumIntersectionObserver}
			></AlbumImage> -->
			<div style="margin: 0.5rem 0.5rem 0;">
				{@render albumDetails()}
			</div>
		</div>

		<div class="tracks">
			<!-- TODO: an eye toggle to expand info (in various stages) -->
			<!-- TODO: paginate or something -->
			{#each songList as songEntry, i (songEntry.id)}
				{@render track(songEntry)}
			{/each}
		</div>
	</div>
{/if}

<style>
	p {
		margin: 0;
	}

	.album-details {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;

		text-align: center;

		margin-bottom: 1rem;
		padding: 1rem;
	}

	.album-details :global(.album-image-wrapper) {
		overflow: hidden;
		border-radius: 0.8rem;
		max-width: 260px;
	}

	.explicit {
		display: inline-block;
		font-weight: bold;
		background-color: #ffffff30;
		color: #fff;
		font-size: 0.7em;
		padding: 0.3rem 0.4em;
		line-height: 1;
		border-radius: 0.4em;
	}

	.tracks .track-item {
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

	.tracks .track-item .track-text {
		position: relative;
		pointer-events: none;
		z-index: 10;

		display: flex;
		justify-content: flex-start;
		align-items: center;

		margin: auto 0;
		padding: 1rem;
	}

	.tracks .track-item button.track-settings-btn {
		z-index: 10;
		display: block;

		font-size: 1.4em;

		appearance: none;
		border: 0;

		margin: 0;
		margin-left: auto;

		cursor: pointer;

		background: none;

		padding: 0.5rem 1rem;
	}

	button.track-settings-btn span {
		vertical-align: 1;
	}

	.tracks .track-item button.track-play-btn {
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

	.tracks .track-item:nth-child(odd) button.track-play-btn {
		background-color: #00000020;
	}

	.tracks .track-item button.track-play-btn {
		outline: 2px solid #ffffff00;
	}
	.tracks .track-item button.track-play-btn:not(:hover):not(:focus-visible) {
		transition: outline-color 0.45s ease;
	}
	.tracks .track-item button.track-play-btn:hover,
	.tracks .track-item button.track-play-btn:focus-visible {
		transition-duration: 0;
	}

	.tracks .track-item button.track-play-btn:hover {
		outline-color: #ffffff20;
	}
	.tracks .track-item button.track-play-btn:focus-visible {
		outline-color: #ffffff50;
	}
</style>
