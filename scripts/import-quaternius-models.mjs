import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const configPath = path.join(
  scriptDirectory,
  "data",
  "quaternius-selection.json",
);
const sourceRoot = path.resolve(
  process.env.QUATERNIUS_SOURCE_DIR ??
    path.join(repositoryRoot, "..", "..", "2026-07-29", "a", "work", "quaternius-source"),
);
const modelRoot = path.join(
  repositoryRoot,
  "mcp",
  "assets",
  "models",
  "quaternius",
);
const thumbnailRoot = path.join(
  repositoryRoot,
  "mcp",
  "assets",
  "thumbs",
  "quaternius",
);
const blenderExecutable =
  process.env.BLENDER_EXECUTABLE ??
  "C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe";
const blenderScript = path.join(
  scriptDirectory,
  "blender-convert-quaternius.py",
);

function assertInside(parent, child) {
  const relative = path.relative(parent, child);
  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Unsafe generated path: ${child}`);
  }
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const expectedModels = config.packs.reduce(
  (total, pack) => total + pack.models.length,
  0,
);
if (expectedModels !== 72) {
  throw new Error(`Expected 72 curated Quaternius models, found ${expectedModels}`);
}

for (const target of [modelRoot, thumbnailRoot]) {
  assertInside(repositoryRoot, target);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
}

execFileSync(
  blenderExecutable,
  [
    "--background",
    "--factory-startup",
    "--python",
    blenderScript,
    "--",
    configPath,
    sourceRoot,
    modelRoot,
    thumbnailRoot,
  ],
  {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
  },
);

async function countFiles(directory, extension) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      total += await countFiles(resolved, extension);
    } else if (entry.name.toLowerCase().endsWith(extension)) {
      total += 1;
    }
  }
  return total;
}

const [modelCount, thumbnailCount] = await Promise.all([
  countFiles(modelRoot, ".glb"),
  countFiles(thumbnailRoot, ".webp"),
]);
if (modelCount !== expectedModels || thumbnailCount !== expectedModels) {
  throw new Error(
    `Incomplete Quaternius import: ${modelCount}/${expectedModels} models and ${thumbnailCount}/${expectedModels} thumbnails`,
  );
}

console.log(
  `Imported ${expectedModels} curated Quaternius models from ${sourceRoot}.`,
);
