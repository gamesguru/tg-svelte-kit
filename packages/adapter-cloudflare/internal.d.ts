declare module 'SERVER' {
	export { Server } from '@tg-svelte/kit';
}

declare module 'MANIFEST' {
	import { SSRManifest } from '@tg-svelte/kit';

	export const manifest: SSRManifest;
	export const prerendered: Set<string>;
	export const app_path: string;
	export const base_path: string;
}
