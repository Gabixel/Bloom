<script lang="ts">
	import { authData } from "$lib/auth.svelte";
	import { page } from "$app/state";

	let {
		navigationDock = $bindable(null),
	}: {
		navigationDock: HTMLElement | null;
	} = $props();

	function getAriaCurrentPage(path: typeof page.route.id) {
		return page.route.id === path ? "page" : undefined;
	}
</script>

<nav
	id="app-navigation"
	bind:this={navigationDock}
	data-sveltekit-replacestate={!authData.isLoggedIn()}
	data-sveltekit-preload-code="eager"
>
	<div class="item-flex">
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
	</div>
</nav>

<style>
	#app-navigation {
		position: fixed;
		z-index: 900;

		bottom: 0;
		left: 0;
		right: 0;

		overflow: hidden;

		contain: layout;
		isolation: isolate;

		/*user-select: none;*/

		/*--height: 4em;
		min-height: var(--height);
		height: var(--height);
		max-height: var(--height);*/

		background-color: #000;

		transform-style: flat;

		display: flex;
		flex-direction: row;
		justify-content: stretch;
	}

	:global(body:not(.ui-player-closed)) #app-navigation {
		transform: translateY(calc(100% * var(--ui-player-progress)));
	}

	#app-navigation > .item-flex {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: space-between;
		align-items: center;

		padding: 1rem 1.75rem;
		min-width: min(100%, 800px);

		margin: 0 auto;
	}

	.navigation-btn {
		color: inherit;
		text-decoration: none;
		padding: 0.35rem;
		/*background: orange;*/

		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		gap: 0.25rem;

		-webkit-user-drag: none;
	}
	.navigation-btn span {
		display: inline-block;
		text-align: center;
		font-size: 0.8rem;
		text-transform: capitalize;

		font-weight: 300;
		letter-spacing: 0.5px;
	}
	/*.navigation-btn {
		transform: translate3d(0, 0, 0);
		backface-visibility: hidden;
		font-smooth: always;
		-webkit-font-smoothing: subpixel-antialiased;
		-moz-osx-font-smoothing: grayscale;

		/background-clip: content-box;/
	}*/
	/*.navigation-btn svg {
		height: 1.1rem;
		margin: -0.2rem 0 -0.5rem 0;
		overflow: visible;
		letter-spacing: 0.5rem;
	}*/
</style>
