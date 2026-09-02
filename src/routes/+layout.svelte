<script lang="ts">
	import { SplashScreen } from "@capacitor/splash-screen";
	import { navigating, page } from "$app/state";
	import { dev as isSvelteDev, version } from "$app/environment";
	import {
		authData,
		destroyUserData,
		startKeepAliveInterval,
		stopKeepAliveInterval,
		toggleKeepAliveInterval,
	} from "$lib/auth.svelte";
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
	import { derived } from "svelte/store";

	CapacitorApp.addListener("backButton", ({ canGoBack }) => {
		if (!canGoBack) {
			CapacitorApp.exitApp();
		} else {
			window.history.back();
		}
	});

	// "[...] and you have to make sure that the links in your app all start with `#/`"

	function getAriaCurrentPage(path: typeof page.route.id) {
		return page.route.id === path ? "page" : undefined;
	}

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	cconsole.log("Hello from layout.svelte");

	let jsConsoleDiv: HTMLDivElement = $state()!;

	let _location = $state(location);

	let navigatorLANAccess = $state("...");

	let isDocumentHidden = $state(document.hidden);

	$effect(() => {
		toggleKeepAliveInterval(!isDocumentHidden && authData.isLoggedIn());
	});

	// Some setup (debugger, events)
	onMount(() => {
		if ("scrollRestoration" in history) {
			history.scrollRestoration = "manual";
		}

		setupCustomLogger();

		// https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access#local_network_access_permissions
		navigator.permissions
			.query({ name: "local-network" } as any)
			.then((result) => {
				navigatorLANAccess = String(result.state);
			});

		cconsole.log("Capacitor.DEBUG:", Capacitor.DEBUG);
		if (Capacitor.DEBUG === true) {
			cconsole.debug("Capacitor running in debug!");
		} else {
			cconsole.warn("Capacitor NOT running in debug!");
		}

		if (isSvelteDev) {
			cconsole.debug("SvelteKit running in debug!");
		} else {
			cconsole.warn("SvelteKit NOT running in debug!");
			document.body.classList.add("svelte-prod");
		}

		cconsole.log("SvelteKit app version:", version);

		window.addEventListener("beforeunload", () => {
			cconsole.warn("beforeunload called");
		});
	});

	// visibilitychange log
	onMount(() => {
		window.addEventListener("visibilitychange", () => {
			cconsole.log(
				"visibility changed!",
				"\ndocument.hidden:",
				document.hidden,
				"\ndocument.visibilityState:",
				document.visibilityState,
			);
			isDocumentHidden = document.hidden;
		});
	});

	// Android Capacitor events
	onMount(() => {
		// TODO: iOS?
		if (Capacitor.getPlatform() !== "android") {
			return;
		}

		// SplashScreen.hide({
		// 	fadeOutDuration: 200,
		// });

		Keyboard.getResizeMode().then((data) => {
			cconsole.log("Keyboard.getResizeMode:", data);
		});

		// Keyboard.addListener("keyboardWillShow", (info) => {
		// 	cconsole.log(
		// 		"keyboard will show with height:",
		// 		info.keyboardHeight,
		// 	);
		// });

		// Keyboard.addListener("keyboardDidShow", (info) => {
		// 	cconsole.log("keyboard did show with height:", info.keyboardHeight);
		// });

		// Keyboard.addListener("keyboardWillHide", () => {
		// 	cconsole.log("keyboard will hide");
		// });

		// Keyboard.addListener("keyboardDidHide", () => {
		// 	cconsole.log("keyboard did hide");
		// });

		///

		CapacitorApp.getInfo().then((data) => {
			cconsole.log("app data", data);
		});
		CapacitorApp.getAppLanguage().then((data) => {
			cconsole.log("app language", data);
		});
		// CapacitorApp.addListener("pause", () => {
		// 	cconsole.log("app pause (background)");
		// });
		// CapacitorApp.addListener("resume", () => {
		// 	cconsole.log("app resume (foreground)");
		// });
		// CapacitorApp.addListener("appStateChange", ({ isActive }) => {
		// 	cconsole.log("app state changed. Is active?", isActive);
		// });
		// CapacitorApp.addListener("appRestoredResult", (data) => {
		// 	cconsole.warn("app restored state:", data);
		// });

		// const checkAppLaunchUrl = async () => {
		// 	const { url } = await CapacitorApp.getLaunchUrl();

		// 	console.log("App opened with URL: " + url);
		// };
		CapacitorApp.addListener("appUrlOpen", (data) => {
			cconsole.warn("app opened with URL:", data);
		});

		// // Disable long press on Android
		// document.addEventListener(
		// 	"contextmenu",
		// 	(e) => {
		// 		const target: HTMLElement | null = e.target as any;

		// 		const isValidInputForLongPress =
		// 			target != null &&
		// 			target.matches("input") &&
		// 			![
		// 				"checkbox",
		// 				"radio",
		// 				"button",
		// 				"submit",
		// 				"reset",
		// 				"file",
		// 				"hidden",
		// 				null,
		// 			].includes((target as HTMLInputElement).type || null);

		// 		if (!isValidInputForLongPress) {
		// 			e.preventDefault();
		// 		}
		// 	},
		// 	{
		// 		passive: false,
		// 	},
		// );
	});

	let credentialsMounted = $state(false);

	// Salt/token restoration
	onMount(() => {
		checkForCredentials();
		credentialsMounted = true;

		function checkForCredentials() {
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
		}
	});

	// Splash screen
	$effect(() => {
		if (!credentialsMounted) {
			return;
		}

		if (Capacitor.getPlatform() !== "android") {
			return;
		}

		SplashScreen.hide({
			fadeOutDuration: 200,
		});
	});

	// Navigation state lock when logged out
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

	let fontsReady = $state(false);

	onMount(() => {
		document.fonts.ready.then(() => {
			fontsReady = true;
			document.body.classList.add("fonts-loaded");
		});
	});

	//#region mca Dolby Immersive Capability
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
			mediacap.message =
				(mediacap.results.supported ? "" : "not ") + "supported";
		}

		return mediacap;
	}

	let pMediaCapResult = $state("");

	Mca().then((value) => (pMediaCapResult = value.message));

	let isBrowserOnline = $state(window.navigator.onLine);
	//#endregion
</script>

<svelte:window bind:online={isBrowserOnline} />

<svelte:head>
	<link
		rel="manifest"
		href="/app.webmanifest"
		crossorigin="use-credentials"
	/>
</svelte:head>

<button
	type="button"
	onclick={() => {
		jsConsoleDiv.classList.toggle("hidden");
	}}
>
	Toggle console
</button>

{#if credentialsMounted && authData.isLoggedIn()}
	<nav data-sveltekit-replacestate={!authData.isLoggedIn()}>
		<a href="/" aria-current={getAriaCurrentPage("/")} draggable="false">
			<span>Home</span>
		</a>
		<a
			href="#/search"
			style="opacity:0.6"
			aria-current={getAriaCurrentPage("/search")}
			draggable="false"
		>
			Search
		</a>
		<a
			href="#/library"
			aria-current={getAriaCurrentPage("/library")}
			draggable="false"
		>
			Library
		</a>
		<a
			href="#/stations"
			aria-current={getAriaCurrentPage("/stations")}
			draggable="false"
		>
			Radios
		</a>
		<a
			href="#/user-settings"
			style="opacity:0.6"
			aria-current={getAriaCurrentPage("/user-settings")}
			draggable="false"
		>
			Settings
		</a>
	</nav>
{/if}

{#if authData.isLoggedIn()}
	<div id="main-inner">
		{@render children()}
	</div>

	<UIPlayer audioPlayer={null}></UIPlayer>
{:else if credentialsMounted}
	<LoginLayout></LoginLayout>
{:else}
	<div></div>
{/if}

<div
	class={["offline-banner", !isBrowserOnline && "visible"]}
	aria-hidden={isBrowserOnline}
>
	<p>You're offline!</p>
</div>

<div
	id="js-console"
	bind:this={jsConsoleDiv}
	class="hidden"
	style=""
	aria-hidden="true"
>
	<div>
		<p style="white-space:normal;font-size:0.8rem">
			page url pathname: "{page.url.pathname}"<br />
			location hash: "{_location.hash}"<br />
			page state: "{JSON.stringify(page.state)}"<br />
			page route id: "{page.route.id}"<br />
			isLoggedIn: {String(authData.isLoggedIn())}<br />
			dolbySupportStatus: {pMediaCapResult}<br />
			platform: {Capacitor.getPlatform()}<br />
			navigator LAN access: {navigatorLANAccess}
		</p>
	</div>
	{#each cconsole.logList() as log, i (i)}
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
				return JSON.stringify(log.replace(/^.*?,\s*/, "")).replaceAll(
					"\\n",
					"\n",
				);
			})()}
		</p>
	{/each}
</div>

<style>
	nav {
		padding: 0.5rem;
		font-weight: bold;

		text-align: center;

		position: sticky;
		top: 0;

		z-index: 50;

		background-color: var(--app-bg);

		text-rendering: optimizeLegibility;
	}
	nav > a + a {
		margin-left: 0.5rem;
	}

	.offline-banner {
		color: #fff;
		font-weight: bold;

		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;

		overflow: visible;

		z-index: 400;

		pointer-events: none;
	}
	.offline-banner:not(.visible) p {
		transform: translateY(100%);
	}
	.offline-banner.visible p {
		transform: translateY(0);
	}
	.offline-banner p {
		position: absolute;
		bottom: 0;
		width: 100%;
		text-align: center;
		font-size: 1.25rem;
		opacity: 0.6;

		margin: 0;
		padding: 1.5rem 1rem;
		background-color: #d05843;
		transform-style: flat;

		transition: transform 0.4s ease-out;
	}

	:global(:root) {
		--bloom-theme: #ffe06a;
		--bloom-theme-dark: #d1a700;
	}

	:global(a) {
		/*color: #8080fe;*/
		color: var(--bloom-theme);
		text-decoration: none;
	}
	/*
	a:visited {
    	color: #d1a700;
    }
    */

	:global(body) {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;
	}

	/* TODO: unsure if I want this */
	:global(body.svelte-prod) {
		user-select: none;
	}

	/*#main-inner {
		padding: 1rem;
	}*/

	/* https://stackoverflow.com/a/16077726/16804863 */
	:global(button::-moz-focus-inner, input::-moz-focus-inner) {
		border: 0;
		padding: 0;
	}

	/* JS console down below */

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

		text-rendering: geometricPrecision;
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
</style>
