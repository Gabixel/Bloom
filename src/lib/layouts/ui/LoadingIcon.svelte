<script lang="ts">
	import icon from "$lib/assets/loading-note.svg?raw";

	let { style }: { style?: string } = $props();
</script>

<div {style}>
	{@html icon}
</div>

<style>
	div {
		aspect-ratio: 1 / 1;
		max-width: min(10vw, 10%);
		opacity: 0;
		animation: wait-for-fade 0.45s ease 0.75s normal forwards;
	}

	div :global(svg) {
		width: 100%;
		height: 100%;
	}

	@keyframes wait-for-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
