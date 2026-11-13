import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  AudioLines,
  Download,
  HardDrive,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react-native";
import {
  Body,
  Button,
  Card,
  Chip,
  Label,
  Notice,
  Page,
  Section,
  Title,
  s,
} from "../../src/components/ui";
import { useLearning } from "../../src/stores/LearningProvider";
import { engineStatus } from "../../src/ai/engine";
import { exportBackup, readBackup } from "../../src/services/backup";
import type { LearningState } from "../../src/types";
import { colors as c } from "../../src/theme";
export default function Profile() {
  const { state, setProfile, replace, clearHistory } = useLearning();
  const p = state.profile!;
  const [name, setName] = useState(p.name),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [status, setStatus] = useState<Awaited<
      ReturnType<typeof engineStatus>
    > | null>(null),
    [confirm, setConfirm] = useState<"delete" | "history" | "restore" | null>(
      null,
    ),
    [backup, setBackup] = useState<LearningState | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    engineStatus()
      .then(setStatus)
      .catch((e) => setError(String(e)));
  }, []);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function destructive() {
    await run(async () => {
      if (confirm === "delete") {
        await replace({
          profile: null,
          activities: [],
          reviews: [],
          conversations: [],
        });
        router.replace("/onboarding");
      } else if (confirm === "history") {
        await clearHistory();
        setMessage("Conversation history cleared.");
      } else if (backup) {
        await replace(backup);
        if (!backup.profile) router.replace("/onboarding");
        else setName(backup.profile.name);
        setMessage("Your learning journey has been restored.");
      }
      setConfirm(null);
    });
  }
  return (
    <Page
      title="Your own little corner."
      subtitle="Make BoloFluent feel a little more like you."
    >
      <Card>
        <View style={s.row}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 20,
              backgroundColor: c.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "700", color: c.primary }}>
              {p.name[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ paddingLeft: 8, gap: 4 }}>
            <Title small>{p.name}</Title>
            <Label>{p.level} · A LIFELONG LEARNER</Label>
          </View>
        </View>
        <TextInput
          accessibilityLabel="Update name"
          value={name}
          onChangeText={setName}
          maxLength={40}
          style={s.input}
        />
        <Button
          title="Save name"
          secondary
          disabled={!name.trim() || name.trim() === p.name}
          onPress={() =>
            run(async () => {
              await setProfile({ ...p, name: name.trim() });
              setMessage("Name updated.");
            })
          }
        />
      </Card>
      <Section title="Your learning rhythm" />
      <Card>
        <Label>DAILY PRACTICE GOAL</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[5, 10, 15, 20, 30].map((g) => (
            <Chip
              key={g}
              selected={p.dailyGoal === g}
              onPress={() => run(() => setProfile({ ...p, dailyGoal: g }))}
            >
              {g} min
            </Chip>
          ))}
        </View>
        <View style={s.divider} />
        <Label>EXPLANATIONS IN</Label>
        <View style={s.row}>
          <Chip
            selected={p.language === "hi"}
            onPress={() => run(() => setProfile({ ...p, language: "hi" }))}
          >
            English + हिन्दी
          </Chip>
          <Chip
            selected={p.language === "en"}
            onPress={() => run(() => setProfile({ ...p, language: "en" }))}
          >
            English
          </Chip>
        </View>
        <View style={s.divider} />
        <Label>LEARNING LEVEL</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {(["beginner", "intermediate", "advanced"] as const).map((l) => (
            <Chip
              key={l}
              selected={p.level === l}
              onPress={() => run(() => setProfile({ ...p, level: l }))}
            >
              {l}
            </Chip>
          ))}
        </View>
        <View style={s.divider} />
        <Label>SPEAKING PACE</Label>
        <View style={s.row}>
          {[
            { text: "Slower", value: 0.7 },
            { text: "Gentle", value: 0.9 },
            { text: "Natural", value: 1 },
          ].map((x) => (
            <Chip
              key={x.value}
              selected={p.speechSpeed === x.value}
              onPress={() =>
                run(() => setProfile({ ...p, speechSpeed: x.value }))
              }
            >
              {x.text}
            </Chip>
          ))}
        </View>
      </Card>
      <Section title="Private by nature" />
      <Card>
        <View style={s.row}>
          <ShieldCheck color={c.primary} size={25} />
          <Body color={c.ink} style={{ flex: 1 }}>
            Your words stay with you.
          </Body>
        </View>
        <Body style={{ fontSize: 12 }}>
          Learning data and conversations are stored on this device. Recordings
          are temporary and removed after practice. There is no account, cloud
          AI, or analytics.
        </Body>
        <Button
          title="Export my backup"
          secondary
          icon={<Download size={16} color={c.primary} />}
          busy={busy}
          onPress={() => run(() => exportBackup(state))}
        />
        <Button
          title="Restore a backup"
          secondary
          icon={<Upload size={16} color={c.primary} />}
          busy={busy}
          onPress={() =>
            run(async () => {
              const data = await readBackup();
              if (data) {
                setBackup(data);
                setConfirm("restore");
              }
            })
          }
        />
        <Button
          title="Clear conversation history"
          secondary
          onPress={() => setConfirm("history")}
        />
        <Button
          title="Delete my local profile"
          secondary
          icon={<Trash2 size={15} color={c.danger} />}
          onPress={() => setConfirm("delete")}
        />
      </Card>
      {confirm && (
        <Card style={{ borderColor: c.orange }}>
          <Title small>
            {confirm === "restore"
              ? "Restore this backup?"
              : confirm === "delete"
                ? "Delete your local profile?"
                : "Clear conversation history?"}
          </Title>
          <Body>
            {confirm === "restore"
              ? "This replaces your current profile, progress, vocabulary reviews, and conversations."
              : confirm === "delete"
                ? "Your profile, learning progress, vocabulary reviews, and conversations will be removed from this device."
                : "All saved practice conversations will be removed. Your learning progress stays."}
          </Body>
          <Button title="Confirm" busy={busy} onPress={destructive} />
          <Button
            title="Keep things as they are"
            secondary
            onPress={() => setConfirm(null)}
          />
        </Card>
      )}
      <Section title="On this device" />
      <Card>
        <View style={s.row}>
          <HardDrive size={20} color={c.primary} />
          <Label>OFFLINE ENGINE</Label>
        </View>
        <Body style={{ fontSize: 12 }}>
          {status?.native
            ? `${(status.memory.total / 1024 ** 3).toFixed(1)} GB RAM · ${status.capability.tier} learning profile`
            : "Browser preview · Local lessons and text practice"}
        </Body>
        <Body style={{ fontSize: 12 }}>
          Speech recognition:{" "}
          {status?.asrEnglish ? "English ready" : "model not bundled"}
          {status?.asrHindi ? " · Hindi ready" : ""}
        </Body>
        <Body style={{ fontSize: 12 }}>
          Tutor:{" "}
          {status?.llm && status.capability.allowLLM
            ? "local model configured"
            : "guided practice and basic grammar"}
        </Body>
        <Body style={{ fontSize: 12 }}>
          Offline voices:{" "}
          {status?.voices.length
            ? status.voices
                .map((v) => v.language)
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(", ")
            : "none available in this build"}
        </Body>
      </Card>
      {!!message && <Notice>{message}</Notice>}
      {!!error && <Notice error>{error}</Notice>}
      <View style={[s.row, { justifyContent: "center" }]}>
        <AudioLines size={15} color={c.primary} />
        <Text style={{ fontSize: 12, color: c.primary, fontWeight: "700" }}>
          BoloFluent · 0.1.0
        </Text>
      </View>
    </Page>
  );
}
