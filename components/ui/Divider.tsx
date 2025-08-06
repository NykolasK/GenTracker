import { StyleSheet, Text, View } from "react-native";

interface DividerProps {
  text?: string;
}

export default function Divider({ text }: DividerProps) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      {text && <Text style={styles.dividerText}>{text}</Text>}
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
    maxWidth: 350,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "400",
    textAlign: "center",
  },
});
