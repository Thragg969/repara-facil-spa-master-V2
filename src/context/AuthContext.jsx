import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

// Función para decodificar JWT
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando token:", error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("username");
        let storedRole = localStorage.getItem("role");
        
        if (storedToken) {
          // Validar integridad básica del token
          const decoded = decodeToken(storedToken);
          
          // Si hay token pero no hay rol guardado (común en Registro), lo extraemos
          if (!storedRole && decoded) {
            storedRole = decoded.role || decoded.authorities?.[0] || "ROLE_CLIENTE";
            localStorage.setItem("role", storedRole); // Guardar para la próxima
            console.log("⚠️ Rol recuperado del token:", storedRole);
          }

          if (decoded && decoded.exp * 1000 < Date.now()) {
            console.warn("⚠️ Token expirado, cerrando sesión");
            logout();
          } else {
            setToken(storedToken);
            setUsername(storedUser);
            setRole(storedRole);
          }
        }
      } catch (error) {
        console.error("❌ Error inicializando sesión:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (userOrEmail, password) => {
    try {
      const resp = await api.post("/auth/login", { 
        username: userOrEmail, 
        password: password 
      });
      
      const { token } = resp.data;
      if (!token) throw new Error("No se recibió token");

      const decoded = decodeToken(token);
      const userRole = decoded.role || decoded.authorities?.[0] || "ROLE_CLIENTE";
      
      setToken(token);
      setUsername(userOrEmail);
      setRole(userRole);
      
      localStorage.setItem("token", token);
      localStorage.setItem("username", userOrEmail);
      localStorage.setItem("role", userRole);
      
      return true;
    } catch (error) {
      console.error("❌ Error en login:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setRole(null);
    localStorage.clear();
  };

  const value = {
    token,
    username,
    role,
    isAuthenticated: !!token,
    // Helpers booleanos para facilitar la lógica en los componentes
    isAdmin: role === "ADMIN" || role === "ROLE_ADMIN",
    isTecnico: role === "TECNICO" || role === "ROLE_TECNICO",
    isCliente: role === "CLIENTE" || role === "ROLE_CLIENTE", 
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
};