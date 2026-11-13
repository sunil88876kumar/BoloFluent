import { z } from "zod";
import { lessons, words } from "../../assets/content/lessons";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date");
export const backupSchema = z.object({
  version: z.literal(1),
  app: z.literal("BoloFluent"),
  state: z
    .object({
      profile: z
        .object({
          name: z.string().trim().min(1).max(40),
          language: z.enum(["hi", "en"]),
          level: z.enum(["beginner", "intermediate", "advanced"]),
          dailyGoal: z.number().int().min(5).max(60),
          speechSpeed: z.number().min(0.5).max(1.5),
        })
        .nullable(),
      activities: z
        .array(
          z.object({
            id: z.string().max(100),
            date,
            type: z.enum(["lesson", "vocabulary", "speaking", "grammar"]),
            reference: z.string().max(500),
            minutes: z.number().min(0).max(240),
            score: z.number().min(0).max(100).optional(),
            details: z
              .object({
                expected: z.string().max(500).optional(),
                recognized: z.string().max(500).optional(),
                corrected: z.string().max(1000).optional(),
                explanation: z.string().max(2000).optional(),
                hindi: z.string().max(2000).optional(),
                source: z.string().max(30).optional(),
                durationSeconds: z.number().min(0).max(65).optional(),
              })
              .optional(),
          }),
        )
        .max(100000),
      reviews: z
        .array(
          z.object({
            wordId: z.number().int().positive(),
            interval: z.number().int().min(0),
            repetitions: z.number().int().min(0),
            ease: z.number().min(1.3).max(100),
            nextReview: date,
          }),
        )
        .max(10000),
      conversations: z
        .array(
          z.object({
            id: z.string().max(100),
            topic: z.string().max(200),
            updatedAt: z.string().max(50),
            messages: z
              .array(
                z.object({
                  id: z.string().max(100),
                  role: z.enum(["user", "assistant"]),
                  text: z.string().max(8000),
                }),
              )
              .max(1000),
          }),
        )
        .max(10000),
    })
    .superRefine((state, ctx) => {
      function unique(values: (string | number)[], label: string) {
        if (new Set(values).size !== values.length)
          ctx.addIssue({ code: "custom", message: `Duplicate ${label}` });
      }
      unique(
        state.activities.map((a) => a.id),
        "activity IDs",
      );
      unique(
        state.reviews.map((r) => r.wordId),
        "word reviews",
      );
      unique(
        state.conversations.map((c) => c.id),
        "conversation IDs",
      );
      unique(
        state.conversations.flatMap((c) => c.messages.map((m) => m.id)),
        "message IDs",
      );
      if (
        !state.profile &&
        (state.activities.length ||
          state.reviews.length ||
          state.conversations.length)
      )
        ctx.addIssue({
          code: "custom",
          message: "Learning data requires a profile",
        });
      if (state.reviews.some((r) => !words.some((w) => w.id === r.wordId)))
        ctx.addIssue({ code: "custom", message: "Unknown vocabulary ID" });
      if (
        state.activities.some(
          (a) =>
            a.type === "lesson" &&
            !lessons.some((l) => String(l.id) === a.reference),
        )
      )
        ctx.addIssue({ code: "custom", message: "Unknown lesson ID" });
    }),
});
