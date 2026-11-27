
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

import { ApiError, apiRequest } from "../lib/api";

const TOKEN_KEY = "247_jtech_access_token";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
};

type LoginResponse = {
  message: string;
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUser;
};

type ProfileResponse = {
  message: string;
  user: AuthUser;
};

type RegisterInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

type AppleCredentials = {
  identityToken: string;
  fullName?: string;
  email?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (details: RegisterInput) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (credentials: AppleCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);

        if (!savedToken) return;

        const response = await apiRequest<ProfileResponse>("/auth/me", {
          token: savedToken,
        });

        if (mounted) {
          setToken(savedToken);
          setUser(response.user);
        }
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.statusCode === 401 || error.statusCode === 403)
        ) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }

        console.warn("Session restoration failed:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const saveSession = useCallback(async (accessToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);

    try {
      const response = await apiRequest<ProfileResponse>("/auth/me", {
        token: accessToken,
      });

      setToken(accessToken);
      setUser(response.user);
    } catch (error) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          password,
        },
      });

      await saveSession(response.accessToken);
    },
    [saveSession],
  );

  const register = useCallback(
    async (details: RegisterInput) => {
      await apiRequest<{ message: string; user: AuthUser }>(
        "/auth/register",
        {
          method: "POST",
          body: {
            fullName: details.fullName.trim(),
            email: details.email.trim().toLowerCase(),
            phoneNumber: details.phoneNumber.trim(),
            password: details.password,
          },
        },
      );

      await login(details.email, details.password);
    },
    [login],
  );

  // Backend social authentication is not implemented yet.
  // These methods deliberately fail instead of creating fake sessions.
  const loginWithGoogle = useCallback(async (_idToken: string) => {
    throw new Error("Google sign-in is not available yet.");
  }, []);

  const loginWithApple = useCallback(
    async (_credentials: AppleCredentials) => {
      throw new Error("Apple sign-in is not available yet.");
    },
    [],
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      loginWithGoogle,
      loginWithApple,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      loginWithGoogle,
      loginWithApple,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
