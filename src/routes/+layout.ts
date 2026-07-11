import { App as CapacitorApp } from "@capacitor/app";
import { cconsole } from "../lib/logger.svelte";

cconsole.log("Hello from layout.ts");

CapacitorApp.addListener("backButton", ({ canGoBack }) => {
	if (!canGoBack) {
		CapacitorApp.exitApp();
	} else {
		window.history.back();
	}
});
