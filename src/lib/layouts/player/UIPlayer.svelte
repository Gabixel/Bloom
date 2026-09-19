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
		listenAudioEvents();

		GGCAudio.addListener("playbackStateChange", (status) => {
			updateTrackData(status);
		});
	});

	onMount(() => {
		import("$lib/layouts/player/player-style.css").then(() => {
			(async () => {
				let stuff =
					await import("$lib/layouts/player/ui-player.svelte");

				stuff.onMount();
			})();
		});
	});

	function updateTrackData(newData: any) {
		// TODO: check plugin, currentTrack seems to be null when pausing/resuming
		if (
			newData.currentTrack != null &&
			newData.currentTrack.title != trackData.title
		) {
			trackData.title = newData.currentTrack.title;
		}
		if (
			newData.currentTrack != null &&
			newData.currentTrack.artist != trackData.artist
		) {
			trackData.artist = newData.currentTrack.artist;
		}

		if (newData.position != trackData.currentTime) {
			trackData.currentTime = newData.position;
		}
		if (newData.duration != trackData.duration) {
			trackData.duration = newData.duration;
		}

		trackState = newData.playbackState;
	}

	function getAriaCurrentPage(path: typeof page.route.id) {
		return page.route.id === path ? "page" : undefined;
	}
</script>

<div class="player-shadow"></div>
<div class="player-screen-dim"></div>
<div class="bottom-dock-container">
	<aside class="audio-player-overlay">
		<footer class="mini-player">
			<div class="player-bg"></div>
			<div class="data-and-cover">
				<!-- ::before -->
				<div class="player-cover-dark-bg"></div>
				<!-- ↓ hidden, for now -->
				<!-- <div class="player-blurred-cover-progress">
					<div class="progress-transform">
						<div class="blurred-image">
							<!-- ::before -- >
							<!-- ::after -- >
						</div>
					</div>
				</div> -->
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
						<div>
							<!-- <i class="material-symbols-outlined fill"
								>play_arrow</i
							> -->
							{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px" viewBox="0 -960 960 960" fill="#e3e3e3" ><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" /></svg>`}
						</div>
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
		data-sveltekit-preload-code="eager"
	>
		<a
			href="/"
			class="navigation-btn"
			aria-current={getAriaCurrentPage("/")}
			draggable="false"
		>
			<div>
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>`}
			</div>
			<div><span>Home</span></div>
		</a>
		<a
			href="#/search"
			style="opacity:0.6"
			class="navigation-btn"
			aria-current={getAriaCurrentPage("/search")}
			draggable="false"
		>
			<div>
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>`}
			</div>
			<div><span>Search</span></div>
		</a>
		<a
			href="#/library"
			class="navigation-btn"
			aria-current={getAriaCurrentPage("/library")}
			draggable="false"
		>
			<div>
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M500-360q42 0 71-29t29-71v-220h120v-80H560v220q-13-10-28-15t-32-5q-42 0-71 29t-29 71q0 42 29 71t71 29ZM320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/></svg>`}
			</div>
			<div><span>Library</span></div>
		</a>
		<a
			href="#/stations"
			style="opacity:0.6"
			class="navigation-btn"
			aria-current={getAriaCurrentPage("/stations")}
			draggable="false"
		>
			<div>
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M160-80q-33 0-56.5-23.5T80-160v-480q0-25 13.5-45t36.5-29l506-206 26 66-330 134h468q33 0 56.5 23.5T880-640v480q0 33-23.5 56.5T800-80H160Zm0-80h640v-280H160v280Zm231-69q29-29 29-71t-29-71q-29-29-71-29t-71 29q-29 29-29 71t29 71q29 29 71 29t71-29ZM160-520h480v-80h80v80h80v-120H160v120Zm0 360v-280 280Z"/></svg>`}
			</div>
			<div><span>Radios</span></div>
		</a>
		<a
			href="#/settings"
			class="navigation-btn"
			aria-current={getAriaCurrentPage("/settings")}
			draggable="false"
		>
			<div>
				{@html `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>`}
			</div>
			<div><span>Settings</span></div>
		</a>
	</nav>
</div>

<style>
</style>
