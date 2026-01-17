import adapter from '../../../index.js';

/** @type {import('@tg-svelte/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			config: 'config/wrangler.jsonc'
		})
	}
};

export default config;
