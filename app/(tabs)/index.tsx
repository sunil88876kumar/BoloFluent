import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Leaf,
  Mic,
  Sparkles,
  Sun,
  Target,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Body,
  Card,
  Label,
  OfflineBadge,
  Page,
  ProgressBar,
  Section,
  Title,
  s,
} from "../../src/components/ui";
import { colors as c } from "../../src/theme";
import { useLearning } from "../../src/stores/LearningProvider";
import { localDate, streak } from "../../src/features/learning";
import { lessons, words } from "../../assets/content/lessons";
export default function Home() {
  const { state } = useLearning();
  const p = state.profile!;
  const today = state.activities.filter((a) => a.date === localDate());
  const minutes = today.reduce((s, a) => s + a.minutes, 0);
  const complete = new Set(
    state.activities
      .filter((a) => a.type === "lesson")
      .map((a) => Number(a.reference)),
  );
  const next =
    lessons.find((l) => l.level === p.level && !complete.has(l.id)) ??
    lessons.find((l) => !complete.has(l.id)) ??
    lessons[0];
  const word = words[(new Date().getDate() - 1) % words.length];
  const hour = new Date().getHours();
  return (
    <Page>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <View style={[s.row, { gap: 6 }]}>
          <AudioLines size={22} color={c.primary} />
          <Text
            style={{
              fontSize: 19,
              fontWeight: "800",
              color: c.primary,
              letterSpacing: -0.8,
            }}
          >
            BoloFluent<Text style={{ color: c.orange }}>·</Text>
          </Text>
        </View>
        <OfflineBadge />
      </View>
      <View style={{ gap: 8, marginTop: 3 }}>
        <View style={s.row}>
          <Sun size={14} color={c.orange} />
          <Label>YOUR DAILY DOSE OF CONFIDENCE</Label>
        </View>
        <Title>
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"},{" "}
          {p.name.split(" ")[0]} <Text style={{ fontSize: 25 }}>☀</Text>
        </Title>
        <Body>Every little conversation is a step forward.</Body>
      </View>
      <LinearGradient
        colors={["#265C46", "#163F32"]}
        style={{ borderRadius: 25, padding: 23, gap: 20, overflow: "hidden" }}
      >
        <View
          style={{
            position: "absolute",
            right: -20,
            top: -40,
            width: 150,
            height: 150,
            borderRadius: 80,
            borderWidth: 22,
            borderColor: "#376C51",
          }}
        />
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <View style={s.row}>
            <Target size={16} color="#B6D3AE" />
            <Label color="#C6DDC0">TODAY’S LITTLE GOAL</Label>
          </View>
          <View
            style={[
              s.row,
              {
                backgroundColor: "#ffffff16",
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 12,
              },
            ]}
          >
            <Flame size={13} color="#F3B879" />
            <Text style={{ color: "#FFF2D9", fontSize: 11, fontWeight: "700" }}>
              {streak(state.activities)} day streak
            </Text>
          </View>
        </View>
        <View>
          <Text
            style={{
              fontSize: 37,
              fontWeight: "700",
              letterSpacing: -1,
              color: "#fff",
            }}
          >
            {Math.floor(minutes)}
            <Text style={{ fontSize: 16, color: "#BBD2B8", fontWeight: "400" }}>
              {" "}
              / {p.dailyGoal} min
            </Text>
          </Text>
          <Text style={{ fontSize: 12, color: "#C2D8BD", marginTop: 5 }}>
            {minutes >= p.dailyGoal
              ? "You showed up for yourself. Beautiful work."
              : "A few minutes today. A more confident you tomorrow."}
          </Text>
        </View>
        <ProgressBar value={minutes / p.dailyGoal} color="#C5DDAA" />
      </LinearGradient>
      <Section
        title="Keep your momentum"
        action="All lessons"
        onPress={() => router.push("/(tabs)/learn")}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/lessons/${next.id}`)}
      >
        <Card>
          <View style={s.row}>
            <View
              style={{
                backgroundColor: c.orangeLight,
                borderRadius: 15,
                padding: 13,
              }}
            >
              <BookOpen size={25} color="#BD864A" />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Label>YOUR NEXT LESSON · {next.minutes} MIN</Label>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: c.ink,
                  letterSpacing: -0.4,
                }}
              >
                {next.title}
              </Text>
              <Text style={{ fontSize: 12, color: c.muted }}>
                {next.subtitle}
              </Text>
            </View>
            <ChevronRight size={20} color={c.primary} />
          </View>
          <View style={s.divider} />
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <Text style={{ fontSize: 11, color: c.muted }}>
              Your {p.level} journey
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "700", color: c.primary }}>
              {complete.size} / {lessons.length} lessons
            </Text>
          </View>
          <ProgressBar value={complete.size / lessons.length} />
        </Card>
      </Pressable>
      <Section title="Make a little room to grow" />
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          {
            title: "Let’s talk",
            sub: "Find your speaking flow",
            icon: Mic,
            bg: c.primaryLight,
            color: c.primary,
            route: "/(tabs)/speaking",
          },
          {
            title: "Word by word",
            sub: "Build your vocabulary",
            icon: Sparkles,
            bg: c.lavender,
            color: c.purple,
            route: "/vocabulary",
          },
        ].map((x) => (
          <Pressable
            key={x.title}
            accessibilityRole="button"
            onPress={() => router.push(x.route as "/vocabulary")}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                backgroundColor: x.bg,
                borderColor: x.bg,
                minHeight: 158,
                padding: 18,
              }}
            >
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <x.icon size={25} color={x.color} />
                <ArrowRight size={15} color={x.color} />
              </View>
              <View style={{ gap: 5, marginTop: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: c.ink }}>
                  {x.title}
                </Text>
                <Text style={{ fontSize: 10, color: c.muted, lineHeight: 16 }}>
                  {x.sub}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
      <Section title="A word to take with you" />
      <Card style={{ backgroundColor: "#F0F2E8", borderColor: "#E5E9DA" }}>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <Label>WORD OF THE DAY</Label>
          <Leaf size={17} color={c.primary} />
        </View>
        <View style={[s.row, { alignItems: "baseline", gap: 12 }]}>
          <Text
            style={{
              fontSize: 25,
              fontWeight: "700",
              color: c.ink,
              letterSpacing: -0.8,
            }}
          >
            {word.word}
          </Text>
          {p.language === "hi" && (
            <Text style={{ fontSize: 14, color: c.primary }}>{word.hindi}</Text>
          )}
        </View>
        <Body style={{ fontSize: 12 }}>{word.meaning}</Body>
        <Text
          style={{
            fontSize: 12,
            color: c.primary,
            lineHeight: 20,
            fontStyle: "italic",
          }}
        >
          “{word.example}”
        </Text>
      </Card>
      <View style={[s.row, { justifyContent: "center", paddingVertical: 5 }]}>
        <Check size={13} color={c.muted} />
        <Text style={{ fontSize: 10, color: c.muted }}>
          Your pace. Your progress. Your voice.
        </Text>
      </View>
    </Page>
  );
}
