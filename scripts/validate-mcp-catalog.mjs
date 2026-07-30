import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd());
const mcpRoot = path.join(root, "mcp");
const errors = [];
const checkedFiles = new Set();

function check(condition, message) {
  if (!condition) errors.push(message);
}

async function readJson(relativePath) {
  const filePath = path.join(mcpRoot, relativePath);
  return JSON.parse(await readFile(filePath, "utf8"));
}

function localPathFromUrl(value) {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.hostname !== "lumoraofficial.de") return null;
    check(
      url.pathname.startsWith("/mcp/"),
      `Lumora URL does not live below /mcp/: ${value}`,
    );
    return decodeURIComponent(url.pathname.replace(/^\/mcp\//, ""));
  }

  return value.replace(/^\.?\//, "");
}

async function checkLocalFile(value, label) {
  const relativePath = localPathFromUrl(value);
  if (!relativePath) return;

  const resolved = path.resolve(mcpRoot, relativePath);
  check(
    resolved.startsWith(`${mcpRoot}${path.sep}`),
    `${label} escapes the mcp directory: ${value}`,
  );
  if (!resolved.startsWith(`${mcpRoot}${path.sep}`)) return;

  checkedFiles.add(relativePath);
  try {
    await access(resolved);
    const fileStat = await stat(resolved);
    check(fileStat.isFile(), `${label} is not a file: ${relativePath}`);
    check(fileStat.size > 0, `${label} is empty: ${relativePath}`);
  } catch {
    errors.push(`${label} is missing: ${relativePath}`);
  }
}

const [
  manifest,
  models,
  componentIndex,
  components,
  originKitComponents,
  reactBitsSnapshot,
  canvasUiSnapshot,
  images,
  designAssets,
  backgrounds,
  provenance,
] =
  await Promise.all([
    readJson("manifest.json"),
    readJson("models.json"),
    readJson("components-index.json"),
    readJson("components.json"),
    readJson("originkit-components.json"),
    readJson("react-bits-components.json"),
    readJson("canvas-ui-components.json"),
    readJson("image-assets.json"),
    readJson("design-assets.json"),
    readJson("animated-backgrounds.json"),
    readJson("provenance.json"),
  ]);
const reactBitsComponents = reactBitsSnapshot.records;
const canvasUiComponents = canvasUiSnapshot.records;
const componentPreviewSource = await readFile(
  path.join(mcpRoot, "component-previews.js"),
  "utf8",
);
const appCssSource = await readFile(path.join(mcpRoot, "app.css"), "utf8");
const appSource = await readFile(path.join(mcpRoot, "app.js"), "utf8");
const indexHtmlSource = await readFile(
  path.join(mcpRoot, "index.html"),
  "utf8",
);
const instructionsSource = await readFile(
  path.join(mcpRoot, "instructions.md"),
  "utf8",
);
const componentPreviewIds = [
  ...componentPreviewSource.matchAll(/^\s*"([a-z0-9-]+)":\s*\(\)\s*=>/gm),
].map((match) => match[1]);
const componentPreviewMotionBlock =
  componentPreviewSource.match(
    /const previewMotions = Object\.freeze\(\{([\s\S]*?)\}\);/,
  )?.[1] ?? "";
const componentPreviewMotionEntries = [
  ...componentPreviewMotionBlock.matchAll(
    /^\s*"([a-z0-9-]+)":\s*"([a-z0-9-]+)",?$/gm,
  ),
].map((match) => ({ archetype: match[1], motion: match[2] }));
const componentPreviewMotionIds = componentPreviewMotionEntries.map(
  (entry) => entry.archetype,
);

const modelIds = new Set(models.map((model) => model.id));
const componentIds = new Set(components.map((component) => component.id));
const componentIndexIds = new Set(componentIndex.map((component) => component.id));
const originKitComponentIds = new Set(
  originKitComponents.map((component) => component.id),
);
const reactBitsComponentIds = new Set(
  reactBitsComponents.map((component) => component.id),
);
const canvasUiComponentIds = new Set(
  canvasUiComponents.map((component) => component.id),
);
const imageIds = new Set(images.map((image) => image.id));
const imageUrls = new Set(images.map((image) => image.publicImageUrl));
const backgroundIds = new Set(backgrounds.map((background) => background.id));
const backgroundUrls = new Set(
  backgrounds.map((background) => background.sourceUrl),
);
const localModels = models.filter((model) => model.storage === "local");
const streamedModels = models.filter((model) => model.storage === "remote");
const kenneyModels = models.filter((model) => model.source === "Kenney");
const quaterniusModels = models.filter(
  (model) => model.source === "Quaternius",
);
const polyHavenModels = models.filter((model) => model.source === "Poly Haven");
const shipSafeModels = models.filter(
  (model) => model.licenceClass === "ship-safe",
);
const kenneyFidelityCounts = Object.fromEntries(
  ["very-low-poly", "standard-low-poly", "detailed-low-poly"].map(
    (band) => [
      band,
      kenneyModels.filter((model) => model.visualFidelity === band).length,
    ],
  ),
);

check(models.length === 1021, `Expected 1,021 models, found ${models.length}`);
check(
  modelIds.size === models.length,
  `Model IDs are not unique (${modelIds.size}/${models.length})`,
);
check(
  kenneyModels.length === 829,
  `Expected 829 Kenney models, found ${kenneyModels.length}`,
);
check(
  quaterniusModels.length === 72,
  `Expected 72 Quaternius models, found ${quaterniusModels.length}`,
);
check(
  polyHavenModels.length === 120,
  `Expected 120 Poly Haven models, found ${polyHavenModels.length}`,
);
check(
  localModels.length === 907,
  `Expected 907 local models, found ${localModels.length}`,
);
check(
  streamedModels.length === 114,
  `Expected 114 streamed models, found ${streamedModels.length}`,
);
check(
  shipSafeModels.length === 1020,
  `Expected 1,020 ship-safe models, found ${shipSafeModels.length}`,
);
check(
  kenneyFidelityCounts["very-low-poly"] === 552 &&
    kenneyFidelityCounts["standard-low-poly"] === 207 &&
    kenneyFidelityCounts["detailed-low-poly"] === 70,
  `Unexpected Kenney fidelity distribution: ${JSON.stringify(kenneyFidelityCounts)}`,
);

check(
  manifest.totals.models === models.length,
  "Manifest model total does not match models.json",
);
check(
  manifest.totals.localModels === localModels.length,
  "Manifest local model total does not match models.json",
);
check(
  manifest.totals.streamedModels === streamedModels.length,
  "Manifest streamed model total does not match models.json",
);
check(
  manifest.totals.shipSafeModels === shipSafeModels.length,
  "Manifest ship-safe model total does not match models.json",
);
check(
  manifest.totals.componentRecipes === components.length,
  "Manifest component total does not match components.json",
);
check(
  manifest.totals.ownedComponentRecipes === 1020 &&
    manifest.totals.linkedOriginKitComponents ===
      originKitComponents.length &&
    manifest.totals.linkedReactBitsComponents ===
      reactBitsComponents.length &&
    manifest.totals.linkedCanvasUiComponents ===
      canvasUiComponents.length &&
    manifest.totals.linkedComponentRecipes ===
      originKitComponents.length +
        reactBitsComponents.length +
        canvasUiComponents.length,
  "Manifest linked component totals are incorrect",
);
check(
  manifest.endpoints.originKitComponents ===
    "https://lumoraofficial.de/mcp/originkit-components.json",
  "Manifest OriginKit component endpoint is incorrect",
);
check(
  manifest.endpoints.reactBitsComponents ===
    "https://lumoraofficial.de/mcp/react-bits-components.json" &&
    manifest.endpoints.canvasUiComponents ===
      "https://lumoraofficial.de/mcp/canvas-ui-components.json",
  "Manifest React Bits or Canvas UI endpoint is incorrect",
);
for (const schemaField of [
  "officialSourceUrl",
  "registryUrl",
  "installCommand",
  "officialVariants",
  "previewVideoUrl",
  "licenceClass",
  "selectionPass",
  "componentRole",
  "enhancementFamily",
  "requiredReview",
  "canBeStructural",
  "pairingGuidance",
]) {
  check(
    Boolean(manifest.componentSchema?.[schemaField]),
    `Manifest component schema is missing ${schemaField}`,
  );
}
check(
  manifest.totals.imageAssets === images.length,
  "Manifest image asset total does not match image-assets.json",
);
check(
  manifest.endpoints.imageAssets ===
    "https://lumoraofficial.de/mcp/image-assets.json",
  "Manifest image asset endpoint is incorrect",
);
check(
  manifest.totals.animatedBackgrounds === backgrounds.length,
  "Manifest animated background total does not match animated-backgrounds.json",
);
check(
  manifest.totals.availableAnimatedBackgrounds ===
    backgrounds.filter((background) => background.availability === "Available")
      .length,
  "Manifest available animated background total does not match the catalog",
);
for (const schemaField of [
  "visualFidelity",
  "selectionPriority",
  "selectionGuidance",
  "bestFor",
  "avoidWhen",
  "fallbackPolicy",
]) {
  check(
    Boolean(manifest.modelSchema[schemaField]),
    `Manifest model schema is missing ${schemaField}`,
  );
}
check(
  manifest.modelSelectionGuidance?.guidanceMode === "advisory",
  "Manifest model selection guidance is not marked advisory",
);
check(
  /Do not infer art-direction fit/i.test(
    manifest.modelSelectionGuidance?.primaryRule ?? "",
  ),
  "Manifest does not prevent name-only or category-only model selection",
);
check(
  /guidance is advisory/i.test(instructionsSource),
  "Codex instructions do not preserve the advisory fallback policy",
);
check(
  /always work in two passes/i.test(instructionsSource) &&
    /skipping the review is not valid/i.test(instructionsSource) &&
    /OriginKit, React Bits, and Canvas UI/i.test(instructionsSource),
  "Codex instructions do not require the two-pass linked-library review",
);
check(
  /selection_pass_label/.test(appSource) &&
    /data-component-pass/.test(appSource) &&
    /id="component-workflow"/.test(indexHtmlSource) &&
    /Always use two component passes/.test(indexHtmlSource) &&
    /manifest\.endpoints\.componentRecords/.test(indexHtmlSource) &&
    /\.component-workflow/.test(appCssSource),
  "Component catalog UI does not expose the two-pass workflow",
);

for (const model of models) {
  check(Boolean(model.id), "A model has no ID");
  check(Boolean(model.name), `${model.id} has no name`);
  check(Boolean(model.category), `${model.id} has no category`);
  check(Boolean(model.licence), `${model.id} has no licence`);
  check(Boolean(model.publicModelUrl), `${model.id} has no public model URL`);
  check(
    model.publicModelUrl.startsWith("https://"),
    `${model.id} does not use an HTTPS public model URL`,
  );

  if (model.storage === "local") {
    await checkLocalFile(model.modelUrl, `${model.id} model`);
  } else {
    check(
      /^https:\/\/.+/i.test(model.modelUrl),
      `${model.id} streamed model URL is not HTTPS`,
    );
  }

  await checkLocalFile(model.thumbnailUrl, `${model.id} thumbnail`);

  for (const dependencyUrl of Object.values(model.files ?? {})) {
    if (model.storage === "local") {
      await checkLocalFile(dependencyUrl, `${model.id} dependency`);
    } else {
      check(
        /^https:\/\/.+/i.test(dependencyUrl),
        `${model.id} streamed dependency URL is not HTTPS`,
      );
    }
  }
}

for (const model of quaterniusModels) {
  check(
    model.licence === "CC0 1.0" && model.licenceClass === "ship-safe",
    `${model.id} does not retain the expected Quaternius CC0 rights`,
  );
  check(
    model.storage === "local" && model.format === "GLB",
    `${model.id} is not a local website-ready GLB`,
  );
  check(
    model.sourceUrl.startsWith("https://quaternius.com/packs/"),
    `${model.id} does not point to an official Quaternius pack`,
  );
  check(Boolean(model.agencyUse), `${model.id} has no agency use guidance`);
  check(Boolean(model.artStyle), `${model.id} has no art style`);
  check(
    model.brandMoods?.length > 0,
    `${model.id} has no brand mood metadata`,
  );
  check(
    model.websiteIndustries?.length > 0,
    `${model.id} has no website industry metadata`,
  );
  check(
    model.sectionFits?.length > 0,
    `${model.id} has no section-fit metadata`,
  );
  check(
    Boolean(model.performanceGuidance),
    `${model.id} has no performance guidance`,
  );
}

const fidelityRanks = {
  "very-low-poly": 1,
  "standard-low-poly": 2,
  "detailed-low-poly": 3,
};
const allowedKenneyPriorities = new Set([
  "fallback-unless-style-aligned",
  "stylized-candidate",
  "strong-stylized-candidate",
  "supporting-module",
]);
for (const model of kenneyModels) {
  check(
    model.guidanceMode === "advisory",
    `${model.id} style guidance must remain advisory`,
  );
  check(
    fidelityRanks[model.visualFidelity] === model.visualFidelityRank,
    `${model.id} has inconsistent visual fidelity metadata`,
  );
  check(
    allowedKenneyPriorities.has(model.selectionPriority),
    `${model.id} has an invalid selection priority`,
  );
  check(Boolean(model.artStyle), `${model.id} has no art style`);
  check(Boolean(model.agencyUse), `${model.id} has no agency use guidance`);
  check(
    model.bestFor?.length > 0,
    `${model.id} has no positive style contexts`,
  );
  check(
    model.avoidWhen?.length > 0,
    `${model.id} has no negative style contexts`,
  );
  check(
    Boolean(model.selectionGuidance),
    `${model.id} has no style selection guidance`,
  );
  check(
    Boolean(model.fallbackPolicy),
    `${model.id} has no fallback policy`,
  );
  check(
    model.brandMoods?.length > 0 &&
      model.websiteIndustries?.length > 0 &&
      model.sectionFits?.length > 0,
    `${model.id} has incomplete agency matching metadata`,
  );
}

for (const name of ["Computer Mouse", "Computer Keyboard", "Laptop"]) {
  const model = kenneyModels.find((candidate) => candidate.name === name);
  check(Boolean(model), `Missing Kenney test record: ${name}`);
  if (!model) continue;
  check(
    model.visualFidelity === "very-low-poly" &&
      model.selectionPriority === "fallback-unless-style-aligned",
    `${name} is not guarded as a very-low-poly fallback`,
  );
  check(
    model.avoidWhen.some((context) => /premium high-tech/i.test(context)) &&
      /not select this because its name sounds high-tech/i.test(
        model.selectionGuidance,
      ),
    `${name} does not warn against misleading premium technology use`,
  );
  check(
    /no closer asset exists/i.test(model.fallbackPolicy),
    `${name} does not remain available as an advisory fallback`,
  );
}

const detailedBuilding = kenneyModels.find(
  (model) => model.name === "Building J",
);
check(Boolean(detailedBuilding), "Missing detailed Kenney architecture test record");
if (detailedBuilding) {
  check(
    detailedBuilding.visualFidelity === "detailed-low-poly" &&
      detailedBuilding.selectionPriority === "strong-stylized-candidate",
    "Detailed Kenney architecture is not promoted for suitable stylized work",
  );
}
const supportingFloor = kenneyModels.find(
  (model) => model.name === "Floor Large",
);
check(Boolean(supportingFloor), "Missing Kenney supporting-module test record");
if (supportingFloor) {
  check(
    supportingFloor.selectionPriority === "supporting-module",
    "Minimal Kenney architecture is not restricted to a supporting role",
  );
}

const ownedComponents = components.filter(
  (component) => component.source_kind === "owned-original-recipe",
);
const linkedOriginKitComponents = components.filter(
  (component) => component.source === "OriginKit",
);
const linkedReactBitsComponents = components.filter(
  (component) => component.source === "React Bits",
);
const linkedCanvasUiComponents = components.filter(
  (component) => component.source === "Canvas UI",
);
const structureComponents = components.filter(
  (component) => component.selection_pass === "structure",
);
const enhancementComponents = components.filter(
  (component) => component.selection_pass === "enhancement",
);
check(
  components.length === 1330,
  `Expected 1,330 component records, found ${components.length}`,
);
check(
  ownedComponents.length === 1020,
  `Expected 1,020 owned-original records, found ${ownedComponents.length}`,
);
check(
  linkedOriginKitComponents.length === 146 &&
    originKitComponents.length === 146,
  `Expected 146 linked OriginKit records, found ${linkedOriginKitComponents.length}/${originKitComponents.length}`,
);
check(
  linkedReactBitsComponents.length === 139 &&
    reactBitsComponents.length === 139,
  `Expected 139 linked React Bits records, found ${linkedReactBitsComponents.length}/${reactBitsComponents.length}`,
);
check(
  linkedCanvasUiComponents.length === 25 &&
    canvasUiComponents.length === 25,
  `Expected 25 linked Canvas UI records, found ${linkedCanvasUiComponents.length}/${canvasUiComponents.length}`,
);
check(
  structureComponents.length === 492 &&
    enhancementComponents.length === 838 &&
    manifest.totals.structureComponentRecipes ===
      structureComponents.length &&
    manifest.totals.enhancementComponentRecipes ===
      enhancementComponents.length,
  `Unexpected two-pass component totals: ${structureComponents.length}/${enhancementComponents.length}`,
);
check(
  reactBitsSnapshot.license === "MIT + Commons Clause v1.0" &&
    /^[a-f0-9]{40}$/.test(reactBitsSnapshot.sourceRevision) &&
    reactBitsSnapshot.excluded?.some((entry) =>
      /React Bits Pro components/.test(entry),
    ),
  "React Bits snapshot is missing its pinned licence or Pro exclusion",
);
check(
  canvasUiSnapshot.license === "MIT + Commons Clause v1.0" &&
    /^[a-f0-9]{40}$/.test(canvasUiSnapshot.sourceRevision),
  "Canvas UI snapshot is missing its pinned licence metadata",
);
check(
  componentIndex.length === components.length,
  "Component index and full component catalog have different lengths",
);
check(
  componentIds.size === components.length,
  `Component IDs are not unique (${componentIds.size}/${components.length})`,
);
check(
  componentIndexIds.size === componentIndex.length,
  "Component index IDs are not unique",
);

for (const component of ownedComponents) {
  check(
    component.source_kind === "owned-original-recipe",
    `${component.id} is not marked as an owned original recipe`,
  );
  check(
    component.license === "owned-original",
    `${component.id} has an unexpected component licence`,
  );
  check(
    componentIndexIds.has(component.id),
    `${component.id} is missing from components-index.json`,
  );
  check(
    ["structure", "enhancement"].includes(component.selection_pass) &&
      Boolean(component.selection_pass_label) &&
      Boolean(component.component_role) &&
      Boolean(component.enhancement_family) &&
      Boolean(component.pairing_guidance) &&
      Boolean(component.codex_selection_instruction) &&
      Boolean(component.stacking_limit),
    `${component.id} has incomplete two-pass selection guidance`,
  );
}

for (const component of linkedOriginKitComponents) {
  check(
    originKitComponentIds.has(component.id) &&
      component.id.startsWith("originkit-"),
    `${component.id} is missing from the OriginKit snapshot`,
  );
  check(
    component.source === "OriginKit" &&
      component.art_direction === "OriginKit" &&
      component.phase === "originkit-linked-2026-07",
    `${component.id} has incomplete OriginKit source metadata`,
  );
  check(
    component.source_kind === "external-linked-component" &&
      component.licence_class === "linked-source" &&
      component.selection_pass === "enhancement" &&
      component.required_review === true &&
      component.source_code_bundled === false &&
      component.media_mirrored === false,
    `${component.id} does not preserve the linked-source boundary`,
  );
  check(
    /^https:\/\/www\.originkit\.dev\/components\/[a-z0-9-]+$/.test(
      component.official_source_url,
    ),
    `${component.id} has an invalid official OriginKit source URL`,
  );
  check(
    /^https:\/\/cdn\.originkit\.dev\/components\/.+\.(jpg|png|webp)(\?.*)?$/i.test(
      component.preview_poster_url,
    ) &&
      /^https:\/\/cdn\.originkit\.dev\/components\/.+\.mp4(\?.*)?$/i.test(
        component.preview_video_url,
      ),
    `${component.id} has invalid official preview media`,
  );
  check(
    Boolean(component.summary) &&
      Boolean(component.responsive_strategy) &&
      Boolean(component.accessibility_contract) &&
      Boolean(component.fallback_strategy),
    `${component.id} has incomplete implementation guidance`,
  );
  check(
    componentIndexIds.has(component.id),
    `${component.id} is missing from components-index.json`,
  );
}

for (const component of originKitComponents) {
  check(
    componentIds.has(component.id),
    `${component.id} is missing from components.json`,
  );
}

for (const component of linkedReactBitsComponents) {
  check(
    reactBitsComponentIds.has(component.id) &&
      component.id.startsWith("reactbits-") &&
      component.phase === "react-bits-linked-2026-07",
    `${component.id} is missing from the React Bits snapshot`,
  );
  check(
    component.source_kind === "external-linked-component" &&
      component.license === "MIT + Commons Clause v1.0" &&
      component.licence_class === "end-project-only-linked-source" &&
      component.selection_pass === "enhancement" &&
      component.required_review === true &&
      component.source_code_bundled === false &&
      component.media_mirrored === false,
    `${component.id} does not preserve the React Bits source boundary`,
  );
  check(
    /^https:\/\/reactbits\.dev\/(animations|text-animations|components|backgrounds)\/[a-z0-9-]+$/.test(
      component.official_source_url,
    ) &&
      /^https:\/\/reactbits\.dev\/r\/.+-TS-TW\.json$/.test(
        component.registry_url,
      ) &&
      /^npx shadcn@latest add @react-bits\/.+-TS-TW$/.test(
        component.install_command,
      ),
    `${component.id} has invalid official React Bits source or registry metadata`,
  );
  check(
    !component.preview_video_url ||
      /^https:\/\/reactbits\.dev\/assets\/video\/.+\.(webm|mp4)$/.test(
        component.preview_video_url,
      ),
    `${component.id} has invalid React Bits preview media`,
  );
  check(
    Boolean(component.summary) &&
      Boolean(component.responsive_strategy) &&
      Boolean(component.accessibility_contract) &&
      Boolean(component.fallback_strategy) &&
      componentIndexIds.has(component.id),
    `${component.id} has incomplete React Bits implementation guidance`,
  );
}
check(
  linkedReactBitsComponents.filter((component) => component.preview_video_url)
    .length === 134,
  "React Bits official remote-preview count has changed",
);

for (const component of linkedCanvasUiComponents) {
  check(
    canvasUiComponentIds.has(component.id) &&
      component.id.startsWith("canvasui-") &&
      component.phase === "canvas-ui-linked-2026-07",
    `${component.id} is missing from the Canvas UI snapshot`,
  );
  check(
    component.source_kind === "external-linked-component" &&
      component.license === "MIT + Commons Clause v1.0" &&
      component.licence_class === "end-project-only-linked-source" &&
      component.selection_pass === "enhancement" &&
      component.required_review === true &&
      component.source_code_bundled === false &&
      component.media_mirrored === false,
    `${component.id} does not preserve the Canvas UI source boundary`,
  );
  check(
    /^https:\/\/canvasui\.dev\/docs\/components\/[a-z0-9-]+$/.test(
      component.official_source_url,
    ) &&
      /^https:\/\/canvasui\.dev\/r\/[a-z0-9-]+-react\.json$/.test(
        component.registry_url,
      ) &&
      /^npx shadcn@latest add @canvas-ui\/[a-z0-9-]+-react$/.test(
        component.install_command,
      ),
    `${component.id} has invalid official Canvas UI source or registry metadata`,
  );
  check(
    /^https:\/\/canvasui\.dev\/assets\/videos\/[a-z0-9-]+\.webm$/.test(
      component.preview_video_url,
    ) &&
      Array.isArray(component.official_variants) &&
      component.official_variants.length === 6,
    `${component.id} has incomplete Canvas UI preview or framework metadata`,
  );
  check(
    Boolean(component.summary) &&
      Boolean(component.responsive_strategy) &&
      Boolean(component.accessibility_contract) &&
      Boolean(component.fallback_strategy) &&
      componentIndexIds.has(component.id),
    `${component.id} has incomplete Canvas UI implementation guidance`,
  );
}
check(
  components.filter(
    (component) =>
      component.selection_pass === "enhancement" &&
      component.can_be_structural === true,
  ).length === 75,
  "Unexpected hybrid section-or-enhancement record count",
);

const componentArchetypes = new Set(
  ownedComponents.map((component) => component.id.split("--")[0]),
);
const previewArchetypes = new Set(componentPreviewIds);
const previewMotionArchetypes = new Set(componentPreviewMotionIds);
check(
  componentArchetypes.size === 85,
  `Expected 85 component archetypes, found ${componentArchetypes.size}`,
);
check(
  previewArchetypes.size === componentArchetypes.size,
  `Preview renderer count does not match component archetypes (${previewArchetypes.size}/${componentArchetypes.size})`,
);
for (const archetype of componentArchetypes) {
  check(
    previewArchetypes.has(archetype),
    `Component archetype has no visual preview renderer: ${archetype}`,
  );
  check(
    previewMotionArchetypes.has(archetype),
    `Component archetype has no live-preview motion profile: ${archetype}`,
  );
}
check(
  previewMotionArchetypes.size === componentArchetypes.size,
  `Live-preview motion profile count does not match component archetypes (${previewMotionArchetypes.size}/${componentArchetypes.size})`,
);
check(
  /\.recipe-preview\.is-live\[data-motion=/.test(appCssSource) &&
    /prefers-reduced-motion:\s*reduce/.test(appCssSource),
  "Live component previews are missing scoped motion or reduced-motion CSS",
);
for (const motion of new Set(
  componentPreviewMotionEntries.map((entry) => entry.motion),
)) {
  check(
    appCssSource.includes(`[data-motion="${motion}"]`),
    `Live-preview motion profile has no scoped CSS: ${motion}`,
  );
}

const kenneyImages = images.filter((image) => image.source === "Kenney");
const importedDesignImages = images.filter(
  (image) => image.phase === "design-assets-2026-07",
);
check(
  images.length === kenneyImages.length + designAssets.length,
  `Expected ${kenneyImages.length + designAssets.length} image assets, found ${images.length}`,
);
check(
  kenneyImages.length === 543,
  `Expected 543 Kenney image assets, found ${kenneyImages.length}`,
);
check(
  importedDesignImages.length === designAssets.length,
  `Merged design asset count does not match design-assets.json (${importedDesignImages.length}/${designAssets.length})`,
);
check(
  imageIds.size === images.length,
  `Image asset IDs are not unique (${imageIds.size}/${images.length})`,
);
check(
  imageUrls.size === images.length,
  `Image asset URLs are not unique (${imageUrls.size}/${images.length})`,
);
const expectedImagePackCounts = new Map([
  ["background-elements", 89],
  ["foliage-sprites", 50],
  ["pixel-vehicles", 75],
  ["pattern-lines", 60],
  ["foliage", 106],
  ["generic-items", 163],
]);
for (const [packSlug, expectedCount] of expectedImagePackCounts) {
  const actualCount = images.filter((image) => image.packSlug === packSlug).length;
  check(
    actualCount === expectedCount,
    `Expected ${expectedCount} ${packSlug} assets, found ${actualCount}`,
  );
}
for (const image of images) {
  check(Boolean(image.id), "An image asset has no ID");
  check(Boolean(image.name), `${image.id} has no name`);
  check(
    Boolean(image.source) &&
      Boolean(image.collection) &&
      Boolean(image.assetType) &&
      Boolean(image.category),
    `${image.id} has incomplete source or classification metadata`,
  );
  check(
    Boolean(image.licence) &&
      Boolean(image.licenceClass) &&
      Boolean(image.licenceUrl),
    `${image.id} has incomplete licence metadata`,
  );
  check(
    Boolean(image.usageMode) &&
      Boolean(image.styleFamily) &&
      Boolean(image.artStyle) &&
      Boolean(image.selectionGuidance),
    `${image.id} has incomplete usage or art-direction guidance`,
  );
  check(
    Number.isInteger(image.width) &&
      image.width > 0 &&
      Number.isInteger(image.height) &&
      image.height > 0,
    `${image.id} has invalid dimensions`,
  );
  check(
    /^https:\/\/.+/i.test(image.publicImageUrl) &&
      /^https:\/\/.+/i.test(image.downloadUrl),
    `${image.id} does not expose HTTPS public and download URLs`,
  );
  if (image.storage === "local" || image.storage === "hybrid") {
    await checkLocalFile(image.imageUrl, `${image.id} image`);
  } else {
    check(
      /^https:\/\/.+/i.test(image.imageUrl),
      `${image.id} remote preview is not HTTPS`,
    );
  }
  for (const [variantName, variant] of Object.entries(image.variants ?? {})) {
    check(
      Boolean(variant.imageUrl) && Boolean(variant.publicImageUrl),
      `${image.id} ${variantName} variant has incomplete URLs`,
    );
    await checkLocalFile(
      variant.imageUrl,
      `${image.id} ${variantName} variant`,
    );
  }
}

for (const image of kenneyImages) {
  check(image.storage === "local", `${image.id} must be locally hosted`);
  check(image.format === "PNG", `${image.id} must remain a PNG`);
  check(image.licence === "CC0 1.0", `${image.id} has an unexpected licence`);
  check(
    image.licenceClass === "ship-safe",
    `${image.id} must be marked ship-safe`,
  );
  check(
    image.publicImageUrl === image.downloadUrl,
    `${image.id} public and download URLs must match`,
  );
  check(
    /^https:\/\/lumoraofficial\.de\/mcp\/assets\/images\/kenney\/.+\.png$/i.test(
      image.publicImageUrl,
    ),
    `${image.id} does not expose a valid absolute PNG URL`,
  );
}

const expectedDesignSourceCounts = new Map([
  ["Lucide", 2007],
  ["Phosphor", 1512],
  ["Open Doodles", 33],
  ["Open Peeps", 93],
  ["ambientCG", 40],
  ["Hero Patterns", 87],
]);
for (const [source, expectedCount] of expectedDesignSourceCounts) {
  const records = designAssets.filter((image) => image.source === source);
  check(
    records.length === expectedCount,
    `Expected ${expectedCount} ${source} records, found ${records.length}`,
  );
}
for (const image of designAssets.filter((record) => record.source === "Phosphor")) {
  check(
    image.variantCount === 6 &&
      Object.keys(image.variants ?? {}).length === 6,
    `${image.id} does not group all six Phosphor variants`,
  );
}
check(
  !designAssets.some((record) =>
    ["DiceBear", "Simple Icons"].includes(record.source),
  ),
  "Removed avatar-generator or brand-logo records remain in design-assets.json",
);
for (const image of designAssets.filter((record) => record.source === "ambientCG")) {
  check(
    image.previewOnly === true &&
      image.storage === "hybrid" &&
      image.downloadUrl.startsWith("https://ambientcg.com/a/"),
    `${image.id} does not separate its local preview from production maps`,
  );
}
for (const image of designAssets.filter((record) => record.source === "Hero Patterns")) {
  check(
    image.licenceClass === "attribution" &&
      /Steve Schoger/i.test(image.attribution),
    `${image.id} does not preserve Hero Patterns attribution`,
  );
}

check(
  backgrounds.length === 152,
  `Expected 152 animated backgrounds, found ${backgrounds.length}`,
);
check(
  backgroundIds.size === backgrounds.length,
  `Animated background IDs are not unique (${backgroundIds.size}/${backgrounds.length})`,
);
check(
  backgroundUrls.size === backgrounds.length,
  `Animated background URLs are not unique (${backgroundUrls.size}/${backgrounds.length})`,
);
check(
  backgrounds.filter((background) => background.format === "MP4").length ===
    125,
  "Expected 125 MP4 animated backgrounds",
);
check(
  backgrounds.filter((background) => background.format === "HLS").length ===
    27,
  "Expected 27 HLS animated backgrounds",
);
check(
  backgrounds.filter((background) => background.availability === "Available")
    .length === 151,
  "Expected 151 available animated backgrounds",
);
for (const background of backgrounds) {
  check(Boolean(background.id), "An animated background has no ID");
  check(Boolean(background.name), `${background.id} has no name`);
  check(
    background.storage === "remote",
    `${background.id} must remain externally hosted`,
  );
  check(
    background.licenceClass === "commercial-use",
    `${background.id} must retain its commercial-use entitlement`,
  );
  check(
    background.licence === "Commercial use (owner-confirmed)",
    `${background.id} has an unexpected commercial licence label`,
  );
  check(
    /^https:\/\/.+/i.test(background.sourceUrl),
    `${background.id} does not use an HTTPS source URL`,
  );
  check(
    background.downloadUrl === background.sourceUrl,
    `${background.id} download URL does not preserve its source URL`,
  );
  if (background.availability === "Available") {
    check(
      /^\.\/assets\/background-thumbs\/animated-background-\d{3}\.webp$/i.test(
        background.thumbnailUrl,
      ),
      `${background.id} does not use its local opening-frame thumbnail`,
    );
    check(
      /^https:\/\/lumoraofficial\.de\/mcp\/assets\/background-thumbs\/animated-background-\d{3}\.webp$/i.test(
        background.publicThumbnailUrl,
      ),
      `${background.id} does not expose an absolute opening-frame thumbnail URL`,
    );
    check(
      background.thumbnailStorage === "local",
      `${background.id} thumbnail must be locally hosted`,
    );
    check(
      background.thumbnailSourceTimeSeconds === 0.1,
      `${background.id} thumbnail timestamp is unexpected`,
    );
    check(
      background.thumbnailDimensions === "640x360",
      `${background.id} thumbnail dimensions are unexpected`,
    );
    await checkLocalFile(
      background.thumbnailUrl,
      `${background.id} opening-frame thumbnail`,
    );
  } else {
    check(
      background.thumbnailUrl === null,
      `${background.id} must not claim a thumbnail for an unavailable source`,
    );
    check(
      background.publicThumbnailUrl === null,
      `${background.id} must not claim a public thumbnail for an unavailable source`,
    );
  }
}

const kenneyProvenanceTotal = provenance.kenney.reduce(
  (total, pack) => total + pack.modelCount,
  0,
);
const quaterniusProvenanceTotal = provenance.quaternius.packs.reduce(
  (total, pack) => total + pack.modelCount,
  0,
);
check(
  quaterniusProvenanceTotal === quaterniusModels.length &&
    provenance.quaternius.localModelCount === quaterniusModels.length,
  "Quaternius provenance total does not match models.json",
);
check(
  provenance.quaternius.rightsUrl === "https://quaternius.com/faq.html",
  "Quaternius provenance does not retain the official rights source",
);
check(
  kenneyProvenanceTotal === kenneyModels.length,
  "Kenney provenance total does not match models.json",
);
check(
  provenance.kenneyStyleGuidance?.guidanceMode === "advisory" &&
    provenance.kenneyStyleGuidance?.evaluatedModelCount ===
      kenneyModels.length,
  "Kenney style-guidance provenance does not cover the full collection",
);
check(
  Object.entries(kenneyFidelityCounts).every(
    ([band, count]) =>
      provenance.kenneyStyleGuidance?.visualFidelityBands?.[band] === count,
  ),
  "Kenney style-guidance provenance fidelity totals are incorrect",
);
check(
  provenance.components.recipeCount === components.length &&
    provenance.components.ownedOriginalCount === ownedComponents.length &&
    provenance.components.linkedOriginKitCount ===
      linkedOriginKitComponents.length &&
    provenance.components.linkedReactBitsCount ===
      linkedReactBitsComponents.length &&
    provenance.components.linkedCanvasUiCount ===
      linkedCanvasUiComponents.length &&
    provenance.components.linkedComponentCount ===
      linkedOriginKitComponents.length +
        linkedReactBitsComponents.length +
        linkedCanvasUiComponents.length &&
    provenance.components.structureCount === structureComponents.length &&
    provenance.components.enhancementCount ===
      enhancementComponents.length,
  "Component provenance total does not match components.json",
);
check(
  provenance.imageAssets.assetCount === images.length,
  "Image asset provenance total does not match image-assets.json",
);
check(
  provenance.imageAssets.packs.reduce(
    (total, pack) => total + pack.assetCount,
    0,
  ) === images.length,
  "Image pack provenance total does not match image-assets.json",
);
check(
  provenance.animatedBackgrounds.uniqueUrlCount === backgrounds.length,
  "Animated background provenance total does not match the catalog",
);
check(
  provenance.animatedBackgrounds.thumbnailCount === 151,
  "Animated background provenance thumbnail total is incorrect",
);
check(
  provenance.animatedBackgrounds.licenceClass === "commercial-use",
  "Animated background provenance must retain commercial-use entitlement",
);
check(
  provenance.polyHaven.localModelCount +
    provenance.polyHaven.streamedModelCount ===
    polyHavenModels.length,
  "Poly Haven provenance total does not match models.json",
);

for (const requiredFile of [
  "index.html",
  "app.css",
  "app.js",
  "component-previews.js",
  "originkit-components.json",
  "react-bits-components.json",
  "canvas-ui-components.json",
  "image-assets.json",
  "design-assets.json",
  "animated-backgrounds.json",
  "instructions.md",
  "provenance.json",
  "licences/three.txt",
  "licences/quaternius.txt",
  "licences/kenney/modular-cave.txt",
  "licences/kenney/platformer.txt",
  "licences/kenney/factory.txt",
  "licences/kenney/city-commercial.txt",
  "licences/kenney/city-suburban.txt",
  "licences/kenney/mini-dungeon.txt",
  "licences/kenney/mini-forest.txt",
  "licences/kenney/furniture.txt",
  "licences/kenney/mini-arcade.txt",
  "licences/kenney/food.txt",
  "licences/kenney-images/background-elements.txt",
  "licences/kenney-images/foliage-sprites.txt",
  "licences/kenney-images/pixel-vehicles.txt",
  "licences/kenney-images/pattern-lines.txt",
  "licences/kenney-images/foliage.txt",
  "licences/kenney-images/generic-items.txt",
  "licences/design-assets/lucide.txt",
  "licences/design-assets/phosphor.txt",
  "licences/design-assets/hero-patterns.txt",
  "licences/design-assets/cc0-sources.txt",
  "licences/originkit-linked-source.txt",
  "licences/react-bits-linked-source.txt",
  "licences/canvas-ui-linked-source.txt",
  "vendor/three.module.min.js",
  "vendor/three.core.min.js",
  "vendor/loaders/GLTFLoader.js",
  "vendor/controls/OrbitControls.js",
  "vendor/utils/BufferGeometryUtils.js",
  "vendor/utils/SkeletonUtils.js",
]) {
  await checkLocalFile(requiredFile, "Required toolkit file");
}

if (errors.length) {
  console.error(`Lumora MCP validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const result = {
    models: models.length,
    kenneyModels: kenneyModels.length,
    quaterniusModels: quaterniusModels.length,
    polyHavenModels: polyHavenModels.length,
    localModels: localModels.length,
    streamedModels: streamedModels.length,
    shipSafeModels: shipSafeModels.length,
    componentRecipes: components.length,
    ownedComponentRecipes: ownedComponents.length,
    structureComponentRecipes: structureComponents.length,
    enhancementComponentRecipes: enhancementComponents.length,
    requiredLinkedEnhancementReviews: components.filter(
      (component) => component.required_review,
    ).length,
    linkedOriginKitComponents: linkedOriginKitComponents.length,
    linkedReactBitsComponents: linkedReactBitsComponents.length,
    linkedCanvasUiComponents: linkedCanvasUiComponents.length,
    imageAssets: images.length,
    animatedBackgrounds: backgrounds.length,
    availableAnimatedBackgrounds: backgrounds.filter(
      (background) => background.availability === "Available",
    ).length,
    verifiedLocalFiles: checkedFiles.size,
  };
  console.log(`Lumora MCP validation passed:\n${JSON.stringify(result, null, 2)}`);
}
