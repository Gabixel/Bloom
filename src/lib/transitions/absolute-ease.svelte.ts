import { linear } from "svelte/easing";
import {
	fade,
	type FadeParams,
	type TransitionConfig,
} from "svelte/transition";

/**
 * Animates the opacity of an element from 0 to the current opacity for `in` transitions and from the current opacity to 0 for `out` transitions.
 */
export function pageFade(
	node: Element,
	{
		delay = 0,
		duration = 400,
		easing = linear,
		isLeaving = true,
	}: FadeParams & { isLeaving?: boolean } = {},
): TransitionConfig {
	node.classList.toggle("leaving-page", isLeaving);

	return fade(node, {
		delay,
		duration,
		easing,
	});
}
