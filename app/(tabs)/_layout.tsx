import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallScreen = SCREEN_WIDTH < 375;

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
          height: isSmallScreen ? 80 : 90, // Altura menor em telas pequenas
          paddingBottom: isSmallScreen ? 20 : 25,
          paddingTop: isSmallScreen ? 10 : 15,
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
          fontSize: isSmallScreen ? 10 : 11,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        // Custom button component to ensure proper text wrapping
        tabBarButton: (props) => {
          // Clone children to ensure text is properly wrapped
          const wrappedChildren = React.Children.map(
            props.children,
            (child) => {
              // Return the child as is
              return child;
            }
          );

          return (
            <TouchableWithoutFeedback onPress={props.onPress}>
              <View style={[props.style, { backgroundColor: "transparent" }]}>
                {wrappedChildren}
              </View>
            </TouchableWithoutFeedback>
          );
        },
      }}
    >
      <Tabs.Screen
        name="homeScreen"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home"
              size={isSmallScreen ? size - 2 : size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="listsScreen"
        options={{
          title: "Listas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="document-text"
              size={isSmallScreen ? size - 2 : size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qrScreen"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.qrButton,
                focused && styles.qrButtonActive,
                isSmallScreen && styles.qrButtonSmall,
              ]}
            >
              <Ionicons
                name="qr-code"
                size={isSmallScreen ? 24 : 28}
                color="#FFFFFF"
              />
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
            <Ionicons
              name="time"
              size={isSmallScreen ? size - 2 : size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profileScreen"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person"
              size={isSmallScreen ? size - 2 : size}
              color={color}
            />
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
  qrButtonSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -20,
  },
});
