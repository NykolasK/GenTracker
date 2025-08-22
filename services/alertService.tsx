import React, { createContext, useContext, useState, ReactNode } from 'react'
import CustomAlert, { type AlertButton } from '../components/ui/CustomAlert'

interface AlertOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  buttons?: AlertButton[]
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

interface AlertProviderProps {
  children: ReactNode
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null)
  const [visible, setVisible] = useState(false)

  const showAlert = (options: AlertOptions) => {
    setAlertConfig(options)
    setVisible(true)
  }

  const hideAlert = () => {
    setVisible(false)
    setTimeout(() => setAlertConfig(null), 300) // Wait for animation
  }

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      )}
    </AlertContext.Provider>
  )
}
