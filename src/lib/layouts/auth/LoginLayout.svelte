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
		storeLoginData,
	} from "$lib/navidrome.svelte";
	import { storeUser } from "$lib/auth.svelte";
	import { cconsole } from "../../logger.svelte";

	let fieldUrl = $state("");
	let fieldUser = $state(""),
		fieldPass = $state("");

	let prevUrls: string[] = $state([]);

	// TODO: check if logged in?
	onMount(() => {
		let prevUrl = localStorage.getItem("nd_url");
		if (prevUrl != null) {
			fieldUrl = prevUrl;
		}

		let prevUsername = localStorage.getItem("nd_username");
		if (prevUsername != null) {
			fieldUser = prevUsername;
		}

		let prevPassword = localStorage.getItem("nd_password");

		if (prevPassword != null) {
			fieldPass = prevPassword;
		}

		let prevLinks = JSON.parse(
			localStorage.getItem("nd_prev_urls") ?? "[]",
		);

		if (Array.isArray(prevLinks)) {
			prevUrls = [...prevLinks];
		}
	});

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		cconsole.log("Logging in @", fieldUrl, "with username", fieldUser, "…");

		const r = await login(fieldUrl, fieldUser, fieldPass);
		if ("error" in r) {
			cconsole.log(r.error);
		} else {
			setNavidromeUrl(fieldUrl);
			storeLoginData(fieldUrl, fieldUser, fieldPass);

			// TODO: improve (also for the jwt case)
			storeUser({
				...(r as any),
			});
		}
	}
</script>

<form class="login-form" onsubmit={onSubmit} autocomplete="on">
	<input
		name="username"
		bind:value={fieldUser}
		placeholder="Username"
		autocomplete="nickname"
		spellcheck="false"
		autocapitalize="none"
	/>
	<input
		name="password"
		bind:value={fieldPass}
		type="password"
		placeholder="Password"
		autocomplete="current-password webauthn"
		spellcheck="false"
	/>
	<input
		name="url"
		list="login-url-list"
		bind:value={fieldUrl}
		type="url"
		placeholder="URL"
		autocomplete="url"
		spellcheck="false"
	/>

	<button>Login</button>

	<datalist id="login-url-list">
		{#each prevUrls as url (url)}
			<option value={url}></option>
		{/each}
		<option value="http://192.168.1."></option>
	</datalist>
</form>

<style>
	.login-form {
		width: 80%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;

		gap: 1rem;
	}

	.login-form > * {
		width: auto;

		padding: 0.5rem;
	}
</style>
