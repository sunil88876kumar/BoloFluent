import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { schema } from "./schema";
import { lessons, words } from "../../assets/content/lessons";
import type { LearningState } from "../types";
import { readLearning, writeLearning } from "./repositories/learning";
let connection: Promise<SQLiteDatabase> | undefined;
async function db() {
  if (!connection)
    connection = (async () => {
      const d = await openDatabaseAsync("bolofluent.db");
      const version = await d.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
      );
      if ((version?.user_version ?? 0) > 1)
        throw new Error(
          "Your learning database was created by a newer BoloFluent version. Update the app to continue.",
        );
      await d.execAsync(schema);
      const columns = await d.getAllAsync<{ name: string }>(
        "PRAGMA table_info(learning_activity)",
      );
      if (!columns.some((c) => c.name === "details_json"))
        await d.execAsync(
          "ALTER TABLE learning_activity ADD COLUMN details_json TEXT",
        );
      await d.withTransactionAsync(async () => {
        for (const l of lessons)
          await d.runAsync(
            "INSERT OR IGNORE INTO lessons(id,title,description,category,difficulty,content_json,sort_order) VALUES(?,?,?,?,?,?,?)",
            l.id,
            l.title,
            l.subtitle,
            l.category,
            l.level,
            JSON.stringify(l),
            l.id,
          );
        for (const w of words)
          await d.runAsync(
            "INSERT OR IGNORE INTO vocabulary(id,word,meaning_en,meaning_hi,example_sentence,pronunciation) VALUES(?,?,?,?,?,?)",
            w.id,
            w.word,
            w.meaning,
            w.hindi,
            w.example,
            w.pronunciation,
          );
      });
      return d;
    })().catch((e) => {
      connection = undefined;
      throw e;
    });
  return connection;
}
export async function loadState(): Promise<LearningState> {
  return readLearning(await db());
}
export async function saveState(state: LearningState) {
  const d = await db();
  await d.withExclusiveTransactionAsync((tx) => writeLearning(tx, state));
}
