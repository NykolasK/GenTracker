import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { logger } from "../utils/logger";

export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  stats?: {
    totalScans: number;
    totalLists: number;
    totalSavings: string;
  };
}

export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update the user's display name
    await updateProfile(user, {
      displayName: displayName,
    });

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email!,
      displayName: displayName,
      createdAt: new Date(),
      stats: {
        totalScans: 0,
        totalLists: 0,
        totalSavings: "0,00",
      },
    };

    await setDoc(doc(db, "users", user.uid), userData);

    return {
      success: true,
      message: "Conta criada com sucesso!",
      user: user,
    };
  } catch (error: any) {
    logger.error("Sign up error:", error);

    let errorMessage = "Erro ao criar conta";

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Este email já está em uso";
        break;
      case "auth/invalid-email":
        errorMessage = "Email inválido";
        break;
      case "auth/weak-password":
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
        break;
      default:
        errorMessage = error.message || "Erro desconhecido";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    return {
      success: true,
      message: "Login realizado com sucesso!",
      user: user,
    };
  } catch (error: any) {
    logger.error("Sign in error:", error);

    let errorMessage = "Erro ao fazer login";

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "Usuário não encontrado";
        break;
      case "auth/wrong-password":
        errorMessage = "Senha incorreta";
        break;
      case "auth/invalid-email":
        errorMessage = "Email inválido";
        break;
      case "auth/too-many-requests":
        errorMessage = "Muitas tentativas. Tente novamente mais tarde";
        break;
      default:
        errorMessage = error.message || "Erro desconhecido";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const logOut = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: "Logout realizado com sucesso!",
    };
  } catch (error: any) {
    logger.error("Logout error:", error);
    return {
      success: false,
      error: "Erro ao fazer logout",
    };
  }
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    logger.error("Error getting user data:", error);
    return null;
  }
};
