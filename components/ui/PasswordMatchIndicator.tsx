import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface PasswordMatchIndicatorProps {
  password: string;
  confirmPassword: string;
}

export default function PasswordMatchIndicator({
  password,
  confirmPassword,
}: PasswordMatchIndicatorProps) {
  if (confirmPassword.length === 0) return null;

  const isMatch = password === confirmPassword;
  const color = isMatch ? "#10B981" : "#EF4444";
  const iconName = isMatch ? "checkmark-circle" : "close-circle";
  const text = isMatch ? "Senhas coincidem" : "Senhas não coincidem";

  return (
    <View style={styles.passwordMatchContainer}>
      <Ionicons name={iconName} size={16} color={color} />
      <Text style={[styles.matchText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  passwordMatchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
