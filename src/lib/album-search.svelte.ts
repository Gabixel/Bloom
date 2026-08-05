let lastSearch = $state({
	searchInput: "",
	albumList: [],
});

export const searchData = {
	getLastSearchData: () => {
		return lastSearch;
	},
	update: (newSearch: typeof lastSearch) => {
		lastSearch = newSearch;
	},
};

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
