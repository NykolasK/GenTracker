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
import { signIn } from "../../services/authService";

const { width } = Dimensions.get("window");

const LoginScreen: React.FC = () => {
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
        Alert.alert("Sucesso", result.message, [
          { text: "OK", onPress: () => router.replace("/homeScreen") },
        ]);
      } else {
        Alert.alert("Erro de Login", result.error);
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
    router.push("/signupScreen");
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Recuperar Senha",
      "Funcionalidade será implementada em breve!"
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/gentracker-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

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

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              Realize Login por outras plataformas
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              <FontAwesome name="google" size={18} color="#EF4444" />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.facebookButton}
              onPress={handleFacebookLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              <FontAwesome name="facebook" size={18} color="#3B82F6" />
              <Text style={styles.facebookButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerLinkText}>
              Não tem uma conta ainda?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleRegisterNavigation}
              disabled={loading}
            >
              <Text style={styles.registerLink}>Registrar agora</Text>
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
    marginBottom: 60,
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
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    maxWidth: 350,
    width: "100%",
  },
  forgotPasswordText: {
    color: "#3B82F6",
    fontSize: 14,
    textAlign: "right",
  },
  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
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
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    marginBottom: 40,
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
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 30,
    flexWrap: "wrap",
  },
  registerLinkText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  registerLink: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
});

export default LoginScreen;
