import { Adapter } from '@tg-svelte/kit';
import './ambient.js';

declare global {
	const ENV_PREFIX: string;
}

interface AdapterOptions {
	out?: string;
	precompress?: boolean;
	envPrefix?: string;
}

export default function plugin(options?: AdapterOptions): Adapter;
