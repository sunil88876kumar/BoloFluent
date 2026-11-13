# BoloFluent

An Android-first English learning app for Hindi and English speakers, built from the supplied technical specification with React Native, Expo SDK 58, and TypeScript.

**Status: working application foundation and native integration source. This is not yet the complete offline AI APK described in the specification.** Model weights are not included, the Android toolchain is not installed in this workspace, and the on-device voice → ASR → LLM → TTS acceptance tests have not been run on a physical device.

![BoloFluent Today screen](docs/bolofluent-preview.png)

## Run

Use Node **24.3 or newer in the 24.x line**, or another version supported by Expo SDK 58.

```bash
npm install
npm run web
```

The browser preview supports onboarding, lessons, quizzes, vocabulary, basic grammar, guided conversations, progress, backup, and restore. It uses localStorage. Android uses SQLite. The native AI engines require a custom Android build; Expo Go cannot provide them.

### Android without Android Studio: cloud build

You can compile BoloFluent on Expo's servers with EAS Build. No local Android SDK, emulator, or Java installation is needed for a cloud build. Expo Go itself does not compile an APK and cannot load this app's custom native modules.

The project includes `eas.json` with two installable APK profiles:

- `development`: custom development client, with network access to your computer's Metro server.
- `preview`: standalone APK with its JavaScript bundled and Android INTERNET permission removed. This is the current application foundation, not the complete offline AI release.

Create or sign in to an Expo account, then run from the project folder:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile development
```

Follow the project-linking prompts. Because this project has dynamic `app.config.cjs`, EAS may ask you to add the project ID manually. Put the actual returned ID under `expo.extra.eas.projectId` in `app.json`; the dynamic config preserves that field. Do not invent a project ID. Let EAS generate Android signing credentials if you do not already have a keystore for this app.

When the build succeeds, open its installation link on an Android phone and install the BoloFluent APK. Start Metro on your computer:

```bash
npm start
```

Open the installed BoloFluent development app and connect to Metro using the displayed development-client QR code, instead of opening that code in Expo Go. For a LAN connection, the phone and computer should be on the same network.

For a standalone APK that opens without Metro:

```bash
npx eas-cli@latest build --platform android --profile preview
```

`.easignore` excludes generated root native folders, so EAS regenerates Android using the selected profile's environment. It includes `modules/**/android` so the local native module is uploaded. It also includes model assets and AARs when those are eventually supplied. No cloud build has been submitted or validated yet; native compilation errors may still need fixes in the first build.

See [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) and [installable APK builds](https://docs.expo.dev/build-reference/apk/).

### Optional: build Android locally

This alternative requires Android Studio, the SDK, and the Java version required by the generated Expo project. Connect a device, then run:

```bash
BOLO_DEV_NETWORK=1 npx expo prebuild --platform android
npm run android
npm start
```

`BOLO_DEV_NETWORK=1` enables the development client's connection to Metro. Without this explicit development flag, the config plugin removes Android's INTERNET permission. Production builds must embed their JS bundle and models and must not use the flag.

## What works in this version

- Local onboarding: name, English/Hindi explanations, level, daily goal.
- Five tabs: Today, Learn, Speak, Progress, Profile.
- Ten bundled lessons, bilingual phrase cards, quizzes, explanations, and completion tracking.
- Sixteen vocabulary flashcards with spaced review intervals.
- Conservative basic grammar correction with English and Hindi explanations. Unknown sentences are not labelled correct.
- Four guided conversation scenarios with saved transcripts and resumable history.
- Microphone permission, recording, playback, a one-minute recording limit, and temporary recording cleanup.
- Repeat-a-sentence practice with **text word match**, explicitly separate from acoustic pronunciation assessment.
- Progress, calendar-based streaks, weekly practice, and earned milestones. Lesson and flashcard minutes are estimates; voice practice uses recorded duration.
- SQLite tables, foreign keys, transactional persistence, schema version tracking, and bundled content seeding on Android.
- Validated JSON export/restore, clear conversations, and delete local profile controls.
- No backend, sign-in, cloud inference, or analytics.

## Native integration

`modules/sherpa-onnx` is a local Expo/Kotlin module. Its source provides:

- Available and total memory detection.
- Install-time model copying into private storage with SHA-256 validation.
- Sherpa Whisper ASR integration with Android AAC/PCM decoding and mono conversion, compiled when the upstream AAR is present.
- Honest unavailable-engine errors when speech assets are absent.
- Android TTS restricted to installed voices that do not require a network. This fallback does **not** fulfil the specification's bundled voice requirement.

The local tutor uses `llama.rn`, which wraps llama.cpp in native C++/JNI. It is not a server call. Inference is gated on available memory, uses a bounded context, and releases its context after each response. Low-memory devices use guided practice and basic rules. Model candidates and memory thresholds still require real device benchmarks.

See [model setup](assets/models/README.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Remaining before the first offline AI APK

1. Select, benchmark, license-check, and bundle multilingual Whisper ASR and a quantized tutor GGUF. Add verified files and notices to the manifest; include the matching Sherpa AAR.
2. Implement and bundle Sherpa English and Hindi TTS voices. The current adapter only supports installed Android offline voices.
3. Compile native Android code against the selected AAR and runtime versions; verify the JNI ABI and native library page-size compatibility.
4. Build an APK and test voice → English/Hindi ASR → tutor feedback → offline TTS repeatedly in airplane mode.
5. Benchmark 4/6/8 GB devices for memory, temperature, latency, Hindi quality, and load/unload stability.
6. Implement a validated acoustic pronunciation model if acoustic scoring is required. Word overlap is not a pronunciation score.
7. Check the merged **release** manifest and network activity; assess installation size and install-time model packaging.

## Checks

```bash
npm run check
npm run export:web
npm run export:android
npm run models:validate
```

`node scripts/validate-models.mjs --release` must fail until required model packages and the Sherpa AAR exist. It validates assets; it does not replace device acceptance testing.

Verified in this workspace: TypeScript checks, 10 automated learning/database checks, 3 browser tests (including microphone capture with a simulated microphone), Android prebuild, and web/Android JavaScript exports. The generated main manifest removes INTERNET and disables Android automatic backup; the merged release manifest still requires an Android build to verify.

Browser smoke tests use the installed Chrome executable by default:

```bash
npm run test:e2e
```

Set `CHROME_PATH` if Chrome is elsewhere. The tests serve the exported `dist` folder, use an isolated browser profile, and verify onboarding, real quiz completion, vocabulary, grammar, conversations, persistence, and deletion.
