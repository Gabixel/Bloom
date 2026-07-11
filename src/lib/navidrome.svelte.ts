import * as IDB from "../../static/idb-keyval-6-esm.js";
import { CapacitorHttp } from "@capacitor/core";

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
		const res = await CapacitorHttp.request({
			url: `${navidrome_base}/auth/login`,
			method: "POST",
			headers: { "Content-Type": "application/json" },
			data: JSON.stringify({ username, password }),
			// credentials: 'include' // abilita se Navidrome usa cookie-based sessions
		});

		if (res.status < 200 || res.status > 299) {
			const text = res.data;
			return { error: `HTTP ${res.status}: ${text}` };
		}

		const data = await res.data;

		if (data?.token != null) {
			return data;
		}

		return { error: "No token in response" };
	} catch (e: any) {
		return { error: e?.message ?? "Network error" };
	}
}

export function authFetch(input: RequestInfo) {
	input = getSubsonicApiPath(input);

	const token = localStorage.getItem("nd_token");
	// const headers = new Headers(init.headers ?? {});
	let headers: { [key: string]: string } = {};

	if (token) headers["X-ND-Authorization"] = `Bearer ${token}`;

	return CapacitorHttp.request({
		url: input,
		// ...init,
		method: "GET",
		headers
	});
}

export function getSubsonicApiPath(input: RequestInfo) {
	return navidrome_base + input;
}
