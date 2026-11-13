export type Level = "beginner" | "intermediate" | "advanced";
export type Language = "hi" | "en";
export interface Profile {
  name: string;
  language: Language;
  level: Level;
  dailyGoal: number;
  speechSpeed: number;
}
export interface Activity {
  id: string;
  date: string;
  type: "lesson" | "vocabulary" | "speaking" | "grammar";
  reference: string;
  minutes: number;
  score?: number;
  details?: {
    expected?: string;
    recognized?: string;
    corrected?: string;
    explanation?: string;
    hindi?: string;
    source?: string;
    durationSeconds?: number;
  };
}
export interface WordReview {
  wordId: number;
  interval: number;
  repetitions: number;
  ease: number;
  nextReview: string;
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}
export interface Conversation {
  id: string;
  topic: string;
  messages: Message[];
  updatedAt: string;
}
export interface LearningState {
  profile: Profile | null;
  activities: Activity[];
  reviews: WordReview[];
  conversations: Conversation[];
}
export interface Exercise {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  hindi: string;
}
export interface Lesson {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  level: Level;
  minutes: number;
  phrases: { en: string; hi: string }[];
  exercises: Exercise[];
}
export interface Word {
  id: number;
  word: string;
  pronunciation: string;
  meaning: string;
  hindi: string;
  example: string;
}
