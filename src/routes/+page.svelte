<script lang="ts">
	import { navigating, page, updated } from "$app/state";
	import { onMount, untrack } from "svelte";
	import { authData, destroyUserData } from "$lib/auth.svelte";
	import {
		authFetch,
		CLIENT_NAME_URL,
		TEST_FETCH_TARGET_ADDRESS_SPACE,
	} from "$lib/navidrome.svelte";
	import { cconsole } from "$lib/logger.svelte";

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
</script>

<svelte:head>
	<title>Home &#183; Bloom</title>
</svelte:head>

<div style="padding:1rem">
	<p>Welcome <strong>{authData.userData().name}</strong>!</p>

	<button
		type="button"
		style="color:darkred;border-radius:0.25rem;background-color:#ffdddd"
		onclick={async () => {
			destroyUserData();
		}}>logout</button
	>

	{#if false}
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch(
					"/rest/getLicense?u=gabixel&v=1.16.1&c=" +
						CLIENT_NAME_URL +
						"&t=",
					{
						...TEST_FETCH_TARGET_ADDRESS_SPACE,
					},
				);
				if (res == null) return;
				const parser = new DOMParser();

				cconsole.log(
					parser.parseFromString(await res.json(), "application/xml"),
				);
				// cconsole.log(await res.text())
			}}>ping</button
		>
		<button
			type="button"
			onclick={async () => {
				const res = await authFetch(
					"/api/user/" + authData.userData().id,
					{
						...TEST_FETCH_TARGET_ADDRESS_SPACE,
					},
				);
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
	{/if}
</div>
