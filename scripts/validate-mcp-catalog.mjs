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

const [manifest, models, componentIndex, components, images, backgrounds, provenance] =
  await Promise.all([
    readJson("manifest.json"),
    readJson("models.json"),
    readJson("components-index.json"),
    readJson("components.json"),
    readJson("image-assets.json"),
    readJson("animated-backgrounds.json"),
    readJson("provenance.json"),
  ]);
const componentPreviewSource = await readFile(
  path.join(mcpRoot, "component-previews.js"),
  "utf8",
);
const componentPreviewIds = [
  ...componentPreviewSource.matchAll(/^\s*"([a-z0-9-]+)":\s*\(\)\s*=>/gm),
].map((match) => match[1]);

const modelIds = new Set(models.map((model) => model.id));
const componentIds = new Set(components.map((component) => component.id));
const componentIndexIds = new Set(componentIndex.map((component) => component.id));
const imageIds = new Set(images.map((image) => image.id));
const imageUrls = new Set(images.map((image) => image.publicImageUrl));
const backgroundIds = new Set(backgrounds.map((background) => background.id));
const backgroundUrls = new Set(
  backgrounds.map((background) => background.sourceUrl),
);
const localModels = models.filter((model) => model.storage === "local");
const streamedModels = models.filter((model) => model.storage === "remote");
const kenneyModels = models.filter((model) => model.source === "Kenney");
const polyHavenModels = models.filter((model) => model.source === "Poly Haven");
const shipSafeModels = models.filter(
  (model) => model.licenceClass === "ship-safe",
);

check(models.length === 949, `Expected 949 models, found ${models.length}`);
check(
  modelIds.size === models.length,
  `Model IDs are not unique (${modelIds.size}/${models.length})`,
);
check(
  kenneyModels.length === 829,
  `Expected 829 Kenney models, found ${kenneyModels.length}`,
);
check(
  polyHavenModels.length === 120,
  `Expected 120 Poly Haven models, found ${polyHavenModels.length}`,
);
check(
  localModels.length === 835,
  `Expected 835 local models, found ${localModels.length}`,
);
check(
  streamedModels.length === 114,
  `Expected 114 streamed models, found ${streamedModels.length}`,
);
check(
  shipSafeModels.length === 948,
  `Expected 948 ship-safe models, found ${shipSafeModels.length}`,
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

check(
  components.length === 1020,
  `Expected 1,020 component records, found ${components.length}`,
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

for (const component of components) {
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
}

const componentArchetypes = new Set(
  components.map((component) => component.id.split("--")[0]),
);
const previewArchetypes = new Set(componentPreviewIds);
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
}

check(images.length === 543, `Expected 543 image assets, found ${images.length}`);
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
  check(image.source === "Kenney", `${image.id} must retain its Kenney source`);
  check(image.storage === "local", `${image.id} must be locally hosted`);
  check(image.format === "PNG", `${image.id} must remain a PNG`);
  check(image.licence === "CC0 1.0", `${image.id} has an unexpected licence`);
  check(
    image.licenceClass === "ship-safe",
    `${image.id} must be marked ship-safe`,
  );
  check(
    Number.isInteger(image.width) &&
      image.width > 0 &&
      Number.isInteger(image.height) &&
      image.height > 0,
    `${image.id} has invalid dimensions`,
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
  await checkLocalFile(image.imageUrl, `${image.id} image`);
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
check(
  kenneyProvenanceTotal === kenneyModels.length,
  "Kenney provenance total does not match models.json",
);
check(
  provenance.components.recipeCount === components.length,
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
  "image-assets.json",
  "animated-backgrounds.json",
  "instructions.md",
  "provenance.json",
  "licences/three.txt",
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
    polyHavenModels: polyHavenModels.length,
    localModels: localModels.length,
    streamedModels: streamedModels.length,
    shipSafeModels: shipSafeModels.length,
    componentRecipes: components.length,
    imageAssets: images.length,
    animatedBackgrounds: backgrounds.length,
    availableAnimatedBackgrounds: backgrounds.filter(
      (background) => background.availability === "Available",
    ).length,
    verifiedLocalFiles: checkedFiles.size,
  };
  console.log(`Lumora MCP validation passed:\n${JSON.stringify(result, null, 2)}`);
}
