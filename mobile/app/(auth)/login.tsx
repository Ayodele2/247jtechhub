
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import images from "../../assets/images";
import { ApiError } from "../../src/lib/api";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password.",
      );
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Please try again.";

      Alert.alert("Sign in failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={images.jt}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="JTECH HUB logo"
          />
          <Text style={styles.brand}>JTECH HUB</Text>
          <Text style={styles.tagline}>Sign in to your account.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.description}>
            Sign in to continue to your account.
          </Text>

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#A39A9C"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="username"
            textContentType="username"
            importantForAutofill="yes"
            editable={!loading}
            returnKeyType="next"
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#A39A9C"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="current-password"
              textContentType="password"
              importantForAutofill="yes"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
            >
              <Text style={styles.showPassword}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Password recovery will be available in a future update.",
              )
            }
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Don&apos;t have an account?{" "}
            </Text>
            <Link href="/(auth)/register" style={styles.registerLink}>
              Create account
            </Link>
          </View>
        </View>

        <Text style={styles.footer}>
          Secure payments. Fast transactions. 247 Jtech Hub.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
    paddingVertical: 45,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 42,
  },
  logo: {
    width: 62,
    height: 62,
    marginBottom: 10,
  },
  brand: {
    color: "#741B2B",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: 2,
  },
  tagline: {
    color: "#716A6C",
    fontSize: 13,
    marginTop: 7,
  },
  form: {
    width: "100%",
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#242124",
  },
  description: {
    color: "#716A6C",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#242124",
    marginBottom: 9,
    marginTop: 17,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#EEE7E8",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#242124",
    backgroundColor: "#FAF9F9",
  },
  passwordContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: "#EEE7E8",
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F9",
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#242124",
  },
  showPassword: {
    color: "#741B2B",
    fontWeight: "700",
    fontSize: 13,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 15,
  },
  forgotText: {
    color: "#741B2B",
    fontSize: 13,
    fontWeight: "600",
  },
  loginButton: {
    height: 55,
    borderRadius: 12,
    backgroundColor: "#741B2B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 27,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 27,
    flexWrap: "wrap",
  },
  registerText: {
    color: "#716A6C",
    fontSize: 13,
  },
  registerLink: {
    color: "#741B2B",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#A39A9C",
    fontSize: 11,
    marginTop: 45,
  },
});
