# SvelteKit Legacy Browser Support Guide

This guide explains how to enable support for legacy browsers (like IE11) in your SvelteKit project using `@vitejs/plugin-legacy`.

## Prerequisites

-   SvelteKit version containing the legacy support fix (version with `client_chunks` and `entry` fixes).
-   Vite 5 (or compatible version).

## Installation

1.  **Install the plugin**:
    ```bash
    npm install -D @vitejs/plugin-legacy terser
    ```
    *Note: `terser` is required for minification in legacy builds.*

## Configuration

2.  **Update `vite.config.js`**:
    Import the legacy plugin and add it to your `plugins` array. Configure the `targets` to specify which browsers you want to support (e.g., `ie 11`).

    ```javascript
    import { sveltekit } from '@sveltejs/kit/vite';
    import { defineConfig } from 'vite';
    import legacy from '@vitejs/plugin-legacy';

    export default defineConfig({
        plugins: [
            legacy({
                targets: ['ie 11'],
                // specific options if needed
            }),
            sveltekit()
        ]
    });
    ```

3.  **Update `package.json`**:
    Ensure your `browserslist` (if used) or `targets` are correctly set. The `targets` option in `legacy()` plugin takes precedence for the legacy chunk generation.

## How it works

SvelteKit's build process will now generate:
-   Modern ES module chunks (standard).
-   Legacy chunks (transpiled to SystemJS/iife for older browsers).
-   Polyfills (loaded automatically based on browser capabilities).

The HTML entry point will include script tags with `nomodule` or SystemJS loader logic to load the correct bundle for the user's browser.

## Troubleshooting

-   **`client_chunks` error**: If you encounter errors related to `client_chunks` being undefined, ensure you are using the patched version of `@sveltejs/kit`.
-   **Manifest mismatch**: If you see "Entry not in manifest" errors, ensure `packages/kit` is using the correct entry point names (`entry.js` vs `start.js`).
