import { useState } from "react";
import { TextInput, Text } from "react-native";
import { Volume2 } from "lucide-react-native";
import { AudioPractice } from "../../src/components/AudioPractice";
import {
  Body,
  Button,
  Card,
  Label,
  Notice,
  Page,
  Title,
  s,
} from "../../src/components/ui";
import { useLearning } from "../../src/stores/LearningProvider";
import { wordMatch } from "../../src/features/learning";
import { speak } from "../../src/ai/engine";
import { colors as c } from "../../src/theme";
const prompts = [
  "I am learning something new every day.",
  "Could I have a cup of tea, please?",
  "It is nice to meet you.",
  "I look forward to working with you.",
  "With practice, I can speak with confidence.",
];
export default function Pronunciation() {
  const { state, activity } = useLearning();
  const [index, setIndex] = useState(0),
    [text, setText] = useState(""),
    [seconds, setSeconds] = useState(0),
    [source, setSource] = useState<"voice" | "text">("text"),
    [score, setScore] = useState<number | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const expected = prompts[index];
  async function assess() {
    setBusy(true);
    try {
      const match = wordMatch(expected, text);
      await activity(
        "speaking",
        source === "voice" ? "voice-repeat" : "text-repeat",
        seconds / 60,
        match.accuracy,
        { expected, recognized: text, source, durationSeconds: seconds },
      );
      setScore(match.accuracy);
    } catch {
      setError("Could not save your practice. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      back
      title="One sentence. One small step."
      subtitle="Listen first. Then say it in your own voice."
    >
      <Card>
        <Label>
          LISTEN & REPEAT · {index + 1} OF {prompts.length}
        </Label>
        <Text
          style={{
            fontSize: 23,
            fontWeight: "700",
            lineHeight: 33,
            color: c.ink,
            letterSpacing: -0.5,
          }}
        >
          {expected}
        </Text>
        <Button
          title="Hear this sentence"
          secondary
          icon={<Volume2 size={16} color={c.primary} />}
          onPress={() =>
            speak(expected, "en", state.profile!.speechSpeed).catch((e) =>
              setError(e.message),
            )
          }
        />
      </Card>
      <AudioPractice
        onTranscript={(t, s) => {
          setText(t);
          setSeconds(s);
          setSource("voice");
          setScore(null);
        }}
      />
      <Card>
        <Label>
          {source === "voice"
            ? "YOUR RECOGNISED WORDS"
            : "OR TRY THE SENTENCE IN TEXT"}
        </Label>
        <TextInput
          accessibilityLabel="Your spoken or typed sentence"
          value={text}
          onChangeText={(t) => {
            setText(t);
            setSource("text");
            setScore(null);
            setSeconds(0);
          }}
          placeholder="Your recognised words appear here. You can also type."
          placeholderTextColor={c.muted}
          multiline
          maxLength={500}
          style={[s.input, { minHeight: 100, textAlignVertical: "top" }]}
        />
        <Button
          title="Compare my words"
          disabled={!text.trim()}
          busy={busy}
          onPress={assess}
        />
      </Card>
      {score !== null && (
        <Card
          style={{
            backgroundColor: c.primaryLight,
            borderColor: c.primaryLight,
          }}
        >
          <Label>
            {source === "voice" ? "RECOGNISED" : "TYPED"} WORD MATCH
          </Label>
          <Title>{score}%</Title>
          <Body color={c.ink}>
            {score === 100
              ? "All the words are there. Keep making them feel natural."
              : "A useful next step: listen once more and try the sentence slowly."}
          </Body>
          <Body style={{ fontSize: 11 }}>
            This compares words in text. It does not assess accent, sounds, or
            acoustic pronunciation.
          </Body>
        </Card>
      )}
      <Button
        title="Try the next sentence"
        secondary
        onPress={() => {
          setIndex((index + 1) % prompts.length);
          setText("");
          setScore(null);
          setSeconds(0);
        }}
      />
      {!!error && <Notice error>{error}</Notice>}
    </Page>
  );
}
