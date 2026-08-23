import { cconsole } from "./logger.svelte";
import { authFetch, CLIENT_NAME } from "./navidrome.svelte";

type user = {
	id: string;
	name: string;
	username: string;
};

let userData: user = $state(null!);
let isLoggedIn = $state(false);

let navidromeToken: string = $state(null!);
let navidromeSubsonicToken: string = $state(null!);
let navidromeSubsonicSalt: string = $state(null!);

export const authData = {
	userData: () => userData,
	isLoggedIn: () => isLoggedIn,
	navidromeToken: () => navidromeToken,
	navidromeSubsonicToken: () => navidromeSubsonicToken,
	navidromeSubsonicSalt: () => navidromeSubsonicSalt,
};

export function storeUser(
	data: user & {
		token: string;
		subsonicToken: string;
		subsonicSalt: string;
	},
) {
	localStorage.setItem("nd_token", data.token);
	navidromeToken = data.token;
	localStorage.setItem("s_token", data.subsonicToken);
	navidromeSubsonicToken = data.subsonicToken;
	localStorage.setItem("s_salt", data.subsonicSalt);
	navidromeSubsonicSalt = data.subsonicSalt;

	userData = data;
	isLoggedIn = true;
}

export function destroyUserData() {
	userData = null!;
	localStorage.removeItem("nd_token");
	localStorage.removeItem("s_token");
	localStorage.removeItem("s_salt");
	isLoggedIn = false;
}

export function jwtTranslate(token: string) {
	const payload: any = JSON.parse(
		atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
	);

	return {
		/** Admin flag */
		adm: payload.adm as boolean,
		/** Expiration time */
		exp: payload.exp as number,
		/** Issued at */
		iat: payload.iat as number,
		/** Issuer */
		iss: payload.iss as string,
		/** Subject (username) */
		sub: payload.sub as string,
		/** User id */
		uid: payload.uid as string,
	};
}

let keepAliveInterval: NodeJS.Timeout | undefined = undefined;
export function startKeepAliveInterval() {
	if (keepAliveInterval != undefined) {
		return;
	}

	// let fetching = false;

	// keepAliveInterval = setInterval(() => {
	// 	if (fetching) {
	// 		return;
	// 	}

	// 	fetching = true;

	// 	authFetch(
	// 		`/api/keepalive/keepalive?u=${authData.userData().username}&v=1.16.1&c=${CLIENT_NAME}` +
	// 			`&t=${authData.navidromeSubsonicToken()}&s=${authData.navidromeSubsonicSalt()}&f=json`,
	// 	)
	// 		.then(async (result) => {
	// 			if (result == null) {
	// 				cconsole.warn("missing result data from keepalive");
	// 				return;
	// 			}

	// 			const newToken = result.headers.get("x-nd-authorization");

	// 			if (newToken == null) {
	// 				cconsole.warn("missing keepalive new token");
	// 			}
	// 		})
	// 		.finally(() => {
	// 			fetching = false;
	// 		});
	// }, 30_000);
}
export function stopKeepAliveInterval() {
	clearInterval(keepAliveInterval);
	keepAliveInterval = undefined;
}

export function toggleKeepAliveInterval(bool: boolean) {
	if (bool) {
		startKeepAliveInterval();
	} else {
		stopKeepAliveInterval();
	}
}

/** @see https://stackoverflow.com/a/7616484/16804863 */
export function hashString(str: string) {
	let hash = 0;
	for (const char of str) {
		hash = (hash << 5) - hash + char.charCodeAt(0);
		hash |= 0; // Constrain to 32bit integer
	}
	return hash.toString();
}
