import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { schema } from "../src/database/schema";
import {
  readLearning,
  writeLearning,
  type LearningReader,
  type LearningWriter,
} from "../src/database/repositories/learning";
import type { LearningState } from "../src/types";
test("SQLite schema applies repeatedly, enforces relations, and cascades deletion", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(schema);
    db.exec(schema);
    db.prepare("INSERT INTO user_profile(id,name) VALUES(?,?)").run(1, "Asha");
    db.prepare("INSERT INTO user_settings(user_id) VALUES(?)").run(1);
    db.prepare(
      "INSERT INTO conversation_sessions(id,user_id,topic) VALUES(?,?,?)",
    ).run("s1", 1, "cafe");
    db.prepare(
      "INSERT INTO conversation_messages(id,session_id,role,message) VALUES(?,?,?,?)",
    ).run("m1", "s1", "user", "I'd like tea.");
    assert.throws(() =>
      db
        .prepare(
          "INSERT INTO conversation_messages(id,session_id,role,message) VALUES(?,?,?,?)",
        )
        .run("m2", "missing", "user", "hello"),
    );
    assert.throws(() =>
      db
        .prepare(
          "INSERT INTO user_profile(id,name,learning_level) VALUES(?,?,?)",
        )
        .run(2, "Bad", "unknown"),
    );
    db.prepare("DELETE FROM user_profile WHERE id=?").run(1);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM conversation_messages").get()?.n,
      0,
    );
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM user_settings").get()?.n,
      0,
    );
    assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 1);
  } finally {
    db.close();
  }
});

test("the actual learning repository round-trips transcripts and results, preserves profile creation, and deletes private data", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(schema);
  db.exec(
    "INSERT INTO lessons(id,title,category,difficulty,content_json) VALUES(1,'Hello','Everyday','beginner','{}');INSERT INTO vocabulary(id,word) VALUES(1,'Confidence');",
  );
  const adapter: LearningReader & LearningWriter = {
    async runAsync(sql, ...values) {
      const result = db.prepare(sql).run(...values);
      return { lastInsertRowId: Number(result.lastInsertRowid) };
    },
    async getFirstAsync<T>(sql: string, ...values: (string | number | null)[]) {
      return (db.prepare(sql).get(...values) ?? null) as T | null;
    },
    async getAllAsync<T>(sql: string, ...values: (string | number | null)[]) {
      return db.prepare(sql).all(...values) as T[];
    },
  };
  const state: LearningState = {
    profile: {
      name: "Asha O'Neil",
      language: "hi",
      level: "beginner",
      dailyGoal: 15,
      speechSpeed: 0.9,
    },
    activities: [
      {
        id: "a1",
        date: "2026-11-13",
        type: "lesson",
        reference: "1",
        minutes: 5,
        score: 100,
      },
      {
        id: "a2",
        date: "2026-11-13",
        type: "speaking",
        reference: "voice-repeat",
        minutes: 0.5,
        score: 100,
        details: {
          expected: "Hello",
          recognized: "Hello",
          durationSeconds: 30,
          source: "voice",
        },
      },
      {
        id: "a3",
        date: "2026-11-13",
        type: "grammar",
        reference: "I is happy.",
        minutes: 0.5,
        details: {
          corrected: "I am happy.",
          explanation: "Use am.",
          hindi: "am का प्रयोग करें।",
          source: "rules",
        },
      },
    ],
    reviews: [
      {
        wordId: 1,
        interval: 1,
        repetitions: 1,
        ease: 2.55,
        nextReview: "2026-11-14",
      },
    ],
    conversations: [
      {
        id: "s1",
        topic: "cafe",
        updatedAt: "2026-11-13T12:00:00.000Z",
        messages: [
          { id: "m1", role: "user", text: "I'd like tea." },
          {
            id: "m2",
            role: "assistant",
            text: "Would you like anything else?",
          },
        ],
      },
    ],
  };
  async function save(next: LearningState) {
    db.exec("BEGIN");
    try {
      await writeLearning(adapter, next);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  try {
    await save(state);
    const actual = JSON.parse(JSON.stringify(await readLearning(adapter)));
    assert.deepEqual(actual, state);
    db.exec("UPDATE user_profile SET created_at='2020-01-01' WHERE id=1");
    await save({ ...state, profile: { ...state.profile!, name: "Riya" } });
    assert.equal(
      db.prepare("SELECT created_at FROM user_profile").get()?.created_at,
      "2020-01-01",
    );
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM grammar_corrections").get()?.n,
      1,
    );
    assert.equal(
      db
        .prepare(
          "SELECT acoustic_pronunciation_score FROM pronunciation_results",
        )
        .get()?.acoustic_pronunciation_score,
      null,
    );
    assert.equal(
      db.prepare("SELECT speaking_minutes FROM daily_progress").get()
        ?.speaking_minutes,
      0.5,
    );
    await assert.rejects(() =>
      save({ ...state, reviews: [{ ...state.reviews[0], wordId: 999 }] }),
    );
    assert.equal((await readLearning(adapter)).profile?.name, "Riya");
    await save({ ...state, conversations: [] });
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM conversation_messages").get()?.n,
      0,
    );
    await save({
      profile: null,
      activities: [],
      reviews: [],
      conversations: [],
    });
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM practice_attempts").get()?.n,
      0,
    );
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM pronunciation_results").get()?.n,
      0,
    );
  } finally {
    db.close();
  }
});
