"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "../services/api";

// 1. Create the context
type AuthContextType = {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { rollNumber: string; password: string }) => Promise<any>;
  signup: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
} | null;

const AuthContext = createContext<AuthContextType>(null);

// 2. Custom hook for consuming context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// ✅ 3. Properly typed AuthProvider
interface AuthProviderProps {
  children: ReactNode; // 👈 this line fixes “children implicitly has an 'any' type”
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Error reading auth data:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Authentication functions ---
  const login = async (credentials: { rollNumber: string; password: string }) => {
    try {
      const res = await api.post("/auth/login", {
        identifier: credentials.rollNumber,
        password: credentials.password,
      });

      if (res.data?.success) {
        const { accessToken, user } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: "Unknown error" };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials";
      return { success: false, error: msg };
    }
  };

  const signup = async (userData: any) => {
    try {
      const res = await api.post("/auth/signup", userData);
      if (res.data?.success) {
        const { accessToken, user } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: "Signup failed" };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Signup error";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.clear();
      router.push("/login");
    }
  };

  const value = { user, isAuthenticated, loading, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
