import cjs from 'e2e-test-dep-hooks-client';
cjs.cjs();

/** @type {import("@tg-svelte/kit").HandleClientError} */
export function handleError({ message }) {
	return { message };
}
