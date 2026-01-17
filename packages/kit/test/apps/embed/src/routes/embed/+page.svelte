<script>
	import { browser } from '$app/environment';
	export let data;

	/**
	 * @param {HTMLElement} node
	 * @param {string} html
	 */
	function embed(node, html) {
		// Fresh Container Strategy:
		// 1. Clear the node (managed by parent)
		// 2. Create a new isolated container
		// 3. Inject HTML into the container
		// 4. Mount the container
		node.innerHTML = '';
		const container = document.createElement('div');
		container.style.height = '100%';
		container.style.width = '100%';
		if (browser) {
			container.innerHTML = html;
		}
		node.appendChild(container);

		const scripts = Array.from(container.querySelectorAll('script'));

		setTimeout(() => {
			for (let i = 0; i < scripts.length; i++) {
				// @ts-ignore
				const sequence = (window.__embed_counter = (window.__embed_counter || 0) + 1);
				const targetId = `__embed_target_${sequence}`;

				const script = scripts[i];
				let code = script.textContent;
				code = code.replace('__sveltekit_dev =', 'const __sveltekit_dev =');

				// Point to the container's parent? No, point to the container itself?
				// The script usually expects to replace `document.currentScript.parentNode`.
				// If we injected innerHTML -> script is child of container.
				// So parentNode IS container.
				// So we want to target the container.
				// Wait, if script runs, it typically replaces `document.currentScript.parentNode` with the app.
				// If `document.currentScript` is the script tag, `parentNode` is `container`.
				// So we should target `container`.

				// @ts-ignore
				window[targetId] = container;

				if (code.includes('element: document.currentScript.parentNode')) {
					code = code.replace(
						'element: document.currentScript.parentNode',
						`element: window.${targetId}`
					);
				}

				// Execute the script
				setTimeout(() => {
					// Wrap in try-catch to log failures
					try {
						(0, eval)(code);
					} catch (e) {
						console.error('EMBED ERROR:', e);
					}
				}, 200 * sequence);
			}
		}, 100);
	}
</script>

<div use:embed={data.a} style="height: 100%; width: 100%; border: none;">
	{#if !browser}
		{@html data.a}
	{/if}
</div>

<div use:embed={data.b} style="height: 100%; width: 100%; border: none;">
	{#if !browser}
		{@html data.b}
	{/if}
</div>
