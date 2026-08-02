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
