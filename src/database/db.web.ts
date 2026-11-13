import type { LearningState } from "../types";
import { backupSchema } from "./validation";
const key = "bolofluent-v1";
export async function loadState(): Promise<LearningState> {
  const raw = localStorage.getItem(key);
  return raw
    ? backupSchema.parse(JSON.parse(raw)).state
    : { profile: null, activities: [], reviews: [], conversations: [] };
}
export async function saveState(state: LearningState) {
  localStorage.setItem(
    key,
    JSON.stringify({ version: 1, app: "BoloFluent", state }),
  );
}
