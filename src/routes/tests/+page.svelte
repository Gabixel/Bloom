<script lang="ts">
	import { setSSE, sse, testEvents } from "$lib/navidrome.svelte";
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

		if (sse != null) {
			return;
		}

		let eventsUrl = testEvents();
		const es = new EventSource(eventsUrl);

		setSSE(es);

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
			cconsole.log("[SSE] KEEP ALIVE", event.data);
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
	});
</script>

<div>test</div>
