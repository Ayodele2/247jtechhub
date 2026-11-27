import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Google sign-in does not work in Expo Go and needs a client ID for the current platform
export const isGoogleConfigured =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  Boolean(
    Platform.select({
      ios: iosClientId,
      android: androidClientId,
      default: webClientId,
    }),
  );

type Props = {
  disabled?: boolean;
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
};

function GoogleButtonInner({ disabled, onIdToken, onError }: Props) {
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
        .catch((e) => onError(e?.message ?? "Google sign in failed. Please try again."))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (response.type === "error") onError("Google sign in failed. Please try again.");
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
      style={({ pressed }) => [styles.button, (pressed || off) && styles.dim]}
    >
      {loading ? (
        <ActivityIndicator color="#741B2B" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

// Renders nothing when Google isn't configured, so the hook never runs
export default function GoogleSignInButton(props: Props) {
  if (!isGoogleConfigured) return null;
  return <GoogleButtonInner {...props} />;
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EEE7E8",
    backgroundColor: "#FFFFFF",
  },
  dim: { opacity: 0.7 },
  text: { color: "#242124", fontSize: 15, fontWeight: "600" },
});