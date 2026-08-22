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

	let logging = $state(false);
	let errorMessage = $state("");

	let showPsw = $state(false);

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

		logging = true;
		errorMessage = "";

		const r = await login(fieldUrl, fieldUser, fieldPass);
		if ("error" in r) {
			cconsole.log(r.error);
			errorMessage = r.error;
		} else {
			setNavidromeUrl(fieldUrl);
			storeLoginData(fieldUrl, fieldUser, fieldPass);

			// TODO: improve (also for the jwt case)
			storeUser({
				...(r as any),
			});
		}

		logging = false;
	}
</script>

<form class="login-form" onsubmit={onSubmit} autocomplete="on">
	<h2>Welcome to Bloom!</h2>

	<fieldset disabled={logging}>
		<input
			class="txt"
			name="username"
			bind:value={fieldUser}
			placeholder="Username"
			autocomplete="nickname"
			spellcheck="false"
			autocapitalize="none"
		/>

		<input
			class="txt"
			name="password"
			bind:value={fieldPass}
			type={showPsw ? "text" : "password"}
			placeholder="Password"
			autocomplete="current-password webauthn"
			spellcheck="false"
		/>
		<label
			><input type="checkbox" bind:checked={showPsw} />
			<span>Show password</span></label
		>

		<input
			class="txt"
			name="url"
			list="login-url-list"
			bind:value={fieldUrl}
			type="url"
			placeholder="URL"
			autocomplete="url"
			spellcheck="false"
		/>

		<button>Login</button>

		<p>{errorMessage}</p>

		<datalist id="login-url-list">
			{#each prevUrls as url, i (i)}
				<option value={url}></option>
			{/each}
			<option value="http://192.168.1."></option>
		</datalist>
	</fieldset>
</form>

<style>
	.login-form {
		width: min(80%, 20rem);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: stretch;

		gap: 1rem;

		text-align: center;

		height: 100%;
	}

	fieldset {
		/* bit of a hack */
		display: contents;
	}

	input[type="url"] {
		font-family: monospace, monospace;
	}

	.login-form input,
	.login-form button {
		width: auto;
	}
	.login-form input {
		padding: 0.5rem;
	}
	.login-form button {
		padding: 1rem 0.5rem;

		background-color: var(--bloom-theme);
		color: #000;
		font-weight: bold;
		letter-spacing: 1px;
		text-transform: uppercase;

		cursor: pointer;
	}

	.login-form .txt {
		border: 2px solid var(--bloom-theme);
	}
	.login-form .txt:disabled {
		border: 2px solid var(--bloom-theme-dark);
	}

	.login-form label {
		width: max-content;
	}
</style>
