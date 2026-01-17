import { sveltekit } from '@tg-svelte/kit/vite';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: [path.resolve('../../../src')]
		}
	}
});
