import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const inputPath =
  process.env.ANIMATED_BACKGROUNDS_FILE ??
  path.join(os.homedir(), "Downloads", "AnimatedBackgrounds.txt");
const outputPath = path.join(
  scriptDirectory,
  "data",
  "animated-backgrounds-source.json",
);

const source = await readFile(inputPath, "utf8");
const parsedUrls = [...source.matchAll(/https:\/\/.*?(?=https:\/\/|\s|$)/g)].map(
  (match) => match[0].trim(),
);
const urls = [...new Set(parsedUrls)];
const entries = new Array(urls.length);
let cursor = 0;

async function inspectUrl(url, index) {
  const format = /\.m3u8(?:$|\?)/i.test(url) ? "HLS" : "MP4";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: format === "MP4" ? { Range: "bytes=0-0" } : {},
      redirect: "follow",
      signal: controller.signal,
    });
    if (format === "MP4") await response.body?.cancel();

    const contentRange = response.headers.get("content-range");
    const totalBytes = contentRange?.match(/\/(\d+)$/)?.[1];
    return {
      sourceIndex: index + 1,
      url,
      format,
      available: response.ok,
      httpStatus: response.status,
      contentType: response.headers.get("content-type"),
      fileSizeBytes: totalBytes ? Number(totalBytes) : null,
    };
  } catch (error) {
    return {
      sourceIndex: index + 1,
      url,
      format,
      available: false,
      httpStatus: 0,
      contentType: null,
      fileSizeBytes: null,
      checkError: error.name === "AbortError" ? "timeout" : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function worker() {
  while (cursor < urls.length) {
    const index = cursor++;
    entries[index] = await inspectUrl(urls[index], index);
  }
}

await Promise.all(Array.from({ length: 12 }, () => worker()));
await mkdir(path.dirname(outputPath), { recursive: true });

const importedAt = new Date().toISOString().slice(0, 10);
const result = {
  importedAt,
  sourceFile: path.basename(inputPath),
  parsedUrlCount: parsedUrls.length,
  uniqueUrlCount: urls.length,
  duplicateCount: parsedUrls.length - urls.length,
  entries,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      source: path.relative(repositoryRoot, inputPath),
      output: path.relative(repositoryRoot, outputPath),
      parsed: parsedUrls.length,
      unique: urls.length,
      duplicates: parsedUrls.length - urls.length,
      available: entries.filter((entry) => entry.available).length,
      unavailable: entries.filter((entry) => !entry.available).length,
      mp4: entries.filter((entry) => entry.format === "MP4").length,
      hls: entries.filter((entry) => entry.format === "HLS").length,
    },
    null,
    2,
  ),
);
