// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface NavidromeRadioObject {
		id: string;
		streamUrl: string;
		name: string;
		homePageUrl?: string;
		/** Timestamp */
		createdAt: string;
		/** Timestamp */
		updatedAt?: string;
	}
}

export {};
