import { AudioPlayer } from "@mediagrid/capacitor-native-audio";
import { cconsole } from "./logger.svelte";
import type { CapacitorException } from "@capacitor/core";

// TODO: web player
let audioPlayerCreated = $state(false);

let audioId = generateAudioId();

export async function createAudioPlayer(url: string) {
	if (audioPlayerCreated) {
		// TODO: change track and all of that
		await AudioPlayer.changeAudioSource({
			audioId,
			source: url,
		});
		await AudioPlayer.changeMetadata({
			audioId,
			friendlyTitle: "Test title 2",
		});
		await AudioPlayer.play({
			audioId,
		});

		return;
	}

	audioPlayerCreated = true;

	await AudioPlayer.create({
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

	await AudioPlayer.onAudioReady(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player ready");
		},
	);
	await AudioPlayer.onAudioEnd(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player ended");
		},
	);
	await AudioPlayer.onMetadataUpdate(
		{
			audioId,
		},
		() => {
			cconsole.log("audio player ended");
		},
	);

	await AudioPlayer.initialize({
		audioId,
	})
		.then(() => {
			cconsole.log("audio player initialized");
		})
		.catch((e) => {
			cconsole.error(`audio player init error: ${e}`);
		});

	await AudioPlayer.play({
		audioId,
	});
}

export async function changeTrack() {
	// await AudioPlayer.onAppGainsFocus();
	// await AudioPlayer.onAppLosesFocus();
	// await AudioPlayer.onPlaybackStatusChange();
	// await AudioPlayer.setVolume()
}

function generateAudioId() {
	return Date.now().toString();
}
