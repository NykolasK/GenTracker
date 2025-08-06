import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3498DB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: 90,
          paddingBottom: 25,
          paddingTop: 15,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarButton: (props) => (
          <TouchableWithoutFeedback onPress={props.onPress}>
            <View style={[props.style, { backgroundColor: "transparent" }]}>
              {props.children}
            </View>
          </TouchableWithoutFeedback>
        ),
      }}
    >
      <Tabs.Screen
        name="homeScreen"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listsScreen"
        options={{
          title: "Listas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qrScreen"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.qrButton, focused && styles.qrButtonActive]}>
              <Ionicons name="qr-code" size={28} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="historyScreen"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profileScreen"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  qrButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3498DB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -25,
    shadowColor: "#3498DB",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  qrButtonActive: {
    backgroundColor: "#2980B9",
    transform: [{ scale: 1.05 }],
  },
});
