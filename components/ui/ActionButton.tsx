"use client"

import React from "react"
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useActionLock } from "../../hooks/useActionLock"

interface ActionButtonProps {
  title: string
  onPress: () => Promise<void>
  variant?: "primary" | "secondary" | "danger"
  icon?: string
  disabled?: boolean
  cooldownMs?: number
  actionName?: string
  showCooldownTimer?: boolean
}

export default function ActionButton({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  cooldownMs = 2000,
  actionName,
  showCooldownTimer = true,
}: ActionButtonProps) {
  const { executeAction, isLocked, isLoading, getRemainingCooldown, canExecute } = useActionLock({
    cooldownMs,
    showFeedback: true,
  })

  const [cooldownTime, setCooldownTime] = React.useState(0)

  // Atualiza timer de cooldown
  React.useEffect(() => {
    if (!isLocked) return

    const interval = setInterval(() => {
      const remaining = getRemainingCooldown()
      setCooldownTime(Math.ceil(remaining / 1000))

      if (remaining <= 0) {
        clearInterval(interval)
        setCooldownTime(0)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isLocked, getRemainingCooldown])

  const handlePress = async () => {
    await executeAction(onPress, actionName)
  }

  const getButtonStyle = () => {
    const baseStyle = [styles.button]

    if (variant === "primary") baseStyle.push(styles.primaryButton)
    if (variant === "secondary") baseStyle.push(styles.secondaryButton)
    if (variant === "danger") baseStyle.push(styles.dangerButton)

    if (disabled || !canExecute) baseStyle.push(styles.disabledButton)
    if (isLocked) baseStyle.push(styles.lockedButton)

    return baseStyle
  }

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText]

    if (variant === "primary") baseStyle.push(styles.primaryButtonText)
    if (variant === "secondary") baseStyle.push(styles.secondaryButtonText)
    if (variant === "danger") baseStyle.push(styles.dangerButtonText)

    if (disabled || !canExecute) baseStyle.push(styles.disabledButtonText)

    return baseStyle
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={getTextStyle()}>Processando...</Text>
        </View>
      )
    }

    if (isLocked && showCooldownTimer && cooldownTime > 0) {
      return (
        <View style={styles.buttonContent}>
          <Ionicons name="time" size={16} color="#9CA3AF" />
          <Text style={getTextStyle()}>Aguarde {cooldownTime}s</Text>
        </View>
      )
    }

    return (
      <View style={styles.buttonContent}>
        {icon && <Ionicons name={icon as any} size={16} color={getTextStyle()[0].color} />}
        <Text style={getTextStyle()}>{title}</Text>
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || !canExecute}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Variants
  primaryButton: {
    backgroundColor: "#3498DB",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },

  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3498DB",
  },
  secondaryButtonText: {
    color: "#3498DB",
  },

  dangerButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  dangerButtonText: {
    color: "#E74C3C",
  },

  // States
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: "#9CA3AF",
  },

  lockedButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
})
