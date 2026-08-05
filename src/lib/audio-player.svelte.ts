import { AudioPlayer as CapacitorAudio } from "@mediagrid/capacitor-native-audio";
import { cconsole } from "./logger.svelte";
import type { CapacitorException } from "@capacitor/core";

// TODO: web player
let audioPlayerCreated = $state(false);

let audioId = generateAudioId();

let isPlaying = $state(false);

let domAudioCheckInterval: NodeJS.Timeout | undefined = undefined;

let trackDuration = $state(NaN);
let trackTime = $state(NaN);

// used in player dock
let mainTrackData = $state({
	title: "...",
	artist: "...",
});

export async function createAudioPlayer(
	url: string,
	trackData: {
		title: string;
		artist: string;
		albumTitle: string;
		duration: number;
	},
) {
	mainTrackData.title = trackData.title;
	mainTrackData.artist = trackData.artist;

	if (audioPlayerCreated) {
		clearInterval(domAudioCheckInterval);
		// TODO: change track and all of that
		await CapacitorAudio.changeAudioSource({
			audioId,
			source: url,
		});
		await CapacitorAudio.changeMetadata({
			audioId,
			friendlyTitle: trackData.title,
			artistName: trackData.artist,
			albumTitle: trackData.albumTitle,
		});
		await CapacitorAudio.play({
			audioId,
		});

		updateDuration(trackData.duration);
		await startTicking();

		return;
	}

	audioPlayerCreated = true;

	await CapacitorAudio.create({
		audioId,
		audioSource: url,
		friendlyTitle: trackData.title,
		artistName: trackData.artist,
		albumTitle: trackData.albumTitle,
		// artworkSource // inherited
		useForNotification: true,
		showSeekBackward: true,
		showSeekForward: true,
		seekBackwardTime: 10,
		seekForwardTime: 10,
		loop: false, // TODO
	})
		.then(() => {
			cconsole.log("audio player: player created");
		})
		.catch((e: CapacitorException) => {
			cconsole.error(`audio player: player creation error: ${e}`);
		});

	await CapacitorAudio.onAudioReady(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player: audio ready");
		},
	);
	await CapacitorAudio.onAudioEnd(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player: audio ended");
		},
	);
	await CapacitorAudio.onMetadataUpdate(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player: metadata updated");
		},
	);
	await CapacitorAudio.onAppGainsFocus(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player: app is in foreground");
			startTicking();
		},
	);
	await CapacitorAudio.onAppLosesFocus(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player: app is in background");
			clearInterval(domAudioCheckInterval);
		},
	);
	await CapacitorAudio.onPlaybackStatusChange(
		{
			audioId,
		},
		(result) => {
			cconsole.log(`audio player: playback status changed to "${result.status}"`);

			isPlaying = result.status === "playing";
		},
	);

	await CapacitorAudio.initialize({
		audioId,
	})
		.then(() => {
			cconsole.log("audio player: initialized");
		})
		.catch((e) => {
			cconsole.error(`audio player: init error.`, e);
		});

	startTicking();

	await CapacitorAudio.play({
		audioId,
	});

	updateDuration(trackData.duration);
}

function updateDuration(value: number) {
	trackDuration = value;
}

// // TODO: await for track change
// async function updateDuration() {
// 	trackDuration = (
// 		await CapacitorAudio.getDuration({
// 			audioId,
// 		})
// 	).duration;
// }

async function startTicking() {
	domAudioCheckInterval = setInterval(async () => {
		// TODO: async guard in case we're stacking 'await's here
		trackTime = (
			await CapacitorAudio.getCurrentTime({
				audioId,
			})
		).currentTime;
	}, 1000);
}

export async function changeTrack() {
	// await CapacitorAudio.onAppGainsFocus();
	// await CapacitorAudio.onAppLosesFocus();
	// await CapacitorAudio.onPlaybackStatusChange();
	// await CapacitorAudio.setVolume()
}

function generateAudioId() {
	return "bloom-" + Date.now().toString();
}

export const trackInfo = {
	getDuration: () => trackDuration,
	getCurrentTime: () => trackTime,
	getData: () => mainTrackData,
	pauseOrResume: async () => {
		if (!audioPlayerCreated) {
			return;
		}

		// let isPlaying = (
		// 	await CapacitorAudio.isPlaying({
		// 		audioId,
		// 	})
		// ).isPlaying;

		if (isPlaying) {
			CapacitorAudio.pause({
				audioId,
			});
		} else {
			CapacitorAudio.play({
				audioId,
			});
		}
	},
	getIsPlaying: () => {
		return isPlaying;
	},
};

export class AudioPlayer {
	/**
	 *
	 */
	constructor() {}

	public async pause() {}
}
