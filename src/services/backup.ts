import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { backupSchema } from "../database/validation";
import type { LearningState } from "../types";
export async function exportBackup(state: LearningState) {
  const file = new File(Paths.cache, "BoloFluent-backup.json");
  file.write(JSON.stringify({ version: 1, app: "BoloFluent", state }, null, 2));
  try {
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("File sharing is not available on this device.");
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Save your BoloFluent backup",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function readBackup() {
  const selected = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (selected.canceled) return null;
  const file = new File(selected.assets[0].uri);
  try {
    if (file.size > 20 * 1024 * 1024)
      throw new Error("Choose a BoloFluent backup smaller than 20 MB.");
    return backupSchema.parse(JSON.parse(await file.text())).state;
  } finally {
    if (file.exists) file.delete();
  }
}
