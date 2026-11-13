# Offline model assets

This development build does not include model weights. Do not label it as the complete offline AI release.

The Android integration accepts **Sherpa-ONNX Whisper multilingual** ASR model packages. Multilingual weights are needed for Hindi; `.en` weights only recognise English. Use separate manifest entries if you select separate English and Hindi models. Benchmark Hindi quality and mixed language speech separately.

Place compatible model files here and add entries to `manifest.json`. Each entry needs `id`, `kind` (`asr`, `tts`, `llm`), `language` (`en`, `hi`, `multilingual`), upstream `source`, `license`, `licenseFile`, `files`, and `config`. Every file, including required license notices, needs a real SHA-256 checksum. Paths are relative to this folder. `config` maps engine parameter names to the same verified relative paths.

ASR config keys: `encoder`, `decoder`, `tokens`. LLM config key: `model` (a compatible Qwen3 GGUF). An example manifest entry, deliberately without invented hashes:

```json
{
  "id": "whisper-tiny-multilingual",
  "kind": "asr",
  "language": "multilingual",
  "source": "<exact upstream model revision URL>",
  "license": "<verified redistribution license>",
  "licenseFile": "asr/whisper/LICENSE",
  "files": [
    { "path": "asr/whisper/encoder.int8.onnx", "sha256": "<actual sha256>" },
    { "path": "asr/whisper/decoder.int8.onnx", "sha256": "<actual sha256>" },
    { "path": "asr/whisper/tokens.txt", "sha256": "<actual sha256>" },
    { "path": "asr/whisper/LICENSE", "sha256": "<actual sha256>" }
  ],
  "config": {
    "encoder": "asr/whisper/encoder.int8.onnx",
    "decoder": "asr/whisper/decoder.int8.onnx",
    "tokens": "asr/whisper/tokens.txt"
  }
}
```

Add a matching upstream `sherpa-onnx.aar` to `modules/sherpa-onnx/android/libs/`. Keep its version, source, checksum, and notices in the third-party inventory. The module compiles the Sherpa adapter when this AAR exists and compiles the unavailable-engine adapter otherwise. No fake transcription is returned.

Run `npm run models:prepare`, then regenerate Android with `npx expo prebuild --platform android`. Models are copied into install-time Android assets; the native module verifies SHA-256 while provisioning application-private storage. There is no in-app model downloader.

The current TTS adapter uses Android voices filtered to **installed, offline** voices only. Bundled Sherpa English/Hindi TTS still needs implementation and validation before release; simply adding `tts` entries does not activate them.

`node scripts/validate-models.mjs --release` intentionally fails for the current manifest. Passing that asset check alone does not prove that the end-to-end native pipeline works.
