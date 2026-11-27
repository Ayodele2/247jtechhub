
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { apiRequest } from "../src/lib/api";

const BURGUNDY = "#741B2B";

const networks = [
  { name: "MTN", service: "mtn_vtu", color: "#FFCC00" },
  { name: "Airtel", service: "airtel_vtu", color: "#E31E24" },
  { name: "Glo", service: "glo_vtu", color: "#159447" },
  { name: "9mobile", service: "9mobile_vtu", color: "#008C45" },
] as const;

type Network = (typeof networks)[number];

type WalletResponse = {
  balanceKobo: string | number;
};

type PurchaseResponse = {
  reference?: string;
  status?: string;
  message?: string;
};

function formatNaira(kobo: string | number) {
  const amount = Number(kobo) / 100;

  if (!Number.isFinite(amount)) return "₦0.00";

  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AirtimeScreen() {
  const { token, isLoading: authLoading, isAuthenticated } = useAuth();

  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;

    async function loadWallet() {
      try {
        const wallet = await apiRequest<WalletResponse>("/wallet", {
          token: token!,
        });

        if (active) {
          setBalance(String(wallet.balanceKobo ?? "0"));
        }
      } catch {
        if (active) {
          Alert.alert(
            "Wallet error",
            "Unable to load your wallet balance. Please try again."
          );
        }
      } finally {
        if (active) setLoadingBalance(false);
      }
    }

    loadWallet();

    return () => {
      active = false;
    };
  }, [token]);

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BURGUNDY} />
      </View>
    );
  }

  if (!isAuthenticated || !token) {
    return <Redirect href="/(auth)/login" />;
  }

  const normalizedPhone = phoneNumber.trim();

  const validPhone =
    /^(0[789][01]\d{8}|\+234[789][01]\d{8}|234[789][01]\d{8})$/.test(
      normalizedPhone
    );

  const parsedAmount = Number(amount);
  const validAmount =
    amount.trim().length > 0 &&
    Number.isInteger(parsedAmount) &&
    parsedAmount >= 50 &&
    parsedAmount <= 100000;

  const handlePurchase = () => {
    if (!validPhone) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid Nigerian phone number, for example 08012345678."
      );
      return;
    }

    if (!validAmount) {
      Alert.alert(
        "Invalid amount",
        "Enter an amount between ₦50 and ₦100,000."
      );
      return;
    }

    const availableBalance = Number(balance) / 100;

    if (parsedAmount > availableBalance) {
      Alert.alert(
        "Insufficient balance",
        "Your wallet balance is not enough for this purchase."
      );
      return;
    }

    Alert.alert(
      "Confirm airtime purchase",
      `Network: ${selectedNetwork.name}\nPhone: ${normalizedPhone}\nAmount: ₦${parsedAmount.toLocaleString("en-NG")}\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => submitPurchase(),
        },
      ]
    );
  };

  const submitPurchase = async () => {
    if (!token || purchasing) return;

    setPurchasing(true);

    try {
      const result = await apiRequest<PurchaseResponse>("/vtu/airtime", {
        method: "POST",
        token,
        body: {
          service: selectedNetwork.service,
          phoneNumber: normalizedPhone,
          amount: parsedAmount,
          idempotencyKey: `airtime-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 12)}`,
        },
      });

      Alert.alert(
        "Purchase submitted",
        result.message ||
          "Your airtime purchase request has been submitted.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );

      const wallet = await apiRequest<WalletResponse>("/wallet", {
        token,
      });

      setBalance(String(wallet.balanceKobo ?? "0"));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete airtime purchase.";

      Alert.alert("Purchase unsuccessful", message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#292329" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Buy Airtime</Text>

          <View style={{ width: 42 }} />
        </View>

        <Text style={styles.heading}>Recharge your phone</Text>
        <Text style={styles.subtitle}>
          Buy airtime instantly with your 247 wallet.
        </Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available wallet balance</Text>

          <Text style={styles.balanceAmount}>
            {loadingBalance ? "Loading..." : formatNaira(balance)}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/wallet")}
          >
            <Text style={styles.fundLink}>＋ Fund wallet</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Select network</Text>

        <View style={styles.networkGrid}>
          {networks.map((network) => {
            const selected =
              selectedNetwork.service === network.service;

            return (
              <TouchableOpacity
                key={network.service}
                style={[
                  styles.networkCard,
                  selected && styles.selectedNetwork,
                ]}
                onPress={() => setSelectedNetwork(network)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.networkDot,
                    { backgroundColor: network.color },
                  ]}
                />

                <Text style={styles.networkName}>{network.name}</Text>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={BURGUNDY}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Phone number</Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="call-outline"
            size={20}
            color="#888"
          />

          <TextInput
            style={styles.input}
            placeholder="08012345678"
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={14}
          />
        </View>

        <Text style={styles.sectionTitle}>Amount</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.nairaSymbol}>₦</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor="#A0A0A0"
            keyboardType="number-pad"
            value={amount}
            onChangeText={(value) =>
              setAmount(value.replace(/[^0-9]/g, ""))
            }
          />
        </View>

        <View style={styles.quickAmounts}>
          {[100, 200, 500, 1000, 2000, 5000].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.amountChip,
                amount === String(value) && styles.selectedAmount,
              ]}
              onPress={() => setAmount(String(value))}
            >
              <Text
                style={[
                  styles.amountChipText,
                  amount === String(value) && styles.selectedAmountText,
                ]}
              >
                ₦{value.toLocaleString("en-NG")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (purchasing || loadingBalance) && styles.disabledButton,
          ]}
          onPress={handlePurchase}
          disabled={purchasing || loadingBalance}
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

        <Text style={styles.disclaimer}>
          Please confirm the phone number and network before proceeding.
        </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F8F2F3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#292329",
  },
  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#292329",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 7,
    marginBottom: 23,
  },
  balanceCard: {
    backgroundColor: BURGUNDY,
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  balanceLabel: {
    color: "#F1DDE1",
    fontSize: 12,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 9,
  },
  fundLink: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#302A2C",
    marginBottom: 12,
    marginTop: 8,
  },
  networkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  networkCard: {
    width: "48%",
    minHeight: 58,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EFE8E9",
    backgroundColor: "#FAF8F8",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  selectedNetwork: {
    borderColor: BURGUNDY,
    backgroundColor: "#F8EFF1",
  },
  networkDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  networkName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#302A2C",
  },
  inputContainer: {
    minHeight: 55,
    borderWidth: 1,
    borderColor: "#EAE3E4",
    borderRadius: 13,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 13,
  },
  input: {
    flex: 1,
    color: "#302A2C",
    fontSize: 15,
    paddingVertical: 13,
  },
  nairaSymbol: {
    color: "#555",
    fontSize: 19,
    fontWeight: "700",
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 25,
  },
  amountChip: {
    borderWidth: 1,
    borderColor: "#EAE3E4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FAF8F8",
  },
  selectedAmount: {
    borderColor: BURGUNDY,
    backgroundColor: "#F8EFF1",
  },
  amountChipText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  selectedAmountText: {
    color: BURGUNDY,
  },
  purchaseButton: {
    backgroundColor: BURGUNDY,
    minHeight: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    color: "#999",
    lineHeight: 17,
    marginTop: 15,
  },
});
