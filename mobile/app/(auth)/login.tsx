import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import images from "../../assets/images";
import { ApiError } from "../../src/lib/api";
import { useAuth } from "../../src/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

/* ---------------- Google config ---------------- */

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Google sign-in does not work in Expo Go and needs a client ID for this platform
const isGoogleConfigured =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  Boolean(
    Platform.select({
      ios: iosClientId,
      android: androidClientId,
      default: webClientId,
    }),
  );

type GoogleButtonProps = {
  disabled?: boolean;
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
};

/** Real Google button. Only rendered when configured, so the hook never crashes. */
function GoogleButton({ disabled, onIdToken, onError }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        onError("Google did not return a valid token. Please try again.");
        setLoading(false);
        return;
      }
      onIdToken(idToken)
        .catch((e) =>
          onError(
            e instanceof ApiError
              ? e.message
              : "Google sign in failed. Please try again.",
          ),
        )
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (response.type === "error") {
        onError("Google sign in failed. Please try again.");
      }
    }
  }, [response]);

  const handlePress = async () => {
    setLoading(true);
    try {
      await promptAsync();
    } catch {
      setLoading(false);
      onError("Could not open Google sign in.");
    }
  };

  const off = disabled || loading || !request;

  return (
    <Pressable
      onPress={handlePress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => [
        styles.socialButton,
        (pressed || off) && styles.buttonDim,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.socialText}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

/** Same look, but just explains why it's unavailable (Expo Go / missing client IDs). */
function GooglePlaceholderButton({
  disabled,
  onError,
}: Pick<GoogleButtonProps, "disabled" | "onError">) {
  return (
    <Pressable
      onPress={() =>
        onError(
          "Google sign in needs a development build and Google client IDs. It isn't available in Expo Go.",
        )
      }
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed }) => [styles.socialButton, pressed && styles.buttonDim]}
    >
      <Ionicons name="logo-google" size={20} color="#DB4437" />
      <Text style={styles.socialText}>Continue with Google</Text>
    </Pressable>
  );
}

/* ---------------- Screen ---------------- */

type Field = "email" | "password" | null;

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<Field>(null);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = loading || appleLoading;

  const handleLogin = async () => {
    if (busy) return;
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    setError(null);
    await loginWithGoogle(idToken);
    router.replace("/(tabs)");
  };

  const handleApple = async () => {
    if (busy) return;
    setError(null);

    try {
      setAppleLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple did not return a valid token.");
      }

      // Apple only sends the name and email the FIRST time a user signs in
      const fullName =
        [credential.fullName?.givenName, credential.fullName?.familyName]
          .filter(Boolean)
          .join(" ") || undefined;

      await loginWithApple({
        identityToken: credential.identityToken,
        fullName,
        email: credential.email ?? undefined,
      });

      router.replace("/(tabs)");
    } catch (e: any) {
      // User closed the Apple sheet: not an error
      if (e?.code === "ERR_REQUEST_CANCELED") return;

      setError(
        e instanceof ApiError
          ? e.message
          : "Apple sign in failed. Please try again.",
      );
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branded header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={images.jt}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="JTECH HUB logo"
            />
          </View>
          <Text style={styles.brand}>JTECH HUB</Text>
          <Text style={styles.tagline}>Secure payments. Fast transactions.</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.description}>
            Sign in to continue to your account.
          </Text>

          {error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color="#B42318" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email address</Text>
          <View style={[styles.field, focused === "email" && styles.fieldFocused]}>
            <Ionicons name="mail-outline" size={20} color="#8A8184" />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#A39A9C"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              keyboardType="email-address"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="username"
              textContentType="username"
              editable={!busy}
              returnKeyType="next"
              accessibilityLabel="Email address"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={[styles.field, focused === "password" && styles.fieldFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A8184" />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#A39A9C"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="current-password"
              textContentType="password"
              editable={!busy}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password"
            />
            <Pressable
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={10}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#8A8184"
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.forgot}
            hitSlop={8}
            onPress={() => setError("Password recovery is coming soon.")}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || busy) && styles.buttonDim,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Sign In</Text>
            )}
          </Pressable>

          {/* Social sign in */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialStack}>
            {/* Apple: iOS only */}
            {Platform.OS === "ios" && (
              <View style={appleLoading && styles.buttonDim} pointerEvents={busy ? "none" : "auto"}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={14}
                  style={styles.appleButton}
                  onPress={handleApple}
                />
              </View>
            )}

            {/* Google */}
            {isGoogleConfigured ? (
              <GoogleButton
                disabled={busy}
                onIdToken={handleGoogleToken}
                onError={setError}
              />
            ) : (
              <GooglePlaceholderButton disabled={busy} onError={setError} />
            )}
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/register" style={styles.registerLink}>
              Create account
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- Styles ---------------- */

const colors = {
  primary: "#741B2B",
  bg: "#FFFFFF",
  tint: "#FAF9F9",
  border: "#EEE7E8",
  text: "#242124",
  muted: "#716A6C",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },

  header: {
    alignItems: "center",
    paddingTop: 72,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logo: { width: 48, height: 48 },
  brand: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  tagline: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 6 },

  card: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  heading: { fontSize: 28, fontWeight: "800", color: colors.text },
  description: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: { flex: 1, color: "#B42318", fontSize: 13 },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  field: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.tint,
  },
  fieldFocused: { borderColor: colors.primary, backgroundColor: "#FFFFFF" },
  input: { flex: 1, fontSize: 15, color: colors.text },

  forgot: { alignSelf: "flex-end", marginTop: 14 },
  forgotText: { color: colors.primary, fontSize: 13, fontWeight: "600" },

  primaryButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  buttonDim: { opacity: 0.7 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12 },

  socialStack: { gap: 12 },
  appleButton: { width: "100%", height: 56 },
  socialButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  socialText: { color: colors.text, fontSize: 15, fontWeight: "600" },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 28,
  },
  registerText: { color: colors.muted, fontSize: 13 },
  registerLink: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});