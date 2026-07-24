<script lang="ts">
	import { AudioPlayer, trackInfo } from "$lib/audio-player.svelte";

	let {
		audioPlayer,
	}: {
		audioPlayer: AudioPlayer | null;
	} = $props();
</script>

<footer>
	<div class="track-cover"></div>

	<div class="track-info">
		<p class="track-name">Test</p>
		<p class="track-extra">Test (time: {trackInfo.getCurrentTime() || "..."} | duration: {trackInfo.getDuration() || "..."})</p>
	</div>
	<div class="actions">
		<button type="button" onclick={() => {
			trackInfo.pauseOrResume();
		}}>Play/Pause</button>
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
