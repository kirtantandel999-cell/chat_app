import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import authApi from "../api/authApi";
import { setUnauthorizedHandler } from "../api/axios";
import {
  getToken,
  setToken as setStorageToken,
  removeToken as removeStorageToken,
} from "../utils/storage";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;
    const initialToken = getToken();

    if (!initialToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .getCurrentUser()
      .then((userData) => {
        if (isMounted) {
          setUser(userData);
          setToken(initialToken);
        }
      })
      .catch(() => {
        if (isMounted) {
          removeStorageToken();
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Register auto-logout on unexpected 401s from Axios
  useEffect(() => {
    setUnauthorizedHandler(() => {
      removeStorageToken();
      setUser(null);
      setToken(null);
    });
  }, []);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleStorageChange = async (event) => {
      if (event.key === "token" || event.key === null) {
        if (event.newValue === null) {
          // Logged out in another tab
          setUser(null);
          setToken(null);
        } else if (event.newValue !== token) {
          // Token updated or logged in from another tab
          setToken(event.newValue);
          try {
            const freshUser = await authApi.getCurrentUser();
            setUser(freshUser);
          } catch {
            setUser(null);
            setToken(null);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login({ email, password });
    setStorageToken(result.token);
    setUser(result.user);
    setToken(result.token);
    return result;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const result = await authApi.register({ name, email, password });
    setStorageToken(result.token);
    setUser(result.user);
    setToken(result.token);
    return result;
  }, []);

  const logout = useCallback(() => {
    removeStorageToken();
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((newUser) => {
    setUser(newUser);
  }, []);

  const updateToken = useCallback((newToken) => {
    setStorageToken(newToken);
    setToken(newToken);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateUser,
      updateToken,
    }),
    [user, token, isLoading, login, register, logout, updateUser, updateToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
