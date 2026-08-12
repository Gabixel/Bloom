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
	import { cconsole } from "../../logger.svelte";

	let navidromeUrl = $state("");
	let user = $state(""),
		pass = $state("");

	// TODO: check if logged in?
	onMount(() => {
		let previousNavidromeUrl = localStorage.getItem("nd_url");

		if (previousNavidromeUrl != null) {
			navidromeUrl = previousNavidromeUrl;
		}
	});

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		// TODO: actually store it only after login.
		// Split this logic for the login
		setNavidromeUrl(navidromeUrl);

		cconsole.log("Logging in @", navidromeUrl, "with username", user, "…");

		const r = await login(user, pass);
		if ("error" in r) {
			cconsole.log(r.error);
		} else {
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
