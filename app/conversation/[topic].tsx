import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Send, Volume2 } from "lucide-react-native";
import { AudioPractice } from "../../src/components/AudioPractice";
import {
  Body,
  Button,
  Chip,
  Label,
  Notice,
  Page,
  Title,
  s,
} from "../../src/components/ui";
import { useLearning } from "../../src/stores/LearningProvider";
import { topics } from "../../assets/content/lessons";
import { correctWithRules } from "../../src/ai/grammar";
import { releaseEngine, speak, tutorReply } from "../../src/ai/engine";
import type { Message } from "../../src/types";
import { colors as c } from "../../src/theme";
export default function Conversation() {
  const { topic, session } = useLocalSearchParams<{
    topic: string;
    session?: string;
  }>();
  const t = topics.find((x) => x.id === topic) ?? topics[0];
  const { state, conversation, activity } = useLearning();
  const saved = state.conversations.find((c) => c.id === session);
  const id = useRef(saved?.id ?? `conversation-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>(
    saved?.messages ?? [
      { id: `hello-${id.current}`, role: "assistant", text: t.opening },
    ],
  );
  const [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"guided" | "model">("guided"),
    [input, setInput] = useState<"text" | "voice">("text"),
    [error, setError] = useState("");
  const active = useRef(true),
    sending = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      active.current = true;
      return () => {
        active.current = false;
        void releaseEngine();
      };
    }, []),
  );
  async function send(value = text, seconds = 0) {
    if (!value.trim() || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const user: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: value.trim().slice(0, 500),
    };
    const next = [...messages, user];
    try {
      let response: string | null = null;
      try {
        response = await tutorReply(next, state.profile!.language);
      } catch {
        if (active.current)
          setError(
            "The local tutor could not run. Continuing with guided prompts.",
          );
      }
      if (!active.current) return;
      setMode(response ? "model" : "guided");
      if (!response) {
        const turn = next.filter((m) => m.role === "user").length - 1;
        const correction = correctWithRules(value);
        response =
          (correction.changed
            ? `Try: “${correction.corrected}” ${correction.explanation}${state.profile!.language === "hi" ? `\n${correction.hindi}` : ""}\n\n`
            : "") + t.prompts[turn % t.prompts.length];
      }
      const complete = [
        ...next,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant" as const,
          text: response,
        },
      ];
      await conversation({
        id: id.current,
        topic: t.id,
        messages: complete,
        updatedAt: new Date().toISOString(),
      });
      await activity("speaking", t.id, seconds / 60);
      if (active.current) {
        setMessages(complete);
        setText("");
      }
    } catch (e) {
      if (active.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      sending.current = false;
      if (active.current) setBusy(false);
    }
  }
  return (
    <Page back>
      <View style={{ gap: 7 }}>
        <Label>
          {mode === "model" ? "ON-DEVICE TUTOR" : "GUIDED CONVERSATION"}
        </Label>
        <Title>{t.title}</Title>
        <Body>{t.description}</Body>
      </View>
      {mode === "guided" && (
        <Notice>
          Practise with prepared conversation prompts and basic grammar checks.
          Free conversation needs the local tutor model.
        </Notice>
      )}
      <View style={{ gap: 15 }}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "94%",
              backgroundColor: m.role === "user" ? c.primary : c.surface,
              borderRadius: 20,
              padding: 18,
              gap: 9,
              borderWidth: m.role === "user" ? 0 : 1,
              borderColor: c.line,
            }}
          >
            <Label color={m.role === "user" ? "#BFD6B5" : c.muted}>
              {m.role === "user"
                ? "YOU"
                : mode === "model"
                  ? "BOLO · LOCAL TUTOR"
                  : "BOLO · PRACTICE PROMPT"}
            </Label>
            <Text
              style={{
                fontSize: 14,
                lineHeight: 23,
                color: m.role === "user" ? "#fff" : c.ink,
              }}
            >
              {m.text}
            </Text>
            {m.role === "assistant" && (
              <Button
                title="Listen"
                secondary
                onPress={() =>
                  speak(m.text, "en", state.profile!.speechSpeed).catch((e) =>
                    setError(e.message),
                  )
                }
                icon={<Volume2 size={14} color={c.primary} />}
              />
            )}
          </View>
        ))}
      </View>
      <View style={s.row}>
        <Chip selected={input === "text"} onPress={() => setInput("text")}>
          Type a reply
        </Chip>
        <Chip selected={input === "voice"} onPress={() => setInput("voice")}>
          Use my voice
        </Chip>
      </View>
      {input === "voice" && (
        <AudioPractice
          allowHindi
          onTranscript={(value, seconds) => send(value, seconds)}
        />
      )}
      <TextInput
        accessibilityLabel="Your conversation reply"
        placeholder="Take your time. What would you say?"
        placeholderTextColor={c.muted}
        value={text}
        onChangeText={setText}
        maxLength={500}
        multiline
        style={[s.input, { minHeight: 95, textAlignVertical: "top" }]}
      />
      <Button
        title={busy ? "A moment for your reply…" : "Send my reply"}
        busy={busy}
        disabled={!text.trim()}
        onPress={() => send()}
        icon={<Send size={16} color="#fff" />}
      />
      {!!error && <Notice error>{error}</Notice>}
      <Body style={{ textAlign: "center", fontSize: 10 }}>
        Your conversation is saved only on this device.
      </Body>
    </Page>
  );
}
