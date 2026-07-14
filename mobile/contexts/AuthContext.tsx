import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import { api } from "../lib/api";

interface UserData {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userData: UserData | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: {
    ownerName: string;
    ownerEmail: string;
    whatsappNumber: string;
    password: string;
    name: string;
    businessType?: string;
    yearsInBusiness?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    configureGoogle();
    checkAuthStatus();
  }, []);

  const configureGoogle = () => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
    });
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("bizsawa_token");
      const savedUserData = await AsyncStorage.getItem("bizsawa_userdata");

      if (token && savedUserData) {
        setUserData(JSON.parse(savedUserData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      handleAuthResponse(response.data);
    } catch (error: any) {
      throw new Error(error.friendlyMessage || "Login failed. Please check your credentials.");
    }
  };

  const loginWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error("Google Sign-In failed: No ID Token received.");
      }

      const response = await api.post("/auth/google", { idToken });
      await handleAuthResponse(response.data);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return; // User cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Login is already in progress.");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services not available.");
      } else {
        console.error("Google Sign-In Error:", error);
        throw new Error(error.friendlyMessage || "Google login failed. Please try again.");
      }
    }
  };

  const handleAuthResponse = async (data: any) => {
    const payload = data?.data && data?.success === true ? data.data : (data?.token ? data : data?.data || data);
    const token = payload?.token;
    const business = payload?.business;

    if (!token || !business) {
      console.error("[Auth] Missing token or business in response payload:", data);
      throw new Error("Invalid authentication response from server");
    }

    await AsyncStorage.setItem("bizsawa_token", token);
    await AsyncStorage.setItem("bizsawa_userdata", JSON.stringify(business));
    setUserData(business);
    setIsAuthenticated(true);
  };

  const register = async (data: {
    ownerName: string;
    ownerEmail: string;
    whatsappNumber: string;
    password: string;
    name: string;
    businessType?: string;
    yearsInBusiness?: string;
  }) => {
    try {
      await api.post("/auth/register", data);
    } catch (error: any) {
      throw new Error(error.friendlyMessage || "Registration failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem("bizsawa_token");
      await AsyncStorage.removeItem("bizsawa_userdata");
      await AsyncStorage.removeItem("HAS_FINISHED_ONBOARDING");
      setIsAuthenticated(false);
      setUserData(null);
      router.replace("/onboarding");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    userData,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
