import { Text, View } from "react-native";
import { Award, BookOpen, Flame, Mic, Sparkles } from "lucide-react-native";
import {
  Body,
  Card,
  Label,
  Page,
  Section,
  Title,
  s,
} from "../../src/components/ui";
import { useLearning } from "../../src/stores/LearningProvider";
import { addDays, localDate, streak } from "../../src/features/learning";
import { lessons } from "../../assets/content/lessons";
import { colors as c } from "../../src/theme";
export default function Progress() {
  const { state } = useLearning();
  const activities = state.activities;
  const completed = new Set(
    activities.filter((a) => a.type === "lesson").map((a) => a.reference),
  ).size;
  const minutes = activities.reduce((sum, a) => sum + a.minutes, 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(localDate(), i - 6));
  const totals = days.map((d) =>
    activities
      .filter((a) => a.date === d)
      .reduce((sum, a) => sum + a.minutes, 0),
  );
  const max = Math.max(state.profile!.dailyGoal, ...totals);
  const speaking = activities.filter(
    (a) => a.type === "speaking" && a.score !== undefined,
  );
  const avg = speaking.length
    ? Math.round(
        speaking.reduce((sum, a) => sum + (a.score ?? 0), 0) / speaking.length,
      )
    : null;
  return (
    <Page
      title="Look how you’re growing."
      subtitle="Every small effort leaves a little mark."
    >
      <Card
        style={{ backgroundColor: c.primaryLight, borderColor: c.primaryLight }}
      >
        <View style={s.row}>
          <View
            style={{
              padding: 13,
              backgroundColor: "#FFFFFF88",
              borderRadius: 18,
            }}
          >
            <Flame size={27} color={c.primary} />
          </View>
          <View style={{ gap: 4 }}>
            <Title small>{streak(activities)} day streak</Title>
            <Body style={{ fontSize: 12 }}>
              Keep showing up for your future self.
            </Body>
          </View>
        </View>
      </Card>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          {
            value: completed,
            label: "Lessons completed",
            icon: BookOpen,
            bg: c.orangeLight,
          },
          {
            value: state.reviews.length,
            label: "Words explored",
            icon: Sparkles,
            bg: c.lavender,
          },
        ].map((x) => (
          <Card key={x.label} style={{ flex: 1, padding: 18 }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: x.bg,
                padding: 10,
                borderRadius: 13,
              }}
            >
              <x.icon size={20} color={c.primary} />
            </View>
            <Text style={{ fontSize: 30, fontWeight: "700", color: c.ink }}>
              {x.value}
            </Text>
            <Text style={{ fontSize: 11, color: c.muted }}>{x.label}</Text>
          </Card>
        ))}
      </View>
      <Section title="Your week, one day at a time" />
      <Card>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <Label>PRACTICE MINUTES</Label>
          <Text style={{ fontSize: 13, fontWeight: "700", color: c.primary }}>
            {Math.round(totals.reduce((a, b) => a + b, 0))} min this week
          </Text>
        </View>
        <View
          style={{
            height: 145,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 12,
            paddingTop: 12,
          }}
        >
          {days.map((d, i) => (
            <View key={d} style={{ flex: 1, alignItems: "center", gap: 9 }}>
              <Text style={{ fontSize: 10, color: c.muted }}>
                {totals[i] ? Math.round(totals[i]) : ""}
              </Text>
              <View
                style={{
                  width: "85%",
                  height: Math.max(5, (totals[i] / max) * 100),
                  borderRadius: 7,
                  backgroundColor: i === 6 ? c.primary : "#CBDDC2",
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: i === 6 ? c.primary : c.muted,
                  fontWeight: i === 6 ? "800" : "400",
                }}
              >
                {new Date(`${d}T12:00:00`).toLocaleDateString("en", {
                  weekday: "narrow",
                })}
              </Text>
            </View>
          ))}
        </View>
        <Body style={{ fontSize: 10 }}>
          Daily goal: {state.profile!.dailyGoal} minutes · Includes estimated
          lesson time.
        </Body>
      </Card>
      <Section title="Little milestones" />
      <Card>
        {[
          {
            title: "The first step",
            sub: "Complete your first learning activity",
            done: activities.length > 0,
          },
          {
            title: "Finding your rhythm",
            sub: "Complete 3 different lessons",
            done: completed >= 3,
          },
          {
            title: "A growing vocabulary",
            sub: "Explore 10 words",
            done: state.reviews.length >= 10,
          },
          {
            title: "A week of showing up",
            sub: "Build a 7-day practice streak",
            done: streak(activities) >= 7,
          },
        ].map((a) => (
          <View key={a.title} style={[s.row, { paddingVertical: 8, gap: 14 }]}>
            <Award size={29} color={a.done ? c.primary : "#C9CFC4"} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: a.done ? c.ink : c.muted,
                }}
              >
                {a.title}
              </Text>
              <Text style={{ fontSize: 10, color: c.muted }}>{a.sub}</Text>
            </View>
            {a.done && (
              <Text
                style={{ fontSize: 10, color: c.primary, fontWeight: "700" }}
              >
                Earned
              </Text>
            )}
          </View>
        ))}
      </Card>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <View>
          <Label>TIME WELL SPENT</Label>
          <Title small>{Math.round(minutes)} minutes</Title>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Mic size={20} color={c.primary} />
          <Body style={{ fontSize: 11 }}>
            {avg === null
              ? "Try a speaking exercise"
              : `${avg}% average word match`}
          </Body>
        </View>
      </View>
      <Body style={{ fontSize: 11 }}>
        You’ve completed {completed} of {lessons.length} lessons. Progress is
        personal — take it at your pace.
      </Body>
    </Page>
  );
}
