import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const isAuthenticated = !!token;

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("unauthorized");
        const data = await res.json();
        setUser(data.user);
      } catch {
        logout();
      }
    };

    if (token) fetchMe();
    else setUser(null);
  }, [token]);

  const login = (newToken, userFromServer) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    if (userFromServer) setUser(userFromServer);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);