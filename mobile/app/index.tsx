
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { createElement } from "react";

declare const require: (path: string) => {
  useAuth: () => { isAuthenticated: boolean; isLoading: boolean };
};

const { useAuth } = require("../src/context/AuthContext");

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return createElement(
      View,
      {
        style: {
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      createElement(ActivityIndicator, { size: "large", color: "#741B2B" }),
    );
  }

  return createElement(Redirect, {
    href: isAuthenticated ? "/(tabs)" : "/(auth)/started",
  });
}
