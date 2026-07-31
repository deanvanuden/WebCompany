import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { applyComponentSelectionGuidance } from "./component-selection-guidance.mjs";

const repoRoot = path.resolve(process.cwd());
const mcpRoot = path.join(repoRoot, "mcp");
const snapshotPath = path.join(mcpRoot, "pmndrs-examples.json");
const publicRoot = "https://lumoraofficial.de/mcp";
const sourceName = "pmndrs Examples";
const repository = "pmndrs/examples";
const repositoryUrl = `https://github.com/${repository}`;
const galleryUrl = "https://pmndrs.github.io/examples";
const inventoryDate = "2026-07-31";
const phase = "pmndrs-examples-linked-2026-07";
const refresh = process.argv.includes("--refresh");

const groups = [
  {
    id: "signature-3d-scene",
    label: "Signature 3D scene",
    bestFor:
      "immersive heroes; technical launches; experiential campaigns; high-attention section canvases",
    impact: "signature",
    performanceCost: "high",
    quality: 92,
    novelty: 93,
    accent: "#63D8FF",
    slugs: [
      "audio-analyser",
      "caustics",
      "clouds",
      "flow-shield",
      "gpgpu-curl-noise-dof",
      "grass-shader",
      "instanced-particles-effects",
      "shader-fire",
      "sparks-and-effects",
      "spline-glass-shapes",
      "thunder-clouds",
      "volumetric-light-godray",
      "volumetric-spotlight",
      "water-shader",
      "zustand-site",
    ],
  },
  {
    id: "scroll-storytelling",
    label: "3D scroll / narrative section",
    bestFor:
      "award-style landing pages; editorial journeys; portfolio narratives; product storytelling",
    impact: "signature",
    performanceCost: "high",
    quality: 91,
    novelty: 90,
    accent: "#C9FF4A",
    slugs: [
      "camera-scroll",
      "gltf-animations-tied-to-scroll",
      "horizontal-tiles",
      "image-gallery",
      "infinite-scroll",
      "landing-page",
      "mount-transitions",
      "router-transitions",
      "scrollcontrols-and-lens-refraction",
      "scrollcontrols-gltf",
      "scrollcontrols-with-minimap",
      "tying-canvas-to-scroll-offset",
      "useintersect-and-scrollcontrols",
    ],
  },
  {
    id: "product-experience",
    label: "3D product / configurator",
    bestFor:
      "product heroes; interactive configurators; premium commerce; material selectors; campaign showcases",
    impact: "signature",
    performanceCost: "high",
    quality: 90,
    novelty: 87,
    accent: "#FF9C6B",
    slugs: [
      "backdrop-and-cables",
      "bloom-hdr-workflow-gltf",
      "bouncy-watch",
      "diamond-ring",
      "faucets-select-highlight",
      "floating-diamonds",
      "floating-instanced-shoes",
      "floating-laptop",
      "gltfjsx-400kb-drone",
      "ground-reflections-and-video-textures",
      "shoe-configurator",
      "stage-presets-gltfjsx",
      "t-shirt-configurator",
      "transparent-aesop-bottles",
      "viking-ship",
    ],
  },
  {
    id: "mixed-dom-webgl",
    label: "Mixed DOM / WebGL interface",
    bestFor:
      "spatial interfaces; annotated products; immersive editorial layouts; maps; synchronized 2D and 3D UI",
    impact: "supporting",
    performanceCost: "high",
    quality: 89,
    novelty: 89,
    accent: "#BCA7FF",
    slugs: [
      "canvas-text",
      "flexbox-yoga-in-webgl",
      "html-annotations",
      "html-input-fields",
      "html-markers",
      "interactive-spline-scene-live-html",
      "mixing-html-and-webgl",
      "mixing-html-and-webgl-w-occlusion",
      "multiple-views-with-uniform-controls",
      "pairing-threejs-to-ui",
      "svg-maps-with-html-annotations",
      "viewcube",
    ],
  },
  {
    id: "portal-transition",
    label: "Portal / spatial transition",
    bestFor:
      "campaign transitions; scene-to-scene navigation; portfolio reveals; spatial storytelling",
    impact: "signature",
    performanceCost: "high",
    quality: 88,
    novelty: 92,
    accent: "#FF73C5",
    slugs: [
      "drei-rendertexture",
      "enter-portals",
      "pass-through-portals",
      "portal-shapes",
      "portals",
      "stencil-mask",
      "threejs-journey-portal",
    ],
  },
  {
    id: "material-lighting",
    label: "3D material / lighting treatment",
    bestFor:
      "premium product renders; architectural scenes; glass and jewelry; cinematic staging; brand atmosphere",
    impact: "supporting",
    performanceCost: "high",
    quality: 87,
    novelty: 86,
    accent: "#FFD76A",
    slugs: [
      "building-live-envmaps",
      "color-grading",
      "diamond-refraction",
      "environment-blur-and-transitions",
      "frosted-glass",
      "glass-flower",
      "inter-epoxy-resin",
      "iridescent-decals",
      "spotlight-shadows",
      "wireframes",
    ],
  },
  {
    id: "interactive-3d-effect",
    label: "Interactive 3D effect",
    bestFor:
      "interactive diagrams; tactile reveals; cursor moments; celebration states; expressive portfolio details",
    impact: "supporting",
    performanceCost: "high",
    quality: 86,
    novelty: 88,
    accent: "#5EF0C3",
    slugs: [
      "bezier-curves-and-nodes",
      "cell-fracture",
      "confetti",
      "lusion-connectors",
      "raycast-cycling",
      "trails",
    ],
  },
  {
    id: "r3f-foundation",
    label: "R3F media / loading foundation",
    bestFor:
      "production-ready 3D delivery; progressive loading; media surfaces; resilient WebGL sections",
    impact: "subtle",
    performanceCost: "medium",
    quality: 84,
    novelty: 76,
    accent: "#8EA4C8",
    slugs: [
      "progressive-loading-states-with-suspense",
      "video-textures",
    ],
  },
];

const featured = new Set([
  "flow-shield",
  "gpgpu-curl-noise-dof",
  "scrollcontrols-and-lens-refraction",
  "shoe-configurator",
  "mixing-html-and-webgl-w-occlusion",
  "enter-portals",
  "frosted-glass",
  "lusion-connectors",
]);

const assetNotes = new Map([
  [
    "bouncy-watch",
    "The visible watch branding is reference content. Reuse the interaction and spring-control pattern with a client-owned or separately licensed product model.",
  ],
  [
    "flow-shield",
    "The demo includes a recognizable Droideka-style model. Reuse the shield shader and interaction pattern with a Lumora-approved model.",
  ],
  [
    "gltfjsx-400kb-drone",
    "Reuse the GLTF compression and presentation workflow; replace the bundled drone unless its asset rights are independently confirmed.",
  ],
  [
    "threejs-journey-portal",
    "Reuse the portal principles only. Recreate the composition and provide original or separately licensed scene assets.",
  ],
  [
    "transparent-aesop-bottles",
    "The visible Aesop packaging is reference content. Reuse the glass/transmission treatment with client-owned packaging and branding.",
  ],
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
      "User-Agent": "Lumora-MCP-pmndrs-Importer/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }
  return response;
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json();
}

async function fetchText(url) {
  return (await fetchResponse(url)).text();
}

function rawUrl(revision, filePath) {
  return `https://raw.githubusercontent.com/${repository}/${revision}/${filePath}`;
}

async function resolveRevision() {
  const commit = await fetchJson(
    `https://api.github.com/repos/${repository}/commits/main`,
  );
  return commit.sha;
}

function curatedEntries() {
  return groups.flatMap((group) =>
    group.slugs.map((slug) => ({ slug, group })),
  );
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
    "official_source_url",
    "code_url",
    "preview_video_url",
    "preview_poster_url",
    "preview_accent",
    "official_featured",
    "official_source_label",
    "implementation_mode",
    "phase",
    "selection_pass",
    "selection_pass_label",
    "component_role",
    "enhancement_family",
    "can_be_structural",
    "section_canvas",
    "requires_structural_pairing",
    "text_overlay_capability",
    "foreground_content_guidance",
    "overlay_readability_guidance",
    "pairing_guidance",
    "codex_selection_instruction",
    "codex_rights_instruction",
    "selection_freedom",
  ];
  return Object.fromEntries(fields.map((field) => [field, record[field]]));
}

function recordFromMetadata({ slug, group, metadata, revision }) {
  const demoUrl = `${galleryUrl}/demos/${slug}`;
  const codeUrl = `${repositoryUrl}/tree/${revision}/demos/${slug}`;
  const metadataUrl = rawUrl(revision, `demos/${slug}/pmndrs.json`);
  const declaredAssets = Array.isArray(metadata.assets) ? metadata.assets : [];
  const libraries = Array.isArray(metadata.libraries)
    ? metadata.libraries
    : [];
  const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  const authors = Array.isArray(metadata.authors) ? metadata.authors : [];
  const description = String(metadata.description ?? "").trim();
  const summary = description
    ? `${description} Curated by Lumora as a ${group.label.toLowerCase()} pattern for agency projects.`
    : `${metadata.title} is an official pmndrs example curated as a ${group.label.toLowerCase()} pattern for agency projects.`;
  const record = {
    id: `pmndrs-${slug}`,
    name: metadata.title,
    category: group.label,
    source_category: group.id,
    art_direction: sourceName,
    summary,
    technique:
      "Open the official live demo and pinned GitHub directory, isolate the useful R3F/WebGL technique, then rebuild it around the project's content, brand tokens, approved assets, and performance budget.",
    style_tags: [
      "3D",
      "WebGL",
      "React Three Fiber",
      "pmndrs",
      ...tags,
    ].join("; "),
    best_for: group.bestFor,
    dependencies: libraries.join("; ") || "React; Three.js; inspect the pinned demo",
    framework_fit:
      "React 18; React Three Fiber; Drei and related pmndrs libraries where recorded",
    motion_level: group.id === "r3f-foundation" ? "medium" : "strong",
    motion_choreography:
      "Use, combine, layer, and repeat any number of 3D behaviors. Retiming and offscreen pausing are implementation options, not selection limits.",
    performance_cost: group.performanceCost,
    accessibility_contract:
      "Keep semantic HTML, headings, links, controls, and focus behavior outside the canvas. Provide keyboard/touch alternatives for pointer interactions and a designed static reduced-motion state.",
    content_contract:
      "Replace demo copy, models, textures, audio, logos, and imagery with real project content and approved assets. The canvas must not be the only carrier of essential information.",
    responsive_strategy:
      "Lazy-load near the viewport, cap device pixel ratio, reduce particles, postprocessing, shadows, and interaction density on mobile, and switch to a composed poster when the scene no longer earns its cost.",
    interaction_inputs:
      "Inspect the official example for scroll, pointer, drag, camera, audio, keyboard, and ambient inputs before adaptation.",
    fallback_strategy:
      "Render an optimized brand-matched poster or simplified DOM composition before WebGL initializes and whenever reduced motion, low capability, loading failure, or context loss requires it.",
    test_focus:
      "source and dependency audit; WebGL loading failure; context cleanup; reduced motion; keyboard and touch parity; narrow viewport; offscreen pause; DPR cap; asset weight",
    implementation_steps:
      "open live demo; inspect pinned source; isolate the technique; replace demo assets and content; adapt tokens and controls; add poster fallback; profile; test",
    brand_tokens:
      "Map lighting, material color, fog, environment, camera, type, spacing, controls, and motion timing to project semantic tokens.",
    avoid_when:
      "the scene competes with conversion or reading, duplicates another signature canvas, has no meaningful static fallback, or cannot meet the project's mobile performance budget",
    impact: group.impact,
    quality_score: group.quality,
    novelty_score: group.novelty,
    compatibility: "React · React Three Fiber · Three.js/WebGL",
    source_kind: "external-linked-component",
    license: "MIT (example code)",
    licence_class: "bundle-ok-code-linked-assets",
    usage_rights:
      "Use and adapt the example code under MIT while preserving the required copyright and licence notice.",
    license_notice_required: true,
    asset_rights_boundary:
      declaredAssets.length > 0
        ? "Only assets explicitly declared in pmndrs metadata carry their recorded provenance. Independently confirm or replace every other visible demo asset."
        : "The pmndrs metadata declares no reusable assets for this demo. Treat visible models, textures, audio, fonts, logos, and imagery as replaceable reference content.",
    codex_rights_instruction:
      "Use or adapt the example code under the recorded MIT licence and preserve its notice. Do not assume the demo's visible models, textures, audio, fonts, logos, or branded objects share that licence; replace them unless the selected asset has its own confirmed record.",
    brand_or_trademark_note: assetNotes.get(slug) ?? null,
    source: sourceName,
    creator: authors.join(", ") || "pmndrs contributors",
    authors,
    source_url: demoUrl,
    official_source_url: demoUrl,
    official_source_label: "Open live pmndrs example",
    code_url: codeUrl,
    metadata_url: metadataUrl,
    original_source_url: metadata.source || null,
    repository_url: repositoryUrl,
    preview_video_url: null,
    preview_poster_url: `${galleryUrl}/${slug}/thumbnail.webp`,
    preview_accent: group.accent,
    preview_layout: "full",
    preview_fallback: "official-static-thumbnail",
    remote_media: true,
    media_mirrored: false,
    source_code_bundled: false,
    implementation_mode: "adapt-from-pinned-official-example",
    install_command: `npx degit pmndrs/examples/demos/${slug} myproject`,
    official_featured: featured.has(slug),
    official_variants: ["React", "React Three Fiber", "Three.js/WebGL"],
    libraries,
    declared_assets: declaredAssets,
    published_at: metadata.publishedAt ?? null,
    inventory_date: inventoryDate,
    source_revision: revision,
    phase,
    public_record_url: `${publicRoot}/components.json#pmndrs-${slug}`,
  };
  return applyComponentSelectionGuidance(record);
}

async function buildSnapshot() {
  const revision = await resolveRevision();
  const [licenseText, ...metadataRecords] = await Promise.all([
    fetchText(rawUrl(revision, "LICENSE")),
    ...curatedEntries().map(async ({ slug, group }) => ({
      slug,
      group,
      metadata: await fetchJson(
        rawUrl(revision, `demos/${slug}/pmndrs.json`),
      ),
    })),
  ]);
  const records = metadataRecords.map((entry) =>
    recordFromMetadata({ ...entry, revision }),
  );
  if (records.length !== 80) {
    throw new Error(`Expected 80 curated pmndrs examples, found ${records.length}`);
  }
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    throw new Error("Curated pmndrs IDs are not unique");
  }
  return {
    source: sourceName,
    sourceUrl: galleryUrl,
    repositoryUrl,
    sourceRevision: revision,
    inventoryDate,
    license: "MIT",
    licenseUrl: `${repositoryUrl}/blob/${revision}/LICENSE`,
    licenseText,
    selectionMethod:
      "Curated for agency-ready signature 3D scenes, scroll narratives, configurators, mixed DOM/WebGL interfaces, portals, materials, interaction patterns, and production foundations.",
    excludedFamilies: [
      "games and game clones",
      "beginner setup demos",
      "debug-only physics examples",
      "near-duplicate implementation tests",
      "examples whose primary value is an unverified branded asset",
    ],
    recordCount: records.length,
    records,
  };
}

async function loadOrRefreshSnapshot() {
  const snapshot =
    refresh || !(await exists(snapshotPath))
      ? await buildSnapshot()
      : JSON.parse(await readFile(snapshotPath, "utf8"));
  snapshot.records = snapshot.records.map(applyComponentSelectionGuidance);
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
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

async function updateInstructions(snapshot) {
  const filePath = path.join(mcpRoot, "instructions.md");
  let instructions = await readFile(filePath, "utf8");
  const content = `
## pmndrs Examples · R3F / WebGL patterns

These ${snapshot.recordCount} records are a curated agency-facing subset of the official pmndrs examples collection. They cover signature 3D scenes, scroll storytelling, product configurators, mixed DOM/WebGL interfaces, portals, materials, interactive effects, and production loading/media foundations.

- Filter \`art_direction: "pmndrs Examples"\` to review the collection.
- Use \`official_source_url\` for the live example, \`preview_poster_url\` for selection, and \`code_url\` for the pinned source directory.
- Treat the effects/motion label as a discovery category, not a usage restriction. Records marked \`section_canvas: true\` may carry heroes or sections visually but still need semantic foreground content. Hybrid records may define structural sections when their content and interaction contract fits.
- Codex may use and combine any number of WebGL scenes. Lazy-loading, DPR controls, pausing, disposal, and poster fallbacks are implementation options, never selection limits.
- The repository's example code is MIT and may be adapted with its notice preserved.
- Demo assets are a separate boundary. Do not assume visible models, textures, audio, fonts, logos, or branded products share the code licence. Use the technique with Lumora-owned, client-owned, or separately confirmed assets.
- Do not paste an unchanged demo composition. Adapt camera, content, materials, colors, typography, controls, timing, and responsive behavior to the project.
`;
  instructions = replaceMarkdownBlock(
    instructions,
    "<!-- PMNDRS-EXAMPLES:START -->",
    "<!-- PMNDRS-EXAMPLES:END -->",
    content,
  );
  await writeFile(filePath, instructions);
}

async function writeLicenseBoundary(snapshot) {
  await mkdir(path.join(mcpRoot, "licences"), { recursive: true });
  const notice = [
    "pmndrs Examples linked code boundary",
    `Inventory date: ${snapshot.inventoryDate}`,
    `Official gallery: ${snapshot.sourceUrl}`,
    `Official repository: ${snapshot.repositoryUrl}`,
    `Pinned revision: ${snapshot.sourceRevision}`,
    `Official licence: ${snapshot.licenseUrl}`,
    "",
    "Lumora MCP stores curated metadata and official remote thumbnail, demo,",
    "and source links. It does not mirror the example source or demo assets.",
    "",
    "The MIT text below covers the repository example code. Models, textures,",
    "audio, fonts, logos, and other visible demo assets may have separate terms.",
    "Replace them unless the selected asset has its own confirmed provenance.",
    "",
    "Pinned official licence text:",
    "",
    snapshot.licenseText.trim(),
    "",
  ].join("\n");
  await writeFile(
    path.join(mcpRoot, "licences", "pmndrs-examples.txt"),
    notice,
  );
}

async function mergeCatalog(snapshot) {
  const componentsPath = path.join(mcpRoot, "components.json");
  const indexPath = path.join(mcpRoot, "components-index.json");
  const components = JSON.parse(await readFile(componentsPath, "utf8"));
  const merged = [
    ...components.filter((record) => record.phase !== phase),
    ...snapshot.records,
  ].map(applyComponentSelectionGuidance);
  const mergedIndex = merged.map(toIndexRecord);
  const ownedCount = merged.filter(
    (record) => record.source_kind === "owned-original-recipe",
  ).length;
  const sourceCount = (name) =>
    merged.filter((record) => record.source === name).length;
  const sectionCanvasCount = merged.filter(
    (record) => record.section_canvas === true,
  ).length;

  await writeFile(componentsPath, `${JSON.stringify(merged, null, 2)}\n`);
  await writeFile(indexPath, `${JSON.stringify(mergedIndex, null, 2)}\n`);

  const manifestPath = path.join(mcpRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.version = "1.3.0";
  manifest.generatedAt = inventoryDate;
  manifest.purpose =
    "A human and machine-readable design toolkit for selecting web-ready 3D models, owned-original and officially linked web components, curated R3F/WebGL patterns, multi-style image and UI assets, and externally hosted animated background references.";
  manifest.totals.componentRecipes = merged.length;
  manifest.totals.ownedComponentRecipes = ownedCount;
  manifest.totals.linkedComponentRecipes = merged.length - ownedCount;
  manifest.totals.linkedOriginKitComponents = sourceCount("OriginKit");
  manifest.totals.linkedReactBitsComponents = sourceCount("React Bits");
  manifest.totals.linkedCanvasUiComponents = sourceCount("Canvas UI");
  manifest.totals.linkedPmndrsExamples = snapshot.records.length;
  manifest.totals.structureComponentRecipes = merged.filter(
    (record) => record.selection_pass === "structure",
  ).length;
  manifest.totals.enhancementComponentRecipes = merged.filter(
    (record) => record.selection_pass === "enhancement",
  ).length;
  manifest.totals.sectionCanvasComponentRecipes = sectionCanvasCount;
  manifest.endpoints.pmndrsExamples = `${publicRoot}/pmndrs-examples.json`;
  manifest.componentSchema = {
    ...manifest.componentSchema,
    codeUrl:
      "Optional pinned implementation directory for linked open-source examples",
    originalSourceUrl:
      "Optional original sandbox or upstream reference recorded by the source catalog",
    exampleLibraries:
      "Exact libraries declared by the linked example metadata",
    assetRightsBoundary:
      "Separates reusable example code from demo models, textures, audio, fonts, logos, and imagery",
  };
  manifest.componentSelectionGuidance = {
    ...manifest.componentSelectionGuidance,
    pmndrs:
      "pmndrs Examples records are curated React Three Fiber/WebGL patterns with official static thumbnails, live demos, and pinned source directories. Codex may use and combine any number of scenes; implementation metadata does not limit selection.",
    selectionFreedom:
      "UNRESTRICTED: Codex alone decides all record counts, combinations, placement, repetition, sources, and selection order. Lumora imposes no usage rules.",
    linkedSourceBoundary:
      "React Bits and Canvas UI allow commercial end-project use under their recorded terms. pmndrs example code is MIT; visible demo assets remain a separate per-item boundary.",
  };
  delete manifest.componentSelectionGuidance.mandatoryEnhancementReview;
  delete manifest.componentSelectionGuidance.enhancementDiscovery;
  delete manifest.componentSelectionGuidance.sourceCoverageRule;
  delete manifest.componentSelectionGuidance.stackingRule;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const provenancePath = path.join(mcpRoot, "provenance.json");
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  provenance.generatedAt = inventoryDate;
  const previous = provenance.components;
  provenance.components = {
    ...previous,
    source:
      "Lumora owned-original recipes plus officially linked OriginKit, React Bits, Canvas UI, and pmndrs Examples catalogs",
    licence:
      "Owned-original; OriginKit user-confirmed free use; React Bits and Canvas UI MIT + Commons Clause v1.0; pmndrs example code MIT with separate demo-asset boundaries",
    recipeCount: merged.length,
    ownedOriginalCount: ownedCount,
    linkedComponentCount: merged.length - ownedCount,
    linkedOriginKitCount: sourceCount("OriginKit"),
    linkedReactBitsCount: sourceCount("React Bits"),
    linkedCanvasUiCount: sourceCount("Canvas UI"),
    linkedPmndrsCount: snapshot.records.length,
    structureCount: manifest.totals.structureComponentRecipes,
    enhancementCount: manifest.totals.enhancementComponentRecipes,
    sectionCanvasCount,
    sources: [
      ...previous.sources.filter((entry) => entry.source !== sourceName),
      {
        source: sourceName,
        sourceUrl: snapshot.sourceUrl,
        repositoryUrl: snapshot.repositoryUrl,
        sourceRevision: snapshot.sourceRevision,
        sourceKind: "external-linked-component",
        licence: snapshot.license,
        licenceUrl: snapshot.licenseUrl,
        recordCount: snapshot.recordCount,
        inventoryDate: snapshot.inventoryDate,
        storage:
          "Curated metadata plus official live-demo, pinned-source, and remote-thumbnail URLs; no example source code or demo assets mirrored.",
        assetBoundary:
          "MIT applies to example code. Visible demo models, textures, audio, fonts, logos, and imagery must be independently confirmed or replaced.",
      },
    ],
    transformations: [
      ...previous.transformations.filter(
        (entry) =>
          !/pmndrs|official static thumbnails and live demos|separated MIT example code/i.test(
            entry,
          ),
      ),
      "Curated 80 agency-ready pmndrs examples from the full gallery and classified them as signature scenes, scroll narratives, product experiences, mixed DOM/WebGL interfaces, portals, materials, interactions, or production foundations.",
      "Linked official static thumbnails and live demos without loading 80 WebGL scenes or mirroring preview media.",
      "Separated MIT example code from unconfirmed demo assets and added replacement guidance for recognizable branded examples.",
    ],
  };
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
}

const snapshot = await loadOrRefreshSnapshot();
await updateInstructions(snapshot);
await writeLicenseBoundary(snapshot);
await mergeCatalog(snapshot);

console.log(
  JSON.stringify(
    {
      source: snapshot.source,
      revision: snapshot.sourceRevision,
      records: snapshot.recordCount,
      categories: Object.fromEntries(
        groups.map((group) => [group.label, group.slugs.length]),
      ),
    },
    null,
    2,
  ),
);
