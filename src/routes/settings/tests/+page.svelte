<script lang="ts">
	import { placeholder_sse, getEventsUrl } from "$lib/navidrome.svelte";
	import {
		SystemBars,
		SystemBarsStyle,
		SystemBarType,
	} from "@capacitor/core";
	import { onMount } from "svelte";
	import { cconsole } from "$lib/logger.svelte";

	onMount(() => {
		cconsole.log(SystemBars);
		cconsole.log(SystemBarsStyle);
		cconsole.log(SystemBarType);
	});

	function testServerSentEvents() {
		if (placeholder_sse.getValue() != null) {
			return;
		}

		let eventsUrl = getEventsUrl();
		const es = new EventSource(eventsUrl);

		placeholder_sse.setValue(es);

		es.onopen = () => {
			cconsole.log("[SSE] OPEN");
		};
		es.onmessage = (event) => {
			cconsole.log("[SSE] MESSAGE", event.data);
		};
		es.onerror = (error) => {
			cconsole.error("[SSE] ERROR", error);
		};

		es.addEventListener("keepAlive", (event) => {
			console.log("[SSE] KEEP ALIVE", event.data);
		});
		es.addEventListener("serverStart", (event) => {
			cconsole.log("[SSE]", event.data);
		});
		let scanning = false;
		es.addEventListener("scanStatus", (event) => {
			let data = JSON.parse(event.data);

			if (data.scanning != scanning) {
				scanning = data.scanning;
				cconsole.log(
					`[SSE] Scanning ${scanning ? "started" : "finished"}`,
				);
			} else {
				return;
			}
		});
	}
</script>

<button onclick={testServerSentEvents}> Test Server-Sent Events stream </button>

{#if placeholder_sse.getValue() != null}
	<button
		onclick={() => {
			placeholder_sse.getValue()!.close();
			placeholder_sse.setValue(null);
		}}>Close server events</button
	>
{/if}
