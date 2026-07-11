import * as IDB from "../../static/idb-keyval-6-esm.js"

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
	try {
		const res = await fetch(`${navidrome_base}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
			// credentials: 'include' // abilita se Navidrome usa cookie-based sessions
		});

		if (!res.ok) {
			const text = await res.text();
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

export function authFetch(input: RequestInfo, init: RequestInit = {}) {
	input = getSubsonicApiPath(input);

	const token = localStorage.getItem("nd_token");
	const headers = new Headers(init.headers ?? {});
	if (token) headers.set("X-ND-Authorization", `Bearer ${token}`);
	return fetch(input, { ...init, headers });
}

export function getSubsonicApiPath(input: RequestInfo) {
	return navidrome_base + input;
}