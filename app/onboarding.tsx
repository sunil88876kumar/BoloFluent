import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  AudioLines,
  Check,
  Leaf,
  ShieldCheck,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
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
} from "../src/components/ui";
import { useLearning } from "../src/stores/LearningProvider";
import { colors as c } from "../src/theme";
import type { Language, Level } from "../src/types";
export default function Onboarding() {
  const { setProfile } = useLearning();
  const [step, setStep] = useState(0),
    [name, setName] = useState(""),
    [language, setLanguage] = useState<Language>("hi"),
    [level, setLevel] = useState<Level>("beginner"),
    [goal, setGoal] = useState(15),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function finish() {
    setBusy(true);
    try {
      await setProfile({
        name: name.trim(),
        language,
        level,
        dailyGoal: goal,
        speechSpeed: 0.9,
      });
      router.replace("/(tabs)");
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <View style={s.row}>
          <AudioLines size={25} color={c.primary} />
          <Text
            style={{
              fontWeight: "800",
              fontSize: 20,
              color: c.primary,
              letterSpacing: -0.7,
            }}
          >
            BoloFluent
          </Text>
        </View>
        <Label>YOUR NEW CHAPTER</Label>
      </View>
      {step === 0 ? (
        <>
          <LinearGradient
            colors={["#DCEBD5", "#EDF1DB"]}
            style={{
              height: 290,
              borderRadius: 35,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: 230,
                height: 230,
                borderRadius: 130,
                borderWidth: 1,
                borderColor: "#C8D9BE",
              }}
            />
            <View
              style={{
                position: "absolute",
                width: 300,
                height: 300,
                borderRadius: 160,
                borderWidth: 1,
                borderColor: "#CFDFC6",
              }}
            />
            <View
              style={{
                backgroundColor: c.primary,
                padding: 28,
                borderRadius: 35,
                transform: [{ rotate: "-8deg" }],
              }}
            >
              <AudioLines color="#fff" size={70} />
            </View>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 13,
                position: "absolute",
                bottom: 30,
                right: 23,
              }}
            >
              <Text style={{ color: c.primary, fontWeight: "700" }}>
                Hello! · नमस्ते!
              </Text>
            </View>
            <Leaf
              size={28}
              color={c.primary}
              style={{ position: "absolute", top: 35, left: 35 }}
            />
          </LinearGradient>
          <View style={{ gap: 14 }}>
            <Label>SMALL STEPS. A STRONGER VOICE.</Label>
            <Title>
              Find your words.<Text>{"\n"}Find your confidence.</Text>
            </Title>
            <Body>
              Your English journey, at your pace. Learn, practise, and grow —
              wherever life takes you.
            </Body>
          </View>
          <Card>
            <View style={s.row}>
              <Check size={17} color={c.primary} />
              <Body color={c.ink}>English lessons with Hindi support</Body>
            </View>
            <View style={s.row}>
              <Check size={17} color={c.primary} />
              <Body color={c.ink}>A little practice, every day</Body>
            </View>
            <View style={s.row}>
              <ShieldCheck size={17} color={c.primary} />
              <Body color={c.ink}>Private learning, saved on your device</Body>
            </View>
          </Card>
          <Button
            title="Let’s begin"
            onPress={() => setStep(1)}
            icon={<ArrowRight size={18} color="#fff" />}
          />
        </>
      ) : (
        <>
          <View style={{ gap: 10, marginTop: 20 }}>
            <Label>MAKE YOURSELF AT HOME</Label>
            <Title>A journey that’s yours.</Title>
            <Body>A few little details to make your practice feel right.</Body>
          </View>
          <View style={{ gap: 10 }}>
            <Label>WHAT SHOULD WE CALL YOU?</Label>
            <TextInput
              accessibilityLabel="Your name"
              placeholder="Your first name"
              value={name}
              onChangeText={setName}
              maxLength={40}
              autoCapitalize="words"
              style={s.input}
              placeholderTextColor={c.muted}
            />
          </View>
          <View style={{ gap: 12 }}>
            <Label>EXPLANATIONS IN</Label>
            <View style={s.row}>
              <Chip
                selected={language === "hi"}
                onPress={() => setLanguage("hi")}
              >
                English + हिन्दी
              </Chip>
              <Chip
                selected={language === "en"}
                onPress={() => setLanguage("en")}
              >
                English
              </Chip>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            <Label>YOUR STARTING POINT</Label>
            {(["beginner", "intermediate", "advanced"] as const).map((l, i) => (
              <Chip key={l} selected={level === l} onPress={() => setLevel(l)}>
                {
                  [
                    "Just getting started",
                    "I know the basics",
                    "Ready for a challenge",
                  ][i]
                }
              </Chip>
            ))}
          </View>
          <View style={{ gap: 12 }}>
            <Label>A LITTLE TIME FOR YOU</Label>
            <View style={s.row}>
              {[5, 10, 15, 20].map((g) => (
                <Chip key={g} selected={goal === g} onPress={() => setGoal(g)}>
                  {g} min
                </Chip>
              ))}
            </View>
          </View>
          {!!error && <Notice error>{error}</Notice>}
          <Button
            title="Start my journey"
            disabled={!name.trim()}
            busy={busy}
            onPress={finish}
          />
          <Body style={{ fontSize: 11, textAlign: "center" }}>
            No account. No subscription. Just you and your next step.
          </Body>
        </>
      )}
    </Page>
  );
}
