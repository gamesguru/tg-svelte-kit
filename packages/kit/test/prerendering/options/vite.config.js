import * as path from 'node:path';
import { sveltekit } from '@tg-svelte/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	build: {
		minify: false
	},

	clearScreen: false,

	logLevel: 'silent',

	plugins: [sveltekit()],

	server: {
		fs: {
			allow: [path.resolve('../../../src')]
		}
	}
};

export default config;
