import type React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextStyle,
  type ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "social-google" | "social-facebook";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondaryButton;
      case "social-google":
        return styles.googleButton;
      case "social-facebook":
        return styles.facebookButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondaryButtonText;
      case "social-google":
        return styles.googleButtonText;
      case "social-facebook":
        return styles.facebookButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#3B82F6"}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#3498DB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 350,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#3498DB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: 12,
    width: "100%",
  },
  facebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: 12,
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  secondaryButtonText: {
    color: "#3498DB",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  facebookButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
