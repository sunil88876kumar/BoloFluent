import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  reviewWord,
  streak,
  wordMatch,
} from "../src/features/learning";
import { correctWithRules } from "../src/ai/grammar";
import { capability } from "../src/ai/capabilities";
import { backupSchema } from "../src/database/validation";
import { lessons, words } from "../assets/content/lessons";
import type { Activity } from "../src/types";
const activity = (date: string): Activity => ({
  id: date,
  date,
  type: "lesson",
  reference: "1",
  minutes: 5,
});
test("streak uses local calendar days, allows today to be unfinished, and ignores repeated activities", () => {
  assert.equal(
    streak(
      [activity("2026-11-12"), activity("2026-11-12"), activity("2026-11-11")],
      "2026-11-13",
    ),
    2,
  );
  assert.equal(streak([activity("2026-11-11")], "2026-11-13"), 0);
  assert.equal(
    streak(
      [activity("2026-11-13"), activity("2026-11-12"), activity("2026-11-10")],
      "2026-11-13",
    ),
    2,
  );
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
test("reviews grow intervals and bring forgotten words back soon", () => {
  const first = reviewWord(1, undefined, true, "2026-11-13");
  const second = reviewWord(1, first, true, "2026-11-14");
  const third = reviewWord(1, second, true, "2026-11-17");
  assert.equal(first.nextReview, "2026-11-14");
  assert.equal(second.interval, 3);
  assert.ok(third.interval > 3);
  const missed = reviewWord(1, third, false, "2026-11-20");
  assert.equal(missed.repetitions, 0);
  assert.equal(missed.interval, 1);
});
test("word matching penalizes omissions, substitutions, and extra words without pretending to score audio", () => {
  assert.equal(wordMatch("Hello, WORLD!", "hello world").accuracy, 100);
  assert.equal(wordMatch("I like tea", "I tea").accuracy, 67);
  assert.equal(wordMatch("I like tea", "I like coffee").accuracy, 67);
  assert.equal(wordMatch("I like tea", "I really like tea").accuracy, 67);
  assert.equal(wordMatch("", "").accuracy, 0);
  assert.equal(wordMatch("hello", "").accuracy, 0);
});
test("basic grammar gives bilingual feedback and does not claim unknown text is correct", () => {
  assert.equal(
    correctWithRules("I am agree with you.").corrected,
    "I agree with you.",
  );
  assert.equal(
    correctWithRules("She go to school.").corrected,
    "She goes to school.",
  );
  assert.equal(
    correctWithRules("I didn’t went home.").corrected,
    "I didn’t go home.",
  );
  assert.ok(correctWithRules("I is happy.").hindi.includes("am"));
  const unknown = correctWithRules("The ideas sleeps furiously.");
  assert.equal(unknown.changed, false);
  assert.match(unknown.explanation, /not a complete/);
});
test("device policy blocks an LLM on low RAM, low available memory, or memory pressure", () => {
  const gb = 1024 ** 3;
  assert.equal(capability(4 * gb, 2 * gb).allowLLM, false);
  assert.equal(capability(8 * gb, gb).allowLLM, false);
  assert.equal(capability(8 * gb, 3 * gb, true).allowLLM, false);
  assert.equal(capability(8 * gb, 3 * gb).allowLLM, true);
});
test("backup validation rejects untrusted content and out-of-range settings", () => {
  const backup = {
    version: 1,
    app: "BoloFluent",
    state: {
      profile: {
        name: "Asha",
        language: "hi",
        level: "beginner",
        dailyGoal: 15,
        speechSpeed: 0.9,
      },
      activities: [],
      reviews: [],
      conversations: [],
    },
  };
  assert.equal(backupSchema.parse(backup).state.profile?.name, "Asha");
  assert.throws(() => backupSchema.parse({ ...backup, version: 2 }));
  assert.throws(() =>
    backupSchema.parse({
      ...backup,
      state: {
        ...backup.state,
        profile: { ...backup.state.profile, dailyGoal: -1 },
      },
    }),
  );
});
test("bundled content has unique IDs and valid answer keys", () => {
  assert.equal(new Set(lessons.map((l) => l.id)).size, lessons.length);
  assert.equal(new Set(words.map((w) => w.id)).size, words.length);
  for (const lesson of lessons) {
    assert.ok(lesson.phrases.length);
    assert.ok(lesson.exercises.length);
    for (const exercise of lesson.exercises) {
      assert.ok(
        exercise.answer >= 0 && exercise.answer < exercise.options.length,
      );
      assert.ok(exercise.hindi);
    }
  }
});

test("restore rejects duplicate IDs, unknown lessons, and invalid calendar dates", () => {
  const base = {
    version: 1,
    app: "BoloFluent",
    state: {
      profile: {
        name: "Asha",
        language: "hi",
        level: "beginner",
        dailyGoal: 15,
        speechSpeed: 0.9,
      },
      activities: [activity("2026-11-13")],
      reviews: [],
      conversations: [],
    },
  };
  assert.throws(() =>
    backupSchema.parse({
      ...base,
      state: {
        ...base.state,
        activities: [activity("2026-11-13"), activity("2026-11-13")],
      },
    }),
  );
  assert.throws(() =>
    backupSchema.parse({
      ...base,
      state: {
        ...base.state,
        activities: [{ ...activity("2026-11-13"), reference: "999" }],
      },
    }),
  );
  assert.throws(() =>
    backupSchema.parse({
      ...base,
      state: { ...base.state, activities: [activity("2026-02-31")] },
    }),
  );
});
