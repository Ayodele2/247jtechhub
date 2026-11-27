
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/context/AuthContext";

const BURGUNDY = "#741B2B";

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, danger && styles.dangerIcon]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#D64545" : BURGUNDY}
        />
      </View>

      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#A49A9C" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const showComingSoon = (feature: string) => {
    Alert.alert(feature, "This feature will be available soon.");
  };

  const handleNotifications = () => {
    setNotificationsEnabled((previous) => !previous);
  };

  const showPersonalInformation = () => {
    Alert.alert(
      "Personal Information",
      `Full name: ${user?.fullName ?? "Not available"}\n\nEmail: ${
        user?.email ?? "Not available"
      }\n\nPhone number: ${user?.phoneNumber ?? "Not available"}`,
      [{ text: "Close" }],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ],
    );
  };

  const performLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch {
      Alert.alert(
        "Logout failed",
        "We could not log you out. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account and preferences
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => showComingSoon("Settings")}
          >
            <Ionicons name="settings-outline" size={21} color={BURGUNDY} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color={BURGUNDY} />
          </View>

          <Text style={styles.userName}>
            {user?.fullName ?? "247 Jtech Hub User"}
          </Text>

          <Text style={styles.userEmail}>
            {user?.email ?? "Email unavailable"}
          </Text>

          <Text style={styles.userPhone}>
            {user?.phoneNumber ?? "Phone number unavailable"}
          </Text>

          <View style={styles.accountBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#278653" />
            <Text style={styles.accountBadgeText}>Account dashboard</Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => showComingSoon("Edit Profile")}
          >
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            title="Personal Information"
            subtitle="View your registered name, email and phone"
            onPress={showPersonalInformation}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="wallet-outline"
            title="Wallet Details"
            subtitle="View your wallet information"
            onPress={() => showComingSoon("Wallet Details")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="time-outline"
            title="Transaction History"
            subtitle="Review your previous transactions"
            onPress={() => showComingSoon("Transaction History")}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleNotifications}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={BURGUNDY}
              />
            </View>

            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>
                {notificationsEnabled ? "Enabled" : "Disabled"}
              </Text>
            </View>

            <View
              style={[
                styles.toggle,
                notificationsEnabled && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleCircle,
                  notificationsEnabled && styles.toggleCircleActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <MenuItem
            icon="lock-closed-outline"
            title="Security"
            subtitle="Password and account security"
            onPress={() => showComingSoon("Security")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => showComingSoon("Language")}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="chatbubble-ellipses-outline"
            title="Contact Support"
            subtitle="Get help with your account or purchases"
            onPress={() => showComingSoon("Contact Support")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="help-circle-outline"
            title="Frequently Asked Questions"
            onPress={() => showComingSoon("Frequently Asked Questions")}
          />

          <View style={styles.separator} />

          <MenuItem
            icon="document-text-outline"
            title="Terms & Privacy Policy"
            onPress={() => showComingSoon("Terms & Privacy Policy")}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="information-circle-outline"
            title="About 247 Jtech Hub"
            subtitle="Learn more about our platform"
            onPress={() => showComingSoon("About 247 Jtech Hub")}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#D64545" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>247 JTECH HUB · Version 1.0.0</Text>
        <Text style={styles.footer}>Powered by 247 Jtech Hub</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#241C1E",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#888084",
    marginTop: 5,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F8F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#FFF9FA",
    borderWidth: 1,
    borderColor: "#F1E4E6",
    borderRadius: 20,
    alignItems: "center",
    padding: 22,
    marginBottom: 28,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F1DFE3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },
  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#241C1E",
    textAlign: "center",
  },
  userEmail: {
    fontSize: 12,
    color: "#888084",
    marginTop: 6,
    textAlign: "center",
  },
  userPhone: {
    fontSize: 12,
    color: "#888084",
    marginTop: 5,
    textAlign: "center",
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF6EF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 13,
    gap: 5,
  },
  accountBadgeText: {
    fontSize: 11,
    color: "#278653",
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BURGUNDY,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 17,
    gap: 7,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8B7E82",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0EAEA",
    borderRadius: 16,
    paddingHorizontal: 13,
    marginBottom: 25,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8F0F1",
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#302629",
  },
  menuSubtitle: {
    fontSize: 10,
    color: "#948B8E",
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3EEEE",
    marginLeft: 52,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 20,
    backgroundColor: "#D9D4D5",
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: BURGUNDY,
  },
  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  dangerIcon: {
    backgroundColor: "#FFF0F0",
  },
  dangerText: {
    color: "#D64545",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#F2DADA",
    borderRadius: 13,
    paddingVertical: 15,
    backgroundColor: "#FFF9F9",
    marginTop: 2,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D64545",
  },
  version: {
    fontSize: 11,
    color: "#938A8D",
    textAlign: "center",
    marginTop: 22,
  },
  footer: {
    fontSize: 10,
    color: "#B0A7AA",
    textAlign: "center",
    marginTop: 6,
  },
});
