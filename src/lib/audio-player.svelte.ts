import {
	createStreamingSoundAsync,
	createAudioEngineAsync,
	type AudioEngine,
	unlockAudioEngineAsync,
	type StreamingSound,
	disposeStreamingSound,
	setStreamingSoundVolume,
	createSoundAsync,
	type StaticSound,
	disposeSound,
} from "@babylonjs/lite";

const audioContext = new AudioContext();
let testAudioEngine: AudioEngine = null!;

createAudioEngineAsync({
	audioContext: audioContext,
}).then(async (engine) => {
	testAudioEngine = engine;

	await unlockAudioEngineAsync(testAudioEngine);
});

let finalAudio: StaticSound | null = null;

// export async function playMusic(src: string) {
export async function playMusic(buffer: ArrayBuffer) {
	if (finalAudio != null) {
		disposeSound(finalAudio);
		finalAudio = null;
	}

	return createSoundAsync(testAudioEngine, buffer as any, {
		autoplay: true,
		loop: false,
		maxInstances: 1,
	}).then((sound) => {
		finalAudio = sound;
	});
}

// setStreamingSoundVolume()
