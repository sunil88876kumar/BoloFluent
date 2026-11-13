import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Award, Check, Volume2 } from "lucide-react-native";
import {
  Body,
  Button,
  Card,
  Label,
  Notice,
  Page,
  ProgressBar,
  Title,
  s,
} from "../../src/components/ui";
import { lessons } from "../../assets/content/lessons";
import { useLearning } from "../../src/stores/LearningProvider";
import { speak } from "../../src/ai/engine";
import { colors as c } from "../../src/theme";
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessons.find((l) => String(l.id) === id);
  const { state, activity } = useLearning();
  const [step, setStep] = useState(-1),
    [answer, setAnswer] = useState<number | null>(null),
    [score, setScore] = useState(0),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!lesson)
    return (
      <Page back title="Lesson not found">
        <Body>Return to Learn and choose another lesson.</Body>
      </Page>
    );
  const exercise = lesson.exercises[step];
  async function next() {
    if (!lesson) return;
    const newScore = score + (answer === lesson.exercises[step].answer ? 1 : 0);
    setScore(newScore);
    if (step + 1 < lesson.exercises.length) {
      setStep(step + 1);
      setAnswer(null);
    } else {
      setBusy(true);
      try {
        await activity(
          "lesson",
          String(lesson.id),
          lesson.minutes,
          Math.round((newScore / lesson.exercises.length) * 100),
        );
        setDone(true);
      } catch {
        setError("Your lesson could not be saved. Please try again.");
        setScore(score);
      } finally {
        setBusy(false);
      }
    }
  }
  return (
    <Page back>
      <Label>
        {lesson.category} · {lesson.minutes} MIN
      </Label>
      <Title>{lesson.title}</Title>
      {done ? (
        <>
          <Card style={{ alignItems: "center", paddingVertical: 35 }}>
            <View
              style={{
                backgroundColor: c.primaryLight,
                borderRadius: 50,
                padding: 20,
              }}
            >
              <Award size={45} color={c.primary} />
            </View>
            <Title small>One more little win.</Title>
            <Body>
              You answered {score} of {lesson.exercises.length} questions
              correctly.
            </Body>
            <Body>Your progress is saved on this device.</Body>
          </Card>
          <Button
            title="Keep growing"
            onPress={() => router.replace("/(tabs)/learn")}
          />
        </>
      ) : step === -1 ? (
        <>
          <Body>
            {lesson.subtitle}. Read these phrases, then try a quick check.
          </Body>
          {lesson.phrases.map((p, i) => (
            <Card key={p.en}>
              <Label>PHRASE {i + 1}</Label>
              <Text
                style={{
                  color: c.ink,
                  fontWeight: "700",
                  fontSize: 19,
                  lineHeight: 28,
                }}
              >
                {p.en}
              </Text>
              {state.profile?.language === "hi" && <Body>{p.hi}</Body>}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Listen to ${p.en}`}
                onPress={() =>
                  speak(p.en, "en", state.profile?.speechSpeed).catch((e) =>
                    setError(e.message),
                  )
                }
                style={s.row}
              >
                <Volume2 size={17} color={c.primary} />
                <Text
                  style={{ fontSize: 12, color: c.primary, fontWeight: "600" }}
                >
                  Listen & repeat
                </Text>
              </Pressable>
            </Card>
          ))}
          <Button title="Try a quick check" onPress={() => setStep(0)} />
        </>
      ) : (
        <>
          <ProgressBar value={step / lesson.exercises.length} />
          <Label>
            QUESTION {step + 1} OF {lesson.exercises.length}
          </Label>
          <Title small>{exercise.prompt}</Title>
          {exercise.options.map((o, i) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: answer === i }}
              disabled={answer !== null}
              key={o}
              onPress={() => setAnswer(i)}
            >
              <Card
                style={{
                  borderColor:
                    answer === i
                      ? i === exercise.answer
                        ? c.primary
                        : c.danger
                      : c.line,
                  backgroundColor:
                    answer === i
                      ? i === exercise.answer
                        ? c.primaryLight
                        : "#FCEDEA"
                      : c.surface,
                }}
              >
                <View style={s.row}>
                  <Text
                    style={{ color: c.muted, fontWeight: "700", fontSize: 12 }}
                  >
                    {String.fromCharCode(65 + i)}
                  </Text>
                  <Text style={{ color: c.ink, fontSize: 15, flex: 1 }}>
                    {o}
                  </Text>
                  {answer === i && i === exercise.answer && (
                    <Check size={18} color={c.primary} />
                  )}
                </View>
              </Card>
            </Pressable>
          ))}
          {answer !== null && (
            <Notice>
              {answer === exercise.answer
                ? "That’s right! "
                : `A little adjustment: “${exercise.options[exercise.answer]}” `}
              {exercise.explanation}
              {state.profile?.language === "hi" ? `\n${exercise.hindi}` : ""}
            </Notice>
          )}
          <Button
            title={
              step + 1 === lesson.exercises.length
                ? "Finish lesson"
                : "Next question"
            }
            disabled={answer === null}
            busy={busy}
            onPress={next}
          />
        </>
      )}
      {!!error && <Notice error>{error}</Notice>}
    </Page>
  );
}
