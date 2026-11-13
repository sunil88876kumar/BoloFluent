import { useState, useRef, useEffect } from "react";
import { TextInput, View } from "react-native";
import { ArrowDown, SpellCheck } from "lucide-react-native";
import {
  Body,
  Button,
  Card,
  Chip,
  Label,
  Notice,
  Page,
  Title,
  s,
} from "../../src/components/ui";
import { correctSentence, releaseEngine } from "../../src/ai/engine";
import type { Correction } from "../../src/ai/grammar";
import { useLearning } from "../../src/stores/LearningProvider";
import { colors as c } from "../../src/theme";
export default function Grammar() {
  const { state, activity } = useLearning();
  const [text, setText] = useState(""),
    [result, setResult] = useState<Correction | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void releaseEngine();
    };
  }, []);
  async function check() {
    setBusy(true);
    setError("");
    try {
      const r = await correctSentence(text, state.profile!.language);
      if (!mounted.current) return;
      setResult(r);
      await activity("grammar", r.original, 0.5, undefined, {
        corrected: r.corrected,
        explanation: r.explanation,
        hindi: r.hindi,
        source: r.source,
      });
    } catch (e) {
      if (mounted.current) setError(String(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Page
      back
      title="Small changes. Clearer English."
      subtitle="Try a sentence and understand what could change."
    >
      <Card>
        <View style={s.row}>
          <SpellCheck size={23} color={c.primary} />
          <Label>YOUR WORDS</Label>
        </View>
        <TextInput
          accessibilityLabel="Sentence to check"
          placeholder="Try: She don't like tea."
          placeholderTextColor={c.muted}
          value={text}
          onChangeText={(v) => {
            setText(v);
            setResult(null);
          }}
          multiline
          maxLength={500}
          style={[
            s.input,
            {
              minHeight: 120,
              textAlignVertical: "top",
              backgroundColor: c.background,
            },
          ]}
        />
        <Button
          title={busy ? "Looking at your sentence…" : "Check my sentence"}
          disabled={!text.trim()}
          busy={busy}
          onPress={check}
        />
      </Card>
      <Label>NEED A LITTLE INSPIRATION?</Label>
      <View style={{ gap: 9 }}>
        {[
          "I am agree with you.",
          "She go to school every day.",
          "I didn’t went to the market.",
        ].map((x) => (
          <Chip
            key={x}
            onPress={() => {
              setText(x);
              setResult(null);
            }}
          >
            {x}
          </Chip>
        ))}
      </View>
      {result && (
        <>
          <View style={{ alignItems: "center" }}>
            <ArrowDown size={22} color={c.muted} />
          </View>
          <Card
            style={{ backgroundColor: c.primaryLight, borderColor: "#D6E3CE" }}
          >
            <Label>
              {result.source === "model"
                ? "LOCAL AI FEEDBACK"
                : "BASIC GRAMMAR FEEDBACK"}
            </Label>
            <Title small>{result.corrected}</Title>
            <View style={s.divider} />
            <Body color={c.ink}>{result.explanation}</Body>
            {state.profile?.language === "hi" && (
              <Body color={c.primary}>{result.hindi}</Body>
            )}
          </Card>
        </>
      )}
      {!!error && <Notice error>{error}</Notice>}
      <Notice>
        Basic mode checks a small set of common patterns. Full sentence feedback
        becomes available when the local tutor model is bundled.
      </Notice>
    </Page>
  );
}
