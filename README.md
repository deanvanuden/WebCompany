# Lumora Website

Production files for [lumoraofficial.de](https://lumoraofficial.de), served as a static GitHub Pages site.

## Structure

- `index.html` — compiled application and page markup; can also be opened directly in a browser.
- `assets/` — compiled stylesheet and local font files.
- `images/` — Lumora branding, transition artwork, studio artwork, and project previews.
- `video/` — interactive project preview films.
- `CNAME` — custom-domain configuration for GitHub Pages.
- `mcp/` — the static Lumora MCP toolkit at
  [lumoraofficial.de/mcp](https://lumoraofficial.de/mcp), including 3D models,
  Web Component recipes, machine-readable JSON endpoints, licences, and
  provenance.
- `scripts/build-mcp-catalog.mjs` — rebuilds the MCP catalogs from the verified
  Kenney ZIPs, Lumora Objects index, and owned-original component catalog.

The legal pages are part of the application and are available through:

- `./index.html?page=impressum`
- `./index.html?page=datenschutz`

The site does not require a server-side runtime or package installation.

## Lumora MCP

The canonical machine entry point is:

```text
https://lumoraofficial.de/mcp/manifest.json
```

The committed `/mcp` output is fully static. Rebuilding the catalog requires
Node.js plus the source asset archives; optional environment variables are
documented at the top of `scripts/build-mcp-catalog.mjs`.
