import { Dimensions, Image, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");

interface LogoProps {
  variant?: "logo" | "icon";
  color?: "black" | "white" | "fullwhite";
  size?: "small" | "medium" | "large";
  style?: any;
}

export default function Logo({
  variant = "logo",
  color = "black",
  size = "large",
  style,
}: LogoProps) {
  const getLogoSource = () => {
    if (variant === "icon") {
      return color === "white"
        ? require("@/assets/images/gentracker-icon-white.png")
        : require("@/assets/images/gentracker-icon-black.png");
    }

    if (color === "fullwhite") {
      return require("@/assets/images/gentracker-logo-fullwhite.png");
    }

    return color === "white"
      ? require("@/assets/images/gentracker-logo-white.png")
      : require("@/assets/images/gentracker-logo-black.png");
  };

  const getLogoSize = () => {
    if (variant === "icon") {
      switch (size) {
        case "small":
          return { width: 40, height: 40 };
        case "medium":
          return { width: 60, height: 60 };
        default:
          return { width: 80, height: 80 };
      }
    }

    switch (size) {
      case "small":
        return { width: 200, height: 50 };
      case "medium":
        return { width: 250, height: 60 };
      default:
        return { width: 300, height: 70 };
    }
  };

  return (
    <View style={[styles.logoContainer, style]}>
      <Image
        source={getLogoSource()}
        style={[styles.logoImage, getLogoSize()]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
  },
  logoImage: {
    maxWidth: width * 0.85,
  },
});
