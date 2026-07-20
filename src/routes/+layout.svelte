<script lang="ts">
	import { navigating, page } from "$app/state";
	import { authData, destroyUserData } from "../lib/auth.svelte.ts";
	import LoginLayout from "$lib/layouts/LoginLayout.svelte";
	import type { LayoutData } from "./$types.d.ts";
	import { onMount, untrack, type Snippet } from "svelte";
	import { goto, replaceState } from "$app/navigation";

	import { jwtTranslate, storeUser } from "$lib/auth.svelte";
	import { setNavidromeUrl } from "../lib/navidrome.svelte.ts";
	// import {
	// 	deleteAudioPlayer,
	// 	storeAudioPlayer,
	// } from "../lib/audio-player.svelte";
	import { cconsole } from "../lib/logger.svelte";
	import { Capacitor } from "@capacitor/core";

	import { App as CapacitorApp } from "@capacitor/app";
	CapacitorApp.addListener("backButton", ({ canGoBack }) => {
		if (!canGoBack) {
			CapacitorApp.exitApp();
		} else {
			window.history.back();
		}
	});

	// "[...] and you have to make sure that the links in your app all start with `#/`"

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	cconsole.log("Hello from layout.svelte");

	let jsConsoleDiv: HTMLDivElement = $state()!;

	let _location = $state(location);

	let audioElement: HTMLAudioElement = $state()!;
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

	/*$effect(() => {
		if (authData.isLoggedIn()) {
			storeAudioPlayer(audioElement);
		} else {
			deleteAudioPlayer();
		}
	});*/

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

	//#region mca
	// https://webapi.streaming.dolby.com/v0_9/help_files/topics/checking_immersive_capability.html
	async function Mca() {
		let mediaConfig: any = {
			type: "media-source",
			audio: {
				contentType: "audio/mp4;codecs=ec-3",
				channels: 16,
				spatialRendering: true,
			},
		};

		let mediacap: any = {
			results: null,
			message: "n/a",
		};

		if ("mediaCapabilities" in navigator) {
			mediacap.results =
				await navigator.mediaCapabilities.decodingInfo(mediaConfig);
			mediacap.message = (mediacap.results.supported ? "" : "not ") + "supported";
		}

		return mediacap;
	}

	let pMediaCapResult = $state("");

	Mca().then((value) => (pMediaCapResult = value.message));
	//#endregion
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
	<button
		type="button"
		onclick={() => {
			jsConsoleDiv.classList.toggle("hidden");
		}}>Toggle console</button
	>
</nav>

<p>
	page url pathname: "{page.url.pathname}"<br />
	location hash: "{_location.hash}"<br />
	page state: "{JSON.stringify(page.state)}"<br />
	page route id: "{page.route.id}"<br />
	isLoggedIn: {String(authData.isLoggedIn())}<br />
	dolbySupportStatus: {pMediaCapResult}
</p>

{#if authData.isLoggedIn()}
	{@render children()}

	<!--<div style="background-color:#00000010">
		Music player<br />
		<audio bind:this={audioElement} controls></audio>
	</div>-->
{:else}
	<LoginLayout></LoginLayout>
{/if}

<div id="js-console" bind:this={jsConsoleDiv} class="hidden" style="">
	{#each cconsole.logList() as log}
		<p>{JSON.stringify(log)}</p>
	{/each}
</div>

<style>
	#js-console {
		position: fixed;
		z-index: 999;
		color: #fff;
		overflow-y: scroll;
		font-family: monospace, monospace;
		font-size: 0.6rem;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.95;
		background-color: #00000070;
		pointer-events: none;
		user-select: none;

		white-space: break-spaces;
		word-break: break-all;
		word-break: break-word;
	}
	#js-console.hidden {
		display: none;
	}
</style>
