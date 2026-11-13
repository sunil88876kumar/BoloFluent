import type {
  Activity,
  Conversation,
  LearningState,
  WordReview,
} from "../../types";
type Value = string | number | null;
export interface LearningReader {
  getFirstAsync<T>(sql: string, ...values: Value[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...values: Value[]): Promise<T[]>;
}
export interface LearningWriter {
  runAsync(
    sql: string,
    ...values: Value[]
  ): Promise<{ lastInsertRowId: number }>;
}
export async function readLearning(d: LearningReader): Promise<LearningState> {
  const p = await d.getFirstAsync<{
    name: string;
    language: "hi" | "en";
    level: "beginner" | "intermediate" | "advanced";
    dailyGoal: number;
    speechSpeed: number;
  }>(
    "SELECT p.name,p.preferred_language AS language,p.learning_level AS level,s.daily_goal_minutes AS dailyGoal,s.speech_speed AS speechSpeed FROM user_profile p JOIN user_settings s ON s.user_id=p.id WHERE p.id=1",
  );
  const activities = await d.getAllAsync<
    Activity & { details_json: string | null }
  >(
    "SELECT id,progress_date AS date,exercise_type AS type,reference,minutes,score,details_json FROM learning_activity WHERE user_id=1",
  );
  const reviews = await d.getAllAsync<WordReview>(
    "SELECT vocabulary_id AS wordId,interval_days AS interval,repetitions,ease,next_review_at AS nextReview FROM user_vocabulary WHERE user_id=1",
  );
  const sessions = await d.getAllAsync<{
    id: string;
    topic: string;
    updatedAt: string;
  }>(
    "SELECT id,topic,COALESCE(ended_at,started_at) AS updatedAt FROM conversation_sessions WHERE user_id=1 ORDER BY started_at",
  );
  const conversations: Conversation[] = [];
  for (const s of sessions)
    conversations.push({
      ...s,
      messages: await d.getAllAsync(
        "SELECT id,role,message AS text FROM conversation_messages WHERE session_id=? ORDER BY rowid",
        s.id,
      ),
    });
  return {
    profile: p ?? null,
    activities: activities.map(({ details_json, ...a }) => ({
      ...a,
      score: a.score ?? undefined,
      details: details_json ? JSON.parse(details_json) : undefined,
    })),
    reviews,
    conversations,
  };
}
export async function writeLearning(tx: LearningWriter, state: LearningState) {
  if (!state.profile) {
    await tx.runAsync("DELETE FROM user_profile WHERE id=1");
    return;
  }
  const p = state.profile;
  await tx.runAsync(
    "INSERT INTO user_profile(id,name,preferred_language,learning_level) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,preferred_language=excluded.preferred_language,learning_level=excluded.learning_level",
    p.name,
    p.language,
    p.level,
  );
  await tx.runAsync(
    "INSERT INTO user_settings(user_id,speech_speed,daily_goal_minutes) VALUES(1,?,?) ON CONFLICT(user_id) DO UPDATE SET speech_speed=excluded.speech_speed,daily_goal_minutes=excluded.daily_goal_minutes",
    p.speechSpeed,
    p.dailyGoal,
  );
  for (const table of [
    "learning_activity",
    "lesson_progress",
    "user_vocabulary",
    "conversation_sessions",
    "daily_progress",
    "grammar_corrections",
    "practice_attempts",
  ])
    await tx.runAsync(`DELETE FROM ${table} WHERE user_id=1`);
  for (const a of state.activities) {
    await tx.runAsync(
      "INSERT INTO learning_activity(id,user_id,progress_date,exercise_type,reference,minutes,score,details_json) VALUES(?,1,?,?,?,?,?,?)",
      a.id,
      a.date,
      a.type,
      a.reference,
      a.minutes,
      a.score ?? null,
      a.details ? JSON.stringify(a.details) : null,
    );
    if (a.type === "grammar" && a.details?.corrected)
      await tx.runAsync(
        "INSERT INTO grammar_corrections(user_id,original_text,corrected_text,explanation_en,explanation_hi,error_type,created_at) VALUES(1,?,?,?,?,?,?)",
        a.reference,
        a.details.corrected,
        a.details.explanation ?? null,
        a.details.hindi ?? null,
        a.details.source ?? null,
        a.date,
      );
    if (a.type === "speaking" && a.details) {
      const attempt = await tx.runAsync(
        "INSERT INTO practice_attempts(user_id,exercise_type,expected_text,recognized_text,audio_duration_seconds,created_at) VALUES(1,?,?,?,?,?)",
        a.reference,
        a.details.expected ?? null,
        a.details.recognized ?? null,
        a.details.durationSeconds ?? null,
        a.date,
      );
      if (a.score !== undefined)
        await tx.runAsync(
          "INSERT INTO pronunciation_results(attempt_id,word_accuracy,assessment_details) VALUES(?,?,?)",
          attempt.lastInsertRowId,
          a.score,
          JSON.stringify({
            method: "text-word-match",
            source: a.details.source,
            acousticAssessed: false,
          }),
        );
    }
    if (a.type === "lesson")
      await tx.runAsync(
        "INSERT OR REPLACE INTO lesson_progress(user_id,lesson_id,status,completed_at) VALUES(1,?,'completed',?)",
        Number(a.reference),
        a.date,
      );
  }
  for (const r of state.reviews)
    await tx.runAsync(
      "INSERT INTO user_vocabulary(user_id,vocabulary_id,status,next_review_at,interval_days,repetitions,ease) VALUES(1,?,?,?,?,?,?)",
      r.wordId,
      r.repetitions >= 3 ? "learned" : "learning",
      r.nextReview,
      r.interval,
      r.repetitions,
      r.ease,
    );
  for (const c of state.conversations) {
    await tx.runAsync(
      "INSERT INTO conversation_sessions(id,user_id,topic,ended_at) VALUES(?,1,?,?)",
      c.id,
      c.topic,
      c.updatedAt,
    );
    for (const m of c.messages)
      await tx.runAsync(
        "INSERT INTO conversation_messages(id,session_id,role,message) VALUES(?,?,?,?)",
        m.id,
        c.id,
        m.role,
        m.text,
      );
  }
  const days = [...new Set(state.activities.map((a) => a.date))];
  for (const day of days) {
    const entries = state.activities.filter((a) => a.date === day);
    await tx.runAsync(
      "INSERT INTO daily_progress(user_id,progress_date,speaking_minutes,lessons_completed,words_learned,exercises_completed) VALUES(1,?,?,?,?,?)",
      day,
      entries
        .filter((a) => a.type === "speaking")
        .reduce((s, a) => s + a.minutes, 0),
      new Set(
        entries.filter((a) => a.type === "lesson").map((a) => a.reference),
      ).size,
      new Set(
        entries.filter((a) => a.type === "vocabulary").map((a) => a.reference),
      ).size,
      entries.length,
    );
  }
}
