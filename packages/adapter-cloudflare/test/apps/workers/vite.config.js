import { sveltekit } from '@tg-svelte/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	build: {
		minify: false
	},
	plugins: [sveltekit()]
};

export default config;
