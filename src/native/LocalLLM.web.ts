import type { initLlama as NativeInit } from "llama.rn";
export const initLlama: typeof NativeInit = async () => {
  throw new Error("The local tutor requires the Android development build.");
};
