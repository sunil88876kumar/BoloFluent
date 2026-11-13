import { Tabs, Redirect } from "expo-router";
import {
  BookOpen,
  ChartNoAxesCombined,
  House,
  Mic,
  UserRound,
} from "lucide-react-native";
import { colors } from "../../src/theme";
import { useLearning } from "../../src/stores/LearningProvider";
export default function TabsLayout() {
  const { state } = useLearning();
  if (!state.profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9DA59B",
        tabBarStyle: {
          backgroundColor: "#FBFCF8",
          borderTopColor: colors.line,
          height: 79,
          paddingTop: 10,
          paddingBottom: 16,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: 4 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <House size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="speaking"
        options={{
          title: "Speak",
          tabBarIcon: ({ color, size }) => (
            <Mic size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <ChartNoAxesCombined size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
