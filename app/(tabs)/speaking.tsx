import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowRight,
  AudioLines,
  ChevronRight,
  Mic,
  Quote,
} from "lucide-react-native";
import {
  Body,
  Button,
  Card,
  Label,
  Page,
  Section,
  Title,
  s,
} from "../../src/components/ui";
import { topics } from "../../assets/content/lessons";
import { useLearning } from "../../src/stores/LearningProvider";
import { colors as c } from "../../src/theme";
export default function Speaking() {
  const { state } = useLearning();
  return (
    <Page
      title="Your voice belongs here."
      subtitle="No perfect words needed. Just a little courage."
    >
      <Card
        style={{
          backgroundColor: c.primary,
          borderColor: c.primary,
          padding: 24,
          gap: 20,
        }}
      >
        <View style={s.row}>
          <AudioLines size={19} color="#C5DDAA" />
          <Label color="#C5DDAA">A MOMENT TO SPEAK</Label>
        </View>
        <Text
          style={{
            fontSize: 25,
            lineHeight: 33,
            fontWeight: "700",
            letterSpacing: -0.6,
            color: "#fff",
          }}
        >
          Say it out loud.{`\n`}Make it feel like you.
        </Text>
        <Body color="#C2D5BD" style={{ fontSize: 12 }}>
          Listen, repeat, and get a little more comfortable with everyday
          English.
        </Body>
        <Button
          title="Practise a sentence"
          secondary
          onPress={() => router.push("/pronunciation")}
          icon={<Mic size={17} color={c.primary} />}
        />
      </Card>
      <Section title="A conversation for every day" />
      <Body style={{ fontSize: 12, marginTop: -10 }}>
        Start with guided prompts. A bundled tutor model adds free conversation
        on supported devices.
      </Body>
      <View style={{ gap: 12 }}>
        {topics.map((t) => (
          <Pressable
            accessibilityRole="button"
            key={t.id}
            onPress={() => router.push(`/conversation/${t.id}`)}
          >
            <Card style={{ padding: 18 }}>
              <View style={[s.row, { gap: 14 }]}>
                <View
                  style={{
                    backgroundColor: c.primaryLight,
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 23 }}>{t.icon}</Text>
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: "700", color: c.ink }}
                  >
                    {t.title}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: c.muted, lineHeight: 17 }}
                  >
                    {t.description}
                  </Text>
                </View>
                <ChevronRight size={17} color={c.primary} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
      {state.conversations.length > 0 && (
        <>
          <Section title="Your recent conversations" />
          {state.conversations
            .slice(-3)
            .reverse()
            .map((conv) => (
              <Pressable
                accessibilityRole="button"
                key={conv.id}
                onPress={() =>
                  router.push({
                    pathname: "/conversation/[topic]",
                    params: { topic: conv.topic, session: conv.id },
                  })
                }
              >
                <Card>
                  <View style={s.row}>
                    <Quote size={17} color={c.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: c.ink }}>
                        {topics.find((t) => t.id === conv.topic)?.title ??
                          conv.topic}
                      </Text>
                      <Body style={{ fontSize: 11 }}>
                        {conv.messages.length} messages ·{" "}
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </Body>
                    </View>
                    <ArrowRight size={15} color={c.primary} />
                  </View>
                </Card>
              </Pressable>
            ))}
        </>
      )}
      <View style={{ alignItems: "center", paddingVertical: 10 }}>
        <Title small>Progress sounds like trying.</Title>
      </View>
    </Page>
  );
}
