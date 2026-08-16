<script lang="ts">
	import {
		AudioPlayer,
		getStatus,
		listenAudioEvents,
		pauseTrack,
		playTrack,
		resumeTrack,
	} from "$lib/audio-player.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import { GGCAudio } from "@gabigroup/capacitor-audio-player";
	import { onMount } from "svelte";

	let {
		audioPlayer,
	}: {
		audioPlayer: AudioPlayer | null;
	} = $props();

	let trackState = "unknown";

	let trackData = $state({
		title: "",
		artist: "",
		currentTime: 0,
		duration: 0,
	});

	onMount(() => {
		listenAudioEvents();

		GGCAudio.addListener("playbackStateChange", (status) => {
			updateTrackData(status);
		});
	});

	function updateTrackData(newData: any) {
		if (newData.currentTrack!.title != trackData.title) {
			trackData.title = newData.currentTrack!.title!;
		}
		if (newData.currentTrack!.artist != trackData.artist) {
			trackData.artist = newData.currentTrack!.artist!;
		}

		if (newData.position != trackData.currentTime) {
			trackData.currentTime = newData.position;
		}
		if (newData.duration != trackData.duration) {
			trackData.duration = newData.duration;
		}

		trackState = newData.playbackState;
	}
</script>

<footer>
	<div class="track-cover"></div>

	<div class="track-info">
		<p class="track-name">
			<span>{trackData.title}</span>
		</p>
		<span class="track-extra">
			<p class="track-artist">{trackData.artist}</p>
			<p>
				{Math.floor(trackData.currentTime / 1000)} | {Math.floor(
					trackData.duration / 1000,
				)}
			</p>
		</span>
	</div>
	<div class="actions">
		<button
			disabled={trackState != "paused" && trackState != "playing"}
			type="button"
			style="font-size:1.5rem"
			onclick={() => {
				switch (trackState) {
					case "playing":
						pauseTrack().then(() => {
							updateTrackData(getStatus());
						});
						break;
					case "paused":
						resumeTrack().then(() => {
							updateTrackData(getStatus());
						});
						break;
				}
			}}
		>
			{trackState != "playing" ? "Play" : "Pause"}
		</button>
	</div>
</footer>

<style>
	footer {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: stretch;
		margin-top: auto;

		z-index: 900;

		background: #1a1a1a;
	}
	.track-cover,
	.track-info {
		height: auto;
	}

	.track-info .track-extra {
		font-size: 0.75rem;
	}

	.track-cover {
		aspect-ratio: 1 / 1;
		background-color: #00000020;
	}

	.track-info {
		padding-right: 3rem;
	}

	/* keep rendering when paragraphs are empty */
	.track-info p::before {
		content: "";
		display: inline-block;
		width: 0px;
	}

	.actions {
		height: auto;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}
</style>
