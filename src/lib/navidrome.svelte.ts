import * as IDB from "../../static/idb-keyval-6-esm.js";

/*
 * u = username
 * p = password
 * t = auth token
 * s = salt for the token
 * v = version
 * c = client name
 * f = response format (xml, json)
 */

export const CLIENT_NAME = "Bloom [GG]";
export const CLIENT_NAME_URL = encodeURI(CLIENT_NAME);

export type LoginResult =
	| {
			avatar: string;
			id: string;
			isAdmin: boolean;
			name: string;
			subsonicSalt: string;
			subsonicToken: string;
			token: string;
			username: string;
	  }
	| { error: string };

let navidrome_base: string = $state("");

export const navidromeData = {
	navidromeBaseUrl: () => navidrome_base,
};

export function setNavidromeUrl(url: string) {
	navidrome_base = url;
	localStorage.setItem("nd_url", url);
}

export async function login(
	username: string,
	password: string,
): Promise<LoginResult> {
	const url = `${navidrome_base}/auth/login`;

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
			// credentials: 'include' // TODO: enable if cookie sessions are a thing
		});

		if (!res.ok) {
			const text = res.text();
			return { error: `HTTP ${res.status}: ${text}` };
		}

		const data = await res.json();

		if (data?.token != null) {
			return data;
		}

		return { error: "No token in response" };
	} catch (e: any) {
		return { error: e?.message ?? "Network error" };
	}
}

/**
 * Authenticated request for Navidrome endpoints.
 */
export function authFetch(inputUrl: RequestInfo, init: RequestInit = {}) {
	inputUrl = getSubsonicApiPath(inputUrl);

	const token = localStorage.getItem("nd_token");

	const headers = new Headers(init.headers ?? {});

	if (token) headers.set("X-ND-Authorization", `Bearer ${token}`);

	return fetch(inputUrl, {
		method: "GET",
		...init,
		headers,
	});
}

export function getSubsonicApiPath(input: RequestInfo) {
	return navidrome_base + input;
}
