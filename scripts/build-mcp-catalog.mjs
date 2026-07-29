import { execFileSync } from "node:child_process";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Optional source overrides:
 * - KENNEY_DOWNLOADS_DIR: directory containing the seven original Kenney ZIPs
 * - LUMORA_OBJECTS_DIR: previous Lumora Objects project with generated catalogs
 * - WEB_COMPONENT_SKILL_DIR: Lumora Web Design Components skill directory
 */
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputRoot = path.join(repositoryRoot, "mcp");
const downloadsDirectory =
  process.env.KENNEY_DOWNLOADS_DIR ?? path.join(os.homedir(), "Downloads");
const lumoraObjectsRoot =
  process.env.LUMORA_OBJECTS_DIR ??
  path.resolve(repositoryRoot, "..", "..", "2026-07-29", "a");
const componentSkillRoot =
  process.env.WEB_COMPONENT_SKILL_DIR ??
  path.join(os.homedir(), ".codex", "skills", "web-design-components");
const animatedBackgroundSourcePath = path.join(
  scriptDirectory,
  "data",
  "animated-backgrounds-source.json",
);
const publicRoot = "https://lumoraofficial.de/mcp";
const tempRoot = path.join(repositoryRoot, ".mcp-import-temp");

const packs = [
  {
    slug: "modular-cave",
    zip: "kenney_modular-cave-kit_1.0.zip",
    title: "Modular Cave Kit",
    version: "1.0",
    sourceUrl: "https://kenney.nl/assets/modular-cave-kit",
    tags: ["cave", "modular", "environment"],
  },
  {
    slug: "platformer",
    zip: "kenney_platformer-kit.zip",
    title: "Platformer Kit",
    version: "4.1",
    sourceUrl: "https://kenney.nl/assets/platformer-kit",
    tags: ["platformer", "gameplay", "environment"],
  },
  {
    slug: "factory",
    zip: "kenney_factory-kit_3.0.zip",
    title: "Factory Kit",
    version: "3.0",
    sourceUrl: "https://kenney.nl/assets/factory-kit",
    tags: ["factory", "industrial", "environment"],
  },
  {
    slug: "city-commercial",
    zip: "kenney_city-kit-commercial_2.1.zip",
    title: "City Kit Commercial",
    version: "2.1",
    sourceUrl: "https://kenney.nl/assets/city-kit-commercial",
    tags: ["city", "commercial", "architecture"],
  },
  {
    slug: "city-suburban",
    zip: "kenney_city-kit-suburban_20.zip",
    title: "City Kit Suburban",
    version: "2.0",
    sourceUrl: "https://kenney.nl/assets/city-kit-suburban",
    tags: ["city", "suburban", "architecture"],
  },
  {
    slug: "mini-dungeon",
    zip: "kenney_mini-dungeon.zip",
    title: "Mini Dungeon",
    version: "2.0",
    sourceUrl: "https://kenney.nl/assets/mini-dungeon",
    tags: ["dungeon", "fantasy", "medieval"],
  },
  {
    slug: "mini-forest",
    zip: "kenney_mini-forest_1.0.zip",
    title: "Mini Forest",
    version: "1.0",
    sourceUrl: "https://kenney.nl/assets/mini-forest",
    tags: ["forest", "nature", "fantasy"],
  },
  {
    slug: "furniture",
    zip: "kenney_furniture-kit.zip",
    title: "Furniture Kit",
    version: "2.0",
    sourceUrl: "https://kenney.nl/assets/furniture-kit",
    tags: ["furniture", "interior", "home"],
    modelDirectory: ["Models", "GLTF format"],
    previewDirectory: ["Isometric"],
    previewSuffix: "_NE",
  },
  {
    slug: "mini-arcade",
    zip: "kenney_mini-arcade.zip",
    title: "Mini Arcade",
    version: "1.2",
    sourceUrl: "https://kenney.nl/assets/mini-arcade",
    tags: ["arcade", "game", "entertainment"],
  },
  {
    slug: "food",
    zip: "kenney_food-kit.zip",
    title: "Food Kit",
    version: "2.0",
    sourceUrl: "https://kenney.nl/assets/food-kit",
    tags: ["food", "kitchen", "cooking"],
  },
];

const localPolyHavenAssets = [
  {
    id: "polyhaven-Camera_01",
    sourceId: "Camera_01",
    name: "Vintage Rangefinder",
    description:
      "Ornate worn rangefinder camera with a leather strap and detailed lens assembly.",
    category: "Electronics",
    tags: ["vintage", "camera", "metal", "leather", "product"],
    creator: "Rajil Jose Macatangay",
    fileSizeMB: 2.33,
    polygons: 26987,
    drawCalls: 5,
    materials: 4,
    dimensions: "26.3 × 21.4 × 7.8 cm",
    performance: "B",
    licenceClass: "concept-only",
    trademarkWarning: true,
  },
  {
    id: "polyhaven-Lantern_01",
    sourceId: "Lantern_01",
    name: "Hurricane Lantern",
    description:
      "Antique brass lantern with a textured glass globe, patina, handle, and rivet details.",
    category: "Lighting",
    tags: ["antique", "brass", "glass", "lighting", "patina"],
    creator: "Rajil Jose Macatangay",
    fileSizeMB: 1.35,
    polygons: 33902,
    drawCalls: 2,
    materials: 2,
    dimensions: "29.4 × 12.2 × 9.7 cm",
    performance: "B",
    licenceClass: "ship-safe",
    trademarkWarning: false,
  },
  {
    id: "polyhaven-ArmChair_01",
    sourceId: "ArmChair_01",
    name: "Victorian Armchair",
    description:
      "Carved varnished-wood frame with period upholstery and a compact web footprint.",
    category: "Furniture",
    tags: ["chair", "victorian", "wood", "interior", "gothic"],
    creator: "Kirill Sannikov",
    fileSizeMB: 0.73,
    polygons: 5626,
    drawCalls: 1,
    materials: 1,
    dimensions: "106.5 × 84.8 × 76.6 cm",
    performance: "A",
    licenceClass: "ship-safe",
    trademarkWarning: false,
  },
  {
    id: "polyhaven-Drill_01",
    sourceId: "Drill_01",
    name: "Cordless Drill",
    description:
      "Lime polymer body, rubber grip, metal chuck, and detailed battery.",
    category: "Tools",
    tags: ["tool", "industrial", "plastic", "metal", "product"],
    creator: "Fernando Quinn",
    fileSizeMB: 0.48,
    polygons: 2926,
    drawCalls: 1,
    materials: 1,
    dimensions: "18.5 × 18.3 × 5.2 cm",
    performance: "A+",
    licenceClass: "ship-safe",
    trademarkWarning: false,
  },
  {
    id: "polyhaven-Ukulele_01",
    sourceId: "Ukulele_01",
    name: "Worn Ukulele",
    description:
      "Scuffed wooden instrument with a detailed fretboard, metal tuners, and visible grain.",
    category: "Instruments",
    tags: ["music", "wood", "instrument", "worn", "product"],
    creator: "Joseph Burgan",
    fileSizeMB: 0.77,
    polygons: 8912,
    drawCalls: 1,
    materials: 1,
    dimensions: "52.7 × 17.8 × 5.1 cm",
    performance: "A",
    licenceClass: "ship-safe",
    trademarkWarning: false,
  },
  {
    id: "polyhaven-ClassicConsole_01",
    sourceId: "ClassicConsole_01",
    name: "Gothic Console",
    description:
      "Ornate Victorian console table with cabriole legs and decorative scrollwork.",
    category: "Furniture",
    tags: ["table", "victorian", "wood", "interior", "ornate"],
    creator: "Kirill Sannikov",
    fileSizeMB: 0.71,
    polygons: 7566,
    drawCalls: 1,
    materials: 1,
    dimensions: "154.3 × 94.9 × 58.9 cm",
    performance: "A",
    licenceClass: "ship-safe",
    trademarkWarning: false,
  },
];

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

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      continue;
    }

    field += character;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...data] = rows;
  return data.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function humanize(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replaceAll(/[^a-zA-Z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase();
}

function categoryForKenney(filename, pack) {
  const value = slugify(filename);
  if (pack.slug === "food") return "Food";
  if (pack.slug === "mini-arcade") {
    if (/(?:^|-)character(?:-|$)/.test(value)) return "Characters";
    if (/(?:^|-)(wall|floor|column)(?:-|$)/.test(value)) return "Architecture";
    return "Gameplay";
  }
  if (pack.slug === "furniture") {
    if (/(?:^|-)(plant|potted-plant)(?:-|$)/.test(value)) return "Nature";
    if (/(?:^|-)lamp(?:-|$)/.test(value)) return "Lighting";
    if (
      /(?:^|-)(computer|dryer|keyboard|laptop|machine|microwave|mouse|radio|speaker|television|toaster|washer)(?:-|$)/.test(
        value,
      )
    ) {
      return "Electronics";
    }
    if (/(?:^|-)(doorway|floor|paneling|stairs|wall)(?:-|$)/.test(value)) {
      return "Architecture";
    }
    return "Furniture";
  }
  const rules = [
    ["Characters", /(?:^|-)(character|archer|human|orc|robot|enemy|player)(?:-|$)/],
    ["Nature", /(?:^|-)(tree|forest|flower|grass|bush|plant|rock|stone|stump|log|mushroom)(?:-|$)/],
    ["Vehicles", /(?:^|-)(vehicle|car|truck|van|bus|forklift)(?:-|$)/],
    ["Lighting", /(?:^|-)(lamp|lantern|light)(?:-|$)/],
    ["Electronics", /(?:^|-)(computer|keyboard|laptop|mouse|radio|speaker|television|vending|ticket-machine|cash-register)(?:-|$)/],
    ["Furniture", /(?:^|-)(bath|bed|bench|bookcase|cabinet|chair|coat-rack|couch|desk|dryer|pillow|rug|shelf|shower|sink|sofa|stool|table|toilet|washer)(?:-|$)/],
    ["Industrial", /(?:^|-)(factory|conveyor|machine|pipe|tank|crane|industrial|warehouse)(?:-|$)/],
    ["Architecture", /(?:^|-)(building|roof|wall|floor|door|window|corridor|room|stairs|bridge|column|platform|cave)(?:-|$)/],
    ["Gameplay", /(?:^|-)(arcade|game|checkpoint|spawn|spike|arrow|coin|gem|block|flag|finish|start|pinball|prize|hockey)(?:-|$)/],
  ];
  const match = rules.find(([, pattern]) => pattern.test(value))?.[0];
  if (match) return match;
  return {
    "modular-cave": "Architecture",
    platformer: "Gameplay",
    factory: "Industrial",
    "city-commercial": "Architecture",
    "city-suburban": "Architecture",
    "mini-dungeon": "Props",
    "mini-forest": "Nature",
    furniture: "Furniture",
    "mini-arcade": "Gameplay",
    food: "Food",
  }[pack.slug] ?? "Props";
}

function formatDimensions(minimum, maximum) {
  if (!minimum || !maximum) return "Not measured";
  const dimensions = maximum.map((value, index) =>
    Math.max(0, value - minimum[index]),
  );
  return `${dimensions
    .map((value) => value.toFixed(value >= 10 ? 1 : 2))
    .join(" × ")} units`;
}

function gradeFor(bytes, polygons) {
  const megabytes = bytes / 1024 / 1024;
  if (megabytes <= 0.08 && polygons <= 5_000) return "A+";
  if (megabytes <= 0.25 && polygons <= 20_000) return "A";
  if (megabytes <= 1.5 && polygons <= 75_000) return "B";
  return "C";
}

function analyzeGlb(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67) {
    throw new Error("Invalid GLB magic header");
  }
  if (buffer.readUInt32LE(4) !== 2) {
    throw new Error("Only GLB version 2 is supported");
  }

  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error("GLB JSON chunk missing");
  const json = JSON.parse(
    buffer
      .subarray(20, 20 + jsonLength)
      .toString("utf8")
      .replace(/\u0000+$/g, "")
      .trim(),
  );

  let polygons = 0;
  let drawCalls = 0;
  let minimum = null;
  let maximum = null;

  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      drawCalls += 1;
      const accessorIndex =
        primitive.indices ?? primitive.attributes?.POSITION;
      const count = Number(json.accessors?.[accessorIndex]?.count ?? 0);
      const mode = primitive.mode ?? 4;
      if (mode === 4) polygons += Math.floor(count / 3);
      if (mode === 5 || mode === 6) polygons += Math.max(0, count - 2);

      const positionAccessor =
        json.accessors?.[primitive.attributes?.POSITION];
      if (positionAccessor?.min && positionAccessor?.max) {
        minimum ??= [...positionAccessor.min];
        maximum ??= [...positionAccessor.max];
        minimum = minimum.map((value, index) =>
          Math.min(value, positionAccessor.min[index]),
        );
        maximum = maximum.map((value, index) =>
          Math.max(value, positionAccessor.max[index]),
        );
      }
    }
  }

  const externalFiles = (json.images ?? [])
    .map((image) => image.uri)
    .filter((uri) => uri && !uri.startsWith("data:"));

  return {
    polygons,
    drawCalls,
    materials: json.materials?.length ?? 0,
    animations: json.animations?.length ?? 0,
    dimensions: formatDimensions(minimum, maximum),
    externalFiles,
  };
}

async function extractKenneyModels() {
  const modelRoot = path.join(outputRoot, "assets", "models", "kenney");
  const thumbnailRoot = path.join(outputRoot, "assets", "thumbs", "kenney");
  const licenceRoot = path.join(outputRoot, "licences", "kenney");
  const generatedTargets = [modelRoot, thumbnailRoot, licenceRoot, tempRoot];
  generatedTargets.forEach((target) => assertInside(repositoryRoot, target));

  await Promise.all(
    packs.map((pack) => stat(path.join(downloadsDirectory, pack.zip))),
  );
  await Promise.all(generatedTargets.map((target) => rm(target, { recursive: true, force: true })));
  await Promise.all([
    mkdir(modelRoot, { recursive: true }),
    mkdir(thumbnailRoot, { recursive: true }),
    mkdir(licenceRoot, { recursive: true }),
    mkdir(tempRoot, { recursive: true }),
  ]);

  const models = [];
  const packProvenance = [];

  for (const pack of packs) {
    const zipPath = path.join(downloadsDirectory, pack.zip);
    const zipStats = await stat(zipPath);
    const packTemp = path.join(tempRoot, pack.slug);
    const packModels = path.join(modelRoot, pack.slug);
    const packThumbnails = path.join(thumbnailRoot, pack.slug);
    await Promise.all([
      mkdir(packTemp, { recursive: true }),
      mkdir(packModels, { recursive: true }),
      mkdir(packThumbnails, { recursive: true }),
    ]);

    execFileSync("tar", ["-xf", zipPath, "-C", packTemp], {
      stdio: "inherit",
    });

    const glbDirectory = path.join(
      packTemp,
      ...(pack.modelDirectory ?? ["Models", "GLB format"]),
    );
    const glbTextureDirectory = path.join(glbDirectory, "Textures");
    const previewDirectory = path.join(
      packTemp,
      ...(pack.previewDirectory ?? ["Previews"]),
    );
    try {
      await stat(glbTextureDirectory);
      await cp(glbTextureDirectory, path.join(packModels, "Textures"), {
        recursive: true,
      });
    } catch {
      // Some packs embed every texture directly in their GLBs.
    }
    const filenames = (await readdir(glbDirectory))
      .filter((filename) => filename.toLowerCase().endsWith(".glb"))
      .sort((left, right) => left.localeCompare(right));
    const licence = await readFile(path.join(packTemp, "License.txt"), "utf8");
    await writeFile(
      path.join(licenceRoot, `${pack.slug}.txt`),
      `${licence
        .replaceAll("\r\n", "\n")
        .replace(/[ \t]+$/gm, "")
        .trim()}\n`,
    );

    for (const filename of filenames) {
      const basename = path.basename(filename, ".glb");
      const stableBasename = slugify(basename);
      const sourceModel = path.join(glbDirectory, filename);
      const sourcePreview = path.join(
        previewDirectory,
        `${basename}${pack.previewSuffix ?? ""}.png`,
      );
      const destinationModel = path.join(packModels, filename);
      const destinationPreview = path.join(
        packThumbnails,
        `${stableBasename}.png`,
      );
      const modelBuffer = await readFile(sourceModel);
      const analysis = analyzeGlb(modelBuffer);
      const modelRelative = `assets/models/kenney/${pack.slug}/${filename}`;
      const thumbnailRelative = `assets/thumbs/kenney/${pack.slug}/${stableBasename}.png`;

      await Promise.all([
        cp(sourceModel, destinationModel),
        cp(sourcePreview, destinationPreview),
      ]);

      const filenameTags = stableBasename.split("-").filter(Boolean);
      models.push({
        id: `kenney-${pack.slug}-${stableBasename}`,
        sourceId: basename,
        name: humanize(basename),
        description: `${humanize(basename)} from Kenney's ${pack.title} ${pack.version} collection.`,
        category: categoryForKenney(basename, pack),
        tags: Array.from(new Set([...pack.tags, ...filenameTags])),
        creator: "Kenney",
        source: "Kenney",
        collection: pack.title,
        collectionVersion: pack.version,
        sourceUrl: pack.sourceUrl,
        licence: "CC0 1.0",
        licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
        licenceClass: "ship-safe",
        rightsNote: "Commercial use allowed; attribution is appreciated but not required.",
        modelUrl: modelRelative,
        publicModelUrl: `${publicRoot}/${modelRelative}`,
        thumbnailUrl: thumbnailRelative,
        publicThumbnailUrl: `${publicRoot}/${thumbnailRelative}`,
        fileSizeMB: Number((modelBuffer.length / 1024 / 1024).toFixed(3)),
        polygons: analysis.polygons,
        drawCalls: analysis.drawCalls,
        materials: analysis.materials,
        animations: analysis.animations,
        dimensions: analysis.dimensions,
        performance: gradeFor(modelBuffer.length, analysis.polygons),
        format: "GLB",
        storage: "local",
        trademarkWarning: false,
        files: Object.fromEntries(
          analysis.externalFiles.map((filename) => [
            filename.replaceAll("\\", "/"),
            `${publicRoot}/assets/models/kenney/${pack.slug}/${filename.replaceAll("\\", "/")}`,
          ]),
        ),
      });
    }

    packProvenance.push({
      pack: pack.title,
      version: pack.version,
      sourceUrl: pack.sourceUrl,
      inputArchive: pack.zip,
      inputArchiveBytes: zipStats.size,
      creator: "Kenney",
      licence: "CC0 1.0",
      licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      modelCount: filenames.length,
      transformations: [
        "Extracted only the self-contained GLB distribution and matching preview images",
        "Renamed output folders by stable collection slug",
        "Read geometry and package metrics without modifying model contents",
      ],
    });
  }

  await rm(tempRoot, { recursive: true, force: true });
  return { models, packProvenance };
}

async function buildPolyHavenModels() {
  const sourceModels = path.join(lumoraObjectsRoot, "public", "models");
  const sourceThumbnails = path.join(lumoraObjectsRoot, "public", "thumbs");
  const destinationModels = path.join(
    outputRoot,
    "assets",
    "models",
    "polyhaven",
  );
  const destinationThumbnails = path.join(
    outputRoot,
    "assets",
    "thumbs",
    "polyhaven",
  );
  [destinationModels, destinationThumbnails].forEach((target) =>
    assertInside(repositoryRoot, target),
  );
  await Promise.all([
    rm(destinationModels, { recursive: true, force: true }),
    rm(destinationThumbnails, { recursive: true, force: true }),
  ]);
  await Promise.all([
    cp(sourceModels, destinationModels, { recursive: true }),
    cp(sourceThumbnails, destinationThumbnails, { recursive: true }),
  ]);

  const localModels = localPolyHavenAssets.map((asset) => {
    const modelRelative = `assets/models/polyhaven/${asset.sourceId}/${asset.sourceId}_1k.gltf`;
    const thumbnailRelative = `assets/thumbs/polyhaven/${asset.sourceId}.png`;
    return {
      ...asset,
      source: "Poly Haven",
      collection: "Poly Haven Local Heroes",
      collectionVersion: "1K glTF",
      sourceUrl: `https://polyhaven.com/a/${asset.sourceId}`,
      licence: "CC0 1.0",
      licenceUrl: "https://polyhaven.com/license",
      rightsNote:
        asset.licenceClass === "ship-safe"
          ? "CC0; no attribution required."
          : "CC0 copyright status retained; trademark review required.",
      modelUrl: modelRelative,
      publicModelUrl: `${publicRoot}/${modelRelative}`,
      thumbnailUrl: thumbnailRelative,
      publicThumbnailUrl: `${publicRoot}/${thumbnailRelative}`,
      animations: 0,
      format: "glTF",
      storage: "local",
    };
  });

  const [remoteCatalog, remoteManifest] = await Promise.all([
    readFile(
      path.join(
        lumoraObjectsRoot,
        "app",
        "generated",
        "polyhaven-assets.json",
      ),
      "utf8",
    ).then(JSON.parse),
    readFile(
      path.join(
        lumoraObjectsRoot,
        "app",
        "generated",
        "polyhaven-file-manifest.json",
      ),
      "utf8",
    ).then(JSON.parse),
  ]);

  const remoteModels = remoteCatalog.map((asset) => {
    const files = remoteManifest[asset.id];
    const mainEntry = Object.entries(files).find(([filename]) =>
      filename.endsWith(".gltf"),
    );
    if (!mainEntry) throw new Error(`No glTF entry for ${asset.id}`);

    return {
      id: `polyhaven-${asset.id}`,
      sourceId: asset.id,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      tags: asset.tags,
      creator: asset.creator,
      source: "Poly Haven",
      collection: "Poly Haven Streamed Index",
      collectionVersion: "1K glTF",
      sourceUrl: asset.sourceUrl,
      licence: asset.license,
      licenceUrl: asset.licenseUrl,
      licenceClass: asset.licenseClass,
      rightsNote:
        asset.licenseClass === "ship-safe"
          ? "CC0; no attribution required."
          : "Review source-specific rights before production use.",
      modelUrl: mainEntry[1],
      publicModelUrl: mainEntry[1],
      thumbnailUrl: asset.thumbnail,
      publicThumbnailUrl: asset.thumbnail,
      fileSizeMB: asset.fileSize,
      polygons: asset.polygons,
      drawCalls: asset.drawCalls,
      materials: asset.materials,
      animations: 0,
      dimensions: asset.dimensions,
      performance: asset.performance,
      format: "glTF",
      storage: "remote",
      trademarkWarning: asset.trademarkWarning,
      files,
    };
  });

  return [...localModels, ...remoteModels];
}

async function buildComponentCatalog() {
  const csvSource = await readFile(
    path.join(componentSkillRoot, "references", "component-catalog.csv"),
    "utf8",
  );
  const components = parseCsv(csvSource).map((component) => ({
    ...component,
    quality_score: Number(component.quality_score),
    novelty_score: Number(component.novelty_score),
    public_record_url: `${publicRoot}/components.json#${component.id}`,
  }));

  if (components.length < 1000) {
    throw new Error(`Expected 1000+ component recipes, found ${components.length}`);
  }

  const index = components.map((component) => ({
    id: component.id,
    name: component.name,
    category: component.category,
    art_direction: component.art_direction,
    summary: component.summary,
    style_tags: component.style_tags,
    best_for: component.best_for,
    framework_fit: component.framework_fit,
    motion_level: component.motion_level,
    performance_cost: component.performance_cost,
    impact: component.impact,
    quality_score: component.quality_score,
    novelty_score: component.novelty_score,
    compatibility: component.compatibility,
    source_kind: component.source_kind,
    license: component.license,
  }));

  return { components, index };
}

function backgroundHostLabel(hostname) {
  if (hostname === "stream.mux.com") return "Mux";
  if (hostname.endsWith("cloudfront.net")) return "CloudFront";
  if (hostname.endsWith("cloudflarestream.com")) return "Cloudflare Stream";
  if (hostname.endsWith("r2.dev")) return "Cloudflare R2";
  return hostname;
}

async function buildAnimatedBackgroundCatalog() {
  const source = JSON.parse(
    await readFile(animatedBackgroundSourcePath, "utf8"),
  );
  const backgrounds = source.entries.map((entry) => {
    const sourceUrl = new URL(entry.url);
    const sequence = String(entry.sourceIndex).padStart(3, "0");
    const format = entry.format;
    const id = `animated-background-${sequence}`;
    const thumbnailPath = `assets/background-thumbs/${id}.webp`;
    const thumbnailUrl = entry.available
      ? `./${thumbnailPath}`
      : null;

    return {
      id,
      name: `Motion Background ${sequence}`,
      sourceOrder: entry.sourceIndex,
      category: "Animated background",
      format,
      mediaType:
        format === "MP4" ? "video/mp4" : "application/vnd.apple.mpegurl",
      retrievalMode:
        format === "MP4" ? "direct-download" : "adaptive-hls-stream",
      source: "User-supplied external URL",
      sourceHost: sourceUrl.hostname,
      hostLabel: backgroundHostLabel(sourceUrl.hostname),
      creator: "Unknown",
      licence: "Commercial use (owner-confirmed)",
      licenceClass: "commercial-use",
      rightsNote:
        "Commercial-use entitlement confirmed by Lumora on 2026-07-29.",
      storage: "remote",
      sourceUrl: entry.url,
      downloadUrl: entry.url,
      previewUrl: entry.url,
      thumbnailUrl,
      publicThumbnailUrl: entry.available
        ? `${publicRoot}/${thumbnailPath}`
        : null,
      thumbnailStorage: entry.available ? "local" : null,
      thumbnailSourceTimeSeconds: entry.available ? 0.1 : null,
      thumbnailDimensions: entry.available ? "640x360" : null,
      availability: entry.available ? "Available" : "Unavailable",
      httpStatus: entry.httpStatus,
      checkedAt: source.importedAt,
      fileSizeMB: entry.fileSizeBytes
        ? Number((entry.fileSizeBytes / 1024 / 1024).toFixed(2))
        : null,
      accentHue: (entry.sourceIndex * 47) % 360,
      previewPattern: (entry.sourceIndex - 1) % 8,
      summary:
        format === "MP4"
          ? "Externally hosted motion footage with a direct MP4 download URL."
          : "Externally hosted adaptive HLS motion stream.",
      performanceGuidance:
        "Select one background, download or stream only that winner, lazy-load it, remove audio, cap resolution and bitrate, and provide a reduced-motion still.",
      publicRecordUrl: `${publicRoot}/animated-backgrounds.json#animated-background-${sequence}`,
    };
  });

  if (backgrounds.length !== source.uniqueUrlCount) {
    throw new Error(
      `Animated background source count mismatch (${backgrounds.length}/${source.uniqueUrlCount})`,
    );
  }

  return {
    backgrounds,
    source: {
      importedAt: source.importedAt,
      sourceFile: source.sourceFile,
      parsedUrlCount: source.parsedUrlCount,
      uniqueUrlCount: source.uniqueUrlCount,
      duplicateCount: source.duplicateCount,
    },
  };
}

async function loadExistingModelCatalog() {
  const [models, provenance] = await Promise.all([
    readFile(path.join(outputRoot, "models.json"), "utf8").then(JSON.parse),
    readFile(path.join(outputRoot, "provenance.json"), "utf8").then(JSON.parse),
  ]);

  return {
    kenneyModels: models.filter((model) => model.source === "Kenney"),
    polyHavenModels: models.filter((model) => model.source === "Poly Haven"),
    packProvenance: provenance.kenney,
  };
}

async function buildFreshModelCatalog() {
  const [{ models: kenneyModels, packProvenance }, polyHavenModels] =
    await Promise.all([extractKenneyModels(), buildPolyHavenModels()]);
  return { kenneyModels, polyHavenModels, packProvenance };
}

async function main() {
  await mkdir(path.join(outputRoot, "assets", "models"), { recursive: true });
  await mkdir(path.join(outputRoot, "assets", "thumbs"), { recursive: true });

  const [
    { kenneyModels, polyHavenModels, packProvenance },
    componentData,
    backgroundData,
  ] = await Promise.all([
    process.env.MCP_REUSE_EXISTING_MODELS === "1"
      ? loadExistingModelCatalog()
      : buildFreshModelCatalog(),
    buildComponentCatalog(),
    buildAnimatedBackgroundCatalog(),
  ]);

  const models = [...kenneyModels, ...polyHavenModels];
  const modelIds = new Set(models.map((model) => model.id));
  if (modelIds.size !== models.length) {
    throw new Error("Duplicate model IDs detected");
  }

  const manifest = {
    name: "Lumora MCP",
    version: "1.0.0",
    generatedAt: "2026-07-29",
    canonicalUrl: `${publicRoot}/`,
    purpose:
      "A human and machine-readable design toolkit for selecting web-ready 3D models, original Web Component implementation recipes, and externally hosted animated background references.",
    totals: {
      models: models.length,
      localModels: models.filter((model) => model.storage === "local").length,
      streamedModels: models.filter((model) => model.storage === "remote").length,
      componentRecipes: componentData.components.length,
      animatedBackgrounds: backgroundData.backgrounds.length,
      availableAnimatedBackgrounds: backgroundData.backgrounds.filter(
        (background) => background.availability === "Available",
      ).length,
      shipSafeModels: models.filter(
        (model) => model.licenceClass === "ship-safe",
      ).length,
    },
    endpoints: {
      models: `${publicRoot}/models.json`,
      componentIndex: `${publicRoot}/components-index.json`,
      componentRecords: `${publicRoot}/components.json`,
      animatedBackgrounds: `${publicRoot}/animated-backgrounds.json`,
      instructions: `${publicRoot}/instructions.md`,
      provenance: `${publicRoot}/provenance.json`,
    },
    modelSchema: {
      id: "Stable catalog identifier",
      modelUrl: "Relative local path or official remote glTF URL",
      publicModelUrl: "Absolute model URL for Codex and external consumers",
      files:
        "Optional exact dependency URL map used to resolve streamed Poly Haven glTF packages",
      licenceClass: "ship-safe, attribution, or concept-only",
    },
    animatedBackgroundSchema: {
      id: "Stable catalog identifier",
      previewUrl: "Original externally hosted MP4 or HLS media URL",
      downloadUrl: "Direct MP4 download or adaptive HLS manifest URL",
      thumbnailUrl: "Local 640x360 WebP extracted from the opening frame",
      publicThumbnailUrl: "Absolute opening-frame thumbnail URL for external consumers",
      availability: "Last observed URL availability",
      licenceClass: "commercial-use based on Lumora owner confirmation",
    },
  };

  const provenance = {
    project: "Lumora MCP",
    generatedAt: "2026-07-29",
    runtimeDependencies: [
      {
        name: "three",
        version: "0.185.1",
        sourceUrl: "https://github.com/mrdoob/three.js",
        licence: "MIT",
        localLicencePath: "mcp/licences/three.txt",
        vendoredFiles: [
          "three.module.min.js",
          "three.core.min.js",
          "GLTFLoader.js",
          "OrbitControls.js",
          "BufferGeometryUtils.js",
          "SkeletonUtils.js",
        ],
      },
      {
        name: "hls.js",
        version: "1.6.16",
        sourceUrl: "https://github.com/video-dev/hls.js",
        licence: "Apache-2.0",
        licenceUrl:
          "https://github.com/video-dev/hls.js/blob/v1.6.16/LICENSE",
        runtimeUrl:
          "https://cdn.jsdelivr.net/npm/hls.js@1.6.16/dist/hls.light.min.js",
        loading:
          "Loaded on demand only when an HLS animated background is selected in a browser without native HLS support.",
      },
    ],
    kenney: packProvenance,
    polyHaven: {
      sourceUrl: "https://api.polyhaven.com/assets?t=models",
      licence: "CC0",
      licenceUrl: "https://polyhaven.com/license",
      localModelCount: polyHavenModels.filter(
        (model) => model.storage === "local",
      ).length,
      streamedModelCount: polyHavenModels.filter(
        (model) => model.storage === "remote",
      ).length,
      transformations: [
        "Preserved source creator, asset page, licence, package metrics, and trademark warnings",
        "Hosted six selected 1K glTF packages locally",
        "Kept 114 packages on the official CDN with exact dependency maps",
      ],
    },
    components: {
      source: "Lumora Web Design Components skill",
      sourceKind: "owned-original-recipe",
      licence: "owned-original",
      recipeCount: componentData.components.length,
      transformations: [
        "Converted the internal CSV catalog to complete JSON records",
        "Generated a smaller browser index without removing full machine-readable records",
      ],
    },
    animatedBackgrounds: {
      source: backgroundData.source.sourceFile,
      sourceKind: "user-supplied-external-links",
      importedAt: backgroundData.source.importedAt,
      parsedUrlCount: backgroundData.source.parsedUrlCount,
      uniqueUrlCount: backgroundData.source.uniqueUrlCount,
      duplicateCount: backgroundData.source.duplicateCount,
      availableCount: backgroundData.backgrounds.filter(
        (background) => background.availability === "Available",
      ).length,
      unavailableCount: backgroundData.backgrounds.filter(
        (background) => background.availability !== "Available",
      ).length,
      storage: "external media with local derived thumbnails",
      licenceClass: "commercial-use",
      entitlementBasis:
        "Commercial-use purchase confirmed by Lumora asset owner on 2026-07-29.",
      rightsNote:
        "Lumora confirmed commercial-use entitlement for the supplied collection.",
      thumbnailCount: backgroundData.backgrounds.filter(
        (background) => Boolean(background.thumbnailUrl),
      ).length,
      thumbnailFormat: "WebP",
      thumbnailDimensions: "640x360",
      thumbnailSourceTimeSeconds: 0.1,
      thumbnailGenerator: "FFmpeg-compatible build-time runtime (not distributed)",
      transformations: [
        "Removed exact duplicate URLs while preserving first-seen order",
        "Recorded URL format, host, last observed availability, and direct retrieval URL",
        "Kept all full background media on its original external host",
        "Extracted and optimized one opening-frame thumbnail per reachable source for accurate local previews",
      ],
    },
  };

  const instructions = `# Lumora MCP

Canonical entry point: ${publicRoot}/

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records, original Web Component implementation recipes, and externally hosted animated background references.

## Machine-readable endpoints

- Manifest: ${publicRoot}/manifest.json
- 3D models: ${publicRoot}/models.json
- Component index: ${publicRoot}/components-index.json
- Complete component records: ${publicRoot}/components.json
- Animated backgrounds: ${publicRoot}/animated-backgrounds.json
- Provenance: ${publicRoot}/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose the model, component, or animated-background catalog.
2. Filter candidates by the real page goal, brand, framework, performance budget, and asset class.
3. For 3D, prefer \`ship-safe\` records and load only the selected model. Use \`publicModelUrl\` in external projects. When a streamed glTF record has a \`files\` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, choose zero to three recipes. Treat each record as an implementation brief and build it from first principles in the target project's conventions.
5. For animated backgrounds, preview candidates from their external URLs, select one winner, and then fetch only that record's \`downloadUrl\`. MP4 records are direct downloads; HLS records are adaptive streams. Optimize the selected media locally and provide a static reduced-motion fallback.
6. Animated backgrounds are marked \`commercial-use\` based on Lumora's confirmation that the collection was purchased with commercial-use rights.
7. Preserve source URLs, licence records, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
8. Do not mirror the entire catalog into a client project. Copy only the chosen assets or implement only the chosen recipes.

## Rights

Kenney packs in this catalog are the user-provided GLB distributions licensed CC0 1.0. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.
`;

  await Promise.all([
    writeFile(
      path.join(outputRoot, "models.json"),
      `${JSON.stringify(models, null, 2)}\n`,
    ),
    writeFile(
      path.join(outputRoot, "components.json"),
      `${JSON.stringify(componentData.components, null, 2)}\n`,
    ),
    writeFile(
      path.join(outputRoot, "components-index.json"),
      `${JSON.stringify(componentData.index, null, 2)}\n`,
    ),
    writeFile(
      path.join(outputRoot, "animated-backgrounds.json"),
      `${JSON.stringify(backgroundData.backgrounds, null, 2)}\n`,
    ),
    writeFile(
      path.join(outputRoot, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    ),
    writeFile(
      path.join(outputRoot, "provenance.json"),
      `${JSON.stringify(provenance, null, 2)}\n`,
    ),
    writeFile(path.join(outputRoot, "instructions.md"), instructions),
  ]);

  console.log(
    JSON.stringify(
      {
        models: models.length,
        kenneyModels: kenneyModels.length,
        polyHavenModels: polyHavenModels.length,
        localModels: manifest.totals.localModels,
        streamedModels: manifest.totals.streamedModels,
        componentRecipes: componentData.components.length,
        animatedBackgrounds: backgroundData.backgrounds.length,
        availableAnimatedBackgrounds:
          manifest.totals.availableAnimatedBackgrounds,
        kenneyMegabytes: Number(
          kenneyModels
            .reduce((sum, model) => sum + model.fileSizeMB, 0)
            .toFixed(2),
        ),
      },
      null,
      2,
    ),
  );
}

await main();
