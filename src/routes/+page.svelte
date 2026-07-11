<script lang="ts">
	import { navigating, page, updated } from "$app/state";
	import { onMount } from "svelte";
	import { authData, destroyUserData } from "../lib/auth.svelte.ts";
	import { authFetch } from "../lib/navidrome.svelte.ts";

	console.log("Hello from page.svelte");

	onMount(() => {
		console.log("page.svelte mounted!");
	});

	$effect(() => {
		console.log(authData.userData());
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
				"/rest/getLicense?u=gabixel&v=1.16.1&c=bloom-gabigroup&t=",
			);
			const parser = new DOMParser();

			console.log(parser.parseFromString(await res.text(), "application/xml"));
			// console.log(await res.text())
		}}>ping</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/user/" + authData.userData().id);
			let json = await res.json();
			divOutput.innerText = JSON.stringify(json, null, 2);
		}}>user (me)</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/user");
			let json = await res.json();
			divOutput.innerText = JSON.stringify(json, null, 2);
		}}>user list</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/player/");
			let json = await res.json();
			divOutput.innerText = JSON.stringify(json, null, 2);
		}}>players list</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/transcoding/");
			let json = await res.json();
			divOutput.innerText = JSON.stringify(json, null, 2);
		}}>transcoding list</button
	>
	<button
		type="button"
		onclick={async () => {
			const res = await authFetch("/api/share/");
			if (res.status === 200 || res.ok === true) {
				console.log(await res.json());
			}
		}}>share</button
	>
	<div bind:this={divOutput} style="font-family:monospace,monospace;white-space:pre-line">

	</div>
</div>
