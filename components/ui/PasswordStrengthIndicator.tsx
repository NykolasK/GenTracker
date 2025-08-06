import { StyleSheet, Text, View } from "react-native";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = () => {
    if (password.length === 0) {
      return { strength: 0, text: "", color: "#D1D5DB" };
    }

    let strength = 0;
    const checks = [
      password.length >= 6,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    if (strength <= 2) return { strength: 1, text: "Fraca", color: "#EF4444" };
    if (strength <= 3) return { strength: 2, text: "Média", color: "#F59E0B" };
    if (strength <= 4) return { strength: 3, text: "Forte", color: "#10B981" };
    return { strength: 4, text: "Muito Forte", color: "#059669" };
  };

  const passwordStrength = getPasswordStrength();

  if (password.length === 0) return null;

  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.strengthBarBackground}>
        <View
          style={[
            styles.strengthBarFill,
            {
              width: `${(passwordStrength.strength / 4) * 100}%`,
              backgroundColor: passwordStrength.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
        {passwordStrength.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  passwordStrengthContainer: {
    width: "100%",
    maxWidth: 350,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthBarBackground: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "left",
  },
});
