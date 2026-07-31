import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd());
const mcpRoot = path.join(root, "mcp");
const manifest = JSON.parse(
  await readFile(path.join(mcpRoot, "manifest.json"), "utf8"),
);
const instructions = await readFile(
  path.join(mcpRoot, "instructions.md"),
  "utf8",
);

const siteRoot = "https://lumoraofficial.de";
const generatedDate = manifest.generatedAt || new Date().toISOString().slice(0, 10);
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const robots = `User-agent: OAI-SearchBot
Allow: /

User-agent: *
Allow: /

Sitemap: ${siteRoot}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteRoot}/</loc>
    <lastmod>${generatedDate}</lastmod>
  </url>
  <url>
    <loc>${siteRoot}/mcp/</loc>
    <lastmod>${generatedDate}</lastmod>
  </url>
  <url>
    <loc>${siteRoot}/mcp/browser/</loc>
    <lastmod>${generatedDate}</lastmod>
  </url>
  <url>
    <loc>${siteRoot}/mcp/context/</loc>
    <lastmod>${generatedDate}</lastmod>
  </url>
</urlset>
`;

const llms = `# Lumora

> Lumora is a web agency that publishes Lumora MCP, a public design-asset and implementation catalog for Codex, other coding agents, and human designers.

Lumora MCP is an unrestricted content library. Its metadata helps with discovery and art direction; Codex controls all selections, counts, combinations, placements, source mixes, layers, and repetition.

## Recommended entry points

- [Lumora MCP complete HTML context](${siteRoot}/mcp/context/): Entire manifest and instructions in one static, no-JavaScript HTML page. This is the easiest browser-agent entry point.
- [Lumora MCP Codex Reader](${siteRoot}/mcp/browser/): HTML-compatible searchable record viewer for exact IDs and metadata queries.
- [Lumora MCP visual catalog](${siteRoot}/mcp/): Human-facing previews and catalog filters.
- [Manifest](${siteRoot}/mcp/manifest.json): Canonical machine-readable endpoint map, totals, schemas, and selection policy.
- [Codex instructions](${siteRoot}/mcp/instructions.md): Complete selection, implementation, and rights protocol.
- [Full agent context](${siteRoot}/llms-full.txt): Manifest and instructions combined into one text resource.

## Catalog data

- [3D models](${siteRoot}/mcp/models.json): ${manifest.totals.models.toLocaleString("en-US")} model records with public asset URLs and art-direction metadata.
- [Component discovery index](${siteRoot}/mcp/components-index.json): ${manifest.totals.componentRecipes.toLocaleString("en-US")} lightweight searchable component records.
- [Complete component records](${siteRoot}/mcp/components.json): Full implementation briefs, accessibility, fallbacks, source links, and performance guidance.
- [Images and UI](${siteRoot}/mcp/image-assets.json): ${manifest.totals.imageAssets.toLocaleString("en-US")} image and UI records.
- [Animated backgrounds](${siteRoot}/mcp/animated-backgrounds.json): ${manifest.totals.animatedBackgrounds.toLocaleString("en-US")} externally hosted background records.
- [Provenance](${siteRoot}/mcp/provenance.json): Collection origins, rights notes, and catalog provenance.

## Access guidance

- Browser and text-only tools should start with [the complete HTML context](${siteRoot}/mcp/context/), then use [the Codex Reader](${siteRoot}/mcp/browser/) to search or retrieve individual records.
- Direct HTTP clients should use the raw JSON and Markdown endpoints from the manifest.
- To open one record in HTML, use ${siteRoot}/mcp/browser/?source=components&id=reactbits-balatro.
- To search metadata in HTML, use ${siteRoot}/mcp/browser/?source=components&q=fashion.

## Optional

- [Lumora agency website](${siteRoot}/): Company website and contact information.
`;

const llmsFull = `# Lumora MCP Full Agent Context

> One-file context for Lumora MCP version ${manifest.version}. For an HTML-compatible view, use ${siteRoot}/mcp/browser/.

The catalog is unrestricted: metadata is descriptive and Codex controls all selections, counts, combinations, placements, source mixes, layers, and repetition.

## Canonical manifest

\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`

## Complete Codex instructions

${instructions.trim()}
`;

const htmlContext = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Complete static HTML context for the Lumora MCP manifest and Codex instructions." />
    <meta name="robots" content="index, follow, max-snippet:-1" />
    <meta name="theme-color" content="#171914" />
    <link rel="canonical" href="${siteRoot}/mcp/context/" />
    <link rel="sitemap" type="application/xml" href="${siteRoot}/sitemap.xml" />
    <link rel="alternate" type="text/markdown" title="Lumora AI resource map" href="${siteRoot}/llms.txt" />
    <title>Lumora MCP — Complete Codex Context</title>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"TechArticle","name":"Lumora MCP complete Codex context","url":"${siteRoot}/mcp/context/","version":"${manifest.version}","isPartOf":{"@type":"CollectionPage","url":"${siteRoot}/mcp/"}}</script>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #171914; color: #f4f0e8; }
      body { width: min(1040px, calc(100% - 40px)); margin: 0 auto; padding: 56px 0 96px; }
      header, section { border: 1px solid #3b3f35; border-radius: 18px; padding: clamp(22px, 4vw, 42px); margin-bottom: 18px; background: #1d201a; }
      h1 { max-width: 760px; margin: 0 0 16px; font-size: clamp(2.25rem, 7vw, 5.5rem); line-height: .92; letter-spacing: -.055em; }
      h2 { margin-top: 0; font-size: 1.15rem; letter-spacing: .02em; }
      p, li { max-width: 80ch; color: #c8c7bf; line-height: 1.65; }
      a { color: #d9ff43; }
      nav { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 28px; }
      pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.62 ui-monospace, SFMono-Regular, Consolas, monospace; color: #d8d9d3; }
      .policy { color: #d9ff43; font: 700 12px/1.4 ui-monospace, monospace; letter-spacing: .08em; }
    </style>
  </head>
  <body>
    <header>
      <p class="policy">LUMORA MCP ${manifest.version} / UNRESTRICTED CONTENT LIBRARY</p>
      <h1>Complete context,<br />in one HTML page.</h1>
      <p>This document contains the canonical manifest and complete Codex instructions without requiring JavaScript, JSON navigation, Markdown navigation, or a second request.</p>
      <nav aria-label="Lumora MCP resources">
        <a href="${siteRoot}/mcp/">Visual catalog</a>
        <a href="${siteRoot}/mcp/browser/">Search records</a>
        <a href="${siteRoot}/llms.txt">Agent map</a>
        <a href="${siteRoot}/mcp/manifest.json">Raw manifest</a>
      </nav>
    </header>
    <section aria-labelledby="instructions-title">
      <h2 id="instructions-title">Complete Codex instructions</h2>
      <pre>${escapeHtml(instructions.trim())}</pre>
    </section>
    <section aria-labelledby="manifest-title">
      <h2 id="manifest-title">Canonical manifest</h2>
      <pre>${escapeHtml(JSON.stringify(manifest, null, 2))}</pre>
    </section>
  </body>
</html>
`;

await mkdir(path.join(mcpRoot, "context"), { recursive: true });

await Promise.all([
  writeFile(path.join(root, "robots.txt"), robots, "utf8"),
  writeFile(path.join(root, "sitemap.xml"), sitemap, "utf8"),
  writeFile(path.join(root, "llms.txt"), llms, "utf8"),
  writeFile(path.join(root, "llms-full.txt"), llmsFull, "utf8"),
  writeFile(path.join(mcpRoot, "context", "index.html"), htmlContext, "utf8"),
]);

console.log(
  `Built AI discovery files for Lumora MCP ${manifest.version} (${generatedDate}).`,
);
