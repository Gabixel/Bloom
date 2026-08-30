import * as IDB from "../../static/idb-keyval-6-esm.js";
import { authData } from "./auth.svelte.js";
import { cconsole } from "./logger.svelte";

// TODO: dynamic based on URL
// TODO: make sure this isn't already an automatic thing made by browsers
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#targetaddressspace
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access
 */
export const TEST_FETCH_TARGET_ADDRESS_SPACE = {
	targetAddressSpace: "local",
} as any;

/*
 * u = username
 * p = password
 * t = auth token
 * s = salt for the token
 * v = version
 * c = client name
 * f = response format (xml, json)
 */

export const CLIENT_NAME = "Bloom App";
export const CLIENT_NAME_URL = encodeURI(CLIENT_NAME);

/** @see https://www.subsonic.org/pages/api.jsp#versions */
export const OPENSUBSONIC_REST_API_VERSION = "1.16.1";

const SEED_UPDATE_INTERVAL_SECONDS = 60;
let lastSeedTime = Date.now();
let seedRegeneratingCount = 0;

let seed = "";
generateSeed();

function regenerateSeedIfTimePassed() {
	const now = Date.now();

	if (
		Math.floor((now - lastSeedTime) / 60_000) < SEED_UPDATE_INTERVAL_SECONDS
	) {
		return;
	}

	console.warn("regenerating seed");

	seedRegeneratingCount++;

	generateSeed();
}

function generateSeed() {
	lastSeedTime = Date.now();
	seed = Date.now().toString() + "-" + seedRegeneratingCount;
}

export function getSeed() {
	regenerateSeedIfTimePassed();

	return seed;
}

export function forceNewSeed() {
	generateSeed();

	return seed;
}

// TODO: (GET: [host]/api/keepalive/keepalive)

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

let navidromeUrl: string = $state("");

export const navidromeData = {
	navidromeBaseUrl: () => navidromeUrl,
};

export function setNavidromeUrl(url: string) {
	navidromeUrl = url;
}

// VERY temporarily
export function storeLoginData(
	url: string,
	username: string,
	password: string,
) {
	let prevUrlsItem: Set<string> | string | string[] =
		localStorage.getItem("nd_prev_urls") ?? new Set();

	if (typeof prevUrlsItem === "string") {
		prevUrlsItem = JSON.parse(prevUrlsItem) as string[];

		if (Array.isArray(prevUrlsItem)) {
			prevUrlsItem = new Set(prevUrlsItem);
		} else {
			prevUrlsItem = new Set();
		}
	}

	prevUrlsItem.add(url);
	localStorage.setItem(
		"nd_prev_urls",
		JSON.stringify(
			(() => {
				let finalArray = prevUrlsItem.values().toArray();
				finalArray.length = 3;
				return finalArray;
			})(),
		),
	);

	localStorage.setItem("nd_url", url);
	localStorage.setItem("nd_username", username);
	localStorage.setItem("nd_password", password);
}

export async function login(
	fieldUrl: string,
	username: string,
	password: string,
): Promise<LoginResult> {
	const url = `${fieldUrl}/auth/login`;

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
		cconsole.error("network error", e);
		return { error: e?.message ?? "Network error" };
	}
}

/**
 * Authenticated request for Navidrome endpoints.
 */
export async function authFetch(
	inputUrl: RequestInfo,
	init: RequestInit = {},
	requestMethod: string = "GET",
): Promise<Response | null> {
	inputUrl = getSubsonicApiPath(inputUrl);

	const token = localStorage.getItem("nd_token");

	const headers = new Headers(init.headers ?? {});

	if (token) headers.set("X-ND-Authorization", `Bearer ${token}`);

	let finalUrl = new URL(inputUrl);
	finalUrl.searchParams.append("u", authData.userData().username);
	finalUrl.searchParams.append("c", CLIENT_NAME_URL);
	finalUrl.searchParams.append("v", "1.16.1"); // TODO: is this needed?
	finalUrl.searchParams.append("t", authData.navidromeSubsonicToken());
	finalUrl.searchParams.append("s", authData.navidromeSubsonicSalt());
	finalUrl.searchParams.append("f", "json");

	let fetchResult: Response | null = null;

	return new Promise(async (resolve, reject) => {
		try {
			fetchResult = await fetch(finalUrl.toString(), {
				method: requestMethod,
				...init,
				headers,
				...TEST_FETCH_TARGET_ADDRESS_SPACE,
			});
		} catch (e: any) {
			reject("network error");
			cconsole.error("network error", e);
			return null;
		}

		resolve(fetchResult);
	});
}

export function getSubsonicApiPath(input: RequestInfo) {
	return navidromeUrl + input;
}
