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
const inventoryDate = "2026-07-30";
const refresh = process.argv.includes("--refresh");

const sources = {
  reactBits: {
    name: "React Bits",
    repo: "DavidHDev/react-bits",
    site: "https://reactbits.dev",
    snapshot: path.join(mcpRoot, "react-bits-components.json"),
    phase: "react-bits-linked-2026-07",
    accent: "#8B5CF6",
  },
  canvasUi: {
    name: "Canvas UI",
    repo: "DavidHDev/canvas-ui",
    site: "https://canvasui.dev",
    snapshot: path.join(mcpRoot, "canvas-ui-components.json"),
    phase: "canvas-ui-linked-2026-07",
    accent: "#33D6C8",
  },
};

const reactGroups = {
  animations: {
    route: "animations",
    label: "Animation",
    bestFor:
      "hero accents; interactive details; expressive transitions; portfolio moments",
    impact: "supporting",
  },
  textAnimations: {
    route: "text-animations",
    label: "Text animation",
    bestFor:
      "display headlines; campaign statements; metrics; editorial transitions",
    impact: "supporting",
  },
  components: {
    route: "components",
    label: "Interactive component",
    bestFor:
      "navigation; galleries; feature sections; calls to action; product storytelling",
    impact: "supporting",
  },
  backgrounds: {
    route: "backgrounds",
    label: "Animated background",
    bestFor:
      "hero atmosphere; section transitions; immersive launches; branded ambience",
    impact: "signature",
  },
};

const reactVideoAliases = new Map([
  ["rotatingtext", "textrotate"],
  ["shapegrid", "squares"],
]);

const highCostReactComponents = new Set([
  "antigravity",
  "ascii-text",
  "ballpit",
  "color-bends",
  "cubes",
  "dither",
  "dome-gallery",
  "dot-field",
  "faulty-terminal",
  "ferrofluid",
  "fluid-glass",
  "galaxy",
  "grainient",
  "grid-distortion",
  "grid-scan",
  "hyperspeed",
  "iridescence",
  "light-rays",
  "lightfall",
  "liquid-chrome",
  "liquid-ether",
  "magic-rings",
  "meta-balls",
  "metallic-paint",
  "model-viewer",
  "particles",
  "pixel-blast",
  "plasma",
  "plasma-wave",
  "prism",
  "prismatic-burst",
  "radar",
  "ribbons",
  "shape-blur",
  "soft-aurora",
  "strands",
]);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchResponse(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json, application/json, text/plain",
      "User-Agent": "Lumora-MCP-Linked-Component-Importer/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }
  return response;
}

async function fetchText(url) {
  return (await fetchResponse(url)).text();
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json();
}

async function resolveRevision(repo) {
  const commit = await fetchJson(
    `https://api.github.com/repos/${repo}/commits/main`,
  );
  return commit.sha;
}

function rawUrl(repo, revision, filePath) {
  return `https://raw.githubusercontent.com/${repo}/${revision}/${filePath}`;
}

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleFromSlug(value) {
  const title = String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
  return title
    .replace(/\bAscii\b/g, "ASCII")
    .replace(/\bVhs\b/g, "VHS")
    .replace(/\bHud\b/g, "HUD")
    .replace(/\b3d\b/gi, "3D");
}

function extractReactGroups(source) {
  const records = [];
  for (const [groupName, profile] of Object.entries(reactGroups)) {
    const match = source.match(
      new RegExp(`const ${groupName} = \\{([\\s\\S]*?)\\n\\};`),
    );
    if (!match) throw new Error(`React Bits group not found: ${groupName}`);
    for (const entry of match[1].matchAll(/'([^']+)':\s*\(\)\s*=>/g)) {
      records.push({ slug: entry[1], groupName, ...profile });
    }
  }
  return records;
}

function toIndexRecord(record) {
  const fields = [
    "id",
    "name",
    "category",
    "source_category",
    "art_direction",
    "summary",
    "style_tags",
    "best_for",
    "framework_fit",
    "motion_level",
    "performance_cost",
    "impact",
    "quality_score",
    "novelty_score",
    "compatibility",
    "source_kind",
    "license",
    "source",
    "source_url",
    "preview_video_url",
    "preview_poster_url",
    "preview_accent",
    "official_featured",
    "implementation_mode",
    "phase",
  ];
  return Object.fromEntries(fields.map((field) => [field, record[field]]));
}

function commonLinkedFields({
  id,
  name,
  source,
  sourceUrl,
  category,
  sourceCategory,
  summary,
  technique,
  styleTags,
  bestFor,
  dependencies,
  frameworkFit,
  motionLevel,
  performanceCost,
  compatibility,
  previewVideoUrl,
  previewAccent,
  installCommand,
  registryUrl,
  phase,
  sourceRevision,
}) {
  return {
    id,
    name,
    category,
    source_category: sourceCategory,
    art_direction: source,
    summary,
    technique,
    style_tags: styleTags.join("; "),
    best_for: bestFor,
    dependencies,
    framework_fit: frameworkFit,
    motion_level: motionLevel,
    motion_choreography:
      "Preserve the core interaction idea, retime it to the brand, pause it offscreen, and remove continuous motion when it no longer supports attention.",
    performance_cost: performanceCost,
    accessibility_contract:
      "Preserve semantic HTML beneath the effect, keyboard and touch parity, visible focus, sufficient contrast, and a meaningful prefers-reduced-motion state.",
    content_contract:
      "Replace every demo asset and string with real project content. The visual effect must never obscure essential information or controls.",
    responsive_strategy:
      "Reduce effect density, pointer dependence, resolution, and continuous animation on narrow screens and coarse-pointer devices; retain the underlying content.",
    interaction_inputs:
      "Inspect the official demo for pointer, scroll, drag, keyboard, and ambient inputs before integration.",
    fallback_strategy:
      "Keep an equivalent static or plain-HTML state when motion, canvas, WebGL, pointer precision, or runtime dependencies are unavailable.",
    test_focus:
      "official dependency check; reduced motion; keyboard and touch parity; narrow viewport; offscreen pause; cleanup; loading; canvas/WebGL fallback",
    implementation_steps:
      "open official source; choose the correct framework variant; install only the selected component; audit dependencies; brand-adapt; add fallback; profile and test",
    brand_tokens:
      "Map exposed colors, type, radii, spacing, imagery, lighting, and motion values to the project's semantic tokens.",
    avoid_when:
      "the effect competes with the page goal, duplicates another signature moment, weakens readability, or cannot provide an accessible fallback",
    impact: category.includes("background") ? "signature" : "supporting",
    quality_score: null,
    novelty_score: null,
    compatibility,
    source_kind: "external-linked-component",
    license: "MIT + Commons Clause v1.0",
    licence_class: "end-project-only-linked-source",
    usage_rights:
      "Use and adapt in personal or commercial applications, websites, and products.",
    resale_restriction:
      "Do not sell, sublicense, or redistribute the components themselves, alone, bundled, or ported.",
    source,
    creator: "David Haz",
    source_url: sourceUrl,
    official_source_url: sourceUrl,
    preview_video_url: previewVideoUrl,
    preview_poster_url: null,
    preview_accent: previewAccent,
    preview_layout: "full",
    preview_fallback: previewVideoUrl
      ? "remote-video-first-frame"
      : "official-live-demo-link",
    remote_media: Boolean(previewVideoUrl),
    media_mirrored: false,
    source_code_bundled: false,
    install_command: installCommand,
    registry_url: registryUrl,
    implementation_mode: "install-from-official-registry",
    official_featured: false,
    inventory_date: inventoryDate,
    source_revision: sourceRevision,
    phase,
    public_record_url: `${publicRoot}/components.json#${id}`,
  };
}

async function buildReactBitsSnapshot() {
  const source = sources.reactBits;
  const revision = await resolveRevision(source.repo);
  const [componentSource, registry, tree, licenseText] = await Promise.all([
    fetchText(rawUrl(source.repo, revision, "src/constants/Components.js")),
    fetchJson(rawUrl(source.repo, revision, "public/r/registry.json")),
    fetchJson(
      `https://api.github.com/repos/${source.repo}/git/trees/${revision}?recursive=1`,
    ),
    fetchText(rawUrl(source.repo, revision, "LICENSE.md")),
  ]);

  const registryItems = registry.items ?? [];
  const registryVariants = registryItems.filter((item) =>
    item.name?.endsWith("-TS-TW"),
  );
  const videos = tree.tree
    .map((entry) => entry.path)
    .filter((entryPath) =>
      /^public\/assets\/video\/.+\.(webm|mp4)$/i.test(entryPath),
    );
  const webmVideos = videos.filter((entryPath) => entryPath.endsWith(".webm"));
  const mp4Videos = videos.filter((entryPath) => entryPath.endsWith(".mp4"));
  const records = extractReactGroups(componentSource).map((entry) => {
    const key = normalizeKey(entry.slug);
    const registryItem = registryVariants.find(
      (item) => normalizeKey(item.title) === key,
    );
    if (!registryItem) {
      throw new Error(`React Bits registry variant missing: ${entry.slug}`);
    }
    const videoKey = reactVideoAliases.get(key) ?? key;
    const videoPath =
      webmVideos.find(
        (entryPath) =>
          normalizeKey(path.basename(entryPath, path.extname(entryPath))) ===
          videoKey,
      ) ??
      mp4Videos.find(
        (entryPath) =>
          normalizeKey(path.basename(entryPath, path.extname(entryPath))) ===
          videoKey,
      ) ??
      null;
    const name = titleFromSlug(entry.slug);
    const sourceUrl = `${source.site}/${entry.route}/${entry.slug}`;
    const previewVideoUrl = videoPath
      ? `${source.site}/${videoPath.replace(/^public\//, "")}`
      : null;
    const highCost =
      entry.groupName === "backgrounds" ||
      highCostReactComponents.has(entry.slug);
    const record = commonLinkedFields({
      id: `reactbits-${entry.slug}`,
      name,
      source: source.name,
      sourceUrl,
      category: entry.label,
      sourceCategory: entry.route,
      summary: `${name} is a public React Bits ${entry.label.toLowerCase()} with four official React variants: JavaScript or TypeScript, each with CSS or Tailwind.`,
      technique:
        "Open the official live demo, choose the TypeScript/JavaScript and CSS/Tailwind variant that matches the project, then install only that registry item and adapt its props.",
      styleTags: [
        "animated",
        "React",
        "React Bits",
        entry.label,
        ...entry.slug.split("-"),
      ],
      bestFor: entry.bestFor,
      dependencies:
        "Dependencies vary by component; inspect the official page and registry payload before installation.",
      frameworkFit:
        "React; official JavaScript/TypeScript and CSS/Tailwind variants",
      motionLevel: entry.groupName === "textAnimations" ? "medium" : "strong",
      performanceCost: highCost ? "high" : "medium",
      compatibility: "React · official shadcn-compatible registry",
      previewVideoUrl,
      previewAccent: source.accent,
      installCommand: `npx shadcn@latest add @react-bits/${registryItem.name}`,
      registryUrl: `${source.site}/r/${registryItem.name}.json`,
      phase: source.phase,
      sourceRevision: revision,
    });
    record.impact = entry.impact;
    record.official_variants = [
      "JS-CSS",
      "JS-TW",
      "TS-CSS",
      "TS-TW",
    ];
    return record;
  });

  if (records.length !== 139) {
    throw new Error(`Expected 139 React Bits components, found ${records.length}`);
  }
  return {
    source: source.name,
    sourceUrl: source.site,
    repositoryUrl: `https://github.com/${source.repo}`,
    sourceRevision: revision,
    inventoryDate,
    license: "MIT + Commons Clause v1.0",
    licenseUrl: `https://github.com/${source.repo}/blob/${revision}/LICENSE.md`,
    licenseText,
    excluded: [
      "React Bits Pro components",
      "React Bits Pro blocks",
      "React Bits Pro templates",
    ],
    recordCount: records.length,
    records,
  };
}

function decodeQuoted(value) {
  return JSON.parse(`"${value}"`);
}

function parseCanvasComponents(source) {
  const matcher =
    /\{\s*href:\s*"((?:\\.|[^"])*)",\s*name:\s*"((?:\\.|[^"])*)",\s*description:\s*"((?:\\.|[^"])*)",\s*video:\s*"((?:\\.|[^"])*)",\s*\}/g;
  return [...source.matchAll(matcher)].map((match) => ({
    href: decodeQuoted(match[1]),
    name: decodeQuoted(match[2]),
    description: decodeQuoted(match[3]),
    video: decodeQuoted(match[4]),
  }));
}

function canvasCategory(slug) {
  if (
    ["dithered-object", "glass-object", "particle-object"].includes(slug)
  ) {
    return "3D / object effect";
  }
  if (["glitch", "retro-dither", "vhs"].includes(slug)) {
    return "Image / distortion effect";
  }
  if (["particle-scroll", "peel", "laser"].includes(slug)) {
    return "Scroll effect";
  }
  return "Interactive canvas effect";
}

async function buildCanvasUiSnapshot() {
  const source = sources.canvasUi;
  const revision = await resolveRevision(source.repo);
  const [componentSource, licenseText] = await Promise.all([
    fetchText(rawUrl(source.repo, revision, "src/data/components.ts")),
    fetchText(rawUrl(source.repo, revision, "LICENSE.md")),
  ]);
  const entries = parseCanvasComponents(componentSource);
  const records = entries.map((entry) => {
    const slug = entry.href.split("/").filter(Boolean).at(-1);
    const category = canvasCategory(slug);
    const sourceUrl = `${source.site}${entry.href}`;
    const record = commonLinkedFields({
      id: `canvasui-${slug}`,
      name: entry.name,
      source: source.name,
      sourceUrl,
      category,
      sourceCategory: category.toLowerCase().replaceAll(" ", "-"),
      summary: entry.description,
      technique:
        "Open the official live demo, choose one of the six framework variants, install only that registry item, preserve the plain-HTML layer, and tune the GPU effect to the project.",
      styleTags: [
        "canvas",
        "WebGL",
        "interactive",
        "Canvas UI",
        ...slug.split("-"),
      ],
      bestFor:
        "immersive heroes; campaign reveals; experimental editorial moments; high-attention product storytelling",
      dependencies:
        "Dependencies vary by component and framework; inspect the official page and registry payload before installation.",
      frameworkFit:
        "React, Solid, Preact, Vue, Svelte, or dependency-free vanilla TypeScript",
      motionLevel: "strong",
      performanceCost: "high",
      compatibility:
        "Modern browsers; experimental html-in-canvas enhances Chrome/Edge while documented WebGL or plain-HTML fallbacks preserve content",
      previewVideoUrl: `${source.site}${entry.video}`,
      previewAccent: source.accent,
      installCommand: `npx shadcn@latest add @canvas-ui/${slug}-react`,
      registryUrl: `${source.site}/r/${slug}-react.json`,
      phase: source.phase,
      sourceRevision: revision,
    });
    record.impact = "signature";
    record.official_variants = [
      "React",
      "Solid",
      "Preact",
      "Vue",
      "Svelte",
      "vanilla TypeScript",
    ];
    record.browser_note =
      "Some live-HTML canvas effects use an experimental Chrome/Edge capability; use the documented WebGL overlay or plain-HTML fallback everywhere else.";
    return record;
  });

  if (records.length !== 25) {
    throw new Error(`Expected 25 Canvas UI components, found ${records.length}`);
  }
  return {
    source: source.name,
    sourceUrl: source.site,
    repositoryUrl: `https://github.com/${source.repo}`,
    sourceRevision: revision,
    inventoryDate,
    license: "MIT + Commons Clause v1.0",
    licenseUrl: `https://github.com/${source.repo}/blob/${revision}/LICENSE.md`,
    licenseText,
    recordCount: records.length,
    records,
  };
}

async function loadOrRefreshSnapshot(source, builder) {
  if (refresh || !(await exists(source.snapshot))) {
    const snapshot = await builder();
    await writeFile(
      source.snapshot,
      `${JSON.stringify(snapshot, null, 2)}\n`,
    );
    return snapshot;
  }
  return JSON.parse(await readFile(source.snapshot, "utf8"));
}

function replaceMarkdownBlock(source, start, end, content) {
  const block = `${start}\n${content.trim()}\n${end}`;
  const pattern = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  return pattern.test(source)
    ? source.replace(pattern, block)
    : `${source.trimEnd()}\n\n${block}\n`;
}

async function updateInstructions(reactSnapshot, canvasSnapshot) {
  const filePath = path.join(mcpRoot, "instructions.md");
  let instructions = await readFile(filePath, "utf8");
  const content = `
## React Bits and Canvas UI linked components

These records expose official live demos, install commands, registry URLs, framework guidance, and remote selection previews. Lumora does not mirror their source code or preview media.

- Filter \`art_direction\` by \`React Bits\` or \`Canvas UI\`.
- Open \`official_source_url\` and inspect \`registry_url\` before installing only the selected component.
- React Bits records cover the ${reactSnapshot.recordCount}-component public catalog and exclude every React Bits Pro component, block, and template.
- Canvas UI records cover all ${canvasSnapshot.recordCount} official effects and list its six framework flavors.
- Use \`preview_video_url\` only to evaluate the effect; do not ship catalog preview films as production media.
- Both sources currently use MIT + Commons Clause v1.0: commercial project use is allowed, but the components themselves may not be sold, sublicensed, or redistributed as a library, bundle, or port.
- Preserve semantic content, reduced motion, offscreen pause, cleanup, responsive fallbacks, and browser fallbacks after adaptation.
`;
  instructions = replaceMarkdownBlock(
    instructions,
    "<!-- LINKED-COMPONENT-LIBRARIES:START -->",
    "<!-- LINKED-COMPONENT-LIBRARIES:END -->",
    content,
  );
  await writeFile(filePath, instructions);
}

async function writeLicenseBoundary(snapshot, fileName) {
  await mkdir(path.join(mcpRoot, "licences"), { recursive: true });
  const notice = [
    `${snapshot.source} linked component source boundary`,
    `Inventory date: ${snapshot.inventoryDate}`,
    `Official catalog: ${snapshot.sourceUrl}`,
    `Official repository: ${snapshot.repositoryUrl}`,
    `Pinned revision: ${snapshot.sourceRevision}`,
    `Official licence: ${snapshot.licenseUrl}`,
    "",
    "Lumora MCP stores metadata and official links only.",
    "Component source code and preview media are not mirrored in this repository.",
    "Install only selected components from the official registry into an end project.",
    "",
    "Pinned official licence text:",
    "",
    snapshot.licenseText.trim(),
    "",
  ].join("\n");
  await writeFile(path.join(mcpRoot, "licences", fileName), notice);
}

async function mergeCatalogs(reactSnapshot, canvasSnapshot) {
  const linkedRecords = [
    ...reactSnapshot.records,
    ...canvasSnapshot.records,
  ];
  const phases = new Set([
    sources.reactBits.phase,
    sources.canvasUi.phase,
  ]);
  const componentsPath = path.join(mcpRoot, "components.json");
  const indexPath = path.join(mcpRoot, "components-index.json");
  const components = JSON.parse(await readFile(componentsPath, "utf8"));
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const merged = [
    ...components.filter((record) => !phases.has(record.phase)),
    ...linkedRecords,
  ];
  const mergedIndex = [
    ...index.filter((record) => !phases.has(record.phase)),
    ...linkedRecords.map(toIndexRecord),
  ];
  const ownedCount = merged.filter(
    (record) => record.source_kind === "owned-original-recipe",
  ).length;
  const originKitCount = merged.filter(
    (record) => record.source === "OriginKit",
  ).length;

  await writeFile(componentsPath, `${JSON.stringify(merged, null, 2)}\n`);
  await writeFile(indexPath, `${JSON.stringify(mergedIndex, null, 2)}\n`);

  const manifestPath = path.join(mcpRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.version = "1.1.0";
  manifest.generatedAt = inventoryDate;
  manifest.totals.componentRecipes = merged.length;
  manifest.totals.ownedComponentRecipes = ownedCount;
  manifest.totals.linkedComponentRecipes = merged.length - ownedCount;
  manifest.totals.linkedOriginKitComponents = originKitCount;
  manifest.totals.linkedReactBitsComponents =
    reactSnapshot.records.length;
  manifest.totals.linkedCanvasUiComponents =
    canvasSnapshot.records.length;
  manifest.endpoints.reactBitsComponents =
    `${publicRoot}/react-bits-components.json`;
  manifest.endpoints.canvasUiComponents =
    `${publicRoot}/canvas-ui-components.json`;
  manifest.componentSchema = {
    id: "Stable catalog identifier",
    sourceKind:
      "owned-original-recipe or external-linked-component",
    officialSourceUrl:
      "Official detail page for a linked component",
    registryUrl:
      "Optional official shadcn-compatible registry payload for the selected component",
    installCommand:
      "Optional official single-component installation command",
    officialVariants:
      "Available language, styling, or framework variants",
    previewVideoUrl:
      "Optional official remote selection preview; never production media",
    licenceClass:
      "owned-original, linked-source, or end-project-only-linked-source",
  };
  manifest.componentSelectionGuidance = {
    ...manifest.componentSelectionGuidance,
    reactBits:
      "React Bits records link to its public registry, official live demos, and remote selection previews. React Bits Pro is excluded.",
    canvasUi:
      "Canvas UI records link to official six-framework registry variants and remote selection previews. Preserve documented browser fallbacks.",
    linkedSourceBoundary:
      "React Bits and Canvas UI use MIT + Commons Clause v1.0: commercial end-project use is allowed, but do not sell or redistribute the component libraries themselves.",
    previewEngine:
      "All 85 owned archetypes have representative SVG compositions. Linked cards load a paused official opening frame only near the viewport; only the selected inspector plays motion. Previews guide selection and are not production source or media.",
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const provenancePath = path.join(mcpRoot, "provenance.json");
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  const originKitSource = provenance.components.sources?.find(
    (entry) => entry.source === "OriginKit",
  ) ?? {
    source: "OriginKit",
    sourceUrl: "https://www.originkit.dev",
    sourceKind: "external-linked-component",
    licence: "user-confirmed-free-use · official-source-link",
    recordCount: originKitCount,
    inventoryDate,
    storage:
      "Metadata snapshot with official component-page, poster, and video URLs; no OriginKit source code or media mirrored locally.",
  };
  provenance.generatedAt = inventoryDate;
  provenance.components = {
    source:
      "Lumora owned-original recipes plus officially linked OriginKit, React Bits, and Canvas UI catalogs",
    sourceKind: "mixed owned-original and external-linked-component",
    licence:
      "Owned-original; OriginKit user-confirmed free use; React Bits and Canvas UI MIT + Commons Clause v1.0",
    recipeCount: merged.length,
    ownedOriginalCount: ownedCount,
    linkedComponentCount: merged.length - ownedCount,
    linkedOriginKitCount: originKitCount,
    linkedReactBitsCount: reactSnapshot.records.length,
    linkedCanvasUiCount: canvasSnapshot.records.length,
    sources: [
      {
        source: "Lumora Web Design Components skill",
        sourceKind: "owned-original-recipe",
        licence: "owned-original",
        recordCount: ownedCount,
      },
      originKitSource,
      {
        source: reactSnapshot.source,
        sourceUrl: reactSnapshot.sourceUrl,
        repositoryUrl: reactSnapshot.repositoryUrl,
        sourceRevision: reactSnapshot.sourceRevision,
        sourceKind: "external-linked-component",
        licence: reactSnapshot.license,
        licenceUrl: reactSnapshot.licenseUrl,
        recordCount: reactSnapshot.records.length,
        inventoryDate,
        exclusions: reactSnapshot.excluded,
        storage:
          "Official metadata, page, registry, and remote preview URLs only; no source code or preview media mirrored.",
      },
      {
        source: canvasSnapshot.source,
        sourceUrl: canvasSnapshot.sourceUrl,
        repositoryUrl: canvasSnapshot.repositoryUrl,
        sourceRevision: canvasSnapshot.sourceRevision,
        sourceKind: "external-linked-component",
        licence: canvasSnapshot.license,
        licenceUrl: canvasSnapshot.licenseUrl,
        recordCount: canvasSnapshot.records.length,
        inventoryDate,
        storage:
          "Official metadata, page, registry, and remote preview URLs only; no source code or preview media mirrored.",
      },
    ],
    transformations: [
      "Preserved official names, categories, detail pages, registry URLs, install commands, framework variants, source revisions, and preview-video URLs.",
      "Added Lumora brand-fit, responsive, accessibility, fallback, browser, and performance guidance.",
      "Excluded all paid React Bits Pro components, blocks, and templates.",
      "Kept third-party source code and preview media on the official services.",
      "Grid cards request a paused opening frame only when rendered; motion runs only for the selected inspector.",
    ],
  };
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  await updateInstructions(reactSnapshot, canvasSnapshot);
  await writeLicenseBoundary(
    reactSnapshot,
    "react-bits-linked-source.txt",
  );
  await writeLicenseBoundary(
    canvasSnapshot,
    "canvas-ui-linked-source.txt",
  );

  return { merged, mergedIndex };
}

const [reactSnapshot, canvasSnapshot] = await Promise.all([
  loadOrRefreshSnapshot(sources.reactBits, buildReactBitsSnapshot),
  loadOrRefreshSnapshot(sources.canvasUi, buildCanvasUiSnapshot),
]);
const allLinkedIds = [
  ...reactSnapshot.records,
  ...canvasSnapshot.records,
].map((record) => record.id);
if (new Set(allLinkedIds).size !== allLinkedIds.length) {
  throw new Error("Duplicate linked component IDs detected.");
}

const { merged } = await mergeCatalogs(reactSnapshot, canvasSnapshot);
console.log(
  JSON.stringify(
    {
      refresh,
      reactBits: reactSnapshot.records.length,
      reactBitsRevision: reactSnapshot.sourceRevision,
      reactBitsRemotePreviews: reactSnapshot.records.filter(
        (record) => record.preview_video_url,
      ).length,
      canvasUi: canvasSnapshot.records.length,
      canvasUiRevision: canvasSnapshot.sourceRevision,
      componentRecipes: merged.length,
    },
    null,
    2,
  ),
);
