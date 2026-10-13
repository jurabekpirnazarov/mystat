import React, { createContext, useContext, useState } from "react";
import { clearStorage } from "../api/storage";

interface User {
  name: string;
  email: string;
  type: "individual" | "legal";
  date: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    name: string,
    type: "individual" | "legal",
    date: string
  ) => void;
  logout: () => void;
  isAuthenticated: boolean;
  nav: string;
  setNav: React.Dispatch<React.SetStateAction<string>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  // Rehydrate user from localStorage on mount
  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  const [nav, setNav] = useState("");

  const login = (
    email: string,
    name: string,
    type: "individual" | "legal",
    date: string
  ) => {
    const mockUser: User = {
      name: name ? name : 'ООО "Технологии"',
      email,
      type,
      date,
    };
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  const logout = () => {
    clearStorage();
    setUser(null);
    
    // Clear all authentication related data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("user_profile");
    
    console.log("User logged out, localStorage cleared");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setNav,
        nav,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
