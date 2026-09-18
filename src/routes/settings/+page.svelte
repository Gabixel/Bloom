<script lang="ts">
	import { settingsData } from "$lib/settings-data.svelte";

	let dimmedLightsSetting = settingsData.getSetting("dimmed_lights");
</script>

<div style="text-align: center;">
	<h1>Settings</h1>

	<fieldset style="max-width: 500px; margin: 0 auto;">
		<legend
			style="background-color: var(--bloom-theme-dark); color: var(--app-bg); font-weight: bold; text-transform: uppercase; padding: 0.25rem;"
		>
			Dimmed lights
		</legend>

		<div>
			<input
				id="toggle-dimmed-lights"
				type="checkbox"
				onchange={(e) => {
					dimmedLightsSetting.enabled =
						(e.target as HTMLInputElement).checked === true;
				}}
				checked={dimmedLightsSetting.enabled}
			/>
			<label for="toggle-dimmed-lights">Enable</label>
		</div>

		{#if dimmedLightsSetting.enabled}
			<input
				type="range"
				min={dimmedLightsSetting.RANGE_MIN}
				max={dimmedLightsSetting.RANGE_MAX}
				step={dimmedLightsSetting.RANGE_STEP}
				value={dimmedLightsSetting.value}
				oninput={(e) => {
					dimmedLightsSetting.value = +(e.target as HTMLInputElement)
						.value;
				}}
			/>
		{/if}
	</fieldset>

	<hr />

	<a href="#/settings/tests" draggable="false">Go to tests &rarr;</a>
</div>

<style>
</style>
