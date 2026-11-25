# Deploy

The site is fully static: `npm run build` writes it to `build/` with `@sveltejs/adapter-static`,
prerendering every page, plus a `404.html` fallback for unknown paths. Two hosts serve it, and both
deploy on every push to `main`.

## Cloudflare Pages

Connected to this repo through Cloudflare's Git integration, project `chonthenao`, served at
<https://chonthenao.pages.dev/>. Build settings in the dashboard:

| Setting                | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| Framework preset       | None (or SvelteKit with the output changed to `build`) |
| Build command          | `npm run build`                                        |
| Build output directory | `build`                                                |

Node comes from `.node-version`. The build serves from the domain root, so it needs no
environment variables. `@sveltejs/adapter-cloudflare` is not used: its current major targets
Workers and no longer supports Pages.

## GitHub Pages

`.github/workflows/deploy.yml` runs the same gate as CI (lint, format, type check, unit tests,
data check, browser tests), then builds with `SITE_BASE=/chonthenao` and
`SITE_ORIGIN=https://tiennm99.github.io`, checks the disclaimer on every page, and publishes to
<https://tiennm99.github.io/chonthenao/>. Pages must be set to deploy from GitHub Actions.

## Build-time settings

`vite.config.js` reads two optional variables:

- `SITE_BASE`: the path the site is served under; empty for a domain root.
- `SITE_ORIGIN`: the absolute origin used in prerendered page URLs, such as the "báo sai" issue
  link. Defaults to `https://chonthenao.pages.dev`.

Every page carries a content security policy (hash mode) that allows only the site's own scripts,
styles and fonts.
