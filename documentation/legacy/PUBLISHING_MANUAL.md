# Publishing the Legacy-Enabled SvelteKit

To make this legacy-connected version of SvelteKit available for others to use via `npm install`, you need to publish it under your own NPM scope (since you cannot publish to `@sveltejs`).

## 1. Prepare for Publishing

1.  **Rename the Package**:
    Open `packages/kit/package.json` and change the `"name"` field to your scoped name.
    We recommend using **`@tg-svelte/kit`** as the name.
    
    Example:
    ```json
    "name": "@tg-svelte/kit",
    ```

    *Why `kit`?* Since this is a fork of the core framework, keeping the name `kit` (scoped to your org) makes it clear it replaces `@sveltejs/kit`. Naming it `legacy-builder-plugin` might be confusing as users can't use it *alongside* the kit; they use it *instead* of the kit.

2.  **Update Version (Optional)**:
    You can manually bump the version or use the existing `changeset` workflow if you have it configured.
    Ensure the version is unique on NPM.

## 2. Build and Publish

Navigate to the `packages/kit` directory and publish:

```bash
cd packages/kit
pnpm install
pnpm run check # Verify types
pnpm publish --access public --no-git-checks
```

*Note: You may need to run `pnpm install` in the root first.*

## 3. How Users Install It

Your users can install this package while aliasing it to `@sveltejs/kit`. This allows their code to continue importing from `@sveltejs/kit` normally, but using your legacy-enabled implementation.

### npm / yarn / pnpm

```bash
npm install -D @sveltejs/kit@npm:@tg-svelte/kit
```

### package.json Example

```json
"devDependencies": {
  "@sveltejs/kit": "npm:@tg-svelte/kit@^2.49.4",
  ...
}
```

## 4. Optional Module Strategy

As requested, users can opt-in to this. If they do not install your fork, they get the standard SvelteKit (which may fail on legacy builds). If they install your fork, legacy builds work.

This is a **drop-in replacement** strategy. It is safe because your fork matches the upstream API (based on v2.49.4).

### Fallback
If users want to verify their app with standard SvelteKit, they simply remove the alias:
```bash
npm install -D @sveltejs/kit@latest
```
