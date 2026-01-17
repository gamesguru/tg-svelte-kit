declare module 'ENV' {
	export function env(key: string, fallback?: any): string;
	export function timeout_env(key: string, fallback?: any): number | undefined;
}

declare module 'HANDLER' {
	export const handler: import('polka').Middleware;
}

declare module 'MANIFEST' {
	import { SSRManifest } from '@tg-svelte/kit';

	export const base: string;
	export const manifest: SSRManifest;
	export const prerendered: Set<string>;
}

declare module 'SERVER' {
	export { Server } from '@tg-svelte/kit';
}
