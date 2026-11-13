import { requireOptionalNativeModule } from "expo-modules-core";
export interface ModelEntry {
  id: string;
  kind: "asr" | "llm" | "tts";
  language: "en" | "hi" | "multilingual";
  license: string;
  licenseFile: string;
  source: string;
  files: { path: string; sha256: string }[];
  config: Record<string, string>;
}
export interface OfflineNative {
  memory(): Promise<{ total: number; available: number; lowMemory: boolean }>;
  prepareModels(manifest: string): Promise<Record<string, string>>;
  transcribe(
    path: string,
    config: Record<string, string>,
    language: string,
  ): Promise<{ text: string; durationMs: number; language: string }>;
  hasSherpa(): boolean;
  voices(): Promise<{ language: string; name: string }[]>;
  speak(text: string, language: string, speed: number): Promise<void>;
  stop(): Promise<void>;
}
export const offline =
  requireOptionalNativeModule<OfflineNative>("BoloOffline");
