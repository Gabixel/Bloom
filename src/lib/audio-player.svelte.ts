import { GGCAudio } from "@gabigroup/capacitor-audio-player";
import { cconsole } from "./logger.svelte";
import type { CapacitorException } from "@capacitor/core";
import { authFetch } from "./navidrome.svelte";

let currentTrackPlayerIndex = -1;
let scrobbleStartRequested = false;
let lastUpdateTs: number | null = null;
let scrobbled: "yes" | "no" | "maybe" = "no";
let lastTrackPosition = 0;
let trackMsListened = 0;

export async function listenAudioEvents() {
	getStatus();

	// TODO: this scrobble logic might "break" when the app is in background, we need to port this logic somewhere else:
	// - a background JS runner? (https://capacitorjs.com/docs/apis/background-runner)
	// - in the native audio plugin itself?
	GGCAudio.addListener("playbackStateChange", (e) => {
		if (e.currentTrack == null || e.currentTrack.id == null) return;

		if (e.isLiveStream) {
			return;
		}

		if (!scrobbleStartRequested) {
			return;
		}

		if (scrobbled !== "no") {
			return;
		}

		const now = Date.now();

		if (lastUpdateTs === null) {
			lastUpdateTs = now;
			lastTrackPosition = e.position;
			return;
		}

		const deltaTime = now - lastUpdateTs;
		const deltaPos = e.position - lastTrackPosition;

		// If delta isn't too high (e.g. after seeking)
		if (deltaPos < 2000) {
			trackMsListened += deltaTime;
		}

		lastUpdateTs = now;
		lastTrackPosition = e.position;

		// Scrobble checks
		const listenedEnoughTime = trackMsListened >= 240_000;
		const listenedHalfTrack =
			e.duration > 0 && trackMsListened >= e.duration * 0.5;

		if (listenedEnoughTime || listenedHalfTrack) {
			scrobbled = "maybe";
			cconsole.log("scrobbling track id", e.currentTrack.id);
			doScrobble(currentTrackPlayerIndex, e.currentTrack.id);
		}
	});

	GGCAudio.addListener("trackChange", (event) => {
		cconsole.log("TRACK", event);
	});

	// GGCAudio.addListener("playlistChange", (event) => {
	// 	cconsole.log("QUEUE", event);
	// });

	GGCAudio.addListener("notificationTap", (event) => {
		cconsole.log("NOTIFICATION TAP", event);
	});

	GGCAudio.addListener("error", (error) => {
		cconsole.error("AUDIO ERROR", error);
	});

	retrieveMediaDevices();
	navigator.mediaDevices.addEventListener("devicechange", async (event) => {
		cconsole.log("Device configuration changed!");

		retrieveMediaDevices();
	});

	async function retrieveMediaDevices() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const audioOutputs = devices.filter(
				(device) => device.kind === "audiooutput",
			);

			console.log("New output list:", audioOutputs);
		} catch (error) {
			console.error("Error while obtaining audio devices:", error);
		}
	}
}

export async function pauseTrack() {
	await GGCAudio.pause();
}
export async function resumeTrack() {
	await GGCAudio.play();
}

export async function playTrack(url: string, trackData: any) {
	scrobbleStartRequested = false;
	scrobbled = "no";
	trackMsListened = 0;
	lastTrackPosition = 0;
	lastUpdateTs = null;
	currentTrackPlayerIndex++;
	await GGCAudio.start({
		autoPlay: true,
		track: {
			url,
			id: trackData.id,
			artwork: trackData.image,
			title: trackData.title,
			artist: trackData.artist,
		},
	});
	informScrobbleAboutTrackStart(currentTrackPlayerIndex, trackData.id);
	cconsole.log("informed about track id", trackData.id);

	// await GGCAudio.play();
}

function informScrobbleAboutTrackStart(
	trackPlayerIndex: number,
	trackId: string,
) {
	authFetch(
		`/rest/scrobble?id=${trackId}&time=${Date.now()}&submission=false`,
	).then(() => {
		if (currentTrackPlayerIndex != trackPlayerIndex) {
			return;
		}

		scrobbleStartRequested = true;
	});
}

function doScrobble(trackPlayerIndex: number, trackId: string) {
	authFetch(`/rest/scrobble?id=${trackId}&time=${Date.now()}&submission=true`)
		.then(() => {
			if (currentTrackPlayerIndex != trackPlayerIndex) {
				return;
			}

			scrobbled = "yes";
			cconsole.log("scrobbled track id", trackId);
		})
		.catch((e) => {
			if (currentTrackPlayerIndex != trackPlayerIndex) {
				return;
			}

			scrobbled = "no";
			cconsole.error("error scrobbling track id", trackId, ":", e);
		});
}

export async function getStatus() {
	let status = await GGCAudio.getStatus();

	cconsole.log("[GCCAudio] status:", status);

	return status;
}

export class AudioPlayer {
	/**
	 *
	 */
	constructor() {}

	public async pause() {}
}
