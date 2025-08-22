import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface DiscountIndicatorProps {
  amount: number
  variant?: "badge" | "inline" | "card"
  size?: "small" | "medium" | "large"
  showPercentage?: boolean
  originalAmount?: number
}

export default function DiscountIndicator({
  amount,
  variant = "badge",
  size = "medium",
  showPercentage = false,
  originalAmount,
}: DiscountIndicatorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const calculatePercentage = () => {
    if (!originalAmount || originalAmount === 0) return 0
    return Math.round((amount / originalAmount) * 100)
  }

  const getIconName = () => {
    switch (variant) {
      case "badge":
        return "pricetag"
      case "inline":
        return "trending-down"
      case "card":
        return "gift"
      default:
        return "pricetag"
    }
  }

  const getStyles = () => {
    const baseStyle = styles[variant]
    const sizeStyle = styles[`${variant}_${size}`]
    return [baseStyle, sizeStyle]
  }

  const getTextStyles = () => {
    const baseStyle = styles[`${variant}Text`]
    const sizeStyle = styles[`${variant}Text_${size}`]
    return [baseStyle, sizeStyle]
  }

  const renderContent = () => {
    const percentage = showPercentage ? calculatePercentage() : null

    return (
      <>
        <Ionicons
          name={getIconName() as any}
          size={size === "small" ? 12 : size === "large" ? 18 : 14}
          color="#27AE60"
        />
        <Text style={getTextStyles()}>
          {variant === "badge" ? "Desconto: " : ""}
          {formatCurrency(amount)}
          {percentage && percentage > 0 ? ` (${percentage}%)` : ""}
        </Text>
      </>
    )
  }

  if (amount <= 0) return null

  return <View style={getStyles()}>{renderContent()}</View>
}

const styles = StyleSheet.create({
  // Badge variant (chip-like)
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#27AE60",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: "flex-start",
  },
  badge_small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badge_medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badge_large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: "#27AE60",
    fontWeight: "600",
  },
  badgeText_small: {
    fontSize: 10,
  },
  badgeText_medium: {
    fontSize: 12,
  },
  badgeText_large: {
    fontSize: 14,
  },

  // Inline variant (for lists)
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inline_small: {},
  inline_medium: {},
  inline_large: {},
  inlineText: {
    color: "#27AE60",
    fontWeight: "500",
  },
  inlineText_small: {
    fontSize: 11,
  },
  inlineText_medium: {
    fontSize: 12,
  },
  inlineText_large: {
    fontSize: 14,
  },

  // Card variant (prominent display)
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27AE60",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    shadowColor: "#27AE60",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  card_small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  card_medium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  card_large: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cardText_small: {
    fontSize: 11,
  },
  cardText_medium: {
    fontSize: 12,
  },
  cardText_large: {
    fontSize: 14,
  },
})
