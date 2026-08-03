<script lang="ts">
	import { AudioPlayer, trackInfo } from "$lib/audio-player.svelte";

	let {
		audioPlayer,
	}: {
		audioPlayer: AudioPlayer | null;
	} = $props();

	let currentTime = $derived.by(() => {
		let time: string | number = trackInfo.getCurrentTime();

		if (isNaN(time)) {
			time = "...";
		} else {
			time = time.toFixed(0);
		}

		return time;
	});
	let duration = $derived.by(() => {
		let time: string | number = trackInfo.getDuration();

		if (isNaN(time)) {
			time = "...";
		} else {
			time = time.toFixed(0);
		}

		return time;
	});
</script>

<footer>
	<div class="track-cover"></div>

	<div class="track-info">
		<p class="track-name">Test</p>
		<p class="track-extra">
			Test (time: {currentTime} | duration: {duration})
		</p>
	</div>
	<div class="actions">
		<button
			type="button"
			onclick={() => {
				trackInfo.pauseOrResume();
			}}
		>
			{trackInfo.getIsPlaying() ? "Pause" : "Play"}
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
