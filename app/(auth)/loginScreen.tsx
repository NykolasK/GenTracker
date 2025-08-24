"use client";

import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import Divider from "../../components/ui/Divider";
import Input from "../../components/ui/Input";
import LinkText from "../../components/ui/LinkText";
import Logo from "../../components/ui/Logo";
import ScreenContainer from "../../components/ui/ScreenContainer";
import { signIn } from "../../services/authService";

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert("Erro", "Por favor, digite seu email");
      return false;
    }
    if (!formData.senha.trim()) {
      Alert.alert("Erro", "Por favor, digite sua senha");
      return false;
    }
    if (!formData.email.includes("@")) {
      Alert.alert("Erro", "Por favor, digite um email válido");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signIn(formData.email.trim(), formData.senha);

      if (result.success) {
        // Navigate directly without showing alert for better UX
        router.replace("/(tabs)/homeScreen");
      } else {
        Alert.alert("Erro de Login", result.error || "Falha ao fazer login");
      }
    } catch {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert("Em breve", "Login com Google será implementado em breve!");
  };

  const handleFacebookLogin = () => {
    Alert.alert("Em breve", "Login com Facebook será implementado em breve!");
  };

  const handleRegisterNavigation = () => {
    router.push("/(auth)/signupScreen");
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Recuperar Senha",
      "Funcionalidade será implementada em breve!"
    );
  };

  return (
    <ScreenContainer
      backgroundColor="#FFFFFF"
      statusBarStyle="dark-content"
      statusBarTranslucent={true}
      edges={["top", "right", "left"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Logo size="large" />

        <View style={styles.formContainer}>
          <Input
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Input
            placeholder="Senha"
            value={formData.senha}
            onChangeText={(value) => handleInputChange("senha", value)}
            isPassword
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          />

          <Divider text="Realize Login por outras plataformas" />

          <View style={styles.socialButtonsContainer}>
            <Button
              title="Google"
              onPress={handleGoogleLogin}
              variant="social-google"
              disabled={loading}
              icon={<FontAwesome name="google" size={18} color="#EF4444" />}
            />

            <Button
              title="Facebook"
              onPress={handleFacebookLogin}
              variant="social-facebook"
              disabled={loading}
              icon={<FontAwesome name="facebook" size={18} color="#3B82F6" />}
            />
          </View>

          <LinkText
            text="Não tem uma conta ainda? "
            linkText="Registrar agora"
            onPress={handleRegisterNavigation}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 50,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    maxWidth: 350,
    width: "100%",
  },
  forgotPasswordText: {
    color: "#3498DB",
    fontSize: 14,
    textAlign: "right",
  },
  loginButton: {
    marginBottom: 40,
  },
  socialButtonsContainer: {
    width: "100%",
    maxWidth: 350,
    gap: 12,
    marginBottom: 40,
  },
});
