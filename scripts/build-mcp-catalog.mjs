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
 * - KENNEY_DOWNLOADS_DIR: directory containing the Kenney 3D and image ZIPs
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
const quaterniusSelectionPath = path.join(
  scriptDirectory,
  "data",
  "quaternius-selection.json",
);
const publicRoot = "https://lumoraofficial.de/mcp";
const tempRoot = path.join(repositoryRoot, ".mcp-import-temp");
const imageTempRoot = path.join(repositoryRoot, ".mcp-image-import-temp");

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

const imagePacks = [
  {
    slug: "background-elements",
    zip: "kenney_background-elements-remastered.zip",
    title: "Background Elements Remastered",
    sourceUrl: "https://kenney.nl/assets/background-elements-remastered",
    tags: ["background", "scenery", "layered", "nature"],
    selections: [
      {
        prefix: "PNG/Default/",
        output: "elements",
        assetType: "Scenery",
        category: "Scenery elements",
      },
      {
        prefix: "Backgrounds/Elements/",
        output: "layers",
        assetType: "Scenery",
        category: "Background layers",
      },
      {
        prefix: "Backgrounds/",
        output: "backgrounds",
        assetType: "Scene",
        category: "Scene backgrounds",
      },
    ],
  },
  {
    slug: "foliage-sprites",
    zip: "kenney_foliage-sprites.zip",
    title: "Foliage Sprites",
    sourceUrl: "https://kenney.nl/assets/foliage-sprites",
    tags: ["foliage", "nature", "sprite", "shaded"],
    selections: [
      {
        prefix: "PNG/Shaded/",
        output: "shaded",
        assetType: "Foliage",
        category: "Foliage sprites",
      },
    ],
  },
  {
    slug: "pixel-vehicles",
    zip: "kenney_pixel-vehicle-pack.zip",
    title: "Pixel Vehicle Pack",
    sourceUrl: "https://kenney.nl/assets/pixel-vehicle-pack",
    tags: ["pixel-art", "vehicle", "game", "sprite"],
    pixelArt: true,
    selections: [
      {
        prefix: "PNG/Cars/",
        output: "cars",
        assetType: "Pixel art",
        category: "Vehicles",
      },
      {
        prefix: "PNG/Characters/",
        output: "characters",
        assetType: "Pixel art",
        category: "Characters",
      },
      {
        prefix: "PNG/Props/",
        output: "props",
        assetType: "Pixel art",
        category: "Props",
      },
    ],
  },
  {
    slug: "pattern-lines",
    zip: "kenney_pattern-pack-lines.zip",
    title: "Pattern Pack: Lines",
    sourceUrl: "https://kenney.nl/assets/pattern-pack-lines",
    tags: ["pattern", "line", "tileable", "texture"],
    tileable: true,
    selections: [
      {
        prefix: "PNG/Thick/Default (256px)/",
        output: "thick",
        assetType: "Pattern",
        category: "Thick line patterns",
      },
      {
        prefix: "PNG/Thin/Default (256px)/",
        output: "thin",
        assetType: "Pattern",
        category: "Thin line patterns",
      },
    ],
  },
  {
    slug: "foliage",
    zip: "kenney_foliage-pack.zip",
    title: "Foliage Pack",
    sourceUrl: "https://kenney.nl/assets/foliage-pack",
    tags: ["foliage", "nature", "leaves", "decoration"],
    selections: [
      {
        prefix: "PNG/Default size/",
        output: "default",
        assetType: "Foliage",
        category: "Foliage elements",
        recursive: true,
      },
    ],
  },
  {
    slug: "generic-items",
    zip: "kenney_generic-items.zip",
    title: "Generic Items",
    sourceUrl: "https://kenney.nl/assets/generic-items",
    tags: ["icon", "item", "ui", "interface"],
    selections: [
      {
        prefix: "PNG/Colored/",
        output: "colored",
        assetType: "UI / Icon",
        category: "Generic items",
      },
    ],
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

async function walkFiles(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(directory, relativePath)));
    } else {
      files.push(relativePath.replaceAll("\\", "/"));
    }
  }
  return files;
}

function analyzePng(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.subarray(12, 16).toString() !== "IHDR") {
    throw new Error("Invalid PNG image");
  }
  const colorType = buffer.readUInt8(25);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    hasAlpha:
      colorType === 4 ||
      colorType === 6 ||
      buffer.indexOf(Buffer.from("tRNS")) !== -1,
  };
}

function imageAssetName(basename, pack, selection) {
  const numericSuffix = basename.match(/(\d+)$/)?.[1];
  if (pack.slug === "foliage-sprites" && numericSuffix) {
    return `Foliage Sprite ${numericSuffix.padStart(3, "0")}`;
  }
  if (pack.slug === "generic-items" && numericSuffix) {
    return `Generic Item ${numericSuffix.padStart(3, "0")}`;
  }
  if (pack.slug === "foliage" && numericSuffix) {
    return `${basename.includes("leaves") ? "Leaf" : "Foliage"} ${numericSuffix.padStart(3, "0")}`;
  }
  if (pack.slug === "pattern-lines" && numericSuffix) {
    const weight = selection.output === "thick" ? "Thick" : "Thin";
    return `${weight} Pattern ${numericSuffix.padStart(3, "0")}`;
  }
  return humanize(basename).replace(/([A-Za-z])(\d+)/g, "$1 $2");
}

function imageUseGuidance(pack, selection) {
  if (pack.pixelArt) {
    return "Use for playful interfaces, game-inspired sections, diagrams, or small decorative motion. Preserve hard pixel edges.";
  }
  if (pack.tileable) {
    return "Use as a repeating CSS texture, clipped accent, mask, or restrained surface treatment.";
  }
  if (selection.category === "Scene backgrounds") {
    return "Use as a full scene foundation or section backdrop, then layer foreground elements above it.";
  }
  if (selection.assetType === "Foliage") {
    return "Use as transparent decorative foliage, parallax depth, framing, or a lightweight nature accent.";
  }
  if (selection.assetType === "UI / Icon") {
    return "Use as an interface icon, inventory-style item, navigation accent, or illustrated detail.";
  }
  return "Use as a transparent scene element, layered illustration, parallax prop, or section decoration.";
}

async function extractImageAssets() {
  const imageRoot = path.join(outputRoot, "assets", "images", "kenney");
  const licenceRoot = path.join(outputRoot, "licences", "kenney-images");
  const generatedTargets = [imageRoot, licenceRoot, imageTempRoot];
  generatedTargets.forEach((target) => assertInside(repositoryRoot, target));

  await Promise.all(
    imagePacks.map((pack) => stat(path.join(downloadsDirectory, pack.zip))),
  );
  await Promise.all(
    generatedTargets.map((target) =>
      rm(target, { recursive: true, force: true }),
    ),
  );
  await Promise.all([
    mkdir(imageRoot, { recursive: true }),
    mkdir(licenceRoot, { recursive: true }),
    mkdir(imageTempRoot, { recursive: true }),
  ]);

  const imageAssets = [];
  const packProvenance = [];
  let sourceOrder = 0;

  for (const pack of imagePacks) {
    const zipPath = path.join(downloadsDirectory, pack.zip);
    const zipStats = await stat(zipPath);
    const packTemp = path.join(imageTempRoot, pack.slug);
    const packOutput = path.join(imageRoot, pack.slug);
    await Promise.all([
      mkdir(packTemp, { recursive: true }),
      mkdir(packOutput, { recursive: true }),
    ]);
    execFileSync("tar", ["-xf", zipPath, "-C", packTemp], {
      stdio: "inherit",
    });

    const licence = await readFile(path.join(packTemp, "License.txt"), "utf8");
    await writeFile(
      path.join(licenceRoot, `${pack.slug}.txt`),
      `${licence
        .replaceAll("\r\n", "\n")
        .replace(/[ \t]+$/gm, "")
        .trim()}\n`,
    );

    const files = (await walkFiles(packTemp))
      .filter((filename) => filename.toLowerCase().endsWith(".png"))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    let packAssetCount = 0;

    for (const selection of pack.selections) {
      const selectedFiles = files.filter((filename) => {
        if (!filename.startsWith(selection.prefix)) return false;
        const remainder = filename.slice(selection.prefix.length);
        return Boolean(remainder) && (selection.recursive || !remainder.includes("/"));
      });
      const selectionOutput = path.join(packOutput, selection.output);
      await mkdir(selectionOutput, { recursive: true });

      for (const filename of selectedFiles) {
        const basename = path.basename(filename, ".png");
        const stableBasename = slugify(basename);
        const sourceImage = path.join(packTemp, ...filename.split("/"));
        const imageBuffer = await readFile(sourceImage);
        const analysis = analyzePng(imageBuffer);
        const destinationFilename = `${stableBasename}.png`;
        const destinationImage = path.join(
          selectionOutput,
          destinationFilename,
        );
        const imageRelative =
          `assets/images/kenney/${pack.slug}/${selection.output}/${destinationFilename}`;
        const category =
          pack.slug === "foliage" && filename.includes("/Leaves/")
            ? "Leaves"
            : selection.category;
        sourceOrder += 1;
        packAssetCount += 1;

        await cp(sourceImage, destinationImage);
        imageAssets.push({
          id: `kenney-image-${pack.slug}-${selection.output}-${stableBasename}`,
          name: imageAssetName(basename, pack, selection),
          description: `${imageAssetName(basename, pack, selection)} from Kenney's ${pack.title} collection.`,
          source: "Kenney",
          creator: "Kenney",
          collection: pack.title,
          packSlug: pack.slug,
          assetType: selection.assetType,
          category,
          tags: Array.from(
            new Set([
              ...pack.tags,
              ...slugify(basename).split("-").filter(Boolean),
              category.toLowerCase(),
            ]),
          ),
          format: "PNG",
          storage: "local",
          imageUrl: imageRelative,
          publicImageUrl: `${publicRoot}/${imageRelative}`,
          downloadUrl: `${publicRoot}/${imageRelative}`,
          sourceUrl: pack.sourceUrl,
          sourcePath: filename,
          licence: "CC0 1.0",
          licenceClass: "ship-safe",
          licenceUrl:
            "https://creativecommons.org/publicdomain/zero/1.0/",
          attribution: "Kenney attribution optional",
          rightsNote:
            "Commercial use, modification, and redistribution allowed; attribution is not required.",
          fileSizeKB: Number((imageBuffer.length / 1024).toFixed(2)),
          width: analysis.width,
          height: analysis.height,
          dimensions: `${analysis.width} × ${analysis.height} px`,
          hasAlpha: analysis.hasAlpha,
          pixelArt: Boolean(pack.pixelArt),
          tileable: Boolean(pack.tileable),
          recommendedUse: imageUseGuidance(pack, selection),
          sourceOrder,
        });
      }
    }

    packProvenance.push({
      pack: pack.title,
      sourceUrl: pack.sourceUrl,
      inputArchive: pack.zip,
      inputArchiveBytes: zipStats.size,
      creator: "Kenney",
      licence: "CC0 1.0",
      licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      assetCount: packAssetCount,
      transformations: [
        "Selected one canonical PNG variant for each useful standalone asset",
        "Excluded duplicate retina, flat, monochrome, vector, sheet, sample, and preview variants",
        "Preserved PNG pixel data and transparency without recompression",
        "Normalized filenames and recorded dimensions, payload, original path, and intended use",
      ],
    });
  }

  const imageIds = new Set(imageAssets.map((asset) => asset.id));
  if (imageIds.size !== imageAssets.length) {
    throw new Error("Duplicate image asset IDs detected");
  }
  await rm(imageTempRoot, { recursive: true, force: true });
  return { imageAssets, packProvenance };
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

const kenneyMoodsByCollection = {
  "Modular Cave Kit": ["rugged", "fantasy", "modular", "game-like"],
  "Platformer Kit": ["playful", "colorful", "casual", "game-like"],
  "Factory Kit": ["industrial", "mechanical", "utilitarian", "game-like"],
  "City Kit Commercial": ["architectural", "isometric", "clean", "stylized"],
  "City Kit Suburban": ["friendly", "architectural", "isometric", "stylized"],
  "Mini Dungeon": ["fantasy", "adventurous", "playful", "game-like"],
  "Mini Forest": ["organic", "whimsical", "friendly", "low-poly"],
  "Furniture Kit": ["friendly", "minimal", "isometric", "playful"],
  "Mini Arcade": ["retro", "playful", "colorful", "game-like"],
  "Food Kit": ["friendly", "casual", "illustrative", "playful"],
};

const kenneyIndustriesByCategory = {
  Architecture: [
    "architecture",
    "real estate concepts",
    "urban planning",
    "hospitality",
    "location experiences",
  ],
  Characters: ["gaming", "education", "community", "kids"],
  Electronics: [
    "gaming",
    "education",
    "youth technology",
    "casual SaaS explainers",
  ],
  Food: ["food", "hospitality", "delivery", "casual dining"],
  Furniture: ["interiors", "hospitality", "real estate concepts", "education"],
  Gameplay: ["gaming", "entertainment", "events", "community"],
  Industrial: ["manufacturing", "logistics", "engineering education", "gaming"],
  Lighting: ["interiors", "hospitality", "events", "stylized environments"],
  Nature: ["outdoors", "wellness", "sustainability", "education"],
  Props: ["gaming", "education", "entertainment", "visual storytelling"],
};

function kenneyFidelityBand(model) {
  if (
    model.polygons >= 900 ||
    (model.category === "Architecture" && model.polygons >= 650)
  ) {
    return {
      id: "detailed-low-poly",
      label: "Detailed low-poly",
      rank: 3,
    };
  }
  if (model.polygons >= 220) {
    return {
      id: "standard-low-poly",
      label: "Standard low-poly",
      rank: 2,
    };
  }
  return {
    id: "very-low-poly",
    label: "Very low-poly",
    rank: 1,
  };
}

function withKenneyStyleGuidance(model) {
  const fidelity = kenneyFidelityBand(model);
  const isTechnicalProp =
    model.category === "Electronics" ||
    /\b(computer|keyboard|laptop|machine|monitor|mouse|phone|screen|server|television)\b/i.test(
      model.name,
    );
  const isMinimalModule =
    model.category === "Architecture" &&
    model.polygons <= 48 &&
    /\b(driveway|floor|path|road|roof|template|wall)\b/i.test(model.name);
  const isDetailedArchitecture =
    model.category === "Architecture" &&
    fidelity.id === "detailed-low-poly";

  let artStyle;
  let selectionPriority;
  let agencyUse;
  let bestFor;
  let avoidWhen;
  let sectionFits;
  let selectionGuidance;
  let fallbackPolicy;
  let brandMoods =
    kenneyMoodsByCollection[model.collection] ?? [
      "playful",
      "stylized",
      "game-like",
    ];

  if (isMinimalModule) {
    artStyle = "Minimal modular geometry";
    selectionPriority = "supporting-module";
    agencyUse =
      "Supporting geometry inside a composed low-poly scene, not a standalone visual";
    bestFor = [
      "assembled isometric scenes",
      "diagram foundations",
      "modular environment building",
    ];
    avoidWhen = [
      "standalone hero object",
      "product close-up",
      "realistic architectural visualization",
    ];
    sectionFits = ["supporting scene", "interactive map", "diagram"];
    selectionGuidance =
      "Treat this as a scene-building module. Its low polygon count is intentional, but it has too little visual information to carry a section alone.";
    fallbackPolicy =
      "Use freely as supporting geometry when it completes a coherent scene; do not promote it to a hero simply because no other object was found.";
  } else if (isTechnicalProp && fidelity.id !== "detailed-low-poly") {
    artStyle =
      fidelity.id === "very-low-poly"
        ? "Very low-poly tech prop"
        : "Simplified low-poly tech prop";
    selectionPriority = "fallback-unless-style-aligned";
    agencyUse =
      "Playful technology vignette, isometric explainer, game-inspired interface, or small supporting prop";
    bestFor = [
      "playful technology",
      "isometric explainers",
      "game-inspired interfaces",
      "small scene details",
    ];
    avoidWhen = [
      "premium high-tech hero",
      "luxury hardware presentation",
      "photoreal product visualization",
      "precision enterprise technology",
    ];
    sectionFits = [
      "supporting illustration",
      "small isometric scene",
      "feature explainer",
      "fallback accent",
    ];
    selectionGuidance =
      "Do not select this because its name sounds high-tech. The geometry is intentionally simplified and can make a premium technology brand feel cheaper unless low-poly styling is part of the art direction.";
    fallbackPolicy =
      "If no closer asset exists, it remains usable as a lightweight fallback: keep it secondary, avoid a close-up, and deliberately adapt its lighting, material treatment, and surrounding composition.";
    brandMoods = ["playful", "isometric", "casual", "game-like"];
  } else if (isDetailedArchitecture) {
    artStyle = "Detailed stylized low-poly architecture";
    selectionPriority = "strong-stylized-candidate";
    agencyUse =
      "Stylized architectural hero, interactive city, spatial story, map, or section environment";
    bestFor = [
      "stylized architectural heroes",
      "interactive maps",
      "isometric cities",
      "spatial storytelling",
    ];
    avoidWhen = [
      "photoreal real-estate visualization",
      "luxury architecture requiring realistic materials",
      "engineering-accurate presentation",
    ];
    sectionFits = [
      "hero scene",
      "interactive map",
      "section environment",
      "scroll story",
    ];
    selectionGuidance =
      "This has substantially more geometry than most Kenney props and can carry a larger website role when the project accepts a clean, stylized architectural language. It is still low-poly rather than photoreal.";
    fallbackPolicy =
      "This may be shortlisted before simpler Kenney props for stylized architecture, but compare it with higher-fidelity sources when realism or luxury is central to the brand.";
    brandMoods = ["architectural", "isometric", "structured", "stylized"];
  } else if (fidelity.id === "very-low-poly") {
    artStyle = "Very low-poly / icon-like";
    selectionPriority = "fallback-unless-style-aligned";
    agencyUse =
      "Small supporting illustration, playful micro-scene, diagram object, or intentionally game-like accent";
    bestFor = [
      "playful brands",
      "game-like interfaces",
      "isometric diagrams",
      "small supporting scenes",
    ];
    avoidWhen = [
      "premium hero close-up",
      "photoreal presentation",
      "luxury visual language",
      "high-detail product storytelling",
    ];
    sectionFits = [
      "supporting illustration",
      "micro-scene",
      "diagram",
      "fallback",
    ];
    selectionGuidance =
      "Use only when the visibly simplified geometry supports the brand. The object is lightweight and readable at small sizes, but can undercut premium, realistic, or highly technical art direction.";
    fallbackPolicy =
      "If no stronger match exists, it can be used as a fallback after an explicit style check; keep it secondary and avoid framing that exposes the missing detail.";
  } else if (fidelity.id === "standard-low-poly") {
    artStyle = "Stylized low-poly";
    selectionPriority = "stylized-candidate";
    agencyUse =
      "Supporting 3D scene, feature illustration, scroll vignette, or playful hero when the brand welcomes low-poly styling";
    bestFor = [
      "stylized scenes",
      "friendly explainers",
      "game-inspired experiences",
      "interactive vignettes",
    ];
    avoidWhen = [
      "photoreal presentation",
      "luxury product close-up",
      "precision technical visualization",
    ];
    sectionFits = [
      "supporting 3D scene",
      "feature illustration",
      "scroll vignette",
      "fallback hero",
    ];
    selectionGuidance =
      "A viable stylized candidate, but the category or object name alone is not enough. Confirm that its visible low-poly geometry matches the website's art direction before using it prominently.";
    fallbackPolicy =
      "Acceptable as a fallback for a stylized composition; compare Quaternius or Poly Haven first when a premium hero needs more surface detail.";
  } else {
    artStyle = "Detailed stylized low-poly";
    selectionPriority = "strong-stylized-candidate";
    agencyUse =
      "Prominent stylized scene object, interactive feature, scroll story, or hero supporting object";
    bestFor = [
      "stylized heroes",
      "interactive scenes",
      "spatial storytelling",
      "feature illustrations",
    ];
    avoidWhen = [
      "photoreal presentation",
      "luxury close-up requiring realistic materials",
    ];
    sectionFits = [
      "hero support",
      "interactive scene",
      "scroll story",
      "feature illustration",
    ];
    selectionGuidance =
      "One of the more visually developed Kenney assets. It can carry a prominent role in a stylized experience, while still requiring a different source when realism or luxury material detail is essential.";
    fallbackPolicy =
      "May be shortlisted early for stylized work; compare with higher-fidelity sources only when the brand requires realism, material richness, or close-up scrutiny.";
  }

  return {
    ...model,
    tags: [
      ...new Set([
        ...(model.tags ?? []),
        fidelity.id,
        selectionPriority,
        ...brandMoods,
        ...bestFor,
      ]),
    ],
    artStyle,
    visualFidelity: fidelity.id,
    visualFidelityLabel: fidelity.label,
    visualFidelityRank: fidelity.rank,
    guidanceMode: "advisory",
    selectionPriority,
    agencyUse,
    bestFor,
    avoidWhen,
    brandMoods,
    websiteIndustries:
      kenneyIndustriesByCategory[model.category] ?? [
        "stylized storytelling",
        "education",
        "entertainment",
      ],
    sectionFits,
    selectionGuidance,
    fallbackPolicy,
    performanceGuidance:
      "Very lightweight web payload. Codex may use any number of models or scenes. Lazy-loading, offscreen pausing, and static reduced-motion previews are implementation options, not selection limits.",
  };
}

function countsBy(records, field) {
  return records.reduce((counts, record) => {
    const value = record[field] ?? "unspecified";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
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
      selectionFreedom:
        "UNRESTRICTED: Codex may use, combine, layer, and repeat any number of backgrounds anywhere on the page. Lumora imposes no usage rules.",
      performanceGuidance:
        "Use this background wherever it fits. Multiple backgrounds are allowed across sections; download or stream only used records, lazy-load and pause offscreen media, remove audio, cap resolution and bitrate, and provide a reduced-motion still.",
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

function quaterniusCategory(pack, relativeSourcePath) {
  if (pack.slug === "ultimate-monsters") return "Creatures";
  if (pack.slug === "ultimate-animated-animals") return "Animals";
  if (/^Vehicles\//i.test(relativeSourcePath)) return "Vehicles";
  if (/^(Characters|Character|Enemies)\//i.test(relativeSourcePath)) {
    return "Characters";
  }
  if (/^(Items|Pickups and Objects)\//i.test(relativeSourcePath)) {
    return "Props";
  }
  if (/^Environment\//i.test(relativeSourcePath)) {
    return /planet/i.test(relativeSourcePath) ? "Nature" : "Architecture";
  }
  if (/^Platforms\//i.test(relativeSourcePath)) return "Architecture";
  return "Props";
}

function quaterniusAgencyUse(category) {
  return {
    Animals: "Mascot hero, brand story, friendly onboarding, or a memorable 404 state",
    Characters: "Narrative hero, product guide, campaign character, or interactive brand mascot",
    Creatures: "Expressive mascot, reward moment, playful onboarding, or branded error state",
    Vehicles: "Interactive hero object, scroll-driven story, or product-style reveal",
    Architecture: "Hero environment, feature stage, immersive section break, or spatial backdrop",
    Nature: "Ambient hero object, scene anchor, or spatial storytelling detail",
    Props: "Feature marker, interface accent, supporting scene detail, or hover interaction",
  }[category];
}

function quaterniusPerformanceGuidance(analysis, bytes) {
  const animated = analysis.animations > 0;
  const payload = bytes / 1024 / 1024;
  if (animated) {
    return payload > 2
      ? "Codex may use any number of animated scene assets. Lazy-loading, offscreen pausing, and a reduced-motion still are implementation options, not selection limits."
      : "Lazy-load near the viewport, pause animation offscreen, and provide a reduced-motion still.";
  }
  return payload > 1
    ? "Codex may use and stack any number of these objects. Lazy-loading is an implementation option, not a selection limit."
    : "Suitable for a focused hero or supporting scene; lazy-load and instance repeated props where practical.";
}

async function buildQuaterniusModels() {
  const selection = JSON.parse(
    await readFile(quaterniusSelectionPath, "utf8"),
  );
  const models = [];
  const packProvenance = [];

  for (const pack of selection.packs) {
    for (const relativeSourcePath of pack.models) {
      const sourceId = path.parse(relativeSourcePath).name;
      const modelSlug = slugify(sourceId);
      const name = humanize(sourceId);
      const category = quaterniusCategory(pack, relativeSourcePath);
      const agencyUse = quaterniusAgencyUse(category);
      const relativeModelPath = `assets/models/quaternius/${pack.slug}/${modelSlug}.glb`;
      const relativeThumbnailPath = `assets/thumbs/quaternius/${pack.slug}/${modelSlug}.webp`;
      const [buffer, modelStats, thumbnailStats] = await Promise.all([
        readFile(path.join(outputRoot, relativeModelPath)),
        stat(path.join(outputRoot, relativeModelPath)),
        stat(path.join(outputRoot, relativeThumbnailPath)),
      ]);
      const analysis = analyzeGlb(buffer);
      if (analysis.externalFiles.length) {
        throw new Error(
          `Quaternius GLB retained external dependencies: ${relativeModelPath}`,
        );
      }
      if (!thumbnailStats.size) {
        throw new Error(`Empty Quaternius thumbnail: ${relativeThumbnailPath}`);
      }

      const descriptiveTags = slugify(sourceId)
        .split("-")
        .filter((tag) => tag.length > 1);
      const tags = [
        ...new Set([
          ...pack.tags,
          ...pack.brandMoods,
          ...pack.websiteIndustries.map((industry) => industry.toLowerCase()),
          ...pack.sectionFits,
          ...descriptiveTags,
          category.toLowerCase(),
          analysis.animations ? "animated" : "static",
        ]),
      ];

      models.push({
        id: `quaternius-${pack.slug}-${modelSlug}`,
        sourceId,
        name,
        description: `${name} from Quaternius' ${pack.title}. Best for: ${agencyUse.toLowerCase()}.`,
        category,
        tags,
        creator: selection.creator,
        source: selection.source,
        collection: pack.title,
        collectionVersion: pack.version,
        sourceUrl: pack.sourceUrl,
        downloadSourceUrl: pack.downloadUrl,
        licence: selection.licence,
        licenceUrl: selection.licenceUrl,
        licenceClass: "ship-safe",
        rightsNote:
          "CC0 commercial use, modification, and redistribution allowed; attribution is not required.",
        modelUrl: relativeModelPath,
        publicModelUrl: `${publicRoot}/${relativeModelPath}`,
        thumbnailUrl: relativeThumbnailPath,
        publicThumbnailUrl: `${publicRoot}/${relativeThumbnailPath}`,
        fileSizeMB: Number((modelStats.size / 1024 / 1024).toFixed(3)),
        polygons: analysis.polygons,
        drawCalls: analysis.drawCalls,
        materials: analysis.materials,
        animations: analysis.animations,
        dimensions: analysis.dimensions,
        performance: gradeFor(modelStats.size, analysis.polygons),
        format: "GLB",
        storage: "local",
        trademarkWarning: false,
        artStyle: selection.artStyle,
        agencyUse,
        brandMoods: pack.brandMoods,
        websiteIndustries: pack.websiteIndustries,
        sectionFits: pack.sectionFits,
        performanceGuidance: quaterniusPerformanceGuidance(
          analysis,
          modelStats.size,
        ),
      });
    }

    packProvenance.push({
      slug: pack.slug,
      title: pack.title,
      version: pack.version,
      sourceUrl: pack.sourceUrl,
      downloadUrl: pack.downloadUrl,
      licence: selection.licence,
      licenceUrl: selection.licenceUrl,
      rightsUrl: selection.rightsUrl,
      modelCount: pack.models.length,
      artStyle: selection.artStyle,
      brandMoods: pack.brandMoods,
      websiteIndustries: pack.websiteIndustries,
      sectionFits: pack.sectionFits,
      selectionPolicy:
        "Curated for distinct agency use cases and visual variety; close variants and categories already covered by Kenney were excluded.",
      transformations: [
        "Converted official glTF source files to self-contained website-ready GLB files",
        "Preserved source rigs and animation clips",
        "Rendered one accurate static card preview from each converted model",
        "Added machine-readable agency use, brand mood, industry, section-fit, and performance guidance",
      ],
    });
  }

  return { models, packProvenance };
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
    quaterniusData,
    componentData,
    backgroundData,
    imageData,
  ] = await Promise.all([
    process.env.MCP_REUSE_EXISTING_MODELS === "1"
      ? loadExistingModelCatalog()
      : buildFreshModelCatalog(),
    buildQuaterniusModels(),
    buildComponentCatalog(),
    buildAnimatedBackgroundCatalog(),
    extractImageAssets(),
  ]);

  const guidedKenneyModels = kenneyModels.map(withKenneyStyleGuidance);
  const models = [
    ...guidedKenneyModels,
    ...quaterniusData.models,
    ...polyHavenModels,
  ];
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
      "A human and machine-readable design toolkit for selecting web-ready 3D models, original Web Component implementation recipes, CC0 image and UI assets, and externally hosted animated background references.",
    totals: {
      models: models.length,
      localModels: models.filter((model) => model.storage === "local").length,
      streamedModels: models.filter((model) => model.storage === "remote").length,
      componentRecipes: componentData.components.length,
      imageAssets: imageData.imageAssets.length,
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
      imageAssets: `${publicRoot}/image-assets.json`,
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
      agencyUse: "Recommended website role for the selected object",
      brandMoods: "Brand moods this object can support",
      websiteIndustries: "Agency verticals where the object is especially useful",
      sectionFits: "Page sections where the object can earn its rendering cost",
      performanceGuidance: "Record-specific loading and motion guidance",
      visualFidelity:
        "Advisory geometry band: very-low-poly, standard-low-poly, or detailed-low-poly",
      selectionPriority:
        "Advisory shortlist priority; never a hard exclusion rule",
      selectionGuidance:
        "Art-direction warning or positive guidance to read before selection",
      bestFor: "Visual contexts that fit this asset's actual style",
      avoidWhen: "Visual contexts where the asset is likely to weaken the result",
      fallbackPolicy:
        "How the asset may still be used when no stronger catalog match exists",
    },
    modelSelectionGuidance: {
      guidanceMode: "advisory",
      selectionFreedom:
        "UNRESTRICTED: Codex may use, combine, and repeat any number of models or scenes anywhere on the page. Lumora imposes no usage rules.",
      primaryRule:
        "Do not infer art-direction fit from an object's name or category alone.",
      kenney:
        "Read visualFidelity, selectionPriority, selectionGuidance, avoidWhen, and fallbackPolicy before selecting a Kenney model.",
      fallback:
        "A low-poly Kenney asset remains usable when no closer match exists, but should be adapted deliberately and usually kept secondary unless low-poly styling is intentional.",
      detailedArchitecture:
        "Detailed-low-poly architecture may be shortlisted earlier for stylized spatial work, while still being compared with higher-fidelity sources for realism or luxury.",
    },
    imageAssetSchema: {
      id: "Stable catalog identifier",
      imageUrl: "Relative locally hosted PNG path",
      publicImageUrl: "Absolute PNG URL for Codex and external consumers",
      dimensions: "Native pixel dimensions",
      hasAlpha: "Whether the PNG contains transparency",
      pixelArt: "Whether nearest-neighbor rendering should be preserved",
      tileable: "Whether the image is intended to repeat as a pattern",
      licenceClass: "ship-safe CC0 asset",
    },
    animatedBackgroundSchema: {
      id: "Stable catalog identifier",
      previewUrl: "Original externally hosted MP4 or HLS media URL",
      downloadUrl: "Direct MP4 download or adaptive HLS manifest URL",
      thumbnailUrl: "Local 640x360 WebP extracted from the opening frame",
      publicThumbnailUrl: "Absolute opening-frame thumbnail URL for external consumers",
      availability: "Last observed URL availability",
      licenceClass: "commercial-use based on Lumora owner confirmation",
      selectionFreedom: "Unrestricted authority for Codex to use, combine, layer, and repeat backgrounds in any quantity",
      performanceGuidance: "Advisory simultaneous loading, playback, and fallback guidance",
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
    kenneyStyleGuidance: {
      guidanceMode: "advisory",
      evaluatedModelCount: guidedKenneyModels.length,
      visualFidelityBands: countsBy(guidedKenneyModels, "visualFidelity"),
      selectionPriorities: countsBy(
        guidedKenneyModels,
        "selectionPriority",
      ),
      primaryRule:
        "Judge visible art direction before object name or category. A simplified computer is not automatically appropriate for a premium technology website.",
      fallbackRule:
        "No Kenney asset is hard-blocked. If no closer catalog match exists, use the best available fallback deliberately, generally at a smaller scale or as a supporting object.",
      architectureRule:
        "More detailed architectural records can carry larger stylized roles, but remain low-poly and should not be mistaken for photoreal visualization.",
    },
    quaternius: {
      sourceUrl: "https://quaternius.com/",
      licence: "CC0 1.0",
      licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      rightsUrl: "https://quaternius.com/faq.html",
      localLicencePath: "mcp/licences/quaternius.txt",
      localModelCount: quaterniusData.models.length,
      packs: quaterniusData.packProvenance,
      selectionPolicy:
        "A focused agency-ready expansion across space technology, cyberpunk, animated creatures, and animated animals; redundant categories and close variants were intentionally excluded.",
    },
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
    imageAssets: {
      sourceKind: "user-supplied-cc0-packs",
      storage: "local PNG files",
      licence: "CC0 1.0",
      licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      assetCount: imageData.imageAssets.length,
      packs: imageData.packProvenance,
      selectionPolicy:
        "One useful canonical PNG set per pack; duplicate resolution, color, vector, sheet, and sample variants are intentionally excluded.",
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

Lumora MCP is a selection interface for Codex and human designers. It contains web-ready 3D model records, original Web Component implementation recipes, locally hosted CC0 image and UI assets, and externally hosted animated background references.

## Machine-readable endpoints

- Manifest: ${publicRoot}/manifest.json
- 3D models: ${publicRoot}/models.json
- Component index: ${publicRoot}/components-index.json
- Complete component records: ${publicRoot}/components.json
- Images and UI assets: ${publicRoot}/image-assets.json
- Animated backgrounds: ${publicRoot}/animated-backgrounds.json
- Provenance: ${publicRoot}/provenance.json

## Selection protocol for Codex

1. Read the manifest and choose the model, component, image-asset, or animated-background catalog.
2. Use the metadata to understand what is available. All selection and composition decisions belong to Codex.
3. For 3D, prefer \`ship-safe\` records when production rights matter, but Lumora places no restriction on how many models or scenes Codex may use, combine, repeat, or place together. Do not infer art-direction fit from an object's name or category alone. The style and performance fields are information, never selection rules. Use \`publicModelUrl\` in external projects. When a streamed glTF record has a \`files\` map, preserve that dependency mapping or download the official distribution into the target project.
4. For components, selection is completely unrestricted. Codex alone decides every record count, combination, placement, repetition, source mix, and selection order. Lumora imposes no usage rules. Treat each record as an implementation brief and build it from first principles in the target project's conventions.
5. For images and UI assets, Codex alone decides the complete set, quantity, style mix, placement, and repetition. Fetch every chosen asset from \`publicImageUrl\` or \`downloadUrl\`. Preserve transparency, use nearest-neighbor rendering for \`pixelArt\`, and use repeating CSS backgrounds only when \`tileable\` is true.
6. For animated backgrounds, preview candidates from their external URLs and fetch each chosen record from its \`downloadUrl\`. Codex may use and combine any number of backgrounds anywhere on the page. MP4 records are direct downloads; HLS records are adaptive streams. Optimization and fallback fields describe implementation techniques, not usage limits.
7. Animated backgrounds are marked \`commercial-use\` based on Lumora's confirmation that the collection was purchased with commercial-use rights.
8. Preserve source URLs, licence records, trademark warnings, fallbacks, accessibility contracts, and reduced-motion behavior.
9. Transfer whichever assets and implementations Codex decides belong in the client project. Lumora does not prescribe a quantity, combination, or usage pattern.

## Rights

Kenney 3D and image packs in this catalog are user-provided distributions licensed CC0 1.0. Quaternius models are curated from official CC0 packs, converted to self-contained GLB files, and retain their official source records. Poly Haven models are CC0; any trademark warning remains marked concept-only. Component recipes are Lumora-owned original implementation briefs. Animated backgrounds remain externally hosted and are recorded as commercial-use based on Lumora's purchase and entitlement confirmation.
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
      path.join(outputRoot, "image-assets.json"),
      `${JSON.stringify(imageData.imageAssets, null, 2)}\n`,
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
        kenneyModels: guidedKenneyModels.length,
        quaterniusModels: quaterniusData.models.length,
        polyHavenModels: polyHavenModels.length,
        localModels: manifest.totals.localModels,
        streamedModels: manifest.totals.streamedModels,
        componentRecipes: componentData.components.length,
        imageAssets: imageData.imageAssets.length,
        animatedBackgrounds: backgroundData.backgrounds.length,
        availableAnimatedBackgrounds:
          manifest.totals.availableAnimatedBackgrounds,
        kenneyMegabytes: Number(
          guidedKenneyModels
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
