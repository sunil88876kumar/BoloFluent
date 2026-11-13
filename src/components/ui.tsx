import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowUpRight, WifiOff } from "lucide-react-native";
import { router } from "expo-router";
import { colors as c } from "../theme";
export function Label({
  children,
  color = c.muted,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.8,
        color,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}
export function Title({
  children,
  small = false,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Text
      style={{
        fontSize: small ? 23 : 31,
        fontWeight: "800",
        letterSpacing: -1.1,
        color: c.ink,
        lineHeight: small ? 30 : 39,
      }}
    >
      {children}
    </Text>
  );
}
export function Body({
  children,
  color = c.muted,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<import("react-native").TextStyle>;
}) {
  return (
    <Text style={[{ fontSize: 14, lineHeight: 22, color }, style]}>
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  busy = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary ? c.primaryLight : c.primary,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.primary : "#fff"} />
      ) : (
        icon
      )}
      <Text
        style={{
          color: secondary ? c.primary : "#fff",
          fontSize: 14,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  children,
  selected,
  onPress,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: selected ? c.primary : c.surface,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.line,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: selected ? "#fff" : c.muted,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function OfflineBadge() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: c.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
      }}
    >
      <WifiOff size={11} color={c.primary} />
      <Text style={{ color: c.primary, fontSize: 10, fontWeight: "700" }}>
        Made for offline
      </Text>
    </View>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={[s.row, { justifyContent: "space-between", marginTop: 7 }]}>
      <Text
        style={{
          fontSize: 19,
          fontWeight: "700",
          color: c.ink,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </Text>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
          <Text style={{ fontSize: 11, color: c.primary, fontWeight: "700" }}>
            {action}
          </Text>
          <ArrowUpRight size={13} color={c.primary} />
        </Pressable>
      )}
    </View>
  );
}
export function Page({
  children,
  title,
  subtitle,
  back = false,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
}) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 24, gap: 22, paddingBottom: 36 }}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={s.row}
            >
              <ArrowLeft size={20} color={c.ink} />
              <Text style={{ color: c.ink, fontWeight: "600" }}>Back</Text>
            </Pressable>
          )}
          {title && (
            <View style={{ gap: 7 }}>
              <Title>{title}</Title>
              {subtitle && <Body>{subtitle}</Body>}
            </View>
          )}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: error ? "#FCEDEA" : c.primaryLight,
        padding: 15,
        borderRadius: 16,
      }}
    >
      <Body
        color={error ? c.danger : c.primary}
        style={{ fontSize: 12, lineHeight: 19 }}
      >
        {children}
      </Body>
    </View>
  );
}
export function ProgressBar({
  value,
  color = c.primary,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{
        height: 6,
        borderRadius: 8,
        backgroundColor: c.line,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          backgroundColor: color,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export const s = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: c.line,
    gap: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  button: {
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  input: {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    color: c.ink,
    fontSize: 15,
    minHeight: 52,
  },
  divider: { height: 1, backgroundColor: c.line },
});
