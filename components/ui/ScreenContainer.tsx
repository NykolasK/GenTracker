import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: "dark-content" | "light-content";
  style?: ViewStyle;
  edges?: ("top" | "right" | "bottom" | "left")[];
  noSafeArea?: boolean;
  statusBarTranslucent?: boolean;
}

export default function ScreenContainer({
  children,
  backgroundColor = "#F8F9FA",
  statusBarStyle = "dark-content",
  style,
  edges,
  noSafeArea = false,
  statusBarTranslucent = false,
}: ScreenContainerProps) {
  // Set default status bar height for Android when translucent
  const statusBarHeight =
    Platform.OS === "android" && statusBarTranslucent
      ? StatusBar.currentHeight || 0
      : 0;

  if (noSafeArea) {
    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={
            statusBarTranslucent ? "transparent" : backgroundColor
          }
          translucent={statusBarTranslucent}
        />
        {statusBarTranslucent && <View style={{ height: statusBarHeight }} />}
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarTranslucent ? "transparent" : backgroundColor}
        translucent={statusBarTranslucent}
      />
      {statusBarTranslucent && <View style={{ height: statusBarHeight }} />}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
