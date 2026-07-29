import { execFileSync } from "node:child_process";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(process.cwd());
const mcpRoot = path.join(repoRoot, "mcp");
const publicRoot = "https://lumoraofficial.de/mcp";
const refresh = process.argv.includes("--refresh");
const tempRoot = path.join(
  repoRoot,
  ".mcp-import-temp",
  "design-assets-phase",
);
const config = JSON.parse(
  await readFile(
    path.join(repoRoot, "scripts", "data", "design-assets-selection.json"),
    "utf8",
  ),
);
const designCatalogPath = path.join(mcpRoot, "design-assets.json");
const licenceRoot = path.join(mcpRoot, "licences", "design-assets");

const sourceRanks = {
  "Open Doodles": 10,
  "Open Peeps": 20,
  ambientCG: 40,
  "Hero Patterns": 50,
  Lucide: 60,
  Phosphor: 70,
};

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function titleFromSlug(value) {
  return String(value)
    .replace(/\.(svg|webp)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function numberFromAttribute(source, name) {
  const match = source.match(
    new RegExp(`\\b${name}=["']([0-9.]+)(?:px)?["']`, "i"),
  );
  return match ? Number(match[1]) : null;
}

function svgMetrics(source, fallback = 24) {
  let width = numberFromAttribute(source, "width");
  let height = numberFromAttribute(source, "height");
  const viewBox = source.match(
    /\bviewBox=["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i,
  );
  if ((!width || !height) && viewBox) {
    width ||= Number(viewBox[1]);
    height ||= Number(viewBox[2]);
  }
  width ||= fallback;
  height ||= fallback;
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

async function fileMetadata(filePath, fallback = 24) {
  const source = await readFile(filePath, "utf8");
  const fileStat = await stat(filePath);
  return {
    ...svgMetrics(source, fallback),
    fileSizeKB: Number((fileStat.size / 1024).toFixed(2)),
  };
}

async function download(url, destination) {
  if (await exists(destination)) return;
  await mkdir(path.dirname(destination), { recursive: true });
  const response = await fetch(url, {
    headers: { "user-agent": "Lumora-MCP-Asset-Importer/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function mapWithConcurrency(values, limit, worker) {
  const results = new Array(values.length);
  let cursor = 0;
  async function run() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await worker(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => run()),
  );
  return results;
}

function localAssetUrl(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  return {
    relative: normalized,
    public: `${publicRoot}/${normalized}`,
  };
}

function baseRecord({
  id,
  name,
  source,
  creator,
  collection,
  packSlug,
  assetType,
  category,
  tags,
  format,
  storage,
  usageMode,
  imageUrl,
  publicImageUrl,
  downloadUrl,
  sourceUrl,
  licence,
  licenceClass,
  licenceUrl,
  attribution,
  rightsNote,
  fileSizeKB,
  width,
  height,
  recommendedUse,
  styleFamily,
  artStyle,
  selectionGuidance,
  bestFor,
  avoidWhen,
  conceptId,
  previewMode = "contain",
  hasAlpha = true,
  pixelArt = false,
  tileable = false,
  extra = {},
}) {
  return {
    id,
    name,
    description: `${name} from the ${collection} collection.`,
    source,
    creator,
    collection,
    packSlug,
    assetType,
    category,
    tags: [...new Set(tags.filter(Boolean))],
    format,
    storage,
    usageMode,
    imageUrl,
    publicImageUrl,
    downloadUrl,
    sourceUrl,
    licence,
    licenceClass,
    licenceUrl,
    attribution,
    rightsNote,
    fileSizeKB,
    width,
    height,
    dimensions: `${width} × ${height}${format === "SVG" ? " viewBox" : " px"}`,
    hasAlpha,
    pixelArt,
    tileable,
    previewMode,
    recommendedUse,
    styleFamily,
    artStyle,
    conceptId,
    selectionGuidance,
    bestFor,
    avoidWhen,
    phase: config.phase,
    featuredRank: sourceRanks[source] ?? 100,
    ...extra,
  };
}

function lucideCategory(name, tags) {
  const haystack = `${name} ${tags.join(" ")}`.toLowerCase();
  const rules = [
    ["Arrows & navigation", /arrow|chevron|navigation|compass|route|move|corner/],
    ["Communication", /mail|message|chat|phone|send|inbox|contact|rss/],
    ["Commerce & finance", /cart|shop|store|wallet|bank|coin|currency|dollar|euro|receipt|credit/],
    ["Media", /audio|video|music|camera|play|pause|volume|mic|headphone|image|film/],
    ["Devices & technology", /computer|monitor|laptop|mouse|keyboard|smartphone|tablet|wifi|bluetooth|cpu|server|database/],
    ["Files & office", /file|folder|archive|clipboard|calendar|book|notebook|printer/],
    ["Development", /code|terminal|git|binary|braces|bug|webhook|package|workflow/],
    ["Maps & travel", /map|pin|plane|car|train|ship|bus|bike|travel|globe/],
    ["People & accessibility", /user|person|people|accessibility|hand|baby|face/],
    ["Health & wellness", /heart|medical|hospital|pill|stethoscope|activity|brain|bone/],
    ["Nature & weather", /sun|moon|cloud|rain|snow|tree|leaf|flower|animal|bird/],
    ["Security & status", /lock|shield|key|warning|alert|check|circle-x|badge|info/],
    ["Shapes & design", /circle|square|triangle|diamond|palette|pen|pencil|crop|layers|align/],
  ];
  return rules.find(([, pattern]) => pattern.test(haystack))?.[0] ?? "General UI";
}

async function ensureNpmPackage(packageName, version, legacyFolder) {
  const legacyPath = path.join(tempRoot, legacyFolder, "package");
  if (await exists(path.join(legacyPath, "package.json"))) return legacyPath;

  const safeName = packageName.replace(/^@/, "").replace(/[\/]/g, "-");
  const packageRoot = path.join(tempRoot, "npm", `${safeName}-${version}`);
  const extracted = path.join(packageRoot, "package");
  if (await exists(path.join(extracted, "package.json"))) return extracted;

  const downloadRoot = path.join(tempRoot, "downloads");
  await mkdir(downloadRoot, { recursive: true });
  const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
  const output = execFileSync(
    npmExecutable,
    [
      "pack",
      `${packageName}@${version}`,
      "--pack-destination",
      downloadRoot,
      "--silent",
    ],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  ).trim();
  const archiveName = output.split(/\r?\n/).at(-1);
  await mkdir(packageRoot, { recursive: true });
  execFileSync("tar", ["-xzf", path.join(downloadRoot, archiveName), "-C", packageRoot]);
  return extracted;
}

async function buildLucideRecords() {
  const version = config.packages["lucide-static"];
  const packageRoot = await ensureNpmPackage(
    "lucide-static",
    version,
    "lucide",
  );
  const sourceRoot = path.join(packageRoot, "icons");
  const outputRoot = path.join(mcpRoot, "assets", "images", "lucide");
  const tags = JSON.parse(
    await readFile(path.join(packageRoot, "tags.json"), "utf8"),
  );
  const files = (await readdir(sourceRoot))
    .filter((file) => file.endsWith(".svg"))
    .sort();
  await mkdir(outputRoot, { recursive: true });

  return mapWithConcurrency(files, 24, async (file) => {
    const slug = path.basename(file, ".svg");
    const sourceFile = path.join(sourceRoot, file);
    const outputFile = path.join(outputRoot, file);
    await copyFile(sourceFile, outputFile);
    const metadata = await fileMetadata(outputFile);
    const urls = localAssetUrl(path.relative(mcpRoot, outputFile));
    const iconTags = [...(tags[slug] ?? []), ...slug.split("-")];
    const name = titleFromSlug(slug);
    return baseRecord({
      id: `lucide-${slug}`,
      name,
      source: "Lucide",
      creator: "Lucide Icons contributors",
      collection: `Lucide ${version}`,
      packSlug: "lucide",
      assetType: "Icon",
      category: lucideCategory(slug, iconTags),
      tags: ["icon", "outline", "stroke", "interface", ...iconTags],
      format: "SVG",
      storage: "local",
      usageMode: "bundled",
      imageUrl: urls.relative,
      publicImageUrl: urls.public,
      downloadUrl: urls.public,
      sourceUrl: `https://lucide.dev/icons/${slug}`,
      licence: "ISC",
      licenceClass: "ship-safe",
      licenceUrl: "https://github.com/lucide-icons/lucide/blob/main/LICENSE",
      attribution: "Retain the bundled Lucide and Feather licence notice.",
      rightsNote: "Commercial use, modification, and redistribution are allowed with the licence notice preserved.",
      ...metadata,
      recommendedUse: "Use for neutral product UI, navigation, controls, feature lists, dashboards, and diagrams.",
      styleFamily: "outline-vector",
      artStyle: "Clean 24px outline icon",
      conceptId: `icon.${slug}`,
      selectionGuidance: "Use Lucide as the quiet default when clarity and consistency matter more than decorative personality.",
      bestFor: ["product UI", "SaaS", "dashboards", "navigation", "technical diagrams"],
      avoidWhen: ["a filled, playful, hand-drawn, or highly branded icon language is required"],
      extra: { libraryVersion: version, variantCount: 1 },
    });
  });
}

async function buildPhosphorRecords() {
  const version = config.packages["@phosphor-icons/core"];
  const packageRoot = await ensureNpmPackage(
    "@phosphor-icons/core",
    version,
    "phosphor",
  );
  const outputRoot = path.join(mcpRoot, "assets", "images", "phosphor");
  const weights = ["regular", "thin", "light", "bold", "fill", "duotone"];
  await mkdir(outputRoot, { recursive: true });
  const module = await import(
    `${pathToFileURL(path.join(packageRoot, "dist", "index.mjs")).href}?v=${Date.now()}`
  );

  return mapWithConcurrency(module.icons, 18, async (icon) => {
    const variants = {};
    let regularMetadata = null;
    for (const weight of weights) {
      const fileName =
        weight === "regular"
          ? `${icon.name}.svg`
          : `${icon.name}-${weight}.svg`;
      const sourceFile = path.join(packageRoot, "assets", weight, fileName);
      const outputFile = path.join(outputRoot, weight, fileName);
      await mkdir(path.dirname(outputFile), { recursive: true });
      await copyFile(sourceFile, outputFile);
      const urls = localAssetUrl(path.relative(mcpRoot, outputFile));
      variants[weight] = {
        imageUrl: urls.relative,
        publicImageUrl: urls.public,
      };
      if (weight === "regular") regularMetadata = await fileMetadata(outputFile, 256);
    }
    const name = icon.pascal_name.replace(/([a-z])([A-Z])/g, "$1 $2");
    return baseRecord({
      id: `phosphor-${icon.name}`,
      name,
      source: "Phosphor",
      creator: "Phosphor Icons",
      collection: `Phosphor ${version}`,
      packSlug: "phosphor",
      assetType: "Icon family",
      category: icon.categories?.[0] ?? icon.figma_category ?? "General UI",
      tags: [
        "icon",
        "outline",
        "filled",
        "duotone",
        ...icon.categories,
        ...icon.tags.filter((tag) => tag !== "*new*"),
        ...icon.name.split("-"),
      ],
      format: "SVG ×6",
      storage: "local",
      usageMode: "bundled-variants",
      imageUrl: variants.regular.imageUrl,
      publicImageUrl: variants.regular.publicImageUrl,
      downloadUrl: variants.regular.publicImageUrl,
      sourceUrl: `https://phosphoricons.com/?q=${encodeURIComponent(icon.name)}`,
      licence: "MIT",
      licenceClass: "ship-safe",
      licenceUrl: "https://github.com/phosphor-icons/core/blob/main/LICENSE",
      attribution: "Retain the bundled MIT licence notice.",
      rightsNote: "Commercial use, modification, and redistribution are allowed with the MIT notice preserved.",
      ...regularMetadata,
      recommendedUse: "Choose one weight per interface context; use duotone or fill for expressive marketing moments and regular or light for product UI.",
      styleFamily: "multi-weight-vector",
      artStyle: "Flexible icon family with six coordinated weights",
      conceptId: `icon.${icon.name}`,
      selectionGuidance: "Treat the six weights as variants of one concept. Do not mix weights randomly within the same interface hierarchy.",
      bestFor: ["expressive UI", "feature sections", "commerce", "editorial diagrams", "product marketing"],
      avoidWhen: ["the project already has a stricter icon system that should remain visually uniform"],
      extra: {
        libraryVersion: version,
        defaultVariant: "regular",
        variantCount: weights.length,
        variants,
      },
    });
  });
}

function extractSvgUrls(html) {
  return [
    ...html.matchAll(/https?:\/\/[^"'\s<>]+?\.svg(?:\?[^"'\s<>]*)?/gi),
  ].map((match) => match[0].replaceAll("&amp;", "&"));
}

async function buildOpenDoodlesRecords() {
  const pageUrl = "https://www.opendoodles.com/";
  const response = await fetch(pageUrl);
  if (!response.ok) throw new Error("Open Doodles page could not be loaded.");
  const urls = [
    ...new Set(
      extractSvgUrls(await response.text()).filter((url) => {
        const parsed = new URL(url);
        return parsed.hostname === "opendoodles.s3-us-west-1.amazonaws.com";
      }),
    ),
  ].sort();
  const outputRoot = path.join(mcpRoot, "assets", "images", "open-doodles");

  return mapWithConcurrency(urls, 8, async (url) => {
    const slug = slugify(path.basename(new URL(url).pathname, ".svg"));
    const outputFile = path.join(outputRoot, `${slug}.svg`);
    await download(url, outputFile);
    const metadata = await fileMetadata(outputFile, 640);
    const local = localAssetUrl(path.relative(mcpRoot, outputFile));
    const name = titleFromSlug(slug);
    return baseRecord({
      id: `open-doodles-${slug}`,
      name,
      source: "Open Doodles",
      creator: "Pablo Stanley",
      collection: "Open Doodles",
      packSlug: "open-doodles",
      assetType: "Illustration",
      category: "People & lifestyle",
      tags: ["illustration", "people", "hand-drawn", "doodle", ...slug.split("-")],
      format: "SVG",
      storage: "local",
      usageMode: "bundled",
      imageUrl: local.relative,
      publicImageUrl: local.public,
      downloadUrl: local.public,
      sourceUrl: pageUrl,
      licence: "CC0 1.0",
      licenceClass: "ship-safe",
      licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      attribution: "Attribution is optional.",
      rightsNote: "Open Doodles permits copying, editing, remixing, sharing, and commercial use under CC0.",
      ...metadata,
      recommendedUse: "Use as a loose editorial illustration, empty state, storytelling accent, or playful human moment.",
      styleFamily: "hand-drawn-doodle",
      artStyle: "Loose monochrome hand-drawn illustration",
      conceptId: `illustration.${slug}`,
      selectionGuidance: "Use when a casual, human, imperfect drawing language supports the brand; recolor deliberately rather than leaving the demo palette by habit.",
      bestFor: ["creative studios", "community", "education", "wellness", "friendly SaaS"],
      avoidWhen: ["luxury, clinical, photoreal, or highly formal art direction"],
    });
  });
}

async function buildOpenPeepsRecords() {
  const pageUrl = "https://www.openpeeps.com/";
  const response = await fetch(pageUrl);
  if (!response.ok) throw new Error("Open Peeps page could not be loaded.");
  const urls = [
    ...new Set(
      extractSvgUrls(await response.text()).filter((url) =>
        /_peep(?:-sitting|-standing)?-\d+\.svg$/i.test(new URL(url).pathname),
      ),
    ),
  ].sort();
  const outputRoot = path.join(mcpRoot, "assets", "images", "open-peeps");

  return mapWithConcurrency(urls, 8, async (url) => {
    const fileName = path.basename(new URL(url).pathname);
    const slug = slugify(fileName.replace(/^[0-9a-f]+_/i, "").replace(/\.svg$/i, ""));
    const outputFile = path.join(outputRoot, `${slug}.svg`);
    await download(url, outputFile);
    const metadata = await fileMetadata(outputFile, 640);
    const local = localAssetUrl(path.relative(mcpRoot, outputFile));
    const pose = slug.includes("sitting")
      ? "Sitting"
      : slug.includes("standing")
        ? "Standing"
        : "Bust";
    const name = `${pose} Peep ${slug.match(/\d+$/)?.[0] ?? ""}`.trim();
    return baseRecord({
      id: `open-peeps-${slug}`,
      name,
      source: "Open Peeps",
      creator: "Pablo Stanley",
      collection: "Open Peeps",
      packSlug: "open-peeps",
      assetType: "Character illustration",
      category: `${pose} characters`,
      tags: ["illustration", "people", "character", "hand-drawn", "peep", pose.toLowerCase()],
      format: "SVG",
      storage: "local",
      usageMode: "bundled",
      imageUrl: local.relative,
      publicImageUrl: local.public,
      downloadUrl: local.public,
      sourceUrl: pageUrl,
      licence: "CC0 1.0",
      licenceClass: "ship-safe",
      licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      attribution: "Attribution is optional.",
      rightsNote: "Open Peeps is in the public domain under CC0 and permits commercial modification and redistribution.",
      ...metadata,
      recommendedUse: "Use for personas, onboarding, testimonials, empty states, editorial scenes, or human-centered product storytelling.",
      styleFamily: "hand-drawn-character",
      artStyle: "Modular monochrome hand-drawn character",
      conceptId: `character.${slug}`,
      selectionGuidance: "Use Open Peeps when a modular, inclusive human illustration system fits the project; customize color and composition to avoid a stock-library feel.",
      bestFor: ["personas", "onboarding", "community", "services", "human-centered SaaS"],
      avoidWhen: ["photoreal credibility, luxury restraint, or a polished 3D character system is required"],
    });
  });
}

async function buildAmbientCgRecords() {
  const ids = config.ambientCgMaterialIds;
  const endpoint =
    `https://ambientcg.com/api/v2/full_json?type=Material&id=${ids.join(",")}` +
    "&include=tagData,displayData,previewData,mapData";
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("ambientCG API request failed.");
  const payload = await response.json();
  const byId = new Map(
    payload.foundAssets.map((asset) => [asset.assetId, asset]),
  );
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new Error(`ambientCG assets missing from API: ${missing.join(", ")}`);
  }
  const outputRoot = path.join(mcpRoot, "assets", "images", "ambientcg");

  return mapWithConcurrency(ids, 6, async (id) => {
    const asset = byId.get(id);
    const previewUrl =
      asset.previewImage?.["512-WEBP"] ??
      asset.previewImage?.["512-PNG"] ??
      asset.previewImage?.["256-WEBP"];
    if (!previewUrl) throw new Error(`No ambientCG preview for ${id}`);
    const extension = new URL(previewUrl).pathname.endsWith(".png") ? "png" : "webp";
    const outputFile = path.join(outputRoot, `${id}.${extension}`);
    await download(previewUrl, outputFile);
    const fileStat = await stat(outputFile);
    const local = localAssetUrl(path.relative(mcpRoot, outputFile));
    const sourceUrl = asset.shortLink ?? `https://ambientcg.com/a/${id}`;
    return baseRecord({
      id: `ambientcg-${id.toLowerCase()}`,
      name: asset.displayName,
      source: "ambientCG",
      creator: "ambientCG",
      collection: "ambientCG agency textures",
      packSlug: "ambientcg-textures",
      assetType: "Texture / material",
      category: asset.displayCategory ?? "PBR material",
      tags: ["texture", "material", "pbr", "surface", ...(asset.tags ?? [])],
      format: "PBR maps",
      storage: "hybrid",
      usageMode: "linked-source-local-preview",
      imageUrl: local.relative,
      publicImageUrl: local.public,
      downloadUrl: sourceUrl,
      sourceUrl,
      licence: "CC0 1.0",
      licenceClass: "ship-safe-linked",
      licenceUrl: "https://docs.ambientcg.com/license/",
      attribution: "Attribution is optional.",
      rightsNote: "ambientCG confirms that both downloadable asset files and preview renders are CC0.",
      fileSizeKB: Number((fileStat.size / 1024).toFixed(2)),
      width: 512,
      height: 512,
      recommendedUse: "Open the official asset page and download the appropriate resolution and PBR maps for the actual implementation; the local WebP is a selection preview only.",
      styleFamily: "photoreal-pbr",
      artStyle: "Photoreal tileable PBR material",
      conceptId: `material.${slugify(asset.displayCategory ?? id)}.${id.toLowerCase()}`,
      previewMode: "cover",
      tileable: true,
      selectionGuidance: "Never use the local thumbnail as the production texture. Fetch the color, normal, roughness, displacement, and ambient-occlusion maps needed by the renderer.",
      bestFor: ["3D scenes", "tactile website surfaces", "product staging", "architectural backgrounds", "material studies"],
      avoidWhen: ["a flat vector, low-bandwidth, or deliberately synthetic visual language is required"],
      extra: {
        ambientCgId: id,
        maps: asset.maps ?? [],
        creationMethod: asset.creationMethod,
        previewOnly: true,
      },
    });
  });
}

async function ensureHeroPatternsRoot() {
  const legacy = path.join(tempRoot, "hero-patterns", "hero-patterns-master");
  if (await exists(path.join(legacy, "svg"))) return legacy;

  const archive = path.join(tempRoot, "downloads", "hero-patterns-master.zip");
  await download(
    "https://github.com/sschoger/hero-patterns/archive/refs/heads/master.zip",
    archive,
  );
  const extracted = path.join(tempRoot, "hero-patterns");
  await mkdir(extracted, { recursive: true });
  execFileSync("tar", ["-xf", archive, "-C", extracted]);
  return path.join(extracted, "hero-patterns-master");
}

async function findHeroPatternSource(svgRoot, slug) {
  const direct = path.join(svgRoot, `${slug}.svg`);
  if (await exists(direct)) return direct;
  const archive = path.join(svgRoot, `${slug}.zip`);
  const extracted = path.join(tempRoot, "hero-pattern-extracted", slug);
  await mkdir(extracted, { recursive: true });
  if (!(await exists(path.join(extracted, `${slug}.svg`)))) {
    execFileSync("tar", ["-xf", archive, "-C", extracted]);
  }
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === "__MACOSX" || entry.name.startsWith("._")) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        const found = await walk(fullPath);
        if (found) return found;
      } else if (entry.name.endsWith(".svg")) {
        return fullPath;
      }
    }
    return null;
  }
  return walk(extracted);
}

async function buildHeroPatternRecords() {
  const root = await ensureHeroPatternsRoot();
  const svgRoot = path.join(root, "svg");
  const slugs = [
    ...new Set(
      (await readdir(svgRoot))
        .filter((file) => /\.(svg|zip)$/i.test(file))
        .map((file) => path.basename(file, path.extname(file))),
    ),
  ].sort();
  const outputRoot = path.join(mcpRoot, "assets", "images", "hero-patterns");
  await mkdir(outputRoot, { recursive: true });

  return mapWithConcurrency(slugs, 8, async (slug) => {
    const sourceFile = await findHeroPatternSource(svgRoot, slug);
    if (!sourceFile) throw new Error(`Hero Pattern SVG missing: ${slug}`);
    const outputFile = path.join(outputRoot, `${slug}.svg`);
    await copyFile(sourceFile, outputFile);
    const metadata = await fileMetadata(outputFile, 100);
    const local = localAssetUrl(path.relative(mcpRoot, outputFile));
    const name = titleFromSlug(slug);
    return baseRecord({
      id: `hero-patterns-${slug}`,
      name,
      source: "Hero Patterns",
      creator: "Steve Schoger",
      collection: "Hero Patterns",
      packSlug: "hero-patterns",
      assetType: "Pattern",
      category: "Repeatable SVG background",
      tags: ["pattern", "background", "repeatable", "svg", ...slug.split("-")],
      format: "SVG pattern",
      storage: "local",
      usageMode: "bundled-attribution",
      imageUrl: local.relative,
      publicImageUrl: local.public,
      downloadUrl: local.public,
      sourceUrl: "https://heropatterns.com/",
      licence: "CC BY 4.0",
      licenceClass: "attribution",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
      attribution: "Hero Patterns by Steve Schoger, licensed under CC BY 4.0.",
      rightsNote: "Commercial use and modification are allowed when appropriate creator and licence attribution is retained.",
      ...metadata,
      recommendedUse: "Use as a lightweight CSS background texture, masked section layer, print-inspired surface, or quiet visual separator.",
      styleFamily: "repeatable-svg-pattern",
      artStyle: "Monochrome repeatable SVG pattern",
      conceptId: `pattern.${slug}`,
      previewMode: "tile",
      tileable: true,
      selectionGuidance: "Recolor and scale the pattern to the brand, keep contrast restrained behind text, and preserve CC BY attribution.",
      bestFor: ["section backgrounds", "editorial texture", "technical surfaces", "empty states", "campaign pages"],
      avoidWhen: ["the pattern competes with reading or introduces an unrelated decorative motif"],
    });
  });
}

async function writeLicenceFiles(packageRoots) {
  await mkdir(licenceRoot, { recursive: true });
  await copyFile(
    path.join(packageRoots.lucide, "LICENSE"),
    path.join(licenceRoot, "lucide.txt"),
  );
  await copyFile(
    path.join(packageRoots.phosphor, "LICENSE"),
    path.join(licenceRoot, "phosphor.txt"),
  );
  await writeFile(
    path.join(licenceRoot, "hero-patterns.txt"),
    [
      "Hero Patterns by Steve Schoger",
      "Source: https://heropatterns.com/",
      "Licence: Creative Commons Attribution 4.0 International",
      "Licence URL: https://creativecommons.org/licenses/by/4.0/",
      "Required attribution: Hero Patterns by Steve Schoger, licensed under CC BY 4.0.",
      "",
    ].join("\n"),
  );
  await writeFile(
    path.join(licenceRoot, "cc0-sources.txt"),
    [
      "Open Doodles by Pablo Stanley — CC0 1.0",
      "https://www.opendoodles.com/about",
      "",
      "Open Peeps by Pablo Stanley — CC0 1.0",
      "https://www.openpeeps.com/",
      "",
      "ambientCG assets and preview renders — CC0 1.0",
      "https://docs.ambientcg.com/license/",
      "",
    ].join("\n"),
  );
}

async function buildDesignCatalog() {
  const lucideRoot = await ensureNpmPackage(
    "lucide-static",
    config.packages["lucide-static"],
    "lucide",
  );
  const phosphorRoot = await ensureNpmPackage(
    "@phosphor-icons/core",
    config.packages["@phosphor-icons/core"],
    "phosphor",
  );
  await writeLicenceFiles({
    lucide: lucideRoot,
    phosphor: phosphorRoot,
  });

  const collections = [];
  for (const [label, builder] of [
    ["Lucide", buildLucideRecords],
    ["Phosphor", buildPhosphorRecords],
    ["Open Doodles", buildOpenDoodlesRecords],
    ["Open Peeps", buildOpenPeepsRecords],
    ["ambientCG", buildAmbientCgRecords],
    ["Hero Patterns", buildHeroPatternRecords],
  ]) {
    process.stdout.write(`Building ${label}… `);
    const records = await builder();
    collections.push(...records);
    console.log(`${records.length} records`);
  }

  const ids = new Set(collections.map((record) => record.id));
  if (ids.size !== collections.length) {
    throw new Error("Duplicate IDs detected in the design asset catalog.");
  }
  await writeFile(
    designCatalogPath,
    `${JSON.stringify(collections, null, 2)}\n`,
  );
  return collections;
}

function collectionSummary(records, source, extra = {}) {
  const selected = records.filter((record) => record.source === source);
  return {
    pack: source,
    sourceUrl: selected[0]?.sourceUrl,
    creator: selected[0]?.creator,
    licence: selected[0]?.licence,
    licenceUrl: selected[0]?.licenceUrl,
    assetCount: selected.length,
    phase: config.phase,
    ...extra,
  };
}

async function updateInstructions() {
  const filePath = path.join(mcpRoot, "instructions.md");
  const start = "<!-- DESIGN-ASSET-GUIDANCE:START -->";
  const end = "<!-- DESIGN-ASSET-GUIDANCE:END -->";
  const block = `${start}
## Images / UI selection guidance

The image catalog intentionally contains overlapping concepts in different visual systems. Search by concept, then compare \`styleFamily\`, \`artStyle\`, \`bestFor\`, \`avoidWhen\`, and \`selectionGuidance\` before choosing.

- Lucide is the quiet outline default for product UI.
- Phosphor records group six coordinated variants; choose one weight consistently.
- Open Doodles and Open Peeps fit friendly, human, hand-drawn art direction.
- ambientCG records contain a local selection preview only. Fetch the required production PBR maps from \`downloadUrl\`.
- Hero Patterns require the attribution stored on each record.
- Kenney remains useful for intentional low-poly, pixel-art, and playful scenes; do not choose it from the subject name alone.

Do not mix icon families or illustration systems casually. Prefer one primary family and one deliberately contrasting supporting family.
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

function annotateBaseImage(record) {
  if (record.source !== "Kenney") {
    return {
      usageMode: record.storage === "local" ? "bundled" : "linked",
      featuredRank: 90,
      ...record,
    };
  }
  const style =
    record.packSlug === "pixel-vehicles"
      ? {
          styleFamily: "pixel-art-game",
          artStyle: "Small-scale pixel-art game sprite",
          selectionGuidance:
            "Use when retro game language is intentional; do not treat the subject alone as evidence that it fits a polished commercial interface.",
          bestFor: ["retro campaigns", "game sites", "playful micro-scenes", "pixel-art storytelling"],
          avoidWhen: ["luxury, photoreal, or precision technology art direction"],
        }
      : record.packSlug === "generic-items"
        ? {
            styleFamily: "low-poly-game-render",
            artStyle: "Very simplified low-poly game-object render",
            selectionGuidance:
              "Use as a playful supporting prop. Compare with Lucide, Phosphor, or a higher-fidelity source before using it as a hero or premium technology visual.",
            bestFor: ["playful interfaces", "game-like collections", "small supporting props"],
            avoidWhen: ["premium technology heroes", "photoreal product scenes", "luxury art direction"],
          }
        : record.packSlug === "pattern-lines"
          ? {
              styleFamily: "geometric-line-pattern",
              artStyle: "Simple geometric line pattern",
              selectionGuidance:
                "Use at restrained contrast and compare with Hero Patterns when a richer repeatable motif would better support the brand.",
              bestFor: ["subtle section texture", "technical backgrounds", "game UI"],
              avoidWhen: ["the line density competes with content"],
            }
          : {
              styleFamily: "stylized-game-scenery",
              artStyle: "Simplified game-oriented scenery or foliage",
              selectionGuidance:
                "Use when a playful illustrated landscape is intentional; compare with photography, PBR material, or editorial illustration for more mature art direction.",
              bestFor: ["playful scenes", "parallax landscapes", "game sites", "children's products"],
              avoidWhen: ["photoreal, luxury, or restrained editorial art direction"],
            };
  return {
    ...record,
    usageMode: "bundled",
    previewMode: "contain",
    conceptId: `kenney-image.${slugify(record.name)}.${record.id}`,
    featuredRank: 90,
    ...style,
  };
}

async function mergeCatalog(designRecords) {
  const imagePath = path.join(mcpRoot, "image-assets.json");
  const current = JSON.parse(await readFile(imagePath, "utf8"));
  const base = current
    .filter((record) => record.phase !== config.phase)
    .map(annotateBaseImage);
  const merged = [
    ...base,
    ...designRecords.map((record, index) => ({
      ...record,
      sourceOrder: base.length + index + 1,
    })),
  ];
  await writeFile(imagePath, `${JSON.stringify(merged, null, 2)}\n`);

  const manifestPath = path.join(mcpRoot, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.generatedAt = config.generatedAt;
  manifest.purpose =
    "A human and machine-readable design toolkit for selecting web-ready 3D models, original Web Component implementation recipes, multi-style image and UI assets, and externally hosted animated background references.";
  manifest.totals.imageAssets = merged.length;
  manifest.totals.bundledImageAssets = merged.filter((record) =>
    ["local", "hybrid"].includes(record.storage),
  ).length;
  manifest.totals.linkedImageAssets = merged.filter(
    (record) => record.storage === "remote",
  ).length;
  manifest.totals.imageAssetCollections = new Set(
    merged.map((record) => record.collection),
  ).size;
  manifest.endpoints.designAssets = `${publicRoot}/design-assets.json`;
  manifest.imageAssetSchema = {
    id: "Stable catalog identifier",
    conceptId: "Normalized subject for comparing the same concept across visual styles",
    imageUrl: "Local path or official linked preview URL",
    publicImageUrl: "Absolute default preview or asset URL",
    downloadUrl: "Production asset, source page, or local asset URL depending on usageMode",
    storage: "local, remote, or hybrid",
    usageMode: "bundled, grouped variants, linked source, or attribution",
    format: "SVG, PNG, or PBR maps",
    styleFamily: "Normalized visual language",
    artStyle: "Human-readable visual treatment",
    variants: "Optional named style or weight URLs grouped under one concept",
    selectionGuidance: "Art-direction and implementation advice",
    bestFor: "Contexts where the asset style is a strong fit",
    avoidWhen: "Contexts where another visual family should be preferred",
    licenceClass: "ship-safe, attribution, or linked",
  };
  manifest.imageSelectionGuidance = {
    guidanceMode: "advisory",
    primaryRule:
      "Search by concept, then choose the visual family that fits the brand; subject-name overlap is intentional.",
    consistencyRule:
      "Use one primary icon or illustration family per interface and mix styles only for an explicit hierarchy.",
    groupedVariants:
      "Phosphor weights are grouped in one record so Codex can choose a consistent regular, thin, light, bold, fill, or duotone treatment.",
    linkedAssets:
      "ambientCG preview images are not production PBR maps; fetch production maps from the official material page.",
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const provenancePath = path.join(mcpRoot, "provenance.json");
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  const kenneyPacks = provenance.imageAssets.packs.filter(
    (pack) => pack.phase !== config.phase,
  );
  const designPacks = [
    collectionSummary(designRecords, "Lucide", {
      version: config.packages["lucide-static"],
      localLicencePath: "mcp/licences/design-assets/lucide.txt",
      transformations:
        "Vendored the complete official SVG directory and preserved tags for search.",
    }),
    collectionSummary(designRecords, "Phosphor", {
      version: config.packages["@phosphor-icons/core"],
      localLicencePath: "mcp/licences/design-assets/phosphor.txt",
      localVariantFileCount:
        designRecords.filter((record) => record.source === "Phosphor").length *
        6,
      transformations:
        "Grouped regular, thin, light, bold, fill, and duotone SVG files into one concept record.",
    }),
    collectionSummary(designRecords, "Open Doodles", {
      sourceUrl: "https://www.opendoodles.com/about",
      localLicencePath: "mcp/licences/design-assets/cc0-sources.txt",
      transformations:
        "Downloaded the official individual SVG links and normalized stable local filenames.",
    }),
    collectionSummary(designRecords, "Open Peeps", {
      sourceUrl: "https://www.openpeeps.com/",
      localLicencePath: "mcp/licences/design-assets/cc0-sources.txt",
      transformations:
        "Downloaded the official ready-made bust, sitting, and standing SVG compositions.",
    }),
    collectionSummary(designRecords, "ambientCG", {
      sourceUrl: "https://docs.ambientcg.com/license/",
      localLicencePath: "mcp/licences/design-assets/cc0-sources.txt",
      storage:
        "Forty local CC0 selection previews with production map downloads linked to official asset pages.",
    }),
    collectionSummary(designRecords, "Hero Patterns", {
      sourceUrl: "https://heropatterns.com/",
      localLicencePath: "mcp/licences/design-assets/hero-patterns.txt",
      transformations:
        "Extracted the official unstyled SVG distributions and preserved required CC BY attribution.",
    }),
  ];
  provenance.generatedAt = config.generatedAt;
  provenance.imageAssets = {
    sourceKind: "mixed local, generator, linked, attribution, and trademark-aware assets",
    storage:
      "Local SVG/PNG/WebP previews plus official generator, source, and pinned CDN links",
    assetCount: merged.length,
    packs: [...kenneyPacks, ...designPacks],
    selectionPolicy:
      "Overlapping subjects are retained when they provide distinct visual languages. Records expose art-direction fit, usage mode, licence class, and implementation warnings.",
  };
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  await updateInstructions();
  return merged;
}

let designRecords;
if (refresh || !(await exists(designCatalogPath))) {
  designRecords = await buildDesignCatalog();
} else {
  designRecords = JSON.parse(await readFile(designCatalogPath, "utf8"));
}
designRecords = designRecords.filter(
  (record) => !["DiceBear", "Simple Icons"].includes(record.source),
);
await writeFile(
  designCatalogPath,
  `${JSON.stringify(designRecords, null, 2)}\n`,
);
const merged = await mergeCatalog(designRecords);
const counts = Object.fromEntries(
  [...new Set(designRecords.map((record) => record.source))]
    .sort()
    .map((source) => [
      source,
      designRecords.filter((record) => record.source === source).length,
    ]),
);
console.log(
  JSON.stringify(
    {
      phase: config.phase,
      designAssets: designRecords.length,
      totalImageAssets: merged.length,
      sources: counts,
    },
    null,
    2,
  ),
);
