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
		max-width: 15vw;
		opacity: 0;
		--wait: 0.75s;
		animation: wait-for-fade 0.45s ease var(--wait) normal forwards;
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
