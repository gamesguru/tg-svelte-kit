<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let data;

	// Capture stable references to initial data to prevent updates from global page store pollution
	// when embedded apps hydrate and overwrite the singleton store.
	const { a, b } = data;

	let isMounted = false;

	onMount(() => {
		isMounted = true;
		document.getElementById('ssr-content-a')?.remove();
		document.getElementById('ssr-content-b')?.remove();
	});

	/**
	 * @param {HTMLElement} node
	 * @param {string} html
	 */
	function embed(node, html) {
		// Fresh Container Strategy
		// Node is isolated by template structure, so no need to wipe hydration content.
		
		const container = document.createElement('div');
		container.style.height = '100%';
		container.style.width = '100%';
		container.innerHTML = html;
		node.appendChild(container);

		// Use a global mutex to ensure sequential execution
		// @ts-ignore
		window.__embed_mutex = window.__embed_mutex || Promise.resolve();

		const scripts = Array.from(container.querySelectorAll('script'));

		// @ts-ignore
		window.__embed_mutex = window.__embed_mutex
			.catch(() => {})
			.then(async () => {
				for (const script of scripts) {
					// @ts-ignore
					const sequence = (window.__embed_counter = (window.__embed_counter || 0) + 1);
					const targetId = `__embed_target_${sequence}`;

					let code = script.textContent || '';
					code = code.replace('__sveltekit_dev =', 'const __sveltekit_dev =');

					// @ts-ignore
					window[targetId] = container.attachShadow({ mode: 'open' });
					
					if (code.includes('element: document.currentScript.parentNode')) {
						code = code.replace(
							'element: document.currentScript.parentNode',
							`element: window['${targetId}']`
						);

						// Clear content to prevent duplicates (Server + Client)
						while (container.firstChild) {
							container.removeChild(container.firstChild);
						}
					}

					try {
						// @ts-ignore
						const result = (0, eval)(code);
						if (result && typeof result.then === 'function') {
							await result;
						}
					} catch (e) {
						// Ignore
					}
					
					// Small buffer just in case
					await new Promise((r) => setTimeout(r, 100));
				}
			});

		return {
			update() {
				// Prevent remounting
			}
		};
	}
</script>

<div style="height: 100%; width: 100%; border: none; position: relative;">
	<div use:embed={a} style="width: 100%; height: 100%;"></div>
	{#if !isMounted}
		<div id="ssr-content-a" style="display: contents">{@html a}</div>
	{/if}
</div>

<div style="height: 100%; width: 100%; border: none; position: relative;">
	<div use:embed={b} style="width: 100%; height: 100%;"></div>
	{#if !isMounted}
		<div id="ssr-content-b" style="display: contents">{@html b}</div>
	{/if}
</div>
