import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export default function Input({
  containerStyle,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <TextInput
        style={[styles.textInput, isPassword && styles.passwordInput, style]}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={isPassword && !showPassword}
        {...props}
      />
      {isPassword && onTogglePassword && (
        <TouchableOpacity
          style={styles.eyeIconContainer}
          onPress={onTogglePassword}
          disabled={props.editable === false}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
    position: "relative",
    width: "100%",
    maxWidth: 350,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#374151",
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 56,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIconContainer: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 56,
  },
});
