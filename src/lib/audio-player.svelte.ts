
import { GGCAudio } from "@gabigroup/capacitor-audio-player";
import { cconsole } from "./logger.svelte";
import type { CapacitorException } from "@capacitor/core";

export async function playTrack(url: string, trackData: any) {
	await GGCAudio.prepare({
		item: {
			url: url,
			title: trackData.title,
			artist: trackData.artist,
			artwork: trackData.image,
		},
	});

	await GGCAudio.play();
}

export class AudioPlayer {
	/**
	 *
	 */
	constructor() {}

	public async pause() {}
}
