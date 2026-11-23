<script lang="ts">
	let {
		navigationDock = $bindable(null),
	}: {
		navigationDock: HTMLElement | null;
	} = $props();
</script>

<nav id="app-navigation" bind:this={navigationDock}>test</nav>

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

		--height: 4em;
		min-height: var(--height);
		height: var(--height);
		max-height: var(--height);

		background-color: cornflowerblue;
	}
</style>
