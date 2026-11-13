import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../assets/models",
);
export async function validateModels({ release = false } = {}) {
  const manifest = JSON.parse(
    await readFile(path.join(root, "manifest.json"), "utf8"),
  );
  if (manifest.version !== 1 || !Array.isArray(manifest.models))
    throw new Error("Invalid model manifest.");
  const installed = new Set(),
    ids = new Set();
  for (const model of manifest.models) {
    if (ids.has(model.id)) throw new Error(`Duplicate model id: ${model.id}`);
    ids.add(model.id);
    if (
      !model.id ||
      !["asr", "tts", "llm"].includes(model.kind) ||
      !["en", "hi", "multilingual"].includes(model.language) ||
      !model.license ||
      !model.source ||
      !model.licenseFile ||
      !model.files?.length ||
      !model.config
    )
      throw new Error(`Incomplete manifest entry: ${model.id}`);
    if (!model.files.some((f) => f.path === model.licenseFile))
      throw new Error(
        `Include the model's licenseFile in its checksummed files: ${model.id}`,
      );
    for (const file of model.files) {
      if (
        !/^[a-zA-Z0-9_./-]+$/.test(file.path) ||
        file.path.split("/").includes("..") ||
        path.isAbsolute(file.path) ||
        !/^[a-f0-9]{64}$/.test(file.sha256)
      )
        throw new Error(`Invalid path or checksum: ${file.path}`);
      const target = await realpath(path.join(root, file.path));
      if (!target.startsWith(root + path.sep))
        throw new Error("Model path escapes assets/models.");
      if (!(await stat(target)).isFile())
        throw new Error(`Not a file: ${file.path}`);
      const hash = createHash("sha256");
      for await (const data of createReadStream(target)) hash.update(data);
      if (hash.digest("hex") !== file.sha256)
        throw new Error(`Checksum mismatch: ${file.path}`);
      installed.add(file.path);
    }
    for (const [key, value] of Object.entries(model.config)) {
      if (!["type", "language"].includes(key) && !installed.has(value))
        throw new Error(
          `Configuration references an unverified file: ${key}=${value}`,
        );
    }
  }
  if (release) {
    for (const language of ["en", "hi"])
      for (const kind of ["asr", "tts"])
        if (
          !manifest.models.some(
            (m) =>
              m.kind === kind &&
              (m.language === language || m.language === "multilingual"),
          )
        )
          throw new Error(
            `Release requires a bundled ${language} ${kind} model.`,
          );
    if (!manifest.models.some((m) => m.kind === "llm"))
      throw new Error("Release requires a bundled tutor model.");
    const aar = path.resolve(
      root,
      "../../modules/sherpa-onnx/android/libs/sherpa-onnx.aar",
    );
    await stat(aar);
  }
  return manifest;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const manifest = await validateModels({
      release: process.argv.includes("--release"),
    });
    console.log(
      `${manifest.models.length} model packages verified.${manifest.models.length ? "" : " Development build: speech models and AI tutor are not bundled."}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
