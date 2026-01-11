import adapter from '../../../../../adapter-auto/index.js';

/** @type {import('@tg-svelte/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;
