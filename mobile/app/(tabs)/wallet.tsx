import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../../src/context/AuthContext";
import { apiRequest, ApiError } from "../../src/lib/api";

WebBrowser.maybeCompleteAuthSession();

const BURGUNDY = "#741B2B";
const CALLBACK_URL = "247jtechhub://wallet/fund/callback";

type Wallet = {
  id: string;
  balanceKobo: string;
  currency: string;
};

type WalletTransaction = {
  id: string;
  type: "credit" | "debit";
  status: "pending" | "successful" | "failed";
  amountKobo: string;
  reference: string;
  description: string | null;
  createdAt: string;
};

type FundingInitializationResponse = {
  message: string;
  funding: {
    id: string;
    reference: string;
    amountKobo: string;
    status: string;
  };
  payment: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  };
};

function formatKobo(amountKobo: string) {
  try {
    const amount = BigInt(amountKobo);
    const naira = amount / 100n;
    const kobo = amount % 100n;

    const formattedNaira = naira.toLocaleString("en-NG");

    return `\u20A6${formattedNaira}${
      kobo > 0n ? `.${kobo.toString().padStart(2, "0")}` : ""
    }`;
  } catch {
    return "\u20A60";
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusColor(status: WalletTransaction["status"]) {
  switch (status) {
    case "successful":
      return "#159447";
    case "pending":
      return "#B7791F";
    case "failed":
      return "#D14343";
  }
}

export default function WalletScreen() {
  const { token } = useAuth();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      if (!token) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      const [walletResponse, transactionResponse] = await Promise.all([
        apiRequest<Wallet>("/wallet", { token }),
        apiRequest<WalletTransaction[]>("/wallet/transactions", { token }),
      ]);

      setWallet(walletResponse);
      setTransactions(transactionResponse);
      setError("");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to load your wallet. Please try again.";

      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadWallet();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [loadWallet]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadWallet();
  };

  const handleFunding = () => {
    setFundingAmount("");
    setAmountModalVisible(true);
  };



const startFunding = async () => {
  const amount = Number(fundingAmount.trim());

  if (!Number.isFinite(amount) || amount <= 0) {
    Alert.alert("Invalid amount", "Enter a valid amount to continue.");
    return;
  }

  if (amount > 1000000) {
    Alert.alert(
      "Amount too high",
      "The maximum funding amount is ₦1,000,000."
    );
    return;
  }

  if (!token) {
    Alert.alert("Session expired", "Please log in again.");
    return;
  }

  setIsFunding(true);
  setAmountModalVisible(false);

  try {
    // 1. Initialize the payment through our backend.
    const initialization =
      await apiRequest<FundingInitializationResponse>(
        "/wallet/fund/initialize",
        {
          method: "POST",
          token,
          body: { amount },
        }
      );

    const authorizationUrl =
      initialization.payment.authorizationUrl;

    const reference = initialization.funding.reference;

    if (!authorizationUrl || !reference) {
      throw new Error(
        "Payment authorization details were not returned."
      );
    }

    // 2. Open Paystack checkout.
    const checkoutResult =
      await WebBrowser.openAuthSessionAsync(
        authorizationUrl,
        CALLBACK_URL
      );

    // 3. Validate the callback reference when a URL is returned.
    if ("url" in checkoutResult && checkoutResult.url) {
      const callbackUrl = new URL(checkoutResult.url);

      const returnedReference =
        callbackUrl.searchParams.get("reference") ??
        callbackUrl.searchParams.get("trxref");

      if (
        returnedReference &&
        returnedReference !== reference
      ) {
        throw new Error(
          "The payment reference does not match this transaction."
        );
      }
    }

    // 4. Verify the original reference through our backend.
    // The backend independently checks the payment with Paystack.
   const verification = await apiRequest<{
  message: string;
  status: "successful";
  reference: string;
  amountKobo?: string;
}>("/wallet/fund/verify", {
  method: "POST",
  token,
  body: { reference },
});

if (verification.status !== "successful") {
  throw new Error(
    verification.message || "Payment has not been confirmed."
  );
}

    // 5. Refresh wallet balance and transaction history.
    await loadWallet();

    Alert.alert(
      "Payment verification complete",
      "Your payment verification request was processed. Check your wallet balance and transaction history for the confirmed result."
    );
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "We couldn't complete wallet funding. Please check your transaction history.";

    Alert.alert("Funding unsuccessful", message);

    await loadWallet();
  } finally {
    setIsFunding(false);
    setFundingAmount("");
  }
};



  const balance = wallet ? formatKobo(wallet.balanceKobo) : "\u20A60";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={BURGUNDY}
            colors={[BURGUNDY]}
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>My Wallet</Text>

          <Text style={styles.subtitle}>
            Manage your funds and wallet activities.
          </Text>

          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={22}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.balanceLabel}>
                AVAILABLE BALANCE
              </Text>

              <TouchableOpacity
                onPress={() => setShowBalance((current) => !current)}
                style={styles.visibilityButton}
              >
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={21}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#FFFFFF"
                style={styles.balanceLoader}
              />
            ) : (
              <Text style={styles.balanceAmount}>
                {showBalance ? balance : "\u20A6 ••••••"}
              </Text>
            )}

            <Text style={styles.balanceDescription}>
              Your 247 Jtech Hub wallet
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.fundButton}
              onPress={handleFunding}
              disabled={isFunding}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={BURGUNDY}
              />
              <Text style={styles.fundButtonText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color="#D14343"
              />

              <View style={styles.errorInfo}>
                <Text style={styles.errorTitle}>
                  Unable to load wallet
                </Text>

                <Text style={styles.errorMessage}>{error}</Text>

                <TouchableOpacity onPress={loadWallet}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Wallet Actions</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleFunding}
                disabled={isFunding}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="add-circle-outline"
                    size={23}
                    color={BURGUNDY}
                  />
                </View>

                <Text style={styles.actionText}>Add Money</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() =>
                  Alert.alert(
                    "Coming soon",
                    "Wallet withdrawal will be available in a future update."
                  )
                }
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={23}
                    color={BURGUNDY}
                  />
                </View>

                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() =>
                  Alert.alert(
                    "Coming soon",
                    "Wallet transfer will be available in a future update."
                  )
                }
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={23}
                    color={BURGUNDY}
                  />
                </View>

                <Text style={styles.actionText}>Transfer</Text>
              </TouchableOpacity>
            </View>

          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>
              Recent Wallet Activity
            </Text>

            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons
                name="refresh-outline"
                size={21}
                color={BURGUNDY}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingHistory}>
              <ActivityIndicator color={BURGUNDY} />

              <Text style={styles.loadingText}>
                Loading wallet activity...
              </Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={35}
                color="#B7A9AC"
              />

              <Text style={styles.emptyTitle}>
                No transactions yet
              </Text>

              <Text style={styles.emptyDescription}>
                Your wallet transactions will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.slice(0, 8).map((transaction) => {
                const isCredit = transaction.type === "credit";

                return (
                  <View
                    key={transaction.id}
                    style={styles.transactionCard}
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: isCredit
                            ? "#E8F7EE"
                            : "#F8ECEF",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isCredit
                            ? "add-circle-outline"
                            : "arrow-up-circle-outline"
                        }
                        size={22}
                        color={isCredit ? "#159447" : BURGUNDY}
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {transaction.description ||
                          (isCredit ? "Wallet Credit" : "Wallet Debit")}
                      </Text>

                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                      </Text>

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: getStatusColor(transaction.status),
                          },
                        ]}
                      >
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color: isCredit ? "#159447" : "#292326",
                        },
                      ]}
                    >
                      {isCredit ? "+" : "-"}
                      {formatKobo(transaction.amountKobo)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={amountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAmountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fund your wallet</Text>

            <Text style={styles.modalDescription}>
              Enter the amount you want to add to your 247 Jtech Hub wallet.
            </Text>

            <Text style={styles.amountLabel}>Amount (NGN)</Text>

            <TextInput
              value={fundingAmount}
              onChangeText={setFundingAmount}
              placeholder="e.g. 1000"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              editable={!isFunding}
            />

            <TouchableOpacity
              style={styles.confirmFundingButton}
              onPress={startFunding}
              disabled={isFunding}
            >
              {isFunding ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmFundingText}>
                  Continue to Paystack
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelFundingButton}
              onPress={() => setAmountModalVisible(false)}
              disabled={isFunding}
            >
              <Text style={styles.cancelFundingText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: BURGUNDY,
  },
  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 7,
    lineHeight: 20,
  },
  balanceCard: {
    backgroundColor: BURGUNDY,
    borderRadius: 18,
    padding: 20,
    marginTop: 22,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  balanceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF25",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#F2DCE1",
  },
  visibilityButton: {
    padding: 5,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 20,
  },
  balanceLoader: {
    marginTop: 20,
    alignSelf: "flex-start",
  },
  balanceDescription: {
    fontSize: 11,
    color: "#F2DCE1",
    marginTop: 6,
  },
  fundButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 13,
    borderRadius: 11,
    marginTop: 22,
  },
  fundButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: BURGUNDY,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#FFF1F1",
  },
  errorInfo: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A52A2A",
  },
  errorMessage: {
    fontSize: 11,
    color: "#805050",
    lineHeight: 17,
    marginTop: 5,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700",
    color: BURGUNDY,
    marginTop: 9,
  },
  actionsSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#292326",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 17,
  },
  actionItem: {
    alignItems: "center",
    flex: 1,
  },
  actionIcon: {
    width: 53,
    height: 53,
    borderRadius: 15,
    backgroundColor: "#F8ECEF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#40383A",
    marginTop: 9,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 15,
  },
  loadingHistory: {
    alignItems: "center",
    padding: 30,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#888888",
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FAF7F8",
    borderRadius: 13,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#40383A",
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 11,
    color: "#888888",
    textAlign: "center",
    marginTop: 6,
  },
  transactionList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: "#F0EAEA",
    borderRadius: 13,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#292326",
  },
  transactionDate: {
    fontSize: 10,
    color: "#888888",
    marginTop: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 5,
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: BURGUNDY,
  },
  modalDescription: {
    fontSize: 12,
    color: "#777777",
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 22,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#40383A",
    marginBottom: 8,
  },
  amountInput: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5DADD",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 17,
    color: "#292326",
  },
  confirmFundingButton: {
    height: 50,
    backgroundColor: BURGUNDY,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  confirmFundingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelFundingButton: {
    alignItems: "center",
    padding: 13,
    marginTop: 5,
  },
  cancelFundingText: {
    color: "#777777",
    fontSize: 13,
    fontWeight: "600",
  },
});
