import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LinkTextProps {
  text: string;
  linkText: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function LinkText({
  text,
  linkText,
  onPress,
  disabled = false,
}: LinkTextProps) {
  return (
    <View style={styles.linkContainer}>
      <Text style={styles.linkText}>{text}</Text>
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 30,
    flexWrap: "wrap",
  },
  linkText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  link: {
    fontSize: 16,
    color: "#3498DB",
    fontWeight: "600",
  },
});
