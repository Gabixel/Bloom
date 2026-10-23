// import { Capacitor } from "@capacitor/core";
import { cconsole } from "$lib/logger.svelte";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

cconsole.log("Hello from page.ts");

gsap.ticker.lagSmoothing(false);

gsap.registerPlugin(Draggable);

// // https://capacitorjs.com/docs/basics/utilities
// if (Capacitor.getPlatform() === "ios") {
// 	cconsole.log("iOS!");
// } else if (Capacitor.getPlatform() === "android") {
// 	cconsole.log("Android!");
// } else {
// 	cconsole.log("Web!");
// }

// if (Capacitor.isNativePlatform()) {
// 	cconsole.log("I'm a native app!");
// } else {
// 	cconsole.log("I'm a PWA or Web app!");
// }

// cconsole.log(Capacitor.DEBUG)
// if (Capacitor.DEBUG === true) {
// 	cconsole.log("Running in debug!");
// }
