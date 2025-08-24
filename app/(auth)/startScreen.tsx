import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Button from "../../components/ui/Button";
import Logo from "../../components/ui/Logo";
import ScreenContainer from "../../components/ui/ScreenContainer";

export default function StartScreen() {
  const handleLogin = () => {
    router.push("/(auth)/loginScreen");
  };

  const handleRegister = () => {
    router.push("/(auth)/signupScreen");
  };

  return (
    <ScreenContainer
      backgroundColor="#F8F9FA"
      statusBarStyle="dark-content"
      statusBarTranslucent={true}
      edges={["top", "right", "left"]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size="large" />
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            title="Entrar na minha conta"
            onPress={handleLogin}
            variant="primary"
          />
          <Button
            title="Registrar-se"
            onPress={handleRegister}
            variant="secondary"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
  },
  buttonsContainer: {
    paddingBottom: 60,
    gap: 16,
  },
});
