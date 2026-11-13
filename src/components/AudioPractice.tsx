import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Mic, Play, Square } from "lucide-react-native";
import { Button, Chip, Label, Notice, s } from "./ui";
import { transcribe, releaseEngine } from "../ai/engine";
import { discardRecording } from "../services/recordings";
import type { Language } from "../types";
import { colors as c } from "../theme";
export function AudioPractice({
  language = "en",
  onTranscript,
  allowHindi = false,
}: {
  language?: Language;
  onTranscript: (text: string, seconds: number) => void;
  allowHindi?: boolean;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY),
    recording = useAudioRecorderState(recorder, 200),
    player = useAudioPlayer();
  const [busy, setBusy] = useState(false),
    [recognitionLanguage, setRecognitionLanguage] =
      useState<Language>(language),
    [uri, setUri] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const latest = useRef<string | null>(null),
    focused = useRef(true),
    busyRef = useRef(false);
  const cleanup = useCallback(async () => {
    focused.current = false;
    try {
      if (recorder.isRecording) await recorder.stop();
    } catch {
      /* Recorder may already be disposed. */
    }
    try {
      player.pause();
    } catch {
      /* Player may already be disposed. */
    }
    const path = latest.current ?? recorder.uri;
    if (path) discardRecording(path);
    latest.current = null;
    setUri(null);
    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      /* Audio session may already be closed. */
    }
    await releaseEngine();
  }, [recorder, player]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setBusy(busyRef.current);
      return () => {
        void cleanup();
      };
    }, [cleanup]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") void cleanup();
      else {
        focused.current = true;
        setBusy(busyRef.current);
      }
    });
    return () => sub.remove();
  }, [cleanup]);
  useEffect(() => {
    if (recording.durationMillis >= 60000 && recording.isRecording)
      void toggle();
  }, [recording.durationMillis, recording.isRecording]);
  async function toggle() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice("");
    try {
      if (recorder.isRecording) {
        const seconds = recording.durationMillis / 1000;
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        const path = recorder.uri;
        if (!path) throw new Error("No audio was captured. Please try again.");
        latest.current = path;
        if (!focused.current) {
          discardRecording(path);
          return;
        }
        setUri(path);
        player.replace({ uri: path });
        try {
          const result = await transcribe(path, recognitionLanguage);
          if (focused.current) {
            if (result.text.trim()) onTranscript(result.text, seconds);
            else
              setNotice(
                "No words were recognised. Try speaking a little closer to the microphone.",
              );
          }
        } catch (e) {
          if (focused.current)
            setNotice(e instanceof Error ? e.message : String(e));
        }
      } else {
        player.pause();
        if (latest.current) {
          discardRecording(latest.current);
          latest.current = null;
          setUri(null);
        }
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted)
          throw new Error(
            "Microphone access is needed to record. You can allow it in your device settings or continue with text.",
          );
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
        if (!focused.current) return;
        recorder.record();
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      busyRef.current = false;
      if (focused.current) setBusy(false);
    }
  }
  return (
    <View style={{ gap: 17, alignItems: "center" }}>
      {allowHindi && (
        <View style={s.row}>
          <Chip
            selected={recognitionLanguage === "en"}
            onPress={() => {
              if (!busy && !recording.isRecording) setRecognitionLanguage("en");
            }}
          >
            English
          </Chip>
          <Chip
            selected={recognitionLanguage === "hi"}
            onPress={() => {
              if (!busy && !recording.isRecording) setRecognitionLanguage("hi");
            }}
          >
            हिन्दी
          </Chip>
        </View>
      )}
      <View
        style={{
          width: 124,
          height: 124,
          borderRadius: 70,
          backgroundColor: c.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          borderColor: "#DCE7D3",
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: 99,
            height: 99,
            borderRadius: 55,
            backgroundColor: "#D1E2C6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              recording.isRecording ? "Stop recording" : "Start recording"
            }
            disabled={busy}
            onPress={toggle}
            style={{
              height: 77,
              width: 77,
              borderRadius: 45,
              backgroundColor: recording.isRecording ? c.danger : c.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy ? 0.5 : 1,
            }}
          >
            {recording.isRecording ? (
              <Square size={27} color="#fff" fill="#fff" />
            ) : (
              <Mic size={31} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
      <Label>
        {busy
          ? "A MOMENT FOR YOUR WORDS…"
          : recording.isRecording
            ? `RECORDING · ${Math.floor(recording.durationMillis / 1000)}s / 60s`
            : "TAP THE MIC. TAKE YOUR TIME."}
      </Label>
      {uri && (
        <Button
          title="Listen to my recording"
          secondary
          icon={<Play size={15} color={c.primary} />}
          onPress={() => {
            player.seekTo(0);
            player.play();
          }}
        />
      )}
      {!!notice && <Notice>{notice}</Notice>}
      <View style={s.row}>
        <Text style={{ fontSize: 10, color: c.muted, textAlign: "center" }}>
          Your recording stays on this device and is removed after practice.
        </Text>
      </View>
    </View>
  );
}
