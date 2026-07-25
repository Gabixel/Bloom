import { afterNavigate } from "$app/navigation";

let logList = $state([] as string[]);

export function setupCustomLogger() {
	initUncaughtExceptionsHandler();

	navigation.addEventListener("currententrychange", () => {
		if (navigation.currentEntry == undefined) {
			return;
		}

		// const data = navigation.currentEntry.getState();
		cconsole.log("navigation entry changed");
	});

	window.addEventListener("hashchange", (event) => {
		cconsole.log("hash change", event);
	});

	afterNavigate(() => {
		cconsole.log("Navigated to:", document.URL);
	});
}

let execInfo = (...data: any[]) => doLog(console.info, "info", ...data);
let execDebug = (...data: any[]) => doLog(console.debug, "debug", ...data);
let execLog = (...data: any[]) => doLog(console.log, "log", ...data);
let execError = (...data: any[]) => doLog(console.error, "error", ...data);
let execWarn = (...data: any[]) => doLog(console.warn, "warn", ...data);
let execTrace = (...data: any[]) => doLog(console.trace, "trace", ...data);

export const cconsole = $state.raw({
	logList: () => logList,
	info: (...data: any[]) => {
		execInfo(...data);
	},
	log: (...data: any[]) => {
		execLog(...data);
	},
	warn: (...data: any[]) => {
		execWarn(...data);
	},
	error: (...data: any[]) => {
		execError(...data);
	},
	debug: (...data: any[]) => {
		execDebug(...data);
	},
	trace: (...data: any[]) => {
		execTrace(...data);
	},
});

function doLog(func: Function, cType: string, ...data: any[]) {
	let firstText = "[BLOOM]";

	if (logList.length > 100) logList.length = 0;

	logList.unshift(
		`${cType},` + data.reduce((prev, curr) => {
			if (prev.length > 0) prev += " ";

			if (typeof curr != "string") prev += JSON.stringify(curr);
			else prev += curr;

			return prev;
		}, ""),
	);

	// if (typeof data?.[0] === "string") {
	// 	firstText += " " + data.splice(0, 1);
	// }

	func(firstText, ...data);
}

function initUncaughtExceptionsHandler() {
	window.onerror = (
		event: Event | string,
		source?: string,
		lineNo?: number,
		colNo?: number,
		error?: Error,
	): void => {
		// error?.message && logs.push(error?.message);

		execError(
			"An unexpected error has occurred.\n",
			event,
			"\n",
			`Source: ${source}\n`,
			`At line ${lineNo}, column ${colNo}\n`,
			`Type: ${error?.name}\n`,
			`Message: "${error?.message}"`,
		);
	};

	window.onunhandledrejection = (e) => {
		// // Don't print default error
		// e.preventDefault();

		// logs.push(e.reason?.stack ?? e.reason);

		execError(
			"An unexpected (in promise) error has occurred.\n",
			`'${e.reason?.stack ?? e.reason}'\n`,
			e,
		);
	};

	execDebug("Exception handler is running...");
}
