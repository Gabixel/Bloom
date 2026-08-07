import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardResizeOptions } from "@capacitor/keyboard";

const config: CapacitorConfig = {
	appId: "com.gabigroup.bloom",
	appName: "Bloom",
	webDir: "www",
	plugins: {
		// https://capacitorjs.com/docs/apis/http#configuration
		CapacitorHttp: {
			enabled: true,
		},
		// https://capacitorjs.com/docs/apis/keyboard#configuration
		Keyboard: {
			resizeOnFullScreen: false,
			resize: KeyboardResize.None,
		},
		// App: {
		// 	disableBackButtonHandler: false,
		// },
		// SplashScreen: { },
		// SystemBars: { }
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
	//appendUserAgent: "Bloom/1.0",
	overrideUserAgent: "Bloom/1.0",
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
