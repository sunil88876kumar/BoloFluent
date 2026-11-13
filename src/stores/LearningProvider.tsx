import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadState, saveState } from "../database/db";
import { localDate, reviewWord } from "../features/learning";
import { purgeRecordings } from "../services/recordings";
import type { Activity, Conversation, LearningState, Profile } from "../types";
const empty: LearningState = {
  profile: null,
  activities: [],
  reviews: [],
  conversations: [],
};
type Store = {
  state: LearningState;
  ready: boolean;
  error: string;
  setProfile: (p: Profile) => Promise<void>;
  activity: (
    type: Activity["type"],
    reference: string,
    minutes: number,
    score?: number,
    details?: Activity["details"],
  ) => Promise<void>;
  review: (id: number, remembered: boolean) => Promise<void>;
  conversation: (c: Conversation) => Promise<void>;
  replace: (s: LearningState) => Promise<void>;
  clearHistory: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(empty),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const current = useRef(empty),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    purgeRecordings();
    loadState()
      .then((s) => {
        current.current = s;
        setState(s);
        setReady(true);
      })
      .catch((e) =>
        setError(`Could not open your learning data: ${String(e)}`),
      );
  }, []);
  function update(transform: (s: LearningState) => LearningState) {
    const result = queue.current.then(async () => {
      const next = transform(current.current);
      await saveState(next);
      current.current = next;
      setState(next);
      setError("");
    });
    queue.current = result.catch((e) =>
      setError(`Your change could not be saved: ${String(e)}`),
    );
    return result;
  }
  const value: Store = {
    state,
    ready,
    error,
    setProfile: (p) => update((s) => ({ ...s, profile: p })),
    activity: (type, reference, minutes, score, details) =>
      update((s) => ({
        ...s,
        activities: [
          ...s.activities,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            date: localDate(),
            type,
            reference,
            minutes,
            score,
            details,
          },
        ],
      })),
    review: (id, remembered) =>
      update((s) => ({
        ...s,
        reviews: [
          ...s.reviews.filter((r) => r.wordId !== id),
          reviewWord(
            id,
            s.reviews.find((r) => r.wordId === id),
            remembered,
          ),
        ],
        activities: [
          ...s.activities,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            date: localDate(),
            type: "vocabulary",
            reference: String(id),
            minutes: 0.5,
          },
        ],
      })),
    conversation: (c) =>
      update((s) => ({
        ...s,
        conversations: [...s.conversations.filter((x) => x.id !== c.id), c],
      })),
    replace: (s) => update(() => s),
    clearHistory: () => update((s) => ({ ...s, conversations: [] })),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLearning() {
  const context = useContext(Context);
  if (!context) throw new Error("LearningProvider is missing");
  return context;
}
