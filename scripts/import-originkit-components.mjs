import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(process.cwd());
const mcpRoot = path.join(repoRoot, "mcp");
const publicRoot = "https://lumoraofficial.de/mcp";
const sourceRoot = "https://www.originkit.dev";
const snapshotPath = path.join(mcpRoot, "originkit-components.json");
const refresh = process.argv.includes("--refresh");
const phase = "originkit-linked-2026-07";
const inventoryDate = "2026-07-30";

const categoryProfiles = {
  animation: {
    label: "Animation",
    bestFor: "hero accents; feature storytelling; expressive transitions",
    impact: "signature",
  },
  "background-animation": {
    label: "Background animation",
    bestFor: "hero backgrounds; section atmosphere; immersive transitions",
    impact: "signature",
  },
  border: {
    label: "Borders",
    bestFor: "feature cards; focused calls to action; interactive framing",
    impact: "supporting",
  },
  button: {
    label: "Buttons",
    bestFor: "campaign calls to action; playful controls; product moments",
    impact: "supporting",
  },
  cursor: {
    label: "Cursor interactions",
    bestFor: "desktop-first showcases; portfolio exploration; playful discovery",
    impact: "supporting",
  },
  image: {
    label: "Image effects",
    bestFor: "editorial imagery; project reveals; art-directed media transitions",
    impact: "signature",
  },
  "image-gallery": {
    label: "Image galleries",
    bestFor: "case studies; portfolios; product collections; campaign storytelling",
    impact: "signature",
  },
  "interactive-elements": {
    label: "Interactive elements",
    bestFor: "immersive heroes; experimental features; high-attention product moments",
    impact: "signature",
  },
  text: {
    label: "Text effects",
    bestFor: "display headlines; campaign statements; editorial transitions",
    impact: "supporting",
  },
};

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Lumora-MCP-OriginKit-Importer/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`OriginKit request failed (${response.status}): ${url}`);
  }
  return response.text();
}

function extractFlightPayload(html) {
  return [
    ...html.matchAll(
      /self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)<\/script>/gs,
    ),
  ]
    .map((match) => JSON.parse(match[1]))
    .join("");
}

function extractJsonArrayAfterMarker(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`OriginKit marker not found: ${marker}`);
  const start = source.indexOf("[", markerIndex + marker.length);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, index + 1));
    }
  }
  throw new Error("OriginKit registry array did not close.");
}

function extractRegistry(html) {
  const payload = extractFlightPayload(html);
  return extractJsonArrayAfterMarker(payload, '"registry":');
}

function extractSitemapSlugs(xml) {
  return [
    ...xml.matchAll(
      /<loc>https:\/\/www\.originkit\.dev\/components\/([^<]+)<\/loc>/g,
    ),
  ].map((match) => match[1]);
}

function decodeHtml(value) {
  return String(value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function extractDetailDescription(html) {
  const jsonLdBlocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const block of jsonLdBlocks) {
    try {
      const payload = JSON.parse(block[1]);
      const nodes = payload["@graph"] ?? [payload];
      for (const node of nodes) {
        const description =
          node?.about?.description ??
          (node?.["@type"] === "SoftwareSourceCode"
            ? node.description
            : null);
        if (description) return decodeHtml(description);
      }
    } catch {
      // Continue to the official meta-description fallback.
    }
  }
  const meta = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  return decodeHtml(meta?.[1]);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    ),
  );
  return output;
}

function titleFromSlug(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function tagsFor(entry) {
  return [
    ...new Set([
      "animated",
      "OriginKit",
      entry.category,
      ...entry.name.split("-"),
      ...(entry.tags ?? []),
    ]),
  ];
}

function makeRecord(entry, description) {
  const profile =
    categoryProfiles[entry.category] ??
    {
      label: titleFromSlug(entry.category),
      bestFor: "art-directed website moments",
      impact: "supporting",
    };
  const sourceUrl = `${sourceRoot}/components/${entry.name}`;
  const summary =
    description ||
    `${entry.displayName} is an official OriginKit ${profile.label.toLowerCase()} component with a live animated preview and source implementation on its OriginKit page.`;
  return {
    id: `originkit-${entry.name}`,
    name: entry.displayName,
    category: profile.label,
    source_category: entry.category,
    art_direction: "OriginKit",
    summary,
    technique:
      "Open the official OriginKit component page, inspect the current source and dependencies, then adapt its props, colors, density, timing, and content to the project.",
    style_tags: tagsFor(entry).join("; "),
    best_for: profile.bestFor,
    dependencies:
      "Inspect the current official component source; dependencies vary by component.",
    framework_fit: "React; Framer; adapt the official source for the target stack",
    motion_level: "varies",
    motion_choreography:
      "Preserve the component's core interaction idea while retiming it to the brand and stopping decorative motion when it no longer serves attention.",
    performance_cost: "varies",
    accessibility_contract:
      "Audit semantics, keyboard and touch equivalents, focus, contrast, and prefers-reduced-motion after adapting the official source.",
    content_contract:
      "Replace demo content and imagery with real project content; do not let the effect obscure essential information or controls.",
    responsive_strategy:
      "Inspect the official responsive behavior, then reduce density, pointer dependence, and continuous animation on narrow or coarse-pointer devices.",
    interaction_inputs:
      "Varies by component; inspect pointer, scroll, drag, keyboard, and ambient inputs on the official source page.",
    fallback_strategy:
      "Use the poster or a brand-matched static state when motion, WebGL, pointer precision, or runtime dependencies are unavailable.",
    test_focus:
      "official dependency check; reduced motion; keyboard and touch parity; narrow viewport; cleanup; loading and media fallback",
    implementation_steps:
      "open official source; audit dependencies; port into project conventions; brand-adapt; add accessible fallback; test performance",
    brand_tokens:
      "Map every exposed color, type, radius, spacing, and motion value to the project's semantic tokens.",
    avoid_when:
      "the effect competes with the page goal, duplicates another signature moment, or cannot provide an accessible fallback",
    impact: profile.impact,
    quality_score: null,
    novelty_score: null,
    compatibility: "official source",
    source_kind: "external-linked-component",
    license: "user-confirmed-free-use · official-source-link",
    licence_class: "linked-source",
    source: "OriginKit",
    creator: "OriginKit",
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    preview_video_url: entry.galleryMedia,
    preview_poster_url: entry.galleryPoster,
    preview_accent: entry.previewAccent || "#7C3AED",
    preview_layout: entry.previewLayout || "full",
    official_featured: Boolean(entry.featured),
    official_variants: entry.variants ?? [],
    remote_media: true,
    media_mirrored: false,
    source_code_bundled: false,
    implementation_mode: "open-official-source",
    inventory_date: inventoryDate,
    phase,
    public_record_url: `${publicRoot}/components.json#originkit-${entry.name}`,
  };
}

async function buildSnapshot() {
  const [homepage, sitemap] = await Promise.all([
    fetchText(`${sourceRoot}/`),
    fetchText(`${sourceRoot}/sitemap.xml`),
  ]);
  const registry = extractRegistry(homepage);
  const sitemapSlugs = extractSitemapSlugs(sitemap);
  const registrySlugs = new Set(registry.map((entry) => entry.name));
  const missingFromRegistry = sitemapSlugs.filter(
    (slug) => !registrySlugs.has(slug),
  );
  const missingFromSitemap = [...registrySlugs].filter(
    (slug) => !sitemapSlugs.includes(slug),
  );
  if (
    registry.length !== sitemapSlugs.length ||
    missingFromRegistry.length ||
    missingFromSitemap.length
  ) {
    throw new Error(
      `OriginKit registry/sitemap mismatch: registry=${registry.length}, sitemap=${sitemapSlugs.length}, missing registry=${missingFromRegistry.join(",")}, missing sitemap=${missingFromSitemap.join(",")}`,
    );
  }

  const descriptions = await mapWithConcurrency(
    registry,
    8,
    async (entry) => {
      try {
        const html = await fetchText(
          `${sourceRoot}/components/${entry.name}`,
        );
        return extractDetailDescription(html);
      } catch (error) {
        console.warn(`${entry.name}: ${error.message}`);
        return "";
      }
    },
  );
  const records = registry.map((entry, index) =>
    makeRecord(entry, descriptions[index]),
  );
  await writeFile(snapshotPath, `${JSON.stringify(records, null, 2)}\n`);
  return records;
}

function toIndexRecord(record) {
  const {
    id,
    name,
    category,
    source_category,
    art_direction,
    summary,
    style_tags,
    best_for,
    framework_fit,
    motion_level,
    performance_cost,
    impact,
    quality_score,
    novelty_score,
    compatibility,
    source_kind,
    license,
    source,
    source_url,
    preview_video_url,
    preview_poster_url,
    preview_accent,
    official_featured,
    implementation_mode,
    phase,
  } = record;
  return {
    id,
    name,
    category,
    source_category,
    art_direction,
    summary,
    style_tags,
    best_for,
    framework_fit,
    motion_level,
    performance_cost,
    impact,
    quality_score,
    novelty_score,
    compatibility,
    source_kind,
    license,
    source,
    source_url,
    preview_video_url,
    preview_poster_url,
    preview_accent,
    official_featured,
    implementation_mode,
    phase,
  };
}

async function updateInstructions() {
  const filePath = path.join(mcpRoot, "instructions.md");
  const start = "<!-- ORIGINKIT-GUIDANCE:START -->";
  const end = "<!-- ORIGINKIT-GUIDANCE:END -->";
  const block = `${start}
## OriginKit linked components

OriginKit records are external linked components with official remote previews. The MCP does not mirror OriginKit source code or media files.

- Search or filter \`art_direction: "OriginKit"\` to see the complete linked inventory.
- Open \`source_url\` to inspect and copy the current official implementation.
- Read the official source and dependency list before adapting the component.
- Brand-adapt the component and preserve responsive, accessibility, reduced-motion, fallback, and performance requirements.
- Load \`preview_video_url\` only for selection; do not ship the catalog preview as production website media.

The user confirmed that OriginKit components are free to use. Keep the implementation connected to its official source record and do not bulk-republish unrelated source or preview files.
${end}`;
  let source = await readFile(filePath, "utf8");
  const pattern = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  source = pattern.test(source)
    ? source.replace(pattern, block)
    : `${source.trimEnd()}\n\n${block}\n`;
  await writeFile(filePath, source);
}

async function mergeCatalog(records) {
  const componentsPath = path.join(mcpRoot, "components.json");
  const indexPath = path.join(mcpRoot, "components-index.json");
  const components = JSON.parse(await readFile(componentsPath, "utf8"));
  const base = components.filter((record) => record.phase !== phase);
  const merged = [...base, ...records];
  const index = [
    ...JSON.parse(await readFile(indexPath, "utf8")).filter(
      (record) =>
        record.phase !== phase &&
        record.source_kind !== "external-linked-component",
    ),
    ...records.map(toIndexRecord),
  ];
  await writeFile(componentsPath, `${JSON.stringify(merged, null, 2)}\n`);
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);

  const manifestPath = path.join(mcpRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.generatedAt = inventoryDate;
  manifest.purpose =
    "A human and machine-readable design toolkit for selecting web-ready 3D models, owned-original and officially linked web components, multi-style image and UI assets, and externally hosted animated background references.";
  manifest.totals.componentRecipes = merged.length;
  manifest.totals.ownedComponentRecipes = base.length;
  manifest.totals.linkedOriginKitComponents = records.length;
  manifest.endpoints.originKitComponents =
    `${publicRoot}/originkit-components.json`;
  manifest.componentSelectionGuidance = {
    ownedOriginal:
      "Lumora owned-original recipes are implementation briefs built from first principles.",
    originKit:
      "OriginKit records link to the official current implementation and remote selection previews; source code and media are not mirrored.",
    selectionRule:
      "Choose by page purpose and art direction, then verify dependencies, responsive behavior, accessibility, reduced motion, and performance in the target project.",
    previewEngine:
      "All 85 owned archetypes have representative SVG compositions. Grid cards remain static and only the selected recipe runs a scoped motion profile; previews guide selection and are not production source code.",
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const provenancePath = path.join(mcpRoot, "provenance.json");
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  provenance.generatedAt = inventoryDate;
  provenance.components = {
    source: "Lumora owned-original recipes plus linked OriginKit components",
    sourceKind: "mixed owned-original and external-linked-component",
    licence:
      "Owned-original for Lumora recipes; user-confirmed-free-use with official-source linking for OriginKit",
    recipeCount: merged.length,
    ownedOriginalCount: base.length,
    linkedOriginKitCount: records.length,
    sources: [
      {
        source: "Lumora Web Design Components skill",
        sourceKind: "owned-original-recipe",
        licence: "owned-original",
        recordCount: base.length,
      },
      {
        source: "OriginKit",
        sourceUrl: sourceRoot,
        sitemapUrl: `${sourceRoot}/sitemap.xml`,
        sourceKind: "external-linked-component",
        licence: "user-confirmed-free-use · official-source-link",
        recordCount: records.length,
        inventoryDate,
        storage:
          "Metadata snapshot with official component-page, poster, and video URLs; no OriginKit source code or media mirrored locally.",
      },
    ],
    transformations: [
      "Preserved the official component name, category, featured state, detail page, poster URL, and preview-video URL.",
      "Added Lumora implementation, brand-fit, responsive, accessibility, fallback, and performance guidance.",
      "Kept OriginKit source code and preview media on the official OriginKit service.",
      "Kept grid-card previews static and activated motion only for the selected component inspector.",
    ],
  };
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  await mkdir(path.join(mcpRoot, "licences"), { recursive: true });
  await writeFile(
    path.join(mcpRoot, "licences", "originkit-linked-source.txt"),
    [
      "OriginKit linked component source boundary",
      `Inventory date: ${inventoryDate}`,
      `Official catalog: ${sourceRoot}/`,
      `Official sitemap: ${sourceRoot}/sitemap.xml`,
      "",
      "The user confirmed that OriginKit components are free to use.",
      "Lumora MCP stores metadata and official links only.",
      "OriginKit source code, poster files, and preview videos are not mirrored in this repository.",
      "Open each record's official_source_url to retrieve the current implementation and dependencies.",
      "",
    ].join("\n"),
  );
  await updateInstructions();
  return merged;
}

let records;
if (refresh || !(await exists(snapshotPath))) {
  records = await buildSnapshot();
} else {
  records = JSON.parse(await readFile(snapshotPath, "utf8"));
}
const ids = new Set(records.map((record) => record.id));
if (ids.size !== records.length) {
  throw new Error("Duplicate OriginKit component IDs detected.");
}
const merged = await mergeCatalog(records);
const categories = Object.fromEntries(
  [...new Set(records.map((record) => record.category))]
    .sort()
    .map((category) => [
      category,
      records.filter((record) => record.category === category).length,
    ]),
);
console.log(
  JSON.stringify(
    {
      phase,
      originKitComponents: records.length,
      totalComponentRecords: merged.length,
      categories,
    },
    null,
    2,
  ),
);
