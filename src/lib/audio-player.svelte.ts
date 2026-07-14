

let audioElement: HTMLAudioElement = $state()!;

export function storeAudioPlayer(audio: HTMLAudioElement) {
	audioElement = audio;
}

// TODO: just expose some play/pause/etc.
export function getAudioPlayer() {
	return audioElement;
}

export function deleteAudioPlayer() {
	audioElement = null!;
}
