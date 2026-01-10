# PR Draft: Fix compatibility with @vitejs/plugin-legacy

## Title
fix(kit): support @vitejs/plugin-legacy multi-output and correct entry name

## Description
This PR addresses build failures when using `@vitejs/plugin-legacy` with SvelteKit.

### The Problem
When `@vitejs/plugin-legacy` is used, Vite produces an array of output bundles (one for modern, one for legacy) instead of a single output object. SvelteKit's `writeBundle` hook previously assumed a single output, causing `TypeError`s when accessing properies like `bundle.output`.

Additionally, the legacy plugin may rename/remap entry chunks. SvelteKit was strictly looking for `start.js` (or `entry.js`), resulting in "Entry not found" errors when the manifest contained `entry-legacy.js` or similar variations.

### The Fix
1.  **Robust Bundle Access**: Updated `writeBundle` to handle `bundle` being an array or object, correctly extracting `client_chunks`.
2.  **Entry Point Resolution**: Updated `find_deps_with_optional_legacy` to correctly look for the entry chunk in the manifest, handling cases where the name might differ slightly due to legacy plugin processing.

### Verification
Verified with a test project (`website-template-svkit-v2-legacy`) targeting IE11. The build produces correct `legacy` chunks and polyfills, and `vite preview` serves them correctly to legacy clients.

## How to Create This PR

1.  **Create a Clean Branch**:
    ```bash
    git checkout -b fix/legacy-plugin-support origin/master
    ```

2.  **Cherry-Pick Changes**:
    Pick the specific commit where we fixed `packages/kit`. (You may need to find the hash via `git log`).
    Alternatively, apply the changes manually to `packages/kit/src/exports/vite/index.js`.

3.  **Push and Open PR**:
    ```bash
    git push -u origin fix/legacy-plugin-support
    ```
    Then open the PR on GitHub against `sveltejs/kit`.
