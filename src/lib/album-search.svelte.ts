const AlbumVisibileEvent = new CustomEvent("album-visible");

export const AlbumIntersectionObserver = new IntersectionObserver(
	(entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				return;
			}

			const elem = entry.target;
			elem.dispatchEvent(AlbumVisibileEvent);

			observer.unobserve(elem);
		});
	},
);

/**
 * A map containing Blob source URLs, keyed by hashed base URLs.
 *
 * `Map<[hash], [blob object URL]>`
 */
export let imageMap = new Map<string, string>();
