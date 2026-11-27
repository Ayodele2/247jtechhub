
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/context/AuthContext";
import { apiRequest } from "../src/lib/api";

const BURGUNDY = "#741B2B";

const networks = [
  { label: "MTN", service: "mtn_data", color: "#F5C400" },
  { label: "Airtel", service: "airtel_data", color: "#E52329" },
  { label: "Glo", service: "glo_data", color: "#159447" },
  { label: "9mobile", service: "9mobile_data", color: "#087D49" },
];

const periods = ["Daily", "Weekly", "Monthly"] as const;
type Period = (typeof periods)[number];

type DataPackage = {
  code: string;
  description: string;
  price: string;
};

type CatalogueResponse = {
  service: string;
  packages: DataPackage[];
};

function getPackagePeriod(description: string): Period | "Other" {
  const value = description.toLowerCase();

  if (
    /\b(daily|day|24\s*hours?|1\s*day|2\s*days?|3\s*days?)\b/.test(value)
  ) {
    return "Daily";
  }

  if (
    /\b(weekly|week|7\s*days?|14\s*days?)\b/.test(value)
  ) {
    return "Weekly";
  }

  if (
    /\b(monthly|month|30\s*days?|31\s*days?)\b/.test(value)
  ) {
    return "Monthly";
  }

  return "Other";
}

function formatPrice(price: string) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return `₦${price}`;

  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function DataScreen() {
  const { token, isLoading, isAuthenticated } = useAuth();

  const [service, setService] = useState("mtn_data");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [packages, setPackages] = useState<DataPackage[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<DataPackage | null>(null);

  const [period, setPeriod] = useState<Period>("Monthly");
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadPackages = useCallback(async () => {
    if (!token) return;

    setLoadingPackages(true);
    setError("");
    setPackages([]);
    setSelectedPackage(null);

    try {
      const result = await apiRequest<CatalogueResponse>(
        `/vtu/data-bundles?service=${service}`,
        { token },
      );

      setPackages(result.packages ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load data bundles.",
      );
    } finally {
      setLoadingPackages(false);
    }
  }, [service, token]);

  useEffect(() => {
    let active = true;

    async function fetchPackages() {
      if (!token) return;

      setLoadingPackages(true);
      setError("");
      setPackages([]);
      setSelectedPackage(null);

      try {
        const result = await apiRequest<CatalogueResponse>(
          `/vtu/data-bundles?service=${service}`,
          { token },
        );

        if (active) {
          setPackages(result.packages ?? []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load data bundles.",
          );
        }
      } finally {
        if (active) setLoadingPackages(false);
      }
    }

    fetchPackages();

    return () => {
      active = false;
    };
  }, [service, token, reloadKey]);

  const filteredPackages = useMemo(() => {
    return packages.filter(
      (item) => getPackagePeriod(item.description) === period,
    );
  }, [packages, period]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BURGUNDY} size="large" />
      </View>
    );
  }

  if (!isAuthenticated || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  async function handlePurchase() {
    const normalizedPhone = phoneNumber.trim();

    if (
      !/^(0[789][01]\d{8}|\+234[789][01]\d{8}|234[789][01]\d{8})$/.test(
        normalizedPhone,
      )
    ) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid Nigerian phone number, for example 08012345678.",
      );
      return;
    }

    if (!selectedPackage) {
      Alert.alert("Select a bundle", "Choose a data bundle to continue.");
      return;
    }

    Alert.alert(
      "Confirm purchase",
      `${selectedPackage.description}\nNetwork: ${
        networks.find((network) => network.service === service)?.label
      }\nPhone: ${normalizedPhone}\nAmount: ${formatPrice(
        selectedPackage.price,
      )}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => submitPurchase(normalizedPhone),
        },
      ],
    );
  }

  async function submitPurchase(normalizedPhone: string) {
    if (!token || !selectedPackage || purchasing) return;

    setPurchasing(true);

    try {
      const result = await apiRequest<{
        message?: string;
        status?: string;
      }>("/vtu/data", {
        method: "POST",
        token,
        body: {
          service,
          phoneNumber: normalizedPhone,
          bundleCode: selectedPackage.code,
          idempotencyKey: `mobile-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
        },
      });

      Alert.alert(
        "Purchase submitted",
        result.message ?? "Your data purchase request was submitted.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert(
        "Purchase unsuccessful",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#292426" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.heading}>Buy Data</Text>
            <Text style={styles.subtitle}>Choose your data plan</Text>
          </View>
        </View>

        {/* Network selection */}
        <Text style={styles.sectionTitle}>Network</Text>

        <View style={styles.networkRow}>
          {networks.map((network) => {
            const active = service === network.service;

            return (
              <TouchableOpacity
                key={network.service}
                style={[
                  styles.networkButton,
                  active && styles.networkButtonActive,
                ]}
                onPress={() => setService(network.service)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.networkDot,
                    { backgroundColor: network.color },
                  ]}
                />
                <Text
                  style={[
                    styles.networkText,
                    active && styles.networkTextActive,
                  ]}
                >
                  {network.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Phone number */}
        <Text style={styles.sectionTitle}>Phone number</Text>

        <View style={styles.phoneInputContainer}>
          <Ionicons name="call-outline" size={19} color="#888" />

          <TextInput
            style={styles.phoneInput}
            placeholder="08012345678"
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={14}
          />
        </View>

        {/* Period tabs */}
        <View style={styles.bundleHeader}>
          <Text style={styles.sectionTitle}>Select data plan</Text>
          {loadingPackages && (
            <ActivityIndicator size="small" color={BURGUNDY} />
          )}
        </View>

        <View style={styles.periodTabs}>
          {periods.map((item) => {
            const active = period === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.periodTab,
                  active && styles.periodTabActive,
                ]}
                onPress={() => {
                  setPeriod(item);
                  setSelectedPackage(null);
                }}
              >
                <Text
                  style={[
                    styles.periodText,
                    active && styles.periodTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bundle list */}
        <ScrollView
          style={styles.bundleScroll}
          contentContainerStyle={styles.bundleGrid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loadingPackages ? (
            <View style={styles.messageContainer}>
              <ActivityIndicator size="large" color={BURGUNDY} />
              <Text style={styles.helper}>
                Loading available data plans...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.messageContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={35}
                color="#B42318"
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setReloadKey((value) => value + 1)}
              >
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredPackages.length === 0 ? (
            <View style={styles.messageContainer}>
              <Ionicons
                name="albums-outline"
                size={35}
                color="#999"
              />
              <Text style={styles.helper}>
                No {period.toLowerCase()} plans found for this network.
              </Text>
              <Text style={styles.emptyHint}>
                Try another category or network.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredPackages.map((item, index) => {
                const active = selectedPackage?.code === item.code;

                return (
                  <TouchableOpacity
                    key={`${item.code}-${index}`}
                    style={[
                      styles.packageCard,
                      active && styles.packageCardActive,
                    ]}
                    onPress={() => setSelectedPackage(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.packageTop}>
                      <Ionicons
                        name="wifi"
                        size={20}
                        color={active ? BURGUNDY : "#A58B91"}
                      />
                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={19}
                          color={BURGUNDY}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.packageName,
                        active && styles.packageNameActive,
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>

                    <Text style={styles.packagePrice}>
                      {formatPrice(item.price)}
                    </Text>

                    <Text style={styles.packageValidity}>
                      {period} plan
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Fixed purchase area */}
        <View style={styles.bottomBar}>
          <View style={styles.selectionSummary}>
            <View>
              <Text style={styles.summaryLabel}>Selected plan</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {selectedPackage
                  ? selectedPackage.description
                  : "No plan selected"}
              </Text>
            </View>

            <Text style={styles.summaryPrice}>
              {selectedPackage
                ? formatPrice(selectedPackage.price)
                : "₦0"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (!selectedPackage ||
                !phoneNumber.trim() ||
                purchasing ||
                loadingPackages) &&
                styles.buttonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={
              !selectedPackage ||
              !phoneNumber.trim() ||
              purchasing ||
              loadingPackages
            }
            activeOpacity={0.85}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Continue to Purchase
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 13,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F7F3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#211D1E",
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#292426",
    marginBottom: 10,
  },
  networkRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 19,
  },
  networkButton: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderColor: "#EAE5E6",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 4,
  },
  networkButtonActive: {
    borderColor: BURGUNDY,
    backgroundColor: "#FBF3F5",
  },
  networkDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  networkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  networkTextActive: {
    color: BURGUNDY,
  },
  phoneInputContainer: {
    height: 49,
    borderWidth: 1,
    borderColor: "#EAE5E6",
    borderRadius: 11,
    marginHorizontal: 18,
    marginBottom: 18,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: "#292426",
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  periodTabs: {
    flexDirection: "row",
    marginHorizontal: 18,
    backgroundColor: "#F5F1F2",
    padding: 4,
    borderRadius: 11,
    marginBottom: 13,
  },
  periodTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: BURGUNDY,
  },
  periodText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  bundleScroll: {
    flex: 1,
  },
  bundleGrid: {
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexGrow: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  packageCard: {
    width: "48%",
    minHeight: 124,
    borderWidth: 1,
    borderColor: "#ECE6E7",
    borderRadius: 14,
    padding: 13,
    backgroundColor: "#FFFFFF",
  },
  packageCardActive: {
    borderColor: BURGUNDY,
    backgroundColor: "#FBF4F5",
    borderWidth: 1.5,
  },
  packageTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },
  packageName: {
    color: "#292426",
    fontSize: 13,
    fontWeight: "800",
    minHeight: 32,
  },
  packageNameActive: {
    color: BURGUNDY,
  },
  packagePrice: {
    fontSize: 17,
    fontWeight: "800",
    color: BURGUNDY,
    marginTop: 7,
  },
  packageValidity: {
    fontSize: 10,
    color: "#999",
    marginTop: 5,
  },
  messageContainer: {
    flex: 1,
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  helper: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  emptyHint: {
    color: "#999",
    fontSize: 11,
    marginTop: 6,
  },
  errorText: {
    color: "#B42318",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: "#F7EBED",
    borderRadius: 9,
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginTop: 13,
  },
  retryText: {
    color: BURGUNDY,
    fontSize: 12,
    fontWeight: "800",
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 15,
    borderTopWidth: 1,
    borderTopColor: "#F0EAEB",
    backgroundColor: "#FFFFFF",
  },
  selectionSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#999",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#292426",
    marginTop: 3,
    maxWidth: 220,
  },
  summaryPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: BURGUNDY,
  },
  purchaseButton: {
    height: 51,
    backgroundColor: BURGUNDY,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  purchaseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
