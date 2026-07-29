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

const [manifest, models, componentIndex, components, provenance] =
  await Promise.all([
    readJson("manifest.json"),
    readJson("models.json"),
    readJson("components-index.json"),
    readJson("components.json"),
    readJson("provenance.json"),
  ]);

const modelIds = new Set(models.map((model) => model.id));
const componentIds = new Set(components.map((component) => component.id));
const componentIndexIds = new Set(componentIndex.map((component) => component.id));
const localModels = models.filter((model) => model.storage === "local");
const streamedModels = models.filter((model) => model.storage === "remote");
const kenneyModels = models.filter((model) => model.source === "Kenney");
const polyHavenModels = models.filter((model) => model.source === "Poly Haven");
const shipSafeModels = models.filter(
  (model) => model.licenceClass === "ship-safe",
);

check(models.length === 589, `Expected 589 models, found ${models.length}`);
check(
  modelIds.size === models.length,
  `Model IDs are not unique (${modelIds.size}/${models.length})`,
);
check(
  kenneyModels.length === 469,
  `Expected 469 Kenney models, found ${kenneyModels.length}`,
);
check(
  polyHavenModels.length === 120,
  `Expected 120 Poly Haven models, found ${polyHavenModels.length}`,
);
check(
  localModels.length === 475,
  `Expected 475 local models, found ${localModels.length}`,
);
check(
  streamedModels.length === 114,
  `Expected 114 streamed models, found ${streamedModels.length}`,
);
check(
  shipSafeModels.length === 588,
  `Expected 588 ship-safe models, found ${shipSafeModels.length}`,
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
  provenance.polyHaven.localModelCount +
    provenance.polyHaven.streamedModelCount ===
    polyHavenModels.length,
  "Poly Haven provenance total does not match models.json",
);

for (const requiredFile of [
  "index.html",
  "app.css",
  "app.js",
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
    verifiedLocalFiles: checkedFiles.size,
  };
  console.log(`Lumora MCP validation passed:\n${JSON.stringify(result, null, 2)}`);
}
