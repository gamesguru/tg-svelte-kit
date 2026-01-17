import * as path from 'node:path';
import { sveltekit } from '@tg-svelte/kit/vite';

/** @type {import('vitest/config').ViteUserConfig} */
const config = {
	build: {
		minify: false
	},

	clearScreen: false,

	logLevel: 'silent',

	plugins: [sveltekit()],

	define: {
		'process.env.MY_ENV': '"MY_ENV DEFINED"'
	},

	server: {
		fs: {
			allow: [path.resolve('../../../src')]
		}
	},

	test: {
		globalSetup: './globalSetup.js'
	}
};

export default config;
