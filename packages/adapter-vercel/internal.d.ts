declare module 'SERVER' {
	export { Server } from '@tg-svelte/kit';
}

declare module 'MANIFEST' {
	import { SSRManifest } from '@tg-svelte/kit';
	export const manifest: SSRManifest;
}
