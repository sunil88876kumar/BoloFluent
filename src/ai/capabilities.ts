export function capability(
  totalBytes: number,
  availableBytes: number,
  lowMemory = false,
) {
  const gb = totalBytes / 1024 ** 3;
  const tier =
    gb < 5 ? "essential" : gb < 7 ? "compact" : gb < 10 ? "full" : "extended";
  const allowLLM = !lowMemory && gb >= 5 && availableBytes >= 1.5 * 1024 ** 3;
  return {
    tier,
    allowLLM,
    contextSize: tier === "extended" ? 2048 : tier === "full" ? 1536 : 768,
    threads: tier === "essential" ? 2 : 4,
  } as const;
}
