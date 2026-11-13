import { Redirect } from "expo-router";
import { useLearning } from "../src/stores/LearningProvider";
export default function Index() {
  const { state } = useLearning();
  return <Redirect href={state.profile ? "/(tabs)" : "/onboarding"} />;
}
