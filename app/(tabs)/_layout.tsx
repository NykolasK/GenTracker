import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="startScreen">
      <Stack.Screen
        name="startScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signupScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="loginScreen"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
