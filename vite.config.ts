import { sveltekit } from "@sveltejs/kit/vite";
import { type UserConfig } from "vite";
import { resolve } from "node:path";

import sveltekitConfig from "./svelte.config.js";

const config = {
	plugins: [sveltekit()],
	define: {
		"process.env.NODE_ENV":
			process.env.NODE_ENV === "production"
				? '"production"'
				: '"development"',
	},
	build: {
		minify: true,
	},
} satisfies UserConfig;

export default config;
