/** @type {import('@tg-svelte/kit').Config} */
const config = {
	kit: {
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
