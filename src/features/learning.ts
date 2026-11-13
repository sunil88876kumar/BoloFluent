import type { Activity, WordReview } from "../types";
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDate(date);
}
export function streak(activities: Activity[], today = localDate()): number {
  const days = new Set(activities.map((a) => a.date));
  let day = days.has(today) ? today : addDays(today, -1),
    count = 0;
  while (days.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
export function reviewWord(
  wordId: number,
  previous: WordReview | undefined,
  remembered: boolean,
  today = localDate(),
): WordReview {
  const repetitions = remembered ? (previous?.repetitions ?? 0) + 1 : 0;
  const ease = Math.max(
    1.3,
    (previous?.ease ?? 2.5) + (remembered ? 0.05 : -0.2),
  );
  const interval = !remembered
    ? 1
    : repetitions === 1
      ? 1
      : repetitions === 2
        ? 3
        : Math.round((previous?.interval ?? 3) * ease);
  return {
    wordId,
    repetitions,
    interval,
    ease,
    nextReview: addDays(today, interval),
  };
}
const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, "")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
export function wordMatch(expected: string, recognized: string) {
  const a = tokenize(expected),
    b = tokenize(recognized);
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return {
    accuracy: a.length
      ? Math.round(Math.max(0, 1 - matrix[a.length][b.length] / a.length) * 100)
      : 0,
    expectedWords: a.length,
    spokenWords: b.length,
  };
}
