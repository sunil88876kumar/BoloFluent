import { validateModels, root } from "./validate-models.mjs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
const manifest = await validateModels({
  release: process.argv.includes("--release"),
});
const inventory = manifest.models
  .map(
    (m) =>
      `${m.id}\nSource: ${m.source}\nLicense: ${m.license}\nNotice: ${m.licenseFile}\n`,
  )
  .join("\n");
await writeFile(
  path.join(root, "MODEL-NOTICES.txt"),
  inventory || "No model weights are distributed in this development build.\n",
);
console.log(
  "Verified local model assets and generated MODEL-NOTICES.txt. Android prebuild copies them into install-time assets.",
);
