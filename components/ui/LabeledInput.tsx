import {
  StyleSheet,
  Text,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Input from "./Input";

interface LabeledInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
}

export default function LabeledInput({
  label,
  required = false,
  containerStyle,
  inputContainerStyle,
  ...inputProps
}: LabeledInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <Input
        containerStyle={inputContainerStyle || styles.inputContainer}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputContainer: {
    marginBottom: 0,
  },
});
