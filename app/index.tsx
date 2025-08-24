import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./(auth)/loadingScreen";

export default function IndexScreen() {
  const { user, loading } = useAuth();

  // Show loading screen while authentication state is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect based on authentication status
  if (user) {
    return <Redirect href="/(tabs)/homeScreen" />;
  } else {
    return <Redirect href="/(auth)/startScreen" />;
  }
}
