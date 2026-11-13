import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flower2,
  Languages,
  SpellCheck,
} from "lucide-react-native";
import {
  Body,
  Card,
  Chip,
  Label,
  Page,
  Section,
  s,
} from "../../src/components/ui";
import { lessons } from "../../assets/content/lessons";
import { useLearning } from "../../src/stores/LearningProvider";
import { colors as c } from "../../src/theme";
export default function Learn() {
  const { state } = useLearning();
  const [filter, setFilter] = useState("All");
  const complete = new Set(
    state.activities
      .filter((a) => a.type === "lesson")
      .map((a) => Number(a.reference)),
  );
  return (
    <Page
      title="A little learning. A lot of you."
      subtitle="Useful English for the life you actually live."
    >
      <Card
        style={{ backgroundColor: c.primaryLight, borderColor: c.primaryLight }}
      >
        <View style={s.row}>
          <Flower2 size={35} color={c.primary} />
          <View style={{ flex: 1, gap: 5 }}>
            <Label>GROW AT YOUR OWN PACE</Label>
            <Text style={{ fontSize: 17, fontWeight: "700", color: c.ink }}>
              Your next chapter starts here.
            </Text>
            <Body style={{ fontSize: 12 }}>
              Every lesson is a small win worth keeping.
            </Body>
          </View>
        </View>
      </Card>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {["All", "beginner", "intermediate", "advanced"].map((f) => (
          <Chip key={f} selected={filter === f} onPress={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </ScrollView>
      <View style={{ gap: 12 }}>
        {lessons
          .filter((l) => filter === "All" || l.level === filter)
          .map((l, i) => (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              onPress={() => router.push(`/lessons/${l.id}`)}
            >
              <Card style={{ padding: 17 }}>
                <View style={[s.row, { gap: 14 }]}>
                  <View
                    style={{
                      height: 48,
                      width: 48,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: complete.has(l.id)
                        ? c.primaryLight
                        : i % 2
                          ? c.lavender
                          : c.orangeLight,
                    }}
                  >
                    {complete.has(l.id) ? (
                      <Check size={23} color={c.primary} />
                    ) : (
                      <BookOpen
                        size={22}
                        color={i % 2 ? c.purple : "#BA8950"}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Label>{l.category}</Label>
                    <Text
                      style={{ fontSize: 17, fontWeight: "700", color: c.ink }}
                    >
                      {l.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: c.muted }}>
                      {l.subtitle}
                    </Text>
                    <View style={s.row}>
                      <Clock3 size={10} color={c.muted} />
                      <Text style={{ fontSize: 10, color: c.muted }}>
                        {l.minutes} min ·{" "}
                        {complete.has(l.id) ? "Completed" : l.level}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={c.primary} />
                </View>
              </Card>
            </Pressable>
          ))}
      </View>
      <Section title="A little extra practice" />
      {[
        {
          title: "Your word garden",
          sub: "Flashcards that come back just when you need them.",
          route: "/vocabulary",
          icon: Languages,
        },
        {
          title: "Grammar, made clearer",
          sub: "Try a sentence. Understand the small changes.",
          route: "/grammar",
          icon: SpellCheck,
        },
      ].map((x) => (
        <Pressable
          accessibilityRole="button"
          key={x.route}
          onPress={() => router.push(x.route as "/grammar")}
        >
          <Card>
            <View style={s.row}>
              <x.icon size={23} color={c.primary} />
              <View style={{ flex: 1, paddingLeft: 8 }}>
                <Text style={{ fontWeight: "700", fontSize: 16, color: c.ink }}>
                  {x.title}
                </Text>
                <Body style={{ fontSize: 11 }}>{x.sub}</Body>
              </View>
              <ArrowUpRight size={17} color={c.primary} />
            </View>
          </Card>
        </Pressable>
      ))}
    </Page>
  );
}
