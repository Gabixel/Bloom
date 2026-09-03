<script lang="ts">
	import LoadingIcon from "../../lib/layouts/ui/LoadingIcon.svelte";
	import { authFetch } from "../../lib/navidrome.svelte";

	let searchText = $state("");

	let searching = $state(false);

	let results = $state({
		album: [] as any[],
		artist: [] as any[],
		track: [] as any[],
		station: [] as any[],
		playlist: [] as any[],
	} as {
		[any: string]: any[];
	});
	let keys = Object.keys(results);

	// TODO: clickable chips to filter the type of search?
	async function runSearch() {
		results["album"] = [];
		results["artist"] = [];
		results["track"] = [];
		results["station"] = [];
		results["playlist"] = [];

		if (searchText == "") {
			return;
		}

		searching = true;

		// Album
		const albumSearchAsync = authFetch(
			`/api/album?_end=15&_start=0&_order=ASC` +
				`&_sort=name&name=${encodeURI(searchText)}`,
		)
			.then((result) =>
				result
					? result.json()
					: new Promise((res, rej) => {
							rej();
						}),
			)
			.then((albumSearchData) => {
				console.log(albumSearchData);

				results["album"] = albumSearchData;
			});

		// Artist
		const artistSearchAsync = authFetch(
			`/api/artist?_end=15&_start=0&_order=ASC` +
				`&_sort=name&name=${encodeURI(searchText)}&role=albumartist`,
		)
			.then((result) =>
				result
					? result.json()
					: new Promise((res, rej) => {
							rej();
						}),
			)
			.then((artistSearchData) => {
				console.log(artistSearchData);

				results["artist"] = artistSearchData;
			});

		// Track/Song
		const trackSearchAsync = authFetch(
			`/api/song?_end=15&_start=0&_order=ASC` +
				`&_sort=title&title=${encodeURI(searchText)}`,
		)
			.then((result) =>
				result
					? result.json()
					: new Promise((res, rej) => {
							rej();
						}),
			)
			.then((trackSearchData) => {
				console.log(trackSearchData);

				results["track"] = trackSearchData;
			});

		// Station/Radio
		const stationSearchAsync = authFetch(
			`/api/radio?_end=15&_start=0&_order=ASC` +
				`&_sort=name&name=${encodeURI(searchText)}`,
		)
			.then((result) =>
				result
					? result.json()
					: new Promise((res, rej) => {
							rej();
						}),
			)
			.then((stationSearchData) => {
				console.log(stationSearchData);

				results["station"] = stationSearchData;
			});

		// Playlist
		const playlistSearchAsync = authFetch(
			`/api/playlist?_end=15&_start=0&_order=ASC` +
				`&_sort=name&q=${encodeURI(searchText)}`,
		)
			.then((result) =>
				result
					? result.json()
					: new Promise((res, rej) => {
							rej();
						}),
			)
			.then((playlistSearchData) => {
				console.log(playlistSearchData);

				results["playlist"] = playlistSearchData;
			});

		await Promise.all([
			albumSearchAsync,
			artistSearchAsync,
			trackSearchAsync,
			stationSearchAsync,
			playlistSearchAsync,
		]);

		searching = false;
	}
</script>

<h1 style="text-align:center;">Soon!</h1>

<div style="text-align: center;">
	<input
		type="search"
		name="search"
		id="search-bar"
		style="width: 90%;padding:1rem;margin-bottom:0.5rem"
		bind:value={searchText}
	/>
	<button
		style="font-size:1.5rem"
		onclick={() => {
			runSearch();
		}}
	>
		Search
	</button>

	<div>
		{#if searching}
			<LoadingIcon delayFade={0}></LoadingIcon>
		{/if}

		<!-- {#key `${results.album.length}${results.artist.length}${results.track.length}${results.station.length}${results.playlist.length}`}
		{/key} -->
		<div
			style="max-width: 100%;white-space: pre-line;word-break: break-word;"
		>
			{#each keys as r}
				<p>
					{r}:<br />
					<span
						style="font-size: 0.8rem;font-family: monospace, monospace;"
						>{JSON.stringify(results[r])}</span
					>
				</p>
			{/each}
		</div>
	</div>
</div>
