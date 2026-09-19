// @ts-nocheck
// see https://codepen.io/gabixel/pen/Ggreeoa

const ANIMATION_DURATION = 450;

/**
 * For convenience. Since all other drag animations run in parallel, we only need one for getting durations and such.
 */
let dragAnimation: Animation = null!;
let allDragAnimations: Animation[] = [];
let animationsReady = false;

let animationRunning = $state(false);

let dragAnimationFrameFuncId: ReturnType<typeof requestAnimationFrame> | null =
	null;

/** when it's open (attached) or attaching to top */
let isDockOpen = $state(false); //isPanelOpen
/** when the inner player page has a `scrollTop` value of zero */
let hasPlayerPageNoScroll = true;

export const dockState = {
	isOpen() {
		return isDockOpen;
	},
	isAnimating() {
		return animationRunning;
	}
};

let audioReady = false;
let audioPlayPromise: Promise<any> | null = null;

let isColorThiefReady = false;

let audioTrackData: TrackItem = {
	title: "",
	trackUrl: "",
	artist: "",
	image: "",
};

let NORMAL_CANVAS_SIZE = Math.min(window.innerWidth, window.innerHeight);
let currentTrackImageUrl: string | null = null;
const normalCanvas = document.createElement("canvas");
normalCanvas.width = normalCanvas.height = NORMAL_CANVAS_SIZE;
const normalCanvasCtx = normalCanvas.getContext("2d", {
	alpha: false,
	// willReadFrequently: true,
})!;

let BLURRED_CANVAS_SIZE = 100;
const CANVAS_BLUR_PIXEL = 2;
const blurredCanvas = document.createElement("canvas");
blurredCanvas.width = blurredCanvas.height = BLURRED_CANVAS_SIZE;
const blurredCanvasCtx = blurredCanvas.getContext("2d", {
	alpha: false,
	// willReadFrequently: true,
})!;
let currentTrackImageBlurredUrl: string | null = null;

// for a good simple graph about the pointer lifecycle, see:
// https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nxnul1or0jmcnkbtrboe.png
// thanks https://dev.to/nishinoshake/smooth-drag-interactions-with-pointer-events-5e2j#key-events

const ANIMATION_ATTACHMENT_THRESHOLDS = {
	paused: 0.28,
	running: 0.4,
} as const;

let dragData: DragaDataType = {
	pointerStartY: -1,
	latestPointerY: -1,
	maxY: window.innerHeight,
	isDragging: false,
	animationPointerStartProgress: 0,
	latestAnimationPointerTime: -1,
	latestAnimationPointerProgress: -0,
	isDragFrameDirty: false,
	currentAttach: "bottom",
	playerDraggedALot: false,
	correctCapturedPointerId: null,
	wasAnimationRunningBeforePointer: false,
};
type DragaDataType = {
	/** where the last pointerdown started */
	pointerStartY: number; // touchStartY
	/** most recent pointer movement Y */
	latestPointerY: number; // lastPointerY
	/** max height that the dock should reach (subtracted with its size after page load) */
	maxY: number;
	isDragging: boolean;
	/** the initial animation progress (0-1) when we call pointerdown */
	animationPointerStartProgress: number;
	/** the animation progress (using time) from the most recent pointer movement */
	latestAnimationPointerTime: CSSNumberish;
	/** the animation progress (using progress 0-1) from the most recent pointer movement */
	latestAnimationPointerProgress: number;
	/** when we need to update the dock progress time with our JS animation frame loop */
	isDragFrameDirty: boolean; // prev pendingFrameTimeUpdate
	/** dock attachment direction (going "bottom" or going "top") */
	currentAttach: "bottom" | "top";
	/** whether we dragged enough to count it as a "drag" and not as a "click" */
	playerDraggedALot: boolean;
	/** when captured, we store the pointer id */
	correctCapturedPointerId: number | null;
	/** whether we held the dock with the pointer while it was attaching */
	wasAnimationRunningBeforePointer: boolean; // prev dragStartWasPlaying
};

// syncBodyAttachClass();

//////

const PAGE_ELEMENTS = {
	// pageScroller: document.getElementsByClassName(
	// 	"page-inner",
	// )![0] as HTMLElement,

	pageContentDockPadder: document.getElementsByClassName(
		"page-inner-dock-padding",
	)![0] as HTMLElement,
} as const;

const BOTTOM_DOCK_ELEMENTS = {
	/** parent of the big overlay. */
	dockContainer: document.getElementsByClassName(
		"bottom-dock-container",
	)[0] as HTMLElement,
	/** the big overlay */
	playerContainer: document.getElementsByClassName(
		"audio-player-overlay",
	)[0] as HTMLElement,
	navMenu: document.getElementById("app-navigation")! as HTMLElement,
	playerInnerPage: document.querySelector(
		".audio-player-overlay .inner",
	) as HTMLElement,
	miniPlayer: document.querySelector(
		".audio-player-overlay .mini-player",
	) as HTMLElement,
	miniPlayerData: document.querySelector(
		".audio-player-overlay .mini-player > div.data-and-cover",
	) as HTMLElement,
	innerTouchProxy: document.getElementsByClassName(
		"touch-proxy",
	)![0] as HTMLElement,
} as const;

let miniPlayerInitialPosition = -1;

async function preparePlayerDockProperties(then) {
	for (let i = 0; i < 3; i++) {
		await new Promise(requestAnimationFrame);

		refreshBottomDockProperties();
	}

	// TODO: add a slide-fade-in transition for the mini player
	// probably just a addClass("ready") with a css animation
	// todo: probably we can remove the ready at the first pointerdown

	then();

	function refreshBottomDockProperties() {
		getComputedStyle(BOTTOM_DOCK_ELEMENTS.miniPlayer);
		getComputedStyle(BOTTOM_DOCK_ELEMENTS.navMenu);

		document.body.style.setProperty(
			"--nav-height",
			`${BOTTOM_DOCK_ELEMENTS.navMenu.offsetHeight}px`,
		);
		document.body.style.setProperty(
			"--player-height",
			`${BOTTOM_DOCK_ELEMENTS.miniPlayer.offsetHeight}px`,
		);
	}
}

function refreshSizes() {
	const h = BOTTOM_DOCK_ELEMENTS.miniPlayer.offsetHeight;
	dragData.maxY = window.innerHeight - h + 1; // one extra pixel in case of any weird gap
}

async function onPageFullyLoaded() {
	// prepareHashedRouting();

	refreshSizes();
	syncAttachClass();

	await setupBottomDockAnimations();

	// preparePageScrollerEvents();

	// prepareColorUpdates();

	// prepareAudio();

	// prepareDebugEvents();

	console.log("navigator.maxTouchPoints:", navigator.maxTouchPoints);

	dragAnimation.addEventListener("finish", () => {
		console.log("dragAnimation finished");

		animationRunning = false;
		toggleClass(document.body, "animating", false);
		toggleClass(document.body, "anim-finishing", false);
		toggleClass(document.body, "anim-finished", true);

		toggleClass(
			document.body,
			"dock-was-fully-open",
			dragData.currentAttach === "top",
		);

		dragProgressUpdater();

		if (dragAnimationFrameFuncId != null) {
			cancelAnimationFrame(dragAnimationFrameFuncId);
			dragAnimationFrameFuncId = null;
		}
	});

	eachAnim((a) => {
		// to trigger some classes
		a.finish();
	});

	// document.body.addEventListener("contextmenu", (e) => e.preventDefault());
	BOTTOM_DOCK_ELEMENTS.playerContainer.addEventListener("contextmenu", (e) =>
		e.preventDefault(),
	);

	setupBottomDockPointerEvents();

	// eachAnim((a) => {
	// 	a.currentTime = 70;
	// });

	// TODO: slide-in
}

async function setupBottomDockAnimations() {
	const settings: KeyframeEffectOptions = {
		duration: ANIMATION_DURATION,
		iterations: 1,
		fill: "both",
		composite: "replace",
		// iterationComposite: "replace",
		easing: "cubic-bezier(0.4, 0, 0.2, 1)",
		direction: "normal",
	};

	const createPseudoAnim = (elem, parent, extraFrom = {}, extraTo = {}) => {
		return new Animation(
			new KeyframeEffect(
				parent,
				[
					// from
					{
						...extraFrom,
					},
					// to
					{
						...extraTo,
					},
				],
				{
					...settings,
					pseudoElement: elem,
				},
			),
		);
	};

	const playerInnerBgOpacityAnimation = createPseudoAnim(
		"::after",
		BOTTOM_DOCK_ELEMENTS.miniPlayer,
		{
			opacity: "0",
		},
		{
			opacity: "1",
		},
	);
	allDragAnimations.push(playerInnerBgOpacityAnimation);

	let playerInnerPageAnimation = new Animation(
		new KeyframeEffect(
			BOTTOM_DOCK_ELEMENTS.playerInnerPage,
			[
				// from
				{
					opacity: "0",
				},
				// to
				{
					opacity: "1",
				},
			],
			settings,
		),
	);
	dragAnimation = playerInnerPageAnimation;
	allDragAnimations.push(playerInnerPageAnimation);

	let animationsPromises = allDragAnimations.map((a) => a.ready);

	await Promise.all(animationsPromises).catch((e) => {
		console.warn("one or more drag animations failed to load", e);
	});

	animationsReady = true;

	eachAnim((a) => {
		a.persist();
		a.currentTime = 0;
		a.playbackRate = -1;
	});
}

/**
 * The basic idea:
 * We have the mini-player (when the dock is "closed", attached to "bottom"), who's responsible for the drag in order to open the inner player page (dragging/attaching to the "top").
 * If we've scrolled enough, it will reveal the inner page.
 * The inner player page has a `innerTouchProxy` element which allows returning back to the "bottom" attach, again, by dragging.
 *
 * There's also a check for "click" (determined by how little far we dragged), and also a check to see if we've clicked something like a button or any other input (i.e. play/pause).
 */
function setupBottomDockPointerEvents() {
	prepareMiniPlayerEvents();

	preparePlayerInnerPage();

	preparePlayerInnerPageProxy();
}

function prepareMiniPlayerEvents() {
	let interactibleElementPressed: HTMLElement | null = null;

	BOTTOM_DOCK_ELEMENTS.miniPlayer.addEventListener(
		"pointerdown",
		(e) => {
			miniPlayerPointerDown(e, () => {
				// Store interacted element (if it should absorb input)
				if (
					e.target != null &&
					// TODO: wtf typescript
					(e.target as HTMLElement).classList.contains(
						"player-block-switch-drag",
					)
				) {
					interactibleElementPressed = e.target as HTMLElement;
				}

				// e.preventDefault();
				// e.stopImmediatePropagation();

				registerNextEvents();
			});
		},
		{
			passive: true,
		},
	);

	function miniPlayerPointerDown(e: PointerEvent, then) {
		console.log("miniPlayer pointerdown");

		if (!dragEvents_isValidPointerPress(e)) {
			return;
		}

		if (dragData.isDragging) {
			console.warn(
				"miniPlayer pointerdown: we're already dragging, skipping event",
			);
			return;
		}

		if (isDockOpen) {
			console.warn(
				"miniPlayer pointerdown: panel is open, skipping event",
			);
			return;
		}

		console.log("miniPlayer pointerdown: passed guard checks");

		const result = registerPointerCapture(
			BOTTOM_DOCK_ELEMENTS.miniPlayer,
			e,
		);
		if (result) {
			dragData.correctCapturedPointerId = e.pointerId;
		} else {
			console.warn("failed pointer registration, exiting begin drag");
			return;
		}

		beginDrag(BOTTOM_DOCK_ELEMENTS.miniPlayer, e);

		storeAnimationProgressOnBeginDrag(e);

		updateDrag(e);

		then();
	}

	// TODO: resize event?

	function registerNextEvents() {
		BOTTOM_DOCK_ELEMENTS.miniPlayer.addEventListener(
			"gotpointercapture",
			miniPlayerGotPointerCapture,
		);
		function miniPlayerGotPointerCapture(e: PointerEvent) {
			if (isDockOpen) {
				console.warn(
					"miniPlayer gotpointercapture: dock is open, something bad happened",
				);
				return;
			}
		}

		BOTTOM_DOCK_ELEMENTS.miniPlayer.addEventListener(
			"pointermove",
			miniPlayerPointerMove,
			{
				passive: true,
			},
		);
		function miniPlayerPointerMove(e: PointerEvent) {
			const isMouse = e.pointerType === "mouse";
			const isTouch = e.pointerType === "touch";

			if (!dragData.isDragging) return;

			if (isDockOpen) {
				return;
			}

			if (
				dragData.correctCapturedPointerId === null ||
				e.pointerId !== dragData.correctCapturedPointerId
			) {
				console.log(
					"miniPlayer pointermove: correctCapturedPointerId is ",
					typeof dragData.correctCapturedPointerId,
					" and e.pointerId is ",
					e.pointerId,
					", skipping event",
				);

				return;
			}

			if (isMouse && (e.buttons & 1) === 0) {
				// TODO: unsure
				console.warn(
					"miniPlayer pointermove: gone wrong, releasing capture",
				);
				clearCapture(BOTTOM_DOCK_ELEMENTS.miniPlayer);
				clearDrag();
				// // TODO: clear drag?
				// destroyPointerCapture(
				// 	BOTTOM_DOCK_ELEMENTS.miniPlayer,
				// 	dragData.correctCapturedPointerId,
				// );
				// dragData.correctCapturedPointerId = null;
				return;
			}

			// e.preventDefault();

			if (Math.abs(dragData.latestPointerY - e.clientY) < 1) {
				return;
			}

			updateDrag(e);
		}

		BOTTOM_DOCK_ELEMENTS.miniPlayer.addEventListener(
			"pointerup",
			miniPlayerPointerUp,
			{
				passive: true,
			},
		);
		function miniPlayerPointerUp(e: PointerEvent) {
			console.log("miniPlayer pointerup");

			if (!dragEvents_isValidPointerRelease(e)) {
				return;
			}

			console.log("valid pointerup");

			// e.preventDefault();

			clearCapture(BOTTOM_DOCK_ELEMENTS.miniPlayer);
		}

		BOTTOM_DOCK_ELEMENTS.miniPlayer.addEventListener(
			"pointercancel",
			miniPlayerPointerCancel,
			{
				passive: true,
			},
		);
		function miniPlayerPointerCancel(e: PointerEvent) {
			console.log("miniPlayer pointercancel");

			if (!dragEvents_isValidPointerRelease(e)) {
				return;
			}

			console.log("valid pointercancel");

			clearCapture(BOTTOM_DOCK_ELEMENTS.miniPlayer);
		}

		BOTTOM_DOCK_ELEMENTS.miniPlayer.addEventListener(
			"lostpointercapture",
			miniPlayerLostPointerCapture,
			{
				passive: true,
			},
		);
		function miniPlayerLostPointerCapture(e: PointerEvent) {
			console.log("miniPlayer lostpointercapture");
			const isMouse = e.pointerType === "mouse";
			const isTouch = e.pointerType === "touch";

			// if (!dragEvents_isValidPointerRelease(e)) {
			// 	return;
			// }

			const hoveredElement =
				document.elementFromPoint(e.clientX, e.clientY) ?? null;

			const elementToClick = interactibleElementPressed;
			const didDragALot = dragData.playerDraggedALot;
			const prevAttach = dragData.currentAttach;

			const didPointerReleaseOverOriginalTarget =
				elementToClick != null && hoveredElement === elementToClick;

			if (
				elementToClick != null &&
				!didDragALot &&
				didPointerReleaseOverOriginalTarget
			) {
				elementToClick.click();
			} else {
				updateAttach();
			}

			syncAttachClass();
			ensureAnimationIsReattached();
			updateElementsInteractibilityBasedOnAttach();

			interactibleElementPressed = null;
			clearDrag();

			clearEvents();
		}

		function clearEvents() {
			BOTTOM_DOCK_ELEMENTS.miniPlayer.removeEventListener(
				"lostpointercapture",
				miniPlayerLostPointerCapture,
			);
			BOTTOM_DOCK_ELEMENTS.miniPlayer.removeEventListener(
				"pointercancel",
				miniPlayerPointerCancel,
			);
			BOTTOM_DOCK_ELEMENTS.miniPlayer.removeEventListener(
				"pointerup",
				miniPlayerPointerUp,
			);
			BOTTOM_DOCK_ELEMENTS.miniPlayer.removeEventListener(
				"pointermove",
				miniPlayerPointerMove,
			);
			BOTTOM_DOCK_ELEMENTS.miniPlayer.removeEventListener(
				"gotpointercapture",
				miniPlayerGotPointerCapture,
			);
		}
	}
}

function preparePlayerInnerPage() {
	BOTTOM_DOCK_ELEMENTS.playerInnerPage.addEventListener(
		"scroll",
		(e) => {
			// if (!isDragging) {
			// 	return;
			// }
			// TODO: stop drag in extreme cases

			updatePlayerInnerPageScrollBehaviour();
		},
		{ passive: true },
	);
	BOTTOM_DOCK_ELEMENTS.playerInnerPage.addEventListener(
		"scrollend",
		(e) => {
			updatePlayerInnerPageScrollBehaviour();
		},
		{ passive: true },
	);
}

function storeAnimationProgressOnBeginDrag(e: PointerEvent) {
	dragData.pointerStartY = e.clientY;
	dragData.animationPointerStartProgress = dragAnimation.overallProgress;

	// TODO: also store start time?
	dragData.latestPointerY = e.clientY;
	dragData.latestAnimationPointerProgress = dragAnimation.overallProgress;

	if (dragAnimation.currentTime == null) {
		console.warn("drag update: current `dragAnimation` time is null");
	}
	dragData.latestAnimationPointerTime = dragAnimation.currentTime ?? 0;
}

/**
 * In case of the inner touch proxy we need to make sure that we can register the capture without causing any scroll to the element.
 */
function preparePlayerInnerPageProxy() {
	let potentialInnerProxyPointerDownId: number | null = null;
	let innerProxyPointerStartY: number = -1;

	BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
		"pointerdown",
		(e) => {
			innerProxyPointerDown(e, () => {
				// BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.overflowY = "hidden";
				registerNextEvents();
			});
		},
		{
			passive: true,
		},
	);
	// BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener("touchmove", (e) => {
	// 	console.log("touchmove");
	// });
	// BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
	// 	"mousemove",
	// 	(e) => {
	// 		console.log("mousemove");
	// 	},
	// );

	function innerProxyPointerDown(e: PointerEvent, then) {
		console.log("innerProxy pointerdown");

		if (!dragEvents_isValidPointerPress(e)) {
			return;
		}

		if (BOTTOM_DOCK_ELEMENTS.playerInnerPage.scrollTop > 0) {
			return;
		}

		if (dragData.isDragging) {
			console.warn(
				"innerProxy pointerdown: we're already dragging, skipping event",
			);
			return;
		}

		if (!isDockOpen) {
			console.warn(
				"innerProxy pointerdown: panel is closed, skipping event",
			);
			return;
		}

		console.log("innerProxy pointerdown: passed guard checks");

		potentialInnerProxyPointerDownId = e.pointerId;

		innerProxyPointerStartY = e.clientY;

		then();
	}

	function registerNextEvents() {
		BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
			"gotpointercapture",
			innerProxyGotPointerCapture,
		);
		function innerProxyGotPointerCapture(e: PointerEvent) {
			if (!isDockOpen) {
				console.warn(
					"innerProxy gotpointercapture: dock is closed, something bad happened",
				);
				return;
			}
		}

		BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
			"pointermove",
			innerProxyPointerMove,
			{
				passive: true,
			},
		);
		function innerProxyPointerMove(e: PointerEvent) {
			const isMouse = e.pointerType === "mouse";

			if (
				potentialInnerProxyPointerDownId == null ||
				potentialInnerProxyPointerDownId !== e.pointerId
			) {
				return;
			}

			if (!isDockOpen) {
				// endDrag();
				//clearEvents();
				return;
			}

			// real pointing device seem to do some quirky stuff
			if (
				dragData.correctCapturedPointerId == null &&
				BOTTOM_DOCK_ELEMENTS.playerInnerPage.scrollTop > 0
			) {
				// endDrag();
				// clearEvents();
				return;
			}

			// Unless more math is actually involved behind the scenes,
			// this should theoretically guarantee to use a scenario
			// without pointer capture steal from the browser.
			const isMovingPointerToTop = e.clientY < innerProxyPointerStartY;
			// ^ TODO: "<=" ?

			if (isMovingPointerToTop && !dragData.isDragging) {
				return;
			}

			// if (dragData.correctCapturedPointerId == null) {e.preventDefault()} else {}
			if (dragData.correctCapturedPointerId == null) {
				const result = registerPointerCapture(
					BOTTOM_DOCK_ELEMENTS.innerTouchProxy,
					e,
				);

				if (result) {
					dragData.correctCapturedPointerId = e.pointerId;

					beginDrag(BOTTOM_DOCK_ELEMENTS.innerTouchProxy, e);

					storeAnimationProgressOnBeginDrag(e);
				} else {
					console.warn(
						"innerProxy: failed pointer registration, exiting pointermove event",
					);
					return;
				}
			} else {
				// TODO: unsure
				if (isMouse && (e.buttons & 1) === 0) {
					console.warn(
						"inner proxy pointermove: gone wrong, releasing capture",
					);
					clearCapture(BOTTOM_DOCK_ELEMENTS.innerTouchProxy);
					clearDrag();
					return;
				}
			}

			updateDrag(e);
		}

		BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
			"pointerup",
			innerProxyPointerUp,
			{
				passive: true,
			},
		);
		function innerProxyPointerUp(e: PointerEvent) {
			console.log("innerProxy pointerup");

			if (!dragEvents_isValidPointerRelease(e)) {
				return;
			}

			console.log("valid pointerup");

			// e.preventDefault();

			if (dragData.correctCapturedPointerId == null) {
				cleanupProxyDrag(e);
			}

			clearCapture(BOTTOM_DOCK_ELEMENTS.innerTouchProxy);
			potentialInnerProxyPointerDownId = null;
		}

		BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
			"pointercancel",
			innerProxyPointerCancel,
			{
				passive: true,
			},
		);
		function innerProxyPointerCancel(e: PointerEvent) {
			console.log("innerProxy pointercancel");

			if (!dragEvents_isValidPointerRelease(e)) {
				return;
			}

			console.log("valid pointercancel");

			// e.preventDefault();

			if (dragData.correctCapturedPointerId == null) {
				cleanupProxyDrag(e);
			}

			clearCapture(BOTTOM_DOCK_ELEMENTS.innerTouchProxy);
			potentialInnerProxyPointerDownId = null;
		}

		BOTTOM_DOCK_ELEMENTS.innerTouchProxy.addEventListener(
			"lostpointercapture",
			innerProxyLostPointerCapture,
			{
				passive: true,
			},
		);
		function innerProxyLostPointerCapture(e: PointerEvent) {
			console.log("innerProxy lostpointercapture");

			const isMouse = e.pointerType === "mouse";
			const isTouch = e.pointerType === "touch";

			// if (!dragEvents_isValidPointerRelease(e)) {
			// 	return;
			// }

			// if (!dragData.isDragging || e.pointerId != dragData.correctCapturedPointerId) {
			// 	return;
			// }

			// TODO: interactible items

			updateAttach(false);

			cleanupProxyDrag(e);
			potentialInnerProxyPointerDownId = null;
		}

		function clearEvents() {
			BOTTOM_DOCK_ELEMENTS.innerTouchProxy.removeEventListener(
				"lostpointercapture",
				innerProxyLostPointerCapture,
			);
			BOTTOM_DOCK_ELEMENTS.innerTouchProxy.removeEventListener(
				"pointercancel",
				innerProxyPointerCancel,
			);
			BOTTOM_DOCK_ELEMENTS.innerTouchProxy.removeEventListener(
				"pointerup",
				innerProxyPointerUp,
			);
			BOTTOM_DOCK_ELEMENTS.innerTouchProxy.removeEventListener(
				"pointermove",
				innerProxyPointerMove,
			);
			BOTTOM_DOCK_ELEMENTS.innerTouchProxy.removeEventListener(
				"gotpointercapture",
				innerProxyGotPointerCapture,
			);
		}

		function cleanupProxyDrag(e: PointerEvent) {
			syncAttachClass();
			ensureAnimationIsReattached();

			updateElementsInteractibilityBasedOnAttach();

			updatePlayerInnerPageScrollBehaviour();

			clearDrag();

			clearEvents();

			// BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.overflowY = "scroll";
		}
	}
}

function dragEvents_isValidPointerPress(e: PointerEvent): boolean {
	const isMouse = e.pointerType === "mouse";
	const isTouch = e.pointerType === "touch";

	// only left button
	if (isMouse && e.button !== 0) return false;
	if (isMouse && (e.buttons & 1) === 0) return false;

	if (dragData.correctCapturedPointerId !== null) {
		console.warn(
			"pointer press validation failed: correctCapturedPointerId is ",
			dragData.correctCapturedPointerId,
			", skipping event",
		);
		return false;
	}

	if (e.buttons > 1) return false;

	return true;
}

function dragEvents_isValidPointerRelease(e: PointerEvent): boolean {
	const isMouse = e.pointerType === "mouse";
	const isTouch = e.pointerType === "touch";

	// if (!dragData.isDragging) {
	// 	console.log("pointer release validation: not dragging");
	// 	return false;
	// }

	if (
		// TODO: unsure
		dragData.correctCapturedPointerId != null &&
		e.pointerId != dragData.correctCapturedPointerId
	) {
		return false;
	}

	if (isMouse && e.button !== 0) return false;

	return true;
}

// dragStart
function beginDrag(elem: HTMLElement, e: PointerEvent) {
	dragData.playerDraggedALot = false;
	toggleClass(document.body, "dragged-a-lot", false);
	toggleClass(document.body, "animating", true);
	animationRunning = true;

	dragData.wasAnimationRunningBeforePointer =
		dragAnimation.playState === "running";

	toggleClass(
		document.body,
		"animation-was-playing",
		dragData.wasAnimationRunningBeforePointer,
	);
	// toggleClass(
	// 	document.body,
	// 	"animation-was-paused",
	// 	!dragData.wasAnimationRunningBeforePointer,
	// );

	eachAnim((a) => {
		a.pause();
	});

	if (dragAnimationFrameFuncId == null) {
		requestAnimationFrame(() => {
			dragProgressUpdater();
		});
	}

	refreshSizes();

	dragData.isDragging = true;
	document.body.classList.add("dragging");
	toggleClass(document.body, "anim-finished", false);

	// debug
	// debugStartPointer.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
}

function dragProgressUpdater() {
	if (!animationsReady) {
		console.warn("cannot update drag progress, animations aren't ready");
		return;
	}

	document.body.style.setProperty(
		"--anim-progress-cubic",
		cubicBezier(0.4, 0, 0.2, 1)(dragAnimation.overallProgress).toFixed(9),
	);
	document.body.style.setProperty(
		"--anim-progress",
		dragAnimation.overallProgress.toFixed(9),
	);

	if (animationRunning || dragData.isDragging || !dragAnimation.finished) {
		dragAnimationFrameFuncId = requestAnimationFrame(dragProgressUpdater);
	} else {
		dragAnimationFrameFuncId = null;
	}
}

function updateDrag(e: PointerEvent) {
	if (
		!dragData.playerDraggedALot &&
		Math.abs(
			dragData.animationPointerStartProgress -
				dragAnimation.overallProgress,
		) > 0.05
	) {
		console.log("playerDraggedALot");
		dragData.playerDraggedALot = true;
		toggleClass(document.body, "dragged-a-lot", true);
	}

	let time = 0;
	let progress = 0;

	/// alternative

	// const dragRange = Math.min(500, window.innerHeight);

	// const deltaY = dragData.pointerStartY - e.clientY;
	// const deltaProgress = deltaY / dragRange;

	// progress = Math.max(
	// 	0,
	// 	Math.min(1, dragData.animationPointerStartProgress + deltaProgress),
	// );

	///

	const delta = e.clientY - dragData.pointerStartY;
	const dragDistance = Math.abs(dragData.maxY - miniPlayerInitialPosition);
	progress = dragData.animationPointerStartProgress - delta / dragDistance;

	time = progress * ANIMATION_DURATION;

	///

	dragData.latestAnimationPointerProgress = progress;
	dragData.latestAnimationPointerTime = time;

	if (!dragData.isDragFrameDirty) {
		dragData.isDragFrameDirty = true;
		runDragFrame();
	}

	// debug
	// debugCurrentPointer.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
}

function runDragFrame() {
	// if (!dragData.isDragFrameDirty) {
	// 	return;
	// }

	if (dragData.isDragging && dragData.correctCapturedPointerId == null) {
		// somehow drag was true but the pointer isn't there, let's cleanup(?)
		// TODO
		return;
	}

	if (!dragData.isDragFrameDirty) {
		return;
	}

	requestAnimationFrame(runDragFrame);

	dragData.isDragFrameDirty = false;

	eachAnim((a) => {
		// console.log(dragData.latestAnimationPointerTime)
		a.currentTime =
			Math.round((dragData.latestAnimationPointerTime as number) * 100) /
			100;

		//a.overallProgress = lastDragProgress;
	});
}

// endDrag
function clearDrag() {
	let wasDragging = dragData.isDragging;

	dragData.isDragging = false;
	toggleClass(document.body, "dragging", false);

	if (wasDragging) {
		toggleClass(document.body, "anim-finishing", true);
	} else {
		toggleClass(document.body, "animating", false);
	}

	// dragData.playerDraggedALot = false;
}

function clearCapture(elem: HTMLElement) {
	if (dragData.correctCapturedPointerId != null) {
		destroyPointerCapture(elem, dragData.correctCapturedPointerId);
		dragData.correctCapturedPointerId = null;
	}
}

function updateAttach(considerSmallDragAsClick = true) {
	//TODO: dragData.wasAnimationRunningBeforePointer

	const progress =
		dragData.currentAttach === "bottom"
			? dragAnimation.overallProgress
			: 1 - dragAnimation.overallProgress;

	const didSurpassMinRatio =
		progress > ANIMATION_ATTACHMENT_THRESHOLDS.paused;

	if (!didSurpassMinRatio) {
		if (dragData.playerDraggedALot || !considerSmallDragAsClick) {
			return;
		}
	}

	dragData.currentAttach = getOppositeAttach();

	invertAnimationDirection();
}

function invertAnimationDirection() {
	eachAnim((a) => {
		a.playbackRate *= -1;
	});
}

function ensureAnimationIsReattached() {
	const animationRateEndProgress = dragAnimation.playbackRate === 1 ? 1 : 0;

	const reachedEnd =
		dragAnimation.overallProgress === animationRateEndProgress;

	if (!reachedEnd) {
		eachAnim((a) => {
			a.play();
		});
	} else {
		eachAnim((a) => {
			a.finish();
		});
	}
}

function syncAttachClass() {
	document.body.classList.add("player-attached-" + dragData.currentAttach);
	document.body.classList.remove("player-attached-" + getOppositeAttach());
}

function updateElementsInteractibilityBasedOnAttach() {
	isDockOpen = dragData.currentAttach === "top";

	updateElementsInert();
}

function updateElementsInert() {
	const shouldPageGetInerted = isDockOpen;

	// document.body.style.pointerEvents = shouldPageGetInerted ? "none" : "auto";
	// document.body.style.touchAction = shouldPageGetInerted ? "none" : "auto";

	// document.body.style.overflow = shouldPageGetInerted ? "hidden" : "auto";

	// PAGE_ELEMENTS.pageScroller.inert = shouldPageGetInerted;
	// PAGE_ELEMENTS.pageScroller.style.overflow = shouldPageGetInerted
	// 	? // do NOT use "clip" here
	// 		"hidden"
	// 	: "auto";

	// document.body.style.overflow = shouldPageGetInerted ? "hidden" : "auto";

	// if (
	// 	// a dumb check, we imply that with touch there's no scrollbar style.
	// 	// this probably needs a better check for mobile browsers
	// 	navigator.maxTouchPoints == 0 ||
	// 	document.body.style.overflow == "hidden"
	// ) {
	// 	document.body.style.overflow = shouldPageGetInerted ? "hidden" : "auto";
	// }

	const shouldPlayerInnerPageGetInerted = !isDockOpen;

	// BOTTOM_DOCK_ELEMENTS.playerInnerPage.inert =
	// 	shouldPlayerInnerPageGetInerted;

	if (!shouldPlayerInnerPageGetInerted) {
		// TODO: use CSS class instead
		BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.pointerEvents = "all";
		BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.touchAction = "pan-down";

		// BOTTOM_DOCK_ELEMENTS.miniPlayer.style.pointerEvents = "none";
		// BOTTOM_DOCK_ELEMENTS.miniPlayer.inert = true;
	} else {
		// Scroll inner player page to the top, just in case
		BOTTOM_DOCK_ELEMENTS.playerInnerPage.scrollTo({
			top: 0,
			behavior: "smooth",
		});

		BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.pointerEvents = "none";
		BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.touchAction = "none";

		// BOTTOM_DOCK_ELEMENTS.miniPlayer.style.pointerEvents = "all";
		// BOTTOM_DOCK_ELEMENTS.miniPlayer.inert = false;
	}
}

//////

export function onMount() {
	preparePlayerDockProperties(() => {
		onPageFullyLoaded();
	});
}

// window.addEventListener("load", () => {
// 	document.fonts.ready.then(() => {
// 		preparePlayerDockProperties(() => {
// 			onPageFullyLoaded();
// 		});
// 	});
// });

function registerPointerCapture(elem: HTMLElement, e: PointerEvent): boolean {
	const { pointerId } = e;

	if (!elem.isConnected) {
		console.warn("Cannot capture: element is not connected to the DOM.");
		return false;
	}

	if (!(e instanceof PointerEvent)) {
		console.warn("Cannot capture: not a PointerEvent.");
		return false;
	}

	// Pointer has to be "active"
	if (e.buttons === 0 && e.pointerType !== "touch") {
		console.warn("Cannot capture: pointer is no longer active.");
		return false;
	}

	try {
		elem.setPointerCapture(pointerId);
	} catch (err) {
		console.warn("setPointerCapture() threw:", err);
		return false;
	}

	// // TODO: this might fail on some browsers, we probably need to verify with `gotpointercapture`
	// if (!elem.hasPointerCapture(pointerId)) {
	// 	console.warn(
	// 		"setPointerCapture() completed but capture was not acquired.",
	// 	);
	// 	return false;
	// }

	// DEBUG_DATA.registeredPointerCaptureId = pointerId;

	console.info(
		"executed setPointerCapture() for ",
		elem,
		"for id ",
		pointerId,
	);

	return true;
}

function destroyPointerCapture(elem: HTMLElement, pointerId: number): boolean {
	if (!elem.hasPointerCapture(pointerId)) {
		console.warn(
			"Cannot release capture: element does not own the capture.",
		);
		return false;
	}

	try {
		elem.releasePointerCapture(pointerId);
	} catch (err) {
		console.warn("releasePointerCapture() threw:", err);
		return false;
	}

	console.info(
		"executed releasePointerCapture() for ",
		elem,
		"for id ",
		pointerId,
	);

	// DEBUG_DATA.registeredPointerCaptureId = null;

	return true;
}

type TrackItem = {
	title: string;
	artist: string;
	image: string;
	trackUrl: string;
};

function setAudioPlaybackRate(rate: number) {
	AUDIO_DATA.audio.playbackRate = rate;
}

function setMiniPlayerTrackData(data: TrackItem | null) {
	let dataElement = BOTTOM_DOCK_ELEMENTS.miniPlayerData;

	(dataElement.querySelector(".track-name") as HTMLElement).innerText =
		data?.title ?? "-";
	(dataElement.querySelector(".track-artist") as HTMLElement).innerText =
		data?.artist ?? "-";

	// TODO: set image here?
}

function setAudioTrack(data: TrackItem | null) {
	if (data == null) {
		setMiniPlayerTrackData(null);
		clearTrackImage();
		return false;
	}

	AUDIO_DATA.audio.src = data.trackUrl;

	setMiniPlayerTrackData(data);

	const image = new Image();
	image.crossOrigin = "anonymous";
	image.src = data.image;
	image.decode().then(() => {
		makeBlurredImageAsync(image, (normalUrl, blurredUrl) => {
			document.body.style.setProperty(
				"--track-image",
				"url(" + normalUrl + ")",
			);

			document.body.style.setProperty(
				"--track-image-blurred",
				"url(" + blurredUrl + ")",
			);
		});
	});

	return true;
}

function clearTrackImage() {
	document.body.style.setProperty(
		"--track-image",
		"linear-gradient(to bottom, transparent, transparent)",
	);
}

async function makeBlurredImageAsync(
	image: HTMLImageElement,
	onDrawFinished: (normalBlobUrl: string, blurredBlobUrl: string) => void,
) {
	normalCanvasCtx.clearRect(0, 0, NORMAL_CANVAS_SIZE, NORMAL_CANVAS_SIZE);
	normalCanvasCtx.drawImage(
		image,
		0,
		0,
		NORMAL_CANVAS_SIZE,
		NORMAL_CANVAS_SIZE,
	);

	blurredCanvasCtx.clearRect(
		-CANVAS_BLUR_PIXEL,
		-CANVAS_BLUR_PIXEL,
		BLURRED_CANVAS_SIZE + CANVAS_BLUR_PIXEL * 2,
		BLURRED_CANVAS_SIZE + CANVAS_BLUR_PIXEL * 2,
	);

	let normalBlob: Blob | Promise<Blob> = canvasToBlob(normalCanvas);

	blurredCanvasCtx.filter = "blur(" + CANVAS_BLUR_PIXEL + "px)";

	blurredCanvasCtx.drawImage(
		image,
		-CANVAS_BLUR_PIXEL,
		-CANVAS_BLUR_PIXEL,
		BLURRED_CANVAS_SIZE + CANVAS_BLUR_PIXEL * 2,
		BLURRED_CANVAS_SIZE + CANVAS_BLUR_PIXEL * 2,
	);

	blurredCanvasCtx.filter = "none";

	let blurredBlob: Blob | Promise<Blob> = canvasToBlob(blurredCanvas);

	normalBlob = await normalBlob;
	blurredBlob = await blurredBlob;

	if (normalBlob == null || blurredBlob == null) {
		throw new Error("blob missing");
	}

	const newImageUrl = URL.createObjectURL(normalBlob);
	const newImageBlurredUrl = URL.createObjectURL(blurredBlob);

	onDrawFinished(newImageUrl, newImageBlurredUrl);

	if (currentTrackImageUrl) {
		URL.revokeObjectURL(currentTrackImageUrl);
	}
	if (currentTrackImageBlurredUrl) {
		URL.revokeObjectURL(currentTrackImageBlurredUrl);
	}

	currentTrackImageUrl = newImageUrl;
	currentTrackImageBlurredUrl = newImageBlurredUrl;

	function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob != null) {
						resolve(blob);
					} else {
						reject(new Error("Unable to create Blob"));
					}
				},
				"image/webp",
				0.8,
			);
		});
	}
}

////// utility

function eachAnim(callback: (a: Animation) => void) {
	for (let i = 0; i < allDragAnimations.length; ++i) {
		callback(allDragAnimations[i]);
	}
}

function toggleClass(
	elem: HTMLElement,
	elemClass: string,
	forcedBoolean: null | boolean = null,
) {
	if (forcedBoolean === null) {
		forcedBoolean = !elem.classList.contains(elemClass);
	}

	forcedBoolean
		? elem.classList.add(elemClass)
		: elem.classList.remove(elemClass);
}

function getOppositeAttach() {
	return dragData.currentAttach === "bottom" ? "top" : "bottom";
}

function getPercentage(value, min, max) {
	return getNormalizedRange(value, min, max) * 100;
}

function getNormalizedRange(value, min, max) {
	return (value - min) / (max - min);
}

function easeOutCubic(t: number) {
	return 1 - Math.pow(1 - t, 3);
}

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
	return function (x: number) {
		let t0 = 0;
		let t1 = 1;
		let t = x;

		for (let i = 0; i < 20; i++) {
			const x_t =
				3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3;

			if (Math.abs(x_t - x) < 1e-6) break;

			if (x_t < x) t0 = t;
			else t1 = t;

			t = (t0 + t1) / 2;
		}

		return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
	};
}

function updatePlayerInnerPageScrollBehaviour() {
	if (ensuredPlayerInnerPageHasNoScroll()) {
		BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.touchAction = "pan-down";
	} else {
		BOTTOM_DOCK_ELEMENTS.playerInnerPage.style.touchAction = "pan-y";
	}
}

function ensuredPlayerInnerPageHasNoScroll() {
	// less or equal check just in case (I'm looking at you, Safari)
	return BOTTOM_DOCK_ELEMENTS.playerInnerPage.scrollTop <= 0;
}

/// generated types

interface IColorThief {
	getColorSync(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): {
		r: number;
		g: number;
		b: number;
		population: number;
	};

	getPaletteSync(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): Array<{
		r: number;
		g: number;
		b: number;
		population: number;
	}>;

	getSwatchesSync(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): Array<{
		r: number;
		g: number;
		b: number;
		population: number;
	}>;

	getColor(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): Promise<{
		r: number;
		g: number;
		b: number;
		population: number;
	}>;

	getPalette(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): Promise<
		Array<{
			r: number;
			g: number;
			b: number;
			population: number;
		}>
	>;

	getSwatches(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): Promise<
		Array<{
			r: number;
			g: number;
			b: number;
			population: number;
		}>
	>;

	getPaletteProgressive(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options?: object,
	): AsyncGenerator<
		Array<{
			r: number;
			g: number;
			b: number;
			population: number;
		}>
	>;

	observe(
		source:
			| ImageData
			| HTMLImageElement
			| HTMLCanvasElement
			| HTMLVideoElement
			| string,
		options: object,
	): AsyncGenerator<
		Array<{
			r: number;
			g: number;
			b: number;
			population: number;
		}>
	>;

	createColor(
		r: number,
		g: number,
		b: number,
		population: number,
	): {
		r: number;
		g: number;
		b: number;
		population: number;
	};
}

declare const ColorThief: IColorThief;
// declare global {
// 	const ColorThief: IColorThief;
// }
// export {};

// interface Animation {
// 	/**
// 	 * A number between `0` and `1`, or `null` if the animation lacks a timeline, is inactive or hasn't been played yet, or if its `currentTime` is set to a non-time value.
// 	 *
// 	 * If the animation's `iterations` property is set to `Infinity`, or if its `currentTime` is set to a negative value, `overallProgress` will return `0`.
// 	 *
// 	 * If the animation's `duration` is set to `0`, `overallProgress` will return `1`.
// 	 */
// 	// @ts-ignore
// 	overallProgress: number;
// }
