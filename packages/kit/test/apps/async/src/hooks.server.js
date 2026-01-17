/** @type {import('@tg-svelte/kit').HandleValidationError} */
export const handleValidationError = ({ issues }) => {
	return { message: issues[0].message };
};

/** @type {import('@tg-svelte/kit').HandleServerError} */
export const handleError = ({ error: e, status, message }) => {
	const error = /** @type {Error} */ (e);

	return { message: `${error.message} (${status} ${message})` };
};

// @ts-ignore this doesn't exist in old Node TODO remove SvelteKit 3 (same in test-basics)
Promise.withResolvers ??= () => {
	const d = {};
	d.promise = new Promise((resolve, reject) => {
		d.resolve = resolve;
		d.reject = reject;
	});
	return d;
};
