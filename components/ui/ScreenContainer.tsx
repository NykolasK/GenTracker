import { SafeAreaView, StatusBar, StyleSheet, type ViewStyle } from "react-native"

interface ScreenContainerProps {
  children: React.ReactNode
  backgroundColor?: string
  statusBarStyle?: "dark-content" | "light-content"
  style?: ViewStyle
}

export default function ScreenContainer({
  children,
  backgroundColor = "#F8F9FA",
  statusBarStyle = "dark-content",
  style,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
