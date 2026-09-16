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
	import { authData } from "$lib/auth.svelte";
	import { page } from "$app/state";

	let {
		audioPlayer,
	}: {
		audioPlayer: AudioPlayer | null;
	} = $props();

	let trackState = $state("unknown");

	let trackData = $state({
		title: "",
		artist: "",
		currentTime: 0,
		duration: 0,
	});

	onMount(() => {
		import("$lib/layouts/player/player-style.css").then(() => {
			// window.addEventListener("load", () => {
			// document.fonts.ready.then(() => {
			(async () => {
				let stuff = await import("$lib/layouts/player/player-script");

				stuff.onMount();
			})();
			// });
			// });
		});

		// listenAudioEvents();

		// GGCAudio.addListener("playbackStateChange", (status) => {
		// 	updateTrackData(status);
		// });
	});

	// function updateTrackData(newData: any) {
	// 	// TODO: check plugin, currentTrack seems to be null when pausing/resuming
	// 	if (
	// 		newData.currentTrack != null &&
	// 		newData.currentTrack.title != trackData.title
	// 	) {
	// 		trackData.title = newData.currentTrack.title;
	// 	}
	// 	if (
	// 		newData.currentTrack != null &&
	// 		newData.currentTrack.artist != trackData.artist
	// 	) {
	// 		trackData.artist = newData.currentTrack.artist;
	// 	}

	// 	if (newData.position != trackData.currentTime) {
	// 		trackData.currentTime = newData.position;
	// 	}
	// 	if (newData.duration != trackData.duration) {
	// 		trackData.duration = newData.duration;
	// 	}

	// 	trackState = newData.playbackState;
	// }

	function getAriaCurrentPage(path: typeof page.route.id) {
		return page.route.id === path ? "page" : undefined;
	}
</script>

<aside class="bottom-dock-container">
	<div class="player-shadow"></div>
	<aside class="audio-player-overlay">
		<footer class="mini-player">
			<div class="player-bg"></div>
			<div class="data-and-cover">
				<!-- ::before -->
				<div class="player-cover-dark-bg"></div>
				<div class="player-blurred-cover-progress">
					<div class="progress-transform">
						<div class="blurred-image">
							<!-- ::before -->
							<!-- ::after -->
						</div>
					</div>
				</div>
				<div class="track-data">
					<div class="track-text-lines">
						<div class="line-track">
							<p class="track-name"></p>
						</div>
						<div class="line-track">
							<p class="track-artist"></p>
						</div>
					</div>
					<button
						id="player-state-button"
						class="player-block-switch-drag"
					>
						<!-- <div>
							<i class="material-symbols-outlined fill"
								>play_arrow</i
							>
						</div> -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							height="24px"
							width="24px"
							viewBox="0 -960 960 960"
							fill="#e3e3e3"
							><path
								d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"
							/></svg
						>
					</button>
				</div>
				<!-- ::after -->
			</div>
			<!-- ::after -->
		</footer>

		<div class="inner">
			<div class="fullscreen-player">
				<p>Track title</p>
				<p>Track artist</p>

				<!--<input
          type="range"
          min="0"
          max="1"
          step="1"
          class="player-inner-interactible player-timeline"
        />-->
				<div
					id="range-slider-1"
					class="player-inner-interactible"
				></div>
			</div>

			<div class="more-stuff">
				<div class="card">
					<div>Lorem ipsum</div>
					<div>Dolor sit amet</div>
					<div>
						Lorem ipsum is a dummy or placeholder text commonly used
						in graphic design, publishing, and web development. It
						is typically a corrupted version of De finibus bonorum
						et malorum, a 1st-century BC text by the Roman statesman
						and philosopher Cicero, with words altered, added, and
						removed to make it nonsensical and improper Latin. The
						first two words are the truncation of dolorem ipsum
						("pain itself"). Lorem ipsum's purpose is to permit a
						page layout to be designed, independently of the copy
						that will subsequently populate it, or to demonstrate
						various fonts of a typeface without meaningful text that
						could be distracting.
					</div>
				</div>
			</div>

			<div class="touch-proxy"></div>
		</div>
	</aside>
	<nav
		id="app-navigation"
		data-sveltekit-replacestate={!authData.isLoggedIn()}
	>
		<a
			href="/"
			class="navigation-btn active"
			aria-current={getAriaCurrentPage("/")}
			draggable="false"
		>
			Home
		</a>
		<a
			href="#/search"
			style="opacity:0.6"
			class="navigation-btn active"
			aria-current={getAriaCurrentPage("/search")}
			draggable="false"
		>
			Search
		</a>
		<a
			href="#/library"
			class="navigation-btn active"
			aria-current={getAriaCurrentPage("/library")}
			draggable="false"
		>
			Library
		</a>
		<a
			href="#/stations"
			class="navigation-btn active"
			aria-current={getAriaCurrentPage("/stations")}
			draggable="false"
		>
			Radios
		</a>
		<!-- <a
			href="#/user-settings"
			style="opacity:0.6"
			class="navigation-btn active"
			aria-current={getAriaCurrentPage("/user-settings")}
			draggable="false"
		>
			Settings
		</a> -->
		<a
			href="#/tests"
			style="color:orange"
			class="navigation-btn active"
			aria-current={getAriaCurrentPage("/tests")}
			draggable="false"
		>
			Tests
		</a>
	</nav>
</aside>

<style>
	/*footer {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: stretch;
		margin-top: auto;

		z-index: 100;

		background: #1a1a1a;

		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
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

	/* keep rendering when paragraphs are empty * /
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
	}*/
</style>
