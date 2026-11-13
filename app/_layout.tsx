import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LearningProvider, useLearning } from "../src/stores/LearningProvider";
import { colors } from "../src/theme";
function Navigation() {
  const { ready, error } = useLearning();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 30,
        }}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.ink }}>
          {error || "Opening BoloFluent…"}
        </Text>
      </View>
    );
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
      {!!error && (
        <View
          accessibilityRole="alert"
          style={{ backgroundColor: "#FCEDEA", padding: 12 }}
        >
          <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
        </View>
      )}
    </>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LearningProvider>
        <View style={{ flex: 1, backgroundColor: "#E8EDE5" }}>
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 560,
              alignSelf: "center",
              backgroundColor: colors.background,
            }}
          >
            <Navigation />
          </View>
        </View>
      </LearningProvider>
    </SafeAreaProvider>
  );
}
