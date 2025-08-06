import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="loadingScreen" />
      <Stack.Screen name="startScreen" />
      <Stack.Screen name="loginScreen" />
      <Stack.Screen name="signupScreen" />
    </Stack>
  );
}
