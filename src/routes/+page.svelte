<script lang="ts">
	import { navigating, page, updated } from "$app/state";
	import { onMount, untrack } from "svelte";
	import { authData, destroyUserData } from "../lib/auth.svelte.ts";
	import { authFetch, CLIENT_NAME_URL } from "../lib/navidrome.svelte.ts";
	import { cconsole } from "../lib/logger.svelte";

	cconsole.log("Hello from page.svelte");

	let userData = authData.userData();

	onMount(() => {
		cconsole.log("page.svelte mounted!");
	});

	$effect(() => {
		let userData = authData.userData();
		untrack(() => {
			cconsole.log(authData.userData());
		});
	});

	let divOutput: HTMLDivElement = $state()!;
</script>

<div>
	<!-- 
		<h1>Welcome to SvelteKit</h1>
		<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
	-->
	<!--
		<h1>Welcome to your library project</h1>
		<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
		<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p> -->

	<!-- <h1>Hello world!</h1> -->

	<p>Welcome {authData.userData().name}!</p>

	<button
		type="button"
		style="color:darkred;border-radius:0.25rem;background-color:#ffdddd"
		onclick={async () => {
			destroyUserData();
		}}>logout</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch(
				"/rest/getLicense?u=gabixel&v=1.16.1&c=" + CLIENT_NAME_URL + "&t=",
			);
			if (res == null) return;
			const parser = new DOMParser();

			cconsole.log(parser.parseFromString(await res.json(), "application/xml"));
			// cconsole.log(await res.text())
		}}>ping</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/user/" + authData.userData().id);
			if (res == null) return;
			let json = res.json();
			cconsole.log(json);
		}}>user (me)</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/user");
			if (res == null) return;
			let json = res.json();
			cconsole.log(json);
		}}>user list</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/player/");
			if (res == null) return;
			let json = res.json();
			cconsole.log(json);
		}}>players list</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/transcoding/");
			if (res == null) return;
			let json = res.json();
			cconsole.log(json);
		}}>transcoding list</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/share/");
			if (res == null) return;
			let json = res.json();
			cconsole.log(json);
		}}>share</button
	>
	<div
		bind:this={divOutput}
		style="font-family:monospace,monospace;white-space:pre-line"
	></div>
</div>
