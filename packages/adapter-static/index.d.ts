import { Adapter } from '@tg-svelte/kit';

export interface AdapterOptions {
	pages?: string;
	assets?: string;
	fallback?: string;
	precompress?: boolean;
	strict?: boolean;
}

export default function plugin(options?: AdapterOptions): Adapter;
