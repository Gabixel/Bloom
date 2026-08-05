<script lang="ts">
	import { SplashScreen } from "@capacitor/splash-screen";
	import { navigating, page } from "$app/state";
	import { authData, destroyUserData } from "$lib/auth.svelte";
	import LoginLayout from "$lib/layouts/auth/LoginLayout.svelte";
	import type { LayoutData } from "./$types.d.ts";
	import { onMount, untrack, type Snippet } from "svelte";
	import { goto, replaceState } from "$app/navigation";

	import { jwtTranslate, storeUser } from "$lib/auth.svelte";
	import { setNavidromeUrl } from "$lib/navidrome.svelte";
	// import {
	// 	deleteAudioPlayer,
	// 	storeAudioPlayer,
	// } from "../lib/audio-player.svelte";
	import { cconsole, setupCustomLogger } from "$lib/logger.svelte";
	import { Capacitor } from "@capacitor/core";

	import { App as CapacitorApp } from "@capacitor/app";
	import { Keyboard } from "@capacitor/keyboard";
	import UIPlayer from "$lib/layouts/player/UIPlayer.svelte";

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
		setupCustomLogger();

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

	onMount(() => {
		SplashScreen.hide({
			fadeOutDuration: 200,
		});

		Keyboard.addListener("keyboardWillShow", (info) => {
			cconsole.log("keyboard will show with height:", info.keyboardHeight);
		});

		Keyboard.addListener("keyboardDidShow", (info) => {
			cconsole.log("keyboard did show with height:", info.keyboardHeight);
		});

		Keyboard.addListener("keyboardWillHide", () => {
			cconsole.log("keyboard will hide");
		});

		Keyboard.addListener("keyboardDidHide", () => {
			cconsole.log("keyboard did hide");
		});
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
	<div id="main-inner">
		{@render children()}
	</div>

	<!--<div style="background-color:#00000010">
		Music player<br />
		<audio bind:this={audioElement} controls></audio>
	</div>-->
	<UIPlayer audioPlayer={null}></UIPlayer>
{:else}
	<LoginLayout></LoginLayout>
{/if}

<div id="js-console" bind:this={jsConsoleDiv} class="hidden" style="">
	{#each cconsole.logList() as log}
		<p
			class={(() => {
				// get piece before first comma ("log", "debug", etc.)
				return log.match(/^[^,]*/)![0];
			})()}
		>
			<span style="white-space: pre;"
				>[{log.match(/^[^,]*/)![0].toUpperCase()}]
			</span>
			{(() => {
				/* remove everything before first comma */
				return JSON.stringify(log.replace(/^.*?,\s*/, ""));
			})()}
		</p>
	{/each}
</div>

<style>
	#js-console {
		position: fixed;
		z-index: 999;
		color: #fff;
		overflow: clip;
		font-family: monospace, monospace;
		font-size: 0.6rem;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.95;
		background-color: #000000aa;
		pointer-events: none;
		user-select: none;

		white-space: break-spaces;
		word-break: break-all;
		word-break: break-word;
	}
	#js-console.hidden {
		display: none;
	}

	#js-console {
		padding: 0.25rem;
	}

	#js-console p {
		margin: 0;
		margin-bottom: 0.2rem;
		padding: 0.15rem 0;
		border: 1px solid rgba(var(--theme), 1);
		background-color: rgba(var(--theme), 0.1);
	}
	#js-console p span {
		color: rgba(var(--theme), 1);
		font-weight: bold;
	}

	#js-console p.info {
		--theme: 46, 98, 219;
	}
	#js-console p.debug {
		--theme: 112, 146, 181;
	}
	#js-console p.log {
		--theme: 22, 178, 181;
	}
	#js-console p.error {
		--theme: 235, 64, 52;
	}
	#js-console p.warn {
		--theme: 191, 112, 15;
	}
	#js-console p.trace {
		--theme: 191, 178, 163;
	}

	:global(:root, html, body) {
		font-size: 100%;
	}

	:global(input),
	:global(button) {
		font-size: 1rem;
		font-family: inherit;
		border: none;
	}

	:global(footer) {
		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
	}

	:global(:root, html, body) {
		padding: 0;
		margin: 0;
		height: 100%;
		min-height: 100lvh;
	}

	:global(body, body *) {
		box-sizing: border-box;
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;
	}

	#main-inner {
		padding: 1rem;
	}
</style>
