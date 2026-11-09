
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import images from "../../assets/images";
import { ApiError } from "../../src/lib/api";
import { useAuth } from "../../src/context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing information", "Please complete all fields.");
      return;
    }

    if (fullName.trim().length < 2) {
      Alert.alert("Invalid name", "Please enter your full name.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    const phonePattern = /^(?:0[789]\d{9}|\+?234[789]\d{9})$/;

    if (!phonePattern.test(normalizedPhone)) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid Nigerian number, for example 08012345678.",
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak password",
        "Your password must contain at least 8 characters.",
      );
      return;
    }

    if (password.length > 72) {
      Alert.alert(
        "Password too long",
        "Your password cannot exceed 72 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Your passwords do not match.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
        password,
      });

      Alert.alert(
        "Account created",
        "Your 247 Jtech Hub account has been created successfully.",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create your account. Please try again.";

      Alert.alert("Registration failed", message);
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
          <Text style={styles.tagline}>
            Create your account and get started.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.description}>
            Join 247 Jtech Hub for fast and reliable transactions.
          </Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#A39A9C"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name"
            textContentType="name"
            importantForAutofill="yes"
            editable={!loading}
            returnKeyType="next"
          />

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
            autoComplete="email"
            textContentType="emailAddress"
            importantForAutofill="yes"
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="08012345678"
            placeholderTextColor="#A39A9C"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            importantForAutofill="yes"
            editable={!loading}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Create a password"
              placeholderTextColor="#A39A9C"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              importantForAutofill="yes"
              editable={!loading}
              returnKeyType="next"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Text style={styles.showPassword}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password again"
            placeholderTextColor="#A39A9C"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.loginLink}>
              Sign in
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
    paddingVertical: 35,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 62,
    height: 62,
    marginBottom: 10,
  },
  brand: {
    color: "#741B2B",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 2,
  },
  tagline: {
    color: "#716A6C",
    fontSize: 12,
    marginTop: 6,
  },
  form: {
    width: "100%",
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#242124",
  },
  description: {
    color: "#716A6C",
    fontSize: 13,
    marginTop: 7,
    marginBottom: 17,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#242124",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    height: 49,
    borderWidth: 1,
    borderColor: "#EEE7E8",
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#242124",
    backgroundColor: "#FAF9F9",
  },
  passwordContainer: {
    height: 49,
    borderWidth: 1,
    borderColor: "#EEE7E8",
    borderRadius: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9F9",
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: "#242124",
  },
  showPassword: {
    color: "#741B2B",
    fontWeight: "700",
    fontSize: 12,
  },
  registerButton: {
    height: 53,
    borderRadius: 12,
    backgroundColor: "#741B2B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 23,
    flexWrap: "wrap",
  },
  loginText: {
    color: "#716A6C",
    fontSize: 13,
  },
  loginLink: {
    color: "#741B2B",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#A39A9C",
    fontSize: 10,
    marginTop: 28,
  },
});
