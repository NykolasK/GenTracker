"use client";

import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "../../components/ui/Button";
import Divider from "../../components/ui/Divider";
import Input from "../../components/ui/Input";
import LinkText from "../../components/ui/LinkText";
import Logo from "../../components/ui/Logo";
import PasswordMatchIndicator from "../../components/ui/PasswordMatchIndicator";
import PasswordStrengthIndicator from "../../components/ui/PasswordStrengthIndicator";
import { signUp } from "../../services/authService";

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmeSenha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      Alert.alert("Erro", "Por favor, digite seu nome");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Erro", "Por favor, digite seu email");
      return false;
    }
    if (!formData.senha.trim()) {
      Alert.alert("Erro", "Por favor, digite sua senha");
      return false;
    }
    if (!formData.confirmeSenha.trim()) {
      Alert.alert("Erro", "Por favor, confirme sua senha");
      return false;
    }

    if (formData.nome.trim().length < 2) {
      Alert.alert("Erro", "Nome deve ter pelo menos 2 caracteres");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert("Erro", "Por favor, digite um email válido");
      return false;
    }

    if (formData.senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (formData.senha !== formData.confirmeSenha) {
      Alert.alert("Erro", "As senhas não coincidem");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signUp(
        formData.email.trim().toLowerCase(),
        formData.senha,
        formData.nome.trim()
      );

      if (result.success) {
        Alert.alert("Conta Criada!", result.message, [
          {
            text: "OK",
            onPress: () => {
              setFormData({
                nome: "",
                email: "",
                senha: "",
                confirmeSenha: "",
              });
              router.replace("/(tabs)/homeScreen");
            },
          },
        ]);
      } else {
        Alert.alert("Erro no Cadastro", result.error);
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    Alert.alert("Em breve", "Cadastro com Google será implementado em breve!");
  };

  const handleFacebookSignUp = () => {
    Alert.alert(
      "Em breve",
      "Cadastro com Facebook será implementado em breve!"
    );
  };

  const handleLoginNavigation = () => {
    router.push("/(auth)/loginScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
      >
        <Logo size="large" />

        <View style={styles.formContainer}>
          <Input
            placeholder="Nome completo"
            value={formData.nome}
            onChangeText={(value) => handleInputChange("nome", value)}
            autoCapitalize="words"
            editable={!loading}
          />

          <Input
            placeholder="E-mail"
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

          <PasswordStrengthIndicator password={formData.senha} />

          <Input
            placeholder="Confirme a senha"
            value={formData.confirmeSenha}
            onChangeText={(value) => handleInputChange("confirmeSenha", value)}
            isPassword
            showPassword={showConfirmPassword}
            onTogglePassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            autoCapitalize="none"
            editable={!loading}
          />

          <PasswordMatchIndicator
            password={formData.senha}
            confirmPassword={formData.confirmeSenha}
          />

          <Button
            title="Criar Conta"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.registerButton}
          />

          <Text style={styles.termsText}>
            Ao criar uma conta, você concorda com nossos{" "}
            <Text style={styles.linkText}>Termos de Uso</Text> e{" "}
            <Text style={styles.linkText}>Política de Privacidade</Text>
          </Text>

          <Divider text="Ou cadastre-se com" />

          <View style={styles.socialButtonsContainer}>
            <Button
              title="Google"
              onPress={handleGoogleSignUp}
              variant="social-google"
              disabled={loading}
              icon={<FontAwesome name="google" size={18} color="#EF4444" />}
            />

            <Button
              title="Facebook"
              onPress={handleFacebookSignUp}
              variant="social-facebook"
              disabled={loading}
              icon={<FontAwesome name="facebook" size={18} color="#3498DB" />}
            />
          </View>

          <LinkText
            text="Já tem uma conta? "
            linkText="Fazer Login"
            onPress={handleLoginNavigation}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: -50,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 50,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 350,
    lineHeight: 16,
  },
  linkText: {
    color: "#3498DB",
    fontWeight: "500",
  },
  socialButtonsContainer: {
    width: "100%",
    maxWidth: 350,
    gap: 12,
    marginBottom: 32,
  },
});
