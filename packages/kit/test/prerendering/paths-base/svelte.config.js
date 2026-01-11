import adapter from '../../../../adapter-static/index.js';

/** @type {import('@tg-svelte/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

		paths: {
			base: '/path-base',
			relative: false
		}
	}
};

export default config;
