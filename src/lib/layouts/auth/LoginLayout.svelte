<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { replaceState } from "$app/navigation";

	let {} = $props();

	import {
		login,
		authFetch,
		setNavidromeUrl,
		navidromeData,
	} from "$lib/navidrome.svelte";
	import { storeUser } from "$lib/auth.svelte";
	let navidromeUrl = $state("");
	let user = $state(""),
		pass = $state(""),
		msg = $state("");

	// TODO: check if logged in?
	onMount(() => {
		let previousNavidromeUrl = localStorage.getItem("nd_url");

		if (previousNavidromeUrl != null) {
			navidromeUrl = $state.snapshot(navidromeData.navidromeBaseUrl());
		}
	});

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		setNavidromeUrl(navidromeUrl);

		const r = await login(user, pass);
		if ("error" in r) msg = r.error;
		else {
			msg = `Logged in as ${r.name}`;

			// TODO: improve (also for the jwt case)
			storeUser({
				...(r as any),
			});
		}
	}
</script>

<form onsubmit={onSubmit} autocomplete="on">
	<input
		bind:value={navidromeUrl}
		type="url"
		placeholder="url"
		autocomplete="url"
		spellcheck="false"
	/>
	<input
		bind:value={user}
		placeholder="username"
		autocomplete="nickname"
		spellcheck="false"
		autocapitalize="none"
	/>
	<input
		bind:value={pass}
		type="password"
		placeholder="password"
		autocomplete="current-password webauthn"
		spellcheck="false"
	/>
	<button>Login</button>
</form>
