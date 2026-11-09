import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import images from "../../assets/images";

const Started = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={images.jt}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="JTECH HUB logo"
          />

          <Text style={styles.title}>Welcome to JTECH HUB</Text>

          <Text style={styles.subtitle}>
            Everything you need, simple and secure, all in one place.
          </Text>
        </View>

        <View style={styles.illustrationWrapper}>
          <Image
            source={images.onboarding}
            style={styles.illustration}
            resizeMode="contain"
            accessibilityLabel="Onboarding illustration"
          />
        </View>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          accessibilityRole="button"
          accessibilityLabel="Get started"
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const colors = {
  background: "#FFFFFF",
  primary: "#741B2B",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  illustrationWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Started;