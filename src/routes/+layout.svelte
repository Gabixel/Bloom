<script lang="ts">
	import { navigating, page } from "$app/state";
	import { authData, destroyUserData } from "../lib/auth.svelte.ts";
	import LoginLayout from "$lib/layouts/LoginLayout.svelte";
	import type { LayoutData } from "./$types.d.ts";
	import { onMount, untrack, type Snippet } from "svelte";
	import { goto, replaceState } from "$app/navigation";

	// "[...] and you have to make sure that the links in your app all start with `#/`"

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	console.log("Hello from layout.svelte");

	let _location = $state(location);

	let audioElement: HTMLAudioElement = $state()!;

	import { jwtTranslate, storeUser } from "$lib/auth.svelte";
	import { setNavidromeUrl } from "../lib/navidrome.svelte.ts";
	import {
		deleteAudioPlayer,
		storeAudioPlayer,
	} from "../lib/audio-player.svelte";

	onMount(() => {
		const navidromeToken = localStorage.getItem("nd_token");
		const navidromeSubsonicToken = localStorage.getItem("s_token");
		const navidromeSubsonicSalt = localStorage.getItem("s_salt");

		if (
			navidromeToken != null &&
			navidromeSubsonicToken != null &&
			navidromeSubsonicSalt != null
		) {
			let jwt = jwtTranslate(navidromeToken);
			let expiration = jwt.exp;

			const nowSec = Math.floor(Date.now() / 1000);
			const secondsLeft = Math.max(0, expiration - nowSec);

			if (secondsLeft <= 60 * 5) {
				return;
			}

			const navidromeUrl = localStorage.getItem("nd_url");

			if (navidromeUrl == null) {
				// TODO: is this too much?
				destroyUserData();
				return;
			}

			setNavidromeUrl(navidromeUrl);

			storeUser({
				id: jwt.uid,
				// TODO: hmmm
				name: jwt.sub,
				username: jwt.sub,
				token: navidromeToken,
				subsonicToken: navidromeSubsonicToken,
				subsonicSalt: navidromeSubsonicSalt,
			});
		} else {
			destroyUserData();
		}
	});

	$effect(() => {
		if (authData.isLoggedIn()) {
			storeAudioPlayer(audioElement);
		} else {
			deleteAudioPlayer();
		}
	});

	$effect(() => {
		if (navigating && !authData.isLoggedIn() && page.route.id != "/") {
			untrack(() => {
				// TODO: store here the returning route as query param? (e.g. `?return_to=/album/123`)
				goto("/", {
					// TODO: maybe we can remove this
					replaceState: true,
				});
			});
		}
	});
</script>

<svelte:head>
	<link rel="manifest" href="/app.webmanifest" crossorigin="use-credentials" />
	<!-- <link rel="manifest" href="./app.webmanifest" /> -->
</svelte:head>

<nav>
	<a href="/">Home</a>
	<a href="#/subpage-example">Example</a>
	<a href="#/album">Albums</a>
	<a href="#/about">About</a>
	<a href="#/settings">Settings</a>
</nav>

<p>
	page url pathname: "{page.url.pathname}"<br />
	location hash: "{_location.hash}"<br />
	page state: "{JSON.stringify(page.state)}"<br />
	page route id: "{page.route.id}"<br />
	isLoggedIn: {String(authData.isLoggedIn())}
</p>

{#if authData.isLoggedIn()}
	{@render children()}

	<div style="background-color:#00000010">
		Music player<br />
		<audio bind:this={audioElement} controls></audio>
	</div>
{:else}
	<LoginLayout></LoginLayout>
{/if}
