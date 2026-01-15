<script>
	export let data;

	/**
	 * @param {HTMLElement} node
	 */
	function embed(node) {
		// We just need to find and execute the scripts, which don't run by default with {@html}.
		// Even though the text says "(server)", the hydration process (triggered by the script)
		// will detect the mismatch and update it to "(browser)".

		const scripts = Array.from(node.querySelectorAll('script'));
		for (const script of scripts) {

			let code = script.textContent;
			code = code.replace('__sveltekit_dev =', 'const __sveltekit_dev =');
			code = code.replace(
				'element: document.currentScript.parentNode',
				'element: document.currentScript?.parentNode ?? window.__embed_target'
			);

			// Set the target for this execution
			// @ts-ignore
			window.__embed_target = script.parentNode;
			
			// Execute the script
			(0, eval)(code);
		}
	}
</script>

<div use:embed>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.a}
</div>

<div use:embed>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html data.b}
</div>
