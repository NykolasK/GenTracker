"use client";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import Logo from "../../components/ui/Logo";
import ScreenContainer from "../../components/ui/ScreenContainer";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
  const { user, loading } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Dot animations
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Floating particles
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main logo animation sequence
    const logoSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Subtle rotation effect
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    // Animated dots sequence
    const dotsSequence = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Progress bar animation
    const progressSequence = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    });

    // Floating particles animation
    const particlesAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(particle1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(particle2, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(particle3, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Start all animations
    logoSequence.start();
    dotsSequence.start();
    progressSequence.start();
    particlesAnimation.start();

    // Check auth state after animations
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          router.replace("/(tabs)/homeScreen");
        } else {
          router.replace("/(auth)/startScreen");
        }
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      dotsSequence.stop();
      particlesAnimation.stop();
    };
  }, [user, loading]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <ScreenContainer backgroundColor="#FFFFFF">
      <LinearGradient
        colors={["#F8F9FA", "#FFFFFF", "#F0F8FF"]}
        style={styles.gradient}
      >
        {/* Floating Particles */}
        <Animated.View
          style={[
            styles.particle,
            styles.particle1,
            {
              opacity: particle1,
              transform: [
                {
                  translateY: particle1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, -100],
                  }),
                },
                {
                  translateX: particle1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width * 0.1, width * 0.9],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.particle,
            styles.particle2,
            {
              opacity: particle2,
              transform: [
                {
                  translateY: particle2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, -100],
                  }),
                },
                {
                  translateX: particle2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width * 0.8, width * 0.2],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.particle,
            styles.particle3,
            {
              opacity: particle3,
              transform: [
                {
                  translateY: particle3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, -100],
                  }),
                },
                {
                  translateX: particle3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width * 0.5, width * 0.7],
                  }),
                },
              ],
            },
          ]}
        />

        <View style={styles.container}>
          {/* Logo with glow effect */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                  { rotate: rotation },
                ],
              },
            ]}
          >
            <View style={styles.logoGlow}>
              <Logo variant="icon" color="black" size="large" />
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.appTitle}>GenTracker</Text>
            <Text style={styles.appSubtitle}>Sua gestão inteligente</Text>
          </Animated.View>

          {/* Animated Loading Dots */}
          <Animated.View
            style={[styles.loadingIndicator, { opacity: fadeAnim }]}
          >
            <View style={styles.loadingDots}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        scale: dot1Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.3],
                        }),
                      },
                    ],
                    opacity: dot1Anim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        scale: dot2Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.3],
                        }),
                      },
                    ],
                    opacity: dot2Anim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [
                      {
                        scale: dot3Anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.3],
                        }),
                      },
                    ],
                    opacity: dot3Anim,
                  },
                ]}
              />
            </View>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View
            style={[styles.progressContainer, { opacity: fadeAnim }]}
          >
            <View style={styles.progressBar}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
            <Text style={styles.progressText}>Carregando...</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  logoGlow: {
    shadowColor: "#3498DB",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  loadingIndicator: {
    alignItems: "center",
    marginBottom: 40,
  },
  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3498DB",
    shadowColor: "#3498DB",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 200,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498DB",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  particle1: {
    backgroundColor: "#3498DB",
    opacity: 0.3,
  },
  particle2: {
    backgroundColor: "#27AE60",
    opacity: 0.2,
  },
  particle3: {
    backgroundColor: "#F39C12",
    opacity: 0.25,
  },
});
