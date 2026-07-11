import { Capacitor } from "@capacitor/core";

console.log("Hello from page.ts");

// https://capacitorjs.com/docs/basics/utilities
if (Capacitor.getPlatform() === "ios") {
	console.log("iOS!");
} else if (Capacitor.getPlatform() === "android") {
	console.log("Android!");
} else {
	console.log("Web!");
}

if (Capacitor.isNativePlatform()) {
	console.log("I'm a native app!");
} else {
	console.log("I'm a PWA or Web app!");
}

console.log(Capacitor.DEBUG)
if (Capacitor.DEBUG === true) {
	console.log("Running in debug!");
}
