import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.gabigroup.bloom",
	appName: "Bloom",
	webDir: "www",
	plugins: {
		CapacitorHttp: {
			enabled: true,
		},
		Keyboard: {
			resizeOnFullScreen: false,
			resize: "none", // TODO: "body"?
		}
	},
	ios: {
		limitsNavigationsToAppBoundDomains: true,
	},
	android: {
		allowMixedContent: true,
		buildOptions: {
			releaseType: "APK",
		},
		// zoomEnabled: false,
		// appendUserAgent: "Bloom/1.0",
		// backgroundColor: "#2e2e2e",
		initialFocus: true,
		resolveServiceWorkerRequests: false,
	},
	appendUserAgent: "Bloom/1.0",
	loggingBehavior: "none",
	backgroundColor: "#2e2e2e",
	zoomEnabled: false,
	server: {
		cleartext: true,
		androidScheme: "https",
		// androidScheme: "http",
		// allowNavigation: [
		//   "localhost"
		// ]
	},
};

export default config;
