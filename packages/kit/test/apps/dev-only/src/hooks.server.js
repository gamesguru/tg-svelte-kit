/** @type {import("@tg-svelte/kit").HandleServerError} */
export function handleError({ error }) {
	return { message: /**@type{any}*/ (error).message };
}
