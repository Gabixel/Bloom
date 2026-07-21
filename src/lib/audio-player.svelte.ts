import { AudioPlayer as CapacitorAudio } from "@mediagrid/capacitor-native-audio";
import { cconsole } from "./logger.svelte";
import type { CapacitorException } from "@capacitor/core";

// TODO: web player
let audioPlayerCreated = $state(false);

let audioId = generateAudioId();

let domAudioCheckInterval: NodeJS.Timeout | undefined = undefined;

let trackDuration = $state(NaN);
let trackTime = $state(NaN);

export async function createAudioPlayer(url: string) {
	if (audioPlayerCreated) {
		clearInterval(domAudioCheckInterval);
		// TODO: change track and all of that
		await CapacitorAudio.changeAudioSource({
			audioId,
			source: url,
		});
		await CapacitorAudio.changeMetadata({
			audioId,
			friendlyTitle: "Test title 2",
		});
		await CapacitorAudio.play({
			audioId,
		});

		await updateDuration();
		await startTicking();

		return;
	}

	audioPlayerCreated = true;

	await CapacitorAudio.create({
		audioId,
		audioSource: url,
		friendlyTitle: "Test title",
		// artistName: "test",
		// albumTitle: "test",
		// artworkSource // inherited
		useForNotification: true,
		showSeekBackward: true,
		showSeekForward: true,
		loop: false, // TODO
	})
		.then(() => {
			cconsole.log("audio player created");
		})
		.catch((e: CapacitorException) => {
			cconsole.error(`audio player creation error: ${e}`);
		});

	await CapacitorAudio.onAudioReady(
		{
			audioId,
		},
		() => {
			cconsole.log("audio ready");
		},
	);
	await CapacitorAudio.onAudioEnd(
		{
			audioId,
		},
		() => {
			cconsole.log("audio ended");
		},
	);
	await CapacitorAudio.onMetadataUpdate(
		{
			audioId,
		},
		() => {
			cconsole.log("audio metadata updated");
		},
	);
	await CapacitorAudio.onAppGainsFocus(
		{
			audioId,
		},
		() => {
			cconsole.log("app is in foreground");
			startTicking();
		},
	);
	await CapacitorAudio.onAppLosesFocus(
		{
			audioId,
		},
		() => {
			cconsole.log("app is in background");
			clearInterval(domAudioCheckInterval);
		},
	);
	await CapacitorAudio.onPlaybackStatusChange(
		{
			audioId,
		},
		(result) => {
			cconsole.log("playback status changed to:", result);
		},
	);

	await CapacitorAudio.initialize({
		audioId,
	})
		.then(() => {
			cconsole.log("audio player initialized");
		})
		.catch((e) => {
			cconsole.error(`audio player init error: ${e}`);
		});

	startTicking();

	await CapacitorAudio.play({
		audioId,
	});

	await updateDuration();
}

// TODO: await for track change
async function updateDuration() {
	trackDuration = (
		await CapacitorAudio.getDuration({
			audioId,
		})
	).duration;
}

async function startTicking() {
	domAudioCheckInterval = setInterval(() => {
		CapacitorAudio.getCurrentTime({
			audioId,
		});
	}, 1000);
}

export async function changeTrack() {
	// await CapacitorAudio.onAppGainsFocus();
	// await CapacitorAudio.onAppLosesFocus();
	// await CapacitorAudio.onPlaybackStatusChange();
	// await CapacitorAudio.setVolume()
}

function generateAudioId() {
	return Date.now().toString();
}

export const trackInfo = {
	getDuration: () => trackDuration,
	getCurrentTime: () => trackTime,
	pauseOrResume: async () => {
		if (!audioPlayerCreated) {
			return;
		}

		let isPlaying = (
			await CapacitorAudio.isPlaying({
				audioId,
			})
		).isPlaying;

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
};

export class AudioPlayer {
	/**
	 *
	 */
	constructor() {}

	public async pause() {}
}
