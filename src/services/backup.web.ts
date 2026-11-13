import type { LearningState } from "../types";
import { backupSchema } from "../database/validation";
export async function exportBackup(state: LearningState) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify({ version: 1, app: "BoloFluent", state }, null, 2)],
      { type: "application/json" },
    ),
  );
  link.href = url;
  link.download = "BoloFluent-backup.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readBackup(): Promise<LearningState | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      try {
        const f = input.files?.[0];
        if (!f) return resolve(null);
        if (f.size > 20 * 1024 * 1024)
          throw new Error("Choose a backup smaller than 20 MB.");
        resolve(backupSchema.parse(JSON.parse(await f.text())).state);
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
