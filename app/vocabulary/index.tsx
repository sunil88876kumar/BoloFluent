import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Check, RotateCcw, Sparkles, Volume2 } from "lucide-react-native";
import {
  Body,
  Button,
  Card,
  Chip,
  Label,
  Notice,
  Page,
  ProgressBar,
  Title,
  s,
} from "../../src/components/ui";
import { useLearning } from "../../src/stores/LearningProvider";
import { words } from "../../assets/content/lessons";
import { localDate } from "../../src/features/learning";
import { speak } from "../../src/ai/engine";
import { colors as c } from "../../src/theme";
export default function Vocabulary() {
  const { state, review } = useLearning();
  const [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [mode, setMode] = useState<"due" | "all">("due"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const list = words.filter(
    (w) =>
      mode === "all" ||
      !state.reviews.some(
        (r) => r.wordId === w.id && r.nextReview > localDate(),
      ),
  );
  const word = list[index % Math.max(1, list.length)];
  async function rate(remembered: boolean) {
    if (!word) return;
    setBusy(true);
    try {
      await review(word.id, remembered);
      if (mode === "all") setIndex(index + 1);
      setFlipped(false);
    } catch {
      setError("Could not save this review. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      back
      title="Your word garden"
      subtitle="A few new words. A little more possibility."
    >
      <View style={s.row}>
        <Chip
          selected={mode === "due"}
          onPress={() => {
            setMode("due");
            setIndex(0);
            setFlipped(false);
          }}
        >
          Ready to review
        </Chip>
        <Chip
          selected={mode === "all"}
          onPress={() => {
            setMode("all");
            setIndex(0);
            setFlipped(false);
          }}
        >
          All {words.length} words
        </Chip>
      </View>
      <ProgressBar value={state.reviews.length / words.length} />
      <Label>
        {state.reviews.length} WORDS EXPLORED · {list.length}{" "}
        {mode === "due" ? "READY TODAY" : "IN YOUR GARDEN"}
      </Label>
      {word ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip vocabulary card"
            onPress={() => setFlipped(!flipped)}
          >
            <Card
              style={{
                minHeight: 320,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: flipped ? c.primaryLight : c.surface,
                padding: 30,
                gap: 18,
              }}
            >
              <Sparkles size={24} color={c.purple} />
              <Label>{flipped ? "MAKE IT YOURS" : "A WORD TO KNOW"}</Label>
              <Title>{word.word}</Title>
              <Text style={{ color: c.muted, fontSize: 14 }}>
                {word.pronunciation}
              </Text>
              {flipped ? (
                <>
                  <Body color={c.ink} style={{ textAlign: "center" }}>
                    {word.meaning}
                  </Body>
                  {state.profile?.language === "hi" && (
                    <Text style={{ fontSize: 22, color: c.primary }}>
                      {word.hindi}
                    </Text>
                  )}
                  <Body style={{ textAlign: "center", fontStyle: "italic" }}>
                    “{word.example}”
                  </Body>
                </>
              ) : (
                <Body style={{ fontSize: 12 }}>
                  Tap to discover the meaning
                </Body>
              )}
            </Card>
          </Pressable>
          <Button
            title="Listen to this word"
            secondary
            onPress={() =>
              speak(word.word, "en", state.profile?.speechSpeed).catch((e) =>
                setError(e.message),
              )
            }
            icon={<Volume2 size={17} color={c.primary} />}
          />
          {flipped ? (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Practise again"
                  secondary
                  busy={busy}
                  onPress={() => rate(false)}
                  icon={<RotateCcw size={15} color={c.primary} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Got it!"
                  busy={busy}
                  onPress={() => rate(true)}
                  icon={<Check size={15} color="#fff" />}
                />
              </View>
            </View>
          ) : (
            <Button title="Reveal meaning" onPress={() => setFlipped(true)} />
          )}
        </>
      ) : (
        <Card style={{ alignItems: "center", paddingVertical: 35 }}>
          <Check size={40} color={c.primary} />
          <Title small>A little room to rest.</Title>
          <Body>You’ve reviewed everything due today.</Body>
          <Button
            title="Explore all words"
            secondary
            onPress={() => {
              setMode("all");
              setIndex(0);
            }}
          />
        </Card>
      )}
      <Body style={{ fontSize: 11, textAlign: "center" }}>
        Words return for review over time, so you can make them stick.
      </Body>
      {!!error && <Notice error>{error}</Notice>}
    </Page>
  );
}
