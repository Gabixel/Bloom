import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: /** @param {Object} o @param {string} o.filename */ ({
			filename,
		}) =>
			filename.split(/[/\\]/).includes("node_modules") ? undefined : true,

		hmr: false,
		dev: true,
		preserveComments: false,
		preserveWhitespace: false,
		discloseVersion: false,
	},

	vitePlugin: {
		//hot: false, // deprecated
		inspector: false, //alt-x
	},
	kit: {
		output: {},
		csp: {
			mode: "hash",
		},
		adapter: adapter(
			// TODO: https://svelte.dev/docs/kit/single-page-apps#Usage
			{
				pages: "www"
			},
		),
		serviceWorker: {
			register: true,
			options: {
				type:
					process.env.NODE_ENV === "production"
						? "classic"
						: "module",
				scope: "/",
			},
		},
		router: {
			type: "hash",
			resolution: "client",
		},

		// version: {
		// 	name: child_process
		// 		// TODO: check if "git" command exists?
		// 		.execSync("git rev-parse HEAD")
		// 		.toString()
		// 		.trim(),
		// },
	},
};

export default config;