<script lang="ts">
	import {
		AudioPlayer,
		listenAudioEvents,
		getStatus,
	} from "$lib/audio-player.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import { onMount } from "svelte";

	let {
		audioPlayer,
	}: {
		audioPlayer: AudioPlayer | null;
	} = $props();

	let currentTime = $state(0);
	let duration = $state(0);

	let trackData = $state({
		title: "",
		artist: "",
	});

	onMount(() => {
		listenAudioEvents();

		setInterval(() => {
			getStatus();
		}, 50000);
	});
</script>

<footer>
	<div class="track-cover"></div>

	<div class="track-info">
		<p class="track-name">
			<span>{trackData.title}</span>
		</p>
		<p class="track-extra">
			<span class="track-artist">{trackData.artist}</span>
			{#if duration > 0}
				<br />
				<span>
					{currentTime} | {duration}
				</span>
			{/if}
		</p>
	</div>
	<!-- <div class="actions">
		<button
			type="button"
			onclick={() => {
				trackInfo.pauseOrResume();
			}}
		>
			{trackInfo.getIsPlaying() ? "Pause" : "Play"}
		</button>
	</div> -->
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

	.actions {
		height: auto;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
	}
</style>
