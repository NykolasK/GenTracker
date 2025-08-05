import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { signUp } from "../../services/authService";

const { width } = Dimensions.get("window");

const SignUpScreen: React.FC = () => {
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
    // Fixed navigation path
    router.push("/(auth)/loginScreen");
  };

  const getPasswordStrength = () => {
    const password = formData.senha;
    if (password.length === 0)
      return { strength: 0, text: "", color: "#D1D5DB" };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/gentracker-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          {/* Nome field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Nome completo"
              placeholderTextColor="#9CA3AF"
              value={formData.nome}
              onChangeText={(value) => handleInputChange("nome", value)}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* E-mail field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="E-mail"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Senha field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.passwordInput]}
              placeholder="Senha"
              placeholderTextColor="#9CA3AF"
              value={formData.senha}
              onChangeText={(value) => handleInputChange("senha", value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator - FIXED */}
          {formData.senha.length > 0 && (
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
              <Text
                style={[styles.strengthText, { color: passwordStrength.color }]}
              >
                {passwordStrength.text}
              </Text>
            </View>
          )}

          {/* Confirme a Senha field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.passwordInput]}
              placeholder="Confirme a senha"
              placeholderTextColor="#9CA3AF"
              value={formData.confirmeSenha}
              onChangeText={(value) =>
                handleInputChange("confirmeSenha", value)
              }
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showConfirmPassword ? "eye" : "eye-off"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Password Match Indicator - FIXED */}
          {formData.confirmeSenha.length > 0 && (
            <View style={styles.passwordMatchContainer}>
              <Ionicons
                name={
                  formData.senha === formData.confirmeSenha
                    ? "checkmark-circle"
                    : "close-circle"
                }
                size={16}
                color={
                  formData.senha === formData.confirmeSenha
                    ? "#10B981"
                    : "#EF4444"
                }
              />
              <Text
                style={[
                  styles.matchText,
                  {
                    color:
                      formData.senha === formData.confirmeSenha
                        ? "#10B981"
                        : "#EF4444",
                  },
                ]}
              >
                {formData.senha === formData.confirmeSenha
                  ? "Senhas coincidem"
                  : "Senhas não coincidem"}
              </Text>
            </View>
          )}

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            Ao criar uma conta, você concorda com nossos{" "}
            <Text style={styles.linkText}>Termos de Uso</Text> e{" "}
            <Text style={styles.linkText}>Política de Privacidade</Text>
          </Text>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ou cadastre-se com</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social login buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignUp}
              activeOpacity={0.8}
              disabled={loading}
            >
              <FontAwesome name="google" size={18} color="#EF4444" />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.facebookButton}
              onPress={handleFacebookSignUp}
              activeOpacity={0.8}
              disabled={loading}
            >
              <FontAwesome name="facebook" size={18} color="#3B82F6" />
              <Text style={styles.facebookButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
            <TouchableOpacity
              onPress={handleLoginNavigation}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Fazer Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoImage: {
    width: 300,
    height: 70,
    maxWidth: width * 0.85,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
  },
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
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 18,
    padding: 4,
  },
  // FIXED PASSWORD STRENGTH STYLES
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
  // FIXED PASSWORD MATCH STYLES
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
  registerButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
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
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    color: "#3B82F6",
    fontWeight: "500",
  },
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
  socialButtonsContainer: {
    width: "100%",
    maxWidth: 350,
    gap: 12,
    marginBottom: 32,
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
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
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
  facebookButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 30,
    flexWrap: "wrap",
  },
  loginLinkText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  loginLink: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
});

export default SignUpScreen;
