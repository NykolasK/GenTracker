import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="startScreen"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
