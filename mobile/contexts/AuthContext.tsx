import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
    checkAuthStatus();
  }, []);

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
      console.log("Login attempt:", credentials);
      console.log("API Base URL:", api.defaults.baseURL);

      const response = await api.post("/auth/login", credentials);
      console.log("Login response:", response.data);

      const { token, business } = response.data;

      await AsyncStorage.setItem("bizsawa_token", token);
      await AsyncStorage.setItem("bizsawa_userdata", JSON.stringify(business));

      setUserData(business);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.friendlyMessage || "Login failed. Please check your credentials.");
    }
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
      await AsyncStorage.removeItem("bizsawa_token");
      await AsyncStorage.removeItem("bizsawa_userdata");
      setIsAuthenticated(false);
      setUserData(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    userData,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
