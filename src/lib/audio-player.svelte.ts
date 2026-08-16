import { GGCAudio } from "@gabigroup/capacitor-audio-player";
import { cconsole } from "./logger.svelte";
import type { CapacitorException } from "@capacitor/core";

export async function listenAudioEvents() {
	getStatus();

	// GGCAudio.addListener("playbackStateChange", (status) => {
	// 	// if (status.playbackState != "playing") return;
	// });

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
}

export async function pauseTrack() {
	await GGCAudio.pause();
}
export async function resumeTrack() {
	await GGCAudio.play();
}

export async function playTrack(url: string, trackData: any) {
	await GGCAudio.start({
		autoPlay: true,
		track: {
			url,
			artwork: trackData.image,
			title: trackData.title,
			artist: trackData.artist,
		},
	});

	// await GGCAudio.play();
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
