<script lang="ts">
	import {
		AudioPlayer,
		getStatus,
		listenAudioEvents,
		pauseTrack,
		playTrack,
		resumeTrack,
	} from "$lib/audio-player.svelte";
	import { cconsole } from "$lib/logger.svelte";
	import { GGCAudio } from "@gabigroup/capacitor-audio-player";
	import { onMount } from "svelte";

	import { gsap } from "gsap";
	import { Draggable } from "gsap/Draggable";

	let {
		audioPlayer,
		navigationDock,
	}: {
		audioPlayer: AudioPlayer | null;
		navigationDock: HTMLElement;
	} = $props();

	let trackState = $state("unknown");

	let trackData = $state({
		title: "",
		artist: "",
		currentTime: 0,
		duration: 0,
	});

	onMount(() => {
		listenAudioEvents();

		GGCAudio.addListener("playbackStateChange", (status) => {
			updateTrackData(status);
		});
	});

	function updateTrackData(newData: any) {
		// TODO: check plugin, currentTrack seems to be null when pausing/resuming
		if (
			newData.currentTrack != null &&
			newData.currentTrack.title != trackData.title
		) {
			trackData.title = newData.currentTrack.title;
		}
		if (
			newData.currentTrack != null &&
			newData.currentTrack.artist != trackData.artist
		) {
			trackData.artist = newData.currentTrack.artist;
		}

		if (newData.position != trackData.currentTime) {
			trackData.currentTime = newData.position;
		}
		if (newData.duration != trackData.duration) {
			trackData.duration = newData.duration;
		}

		trackState = newData.playbackState;
	}

	let uielement = $state(null!) as HTMLDivElement;
	let fullpanel = $state(null!) as HTMLElement;
	let minipanel = $state(null!) as HTMLElement;
	let isFullpanelScrolled = $state(false);
	let uiproxy = $state(null!) as HTMLDivElement;

	let isOpen = $state(false);

	const clamp = gsap.utils.clamp(0, 1);

	// in seconds
	const wholeDuration = 0.45;

	let dockNavigationHeight = $derived.by(() => {
		if (!navigationDock) {
			return "0em";
		} else {
			return gsap.getProperty(navigationDock, "clientHeight", "em");
		}
	});

	/**
	 * When we release the pointer, it settles ("anchors") by itself to the top or the bottom of the view.
	 */
	let settleAnimation: gsap.core.Tween | undefined;

	let slideAnimationTimeline: gsap.core.Timeline | undefined;
	let dragger: Draggable;

	let startProgress = 0;
	let startY = 0;
	let dragHeight = 1;
	let moved = false;
	let clickableInteractedOnPress = false;

	function snap(open: boolean) {
		settleAnimation?.kill();

		const target = open ? 1 : 0; // 1 = going to open, 0 = going to close
		// const distance = Math.abs(target - slideAnimationTimeline!.progress());

		isOpen = open;

		gsap.set(fullpanel, { visibility: "visible" });

		settleAnimation = slideAnimationTimeline!.tweenTo(
			target * slideAnimationTimeline!.duration(),
			{
				// duration: Math.max(0.16, distance * 0.42),
				// ease: target === 1 ? "power1.out" : "power1.in",

				onComplete() {
					if (!open) {
						gsap.set(fullpanel, { visibility: "hidden" });
					}
				},
			},
		);
	}

	function getCenterOffsetRelativeToTimelineElement(
		largeDuration: number,
		duration: number,
	) {
		return (largeDuration - duration) / 2;
	}

	onMount(() => {
		// uielement.addEventListener("click", () => {
		// 	isOpen = !isOpen;
		// });

		updateFullpanelScrollBehaviour();
		fullpanel.addEventListener(
			"scroll",
			() => {
				updateFullpanelScrollBehaviour();
			},
			{
				passive: true,
			},
		);
		fullpanel.addEventListener(
			"scrollend",
			() => {
				updateFullpanelScrollBehaviour();
			},
			{
				passive: true,
			},
		);

		function ensuredPanelHasNoScroll() {
			// less or equal check just in case (I'm looking at you, Safari)
			return fullpanel.scrollTop <= 0;
		}

		function updateFullpanelScrollBehaviour() {
			isFullpanelScrolled = !ensuredPanelHasNoScroll();
			// if (ensuredPanelHasNoScroll()) {
			// 	// fullpanel.style.touchAction = "pan-down";
			// 	fullpanel.style.touchAction = "pan-down";
			// } else {
			// 	// fullpanel.style.touchAction = "pan-y";
			// 	fullpanel.style.touchAction = "pan-y";
			// }
		}

		let gsapCtx: gsap.Context = null!;

		// TODO: the drag/swipe UX still sucks, but we're slowly getting somewhere
		gsapCtx = gsap.context(() => {
			slideAnimationTimeline = gsap
				.timeline({
					paused: true,
					// onComplete() {
					// 	isOpen = true;
					// 	console.log("complete!");
					// },
					// onStart() {
					// 	console.log("started!");
					// },
					// onReverseComplete() {
					// 	isOpen = false;
					// 	console.log("reverse complete!");
					// },
					onUpdate() {
						let progress: number =
							slideAnimationTimeline!.progress();

						document.body.classList.toggle(
							"ui-player-closed",
							progress === 0,
						);

						gsap.set(document.documentElement, {
							"--ui-player-progress": progress,
						});
					},
				})
				// dock movement
				.fromTo(
					uielement,
					{
						yPercent: 0,
						y: 0,
					},
					{
						y: () =>
							-window.innerHeight +
							minipanel.clientHeight +
							(navigationDock?.clientHeight ?? 0),

						// ease: "sine.inOut",
						ease: "power1.inOut",
						duration: wholeDuration,
					},
				)
				// fullscreen panel fade-in
				.fromTo(
					fullpanel,
					{
						autoAlpha: 0,
					},
					{
						autoAlpha: 1,
						duration: wholeDuration / 1.25,
						ease: "power1.inOut",
					},
					"<+=" +
						getCenterOffsetRelativeToTimelineElement(
							wholeDuration,
							wholeDuration / 1.25,
						),
				);

			gsap.set(fullpanel, { visibility: "hidden" });

			function isElementClickable(e: any) {
				return (
					e instanceof Element &&
					e.closest(
						"[data-no-drag], .scrollable, button, a, input, textarea, select",
					) !== null
				);
			}

			dragger = Draggable.create(uiproxy, {
				type: "y",
				trigger: uielement,
				minimumMovement: 3,

				// allow scrolling fullscreen panel
				allowNativeTouchScrolling: true,

				allowEventDefault: false,
				force3D: true,
				lockAxis: false,

				zIndexBoost: false,

				// TODO
				// inertia: true,

				dragClickables: false,

				// Prevent trigger on browser interactible areas
				clickableTest: (el) => isElementClickable(el),

				onPressInit() {
					gsap.set(uiproxy, { y: 0 });
				},

				onRelease(e) {
					if (clickableInteractedOnPress) {
						clickableInteractedOnPress = false;
						return;
					}

					if (moved) {
						return;
					}

					if (
						slideAnimationTimeline!.progress() > 0 &&
						slideAnimationTimeline!.progress() < 1
					) {
						snap(slideAnimationTimeline!.progress() >= 0.5);
					}
				},

				onPress(e) {
					if (isElementClickable(e.target)) {
						clickableInteractedOnPress = true;
						return;
					}

					settleAnimation?.kill();
					slideAnimationTimeline!.pause();

					startProgress = slideAnimationTimeline!.progress();
					startY = this.y;
					dragHeight = Math.max(1, fullpanel.clientHeight);
					moved = false;

					gsap.set(fullpanel, { visibility: "visible" });
				},

				onDragStart() {
					moved = true;
				},

				onDrag() {
					const deltaY = this.y - startY;

					slideAnimationTimeline!.progress(
						clamp(startProgress - deltaY / dragHeight),
					);
				},

				onDragEnd() {
					if (moved) {
						snap(slideAnimationTimeline!.progress() >= 0.5);
					}
				},

				onClick(e) {
					if (isOpen) {
						return;
					}

					if (
						clickableInteractedOnPress ||
						isElementClickable(e.target)
					) {
						clickableInteractedOnPress = false;
						return;
					}

					// TODO: improve drags and clicks (plus, use inertia plugin)
					snap(slideAnimationTimeline!.progress() < 0.5);
				},
			})[0];
		}, uielement);

		return () => {
			settleAnimation?.kill();
			dragger?.kill();
			gsapCtx.revert();
			isOpen = false;
			moved = false;
			clickableInteractedOnPress = false;
		};
	});

	// TODO: organize event lifetime
	window.addEventListener(
		"resize",
		() => {
			if (slideAnimationTimeline == null) {
				return;
			}

			const time = slideAnimationTimeline.time();

			dragHeight = Math.max(1, fullpanel.clientHeight);

			slideAnimationTimeline.invalidate();

			if (slideAnimationTimeline.paused() && time === 0) {
				return;
			}

			slideAnimationTimeline.restart().time(time);
		},
		{
			passive: true,
		},
	);

	// $effect(() => {
	// 	if (isOpen) {
	// 		slideAnimationTimeline?.play();
	// 	} else {
	// 		slideAnimationTimeline?.reverse();
	// 	}
	// });
</script>

<div
	id="ui-player-fixed"
	role="complementary"
	tabindex="-1"
	bind:this={uielement}
	class={[isOpen && "is-open"]}
	style:--dock-height={dockNavigationHeight}
>
	<aside>
		<div>
			<section
				class={["fullscreen-view", isFullpanelScrolled && "scrolled"]}
				bind:this={fullpanel}
			>
				<div class="fullscreen-front-panel">test</div>
				<div
					style="height: 20rem; background-color: midnightblue; color: #fff"
				>
					hello
				</div>
			</section>
			<div class="mini-view" bind:this={minipanel}>
				<div
					style="width: 4rem; aspect-ratio: 1/1; background: #00000060"
				>
					<!-- TODO: song cover art -->
				</div>
				<div
					style="display: flex; flex-direction: column; flex-grow: 1"
				>
					<div>
						<!-- TODO: absolute position to allow scrolling -->
						{trackData.title || "<No title>"}
					</div>
					<div>
						<!-- TODO: absolute position to allow scrolling -->
						{trackData.artist || "<No artist>"}
					</div>
				</div>
				<div>
					<button
						id="audio-toggle-button"
						data-clickable="true"
						data-no-drag="true"
						style="min-width: 0; min-height: 0; font-size: 4em; cursor: pointer"
						onclick={() => {
							switch (trackState) {
								case "playing":
									pauseTrack().then(() => {
										updateTrackData(getStatus());
									});
									break;
								case "unknown":
									break;
								default:
									resumeTrack().then(() => {
										updateTrackData(getStatus());
									});
									break;
							}
						}}
					>
						{#if trackState != "playing"}
							<!-- Play -->
							{@html `<svg xmlns="http://www.w3.org/2000/svg" height="48px" width="48px" viewBox="0 -960 960 960" fill="#e3e3e3" ><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" /></svg>`}
						{:else}
							<!-- Pause -->
							{@html `<svg xmlns="http://www.w3.org/2000/svg" height="48px" width="48px" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/></svg>`}
						{/if}
					</button>
				</div>
			</div>
		</div>
	</aside>
	<div class="proxy" bind:this={uiproxy}></div>
</div>

<style>
	#ui-player-fixed {
		position: fixed;

		z-index: 800;

		/*bottom: 0;*/
		bottom: var(--dock-height);
		left: 0;
		right: 0;

		overflow: visible;

		min-width: 100%;
		max-width: 100%;

		/*background-color: #4a4af390;*/
		background-color: #46399d;

		user-select: none;

		/*transform: translateY(0);*/
	}
	#ui-player-fixed {
		contain: layout;
		isolation: isolate;
	}

	/*#ui-player-fixed.open {
		transform: translateY(calc(var(--100lvh) * -1 + 100%));
	}*/

	.mini-view {
		position: relative;
		z-index: 10;

		display: flex;
		flex-direction: row;
		padding: 0.45rem;
		gap: 0.45rem;
		justify-content: flex-start;
		/*bottom: var(--dock-height);*/
	}

	.fullscreen-view {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background-color: #fe43f2;
		/*background-color: #fe43f240;*/

		z-index: 20;

		min-height: 100lvh;
		max-height: 100lvh;
		overflow: scroll;
	}

	.fullscreen-view {
		contain: strict;
	}

	.fullscreen-view .fullscreen-front-panel {
		/*height: calc(90vh - var(--dock-height));*/
		height: 90vh;
		background-color: orange;
	}

	.fullscreen-view {
		/*display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;*/
	}

	#ui-player-fixed:not(.is-open) {
		touch-action: none !important;
	}

	.fullscreen-view:not(.scrolled) {
		touch-action: pan-down !important;
	}
	.fullscreen-view.scrolled {
		touch-action: pan-y !important;
	}

	.proxy {
		position: absolute;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
</style>
