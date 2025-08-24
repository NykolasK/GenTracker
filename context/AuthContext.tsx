"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebaseConfig";
import { getUserData, type UserData } from "../services/authService";
import { logger } from "../utils/logger";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.info("Setting up auth state listener");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      logger.info("Auth state changed:", user ? user.uid : "no user");
      setUser(user);

      if (user) {
        // Fetch additional user data from Firestore
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
          logger.info("User data loaded successfully:", user.uid);
        } catch (error) {
          logger.error("Failed to load user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => {
      logger.info("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
