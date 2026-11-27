
import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  type ImageSourcePropType,
} from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import images from "../../assets/images";
import { useAuth } from "../../src/context/AuthContext";
import { apiRequest } from "../../src/lib/api";

const BURGUNDY = "#741B2B";

type Service = {
  title: string;
  image: ImageSourcePropType;
  route: Href | null;
};

type WalletResponse = {
  id: string;
  balance: number;
  balanceKobo: string;
  currency: string;
};

type WalletTransaction = {
  id: string;
  type: string;
  status: string;
  amountKobo: string | number;
  reference: string;
  description: string | null;
  createdAt: string | Date;
};

const services: Service[] = [
  { title: "Data", image: images.data, route: "/data" },
  { title: "Airtime", image: images.call, route: "/airtime" },
  { title: "Electricity", image: images.electricity, route: null },
  { title: "Cable TV", image: images.cable, route: "/cable-tv" },
  { title: "Education", image: images.learn, route: "/(tabs)/education" },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTransactionDate(value: string | Date) {
  const date = new Date(value);

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

function getTransactionImage(
  transaction: WalletTransaction,
): ImageSourcePropType {
  const description = (transaction.description ?? "").toLowerCase();

  if (description.includes("data")) {
    return images.pdata;
  }

  if (description.includes("airtime")) {
    return images.call;
  }

  return images.wallet;
}

function getTransactionTitle(transaction: WalletTransaction) {
  if (transaction.description?.trim()) {
    return transaction.description;
  }

  return transaction.type === "credit"
    ? "Wallet Credit"
    : "Wallet Debit";
}

function getTransactionStatus(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "successful") {
    return {
      label: "Successful",
      color: "#299B68",
    };
  }

  if (normalized === "failed") {
    return {
      label: "Failed",
      color: "#D64545",
    };
  }

  return {
    label: "Pending",
    color: "#C28A28",
  };
}

export default function HomeScreen() {
  const { token } = useAuth();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHomeData = useCallback(async (refresh = false) => {
    if (!token) {
      setError("Please sign in to view your wallet.");
      setIsLoading(false);
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
    } else if (!wallet) {
      setIsLoading(true);
    }

    try {
      const [walletData, transactionData] = await Promise.all([
        apiRequest<WalletResponse>("/wallet", { token }),
        apiRequest<WalletTransaction[]>("/wallet/transactions", { token }),
      ]);

      setWallet(walletData);
      setTransactions(
        Array.isArray(transactionData) ? transactionData.slice(0, 5) : [],
      );
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your account information.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, wallet]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const handleServicePress = (service: Service) => {
    if (service.route) {
      router.push(service.route);
      return;
    }

    Alert.alert(
      service.title,
      `${service.title} service is coming soon.`,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadHomeData(true)}
            tintColor={BURGUNDY}
            colors={[BURGUNDY]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>247 JTECH HUB</Text>
            <Text style={styles.greeting}>Hello, Welcome back 👋</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
              Alert.alert("Notifications", "No new notifications.")
            }
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <Text style={styles.walletLabel}>Available Balance</Text>

            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
            >
              <Text style={styles.hideButton}>
                {balanceVisible ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading && !wallet ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="large"
              style={styles.balanceLoader}
            />
          ) : (
            <Text style={styles.balance}>
              {balanceVisible
                ? wallet
                  ? formatNaira(wallet.balance)
                  : "₦0.00"
                : "₦••••••••"}
            </Text>
          )}

          <View style={styles.walletBottom}>
            <Text style={styles.walletNote}>Your wallet balance</Text>

            <TouchableOpacity
              style={styles.fundButton}
              onPress={() => router.push("/(tabs)/wallet")}
            >
              <Text style={styles.fundButtonText}>＋ Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void loadHomeData(true)}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Services</Text>
            <Text style={styles.sectionSubtitle}>
              What would you like to do?
            </Text>
          </View>

          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.title}
                style={styles.serviceCard}
                activeOpacity={0.75}
                onPress={() => handleServicePress(service)}
              >
                <View style={styles.serviceIcon}>
                  <Image
                    source={service.image}
                    style={styles.serviceImage}
                    resizeMode="contain"
                    accessibilityLabel={service.title}
                  />
                </View>

                <Text style={styles.serviceTitle}>
                  {service.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTag}>247 JTECH HUB</Text>
            <Text style={styles.promoTitle}>
              Stay connected,{"\n"}spend smarter.
            </Text>
            <Text style={styles.promoDescription}>
              Easy airtime and data purchases, anytime.
            </Text>
          </View>

          <Text style={styles.promoEmoji}>🚀</Text>
        </View>

        <TouchableOpacity
          style={styles.referralCard}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              "Referral Programme",
              "Invite friends to 247 JTECH HUB and earn rewards when they meet the referral requirements. Referral rewards will be available once the referral system is connected.",
            )
          }
        >
          <View style={styles.referralContent}>
            <Text style={styles.referralTag}>EARN REWARDS</Text>
            <Text style={styles.referralTitle}>
              Invite friends,{"\n"}earn referral bonuses.
            </Text>
            <Text style={styles.referralDescription}>
              Share 247 JTECH HUB with friends and earn when they qualify.
            </Text>

            <View style={styles.referralButton}>
              <Text style={styles.referralButtonText}>
                Invite Friends →
              </Text>
            </View>
          </View>

          <Text style={styles.referralEmoji}>🎁</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/transactions")}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading && transactions.length === 0 ? (
            <ActivityIndicator
              color={BURGUNDY}
              size="small"
              style={styles.transactionLoader}
            />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyDescription}>
                Your wallet activity will appear here.
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const amount = Number(transaction.amountKobo) / 100;
              const isCredit = transaction.type.toLowerCase() === "credit";
              const status = getTransactionStatus(transaction.status);

              return (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Image
                      source={getTransactionImage(transaction)}
                      style={styles.transactionImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.transactionDetails}>
                    <Text
                      style={styles.transactionTitle}
                      numberOfLines={1}
                    >
                      {getTransactionTitle(transaction)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(transaction.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        isCredit && styles.creditAmount,
                      ]}
                    >
                      {isCredit ? "+" : "-"}
                      {formatNaira(amount)}
                    </Text>
                    <Text
                      style={[
                        styles.transactionStatus,
                        { color: status.color },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
    paddingBottom: 35,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  brand: {
    fontSize: 15,
    fontWeight: "800",
    color: BURGUNDY,
    letterSpacing: 1.2,
  },
  greeting: {
    fontSize: 14,
    color: "#777777",
    marginTop: 7,
  },
  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#F8F2F3",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#E34B4B",
  },
  walletCard: {
    backgroundColor: BURGUNDY,
    borderRadius: 22,
    padding: 22,
    marginBottom: 32,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: {
    color: "#F1DDE1",
    fontSize: 13,
  },
  hideButton: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 22,
  },
  balanceLoader: {
    alignSelf: "flex-start",
    marginTop: 14,
    marginBottom: 22,
  },
  walletBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletNote: {
    color: "#EBD3D8",
    fontSize: 11,
  },
  fundButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  fundButtonText: {
    color: BURGUNDY,
    fontSize: 12,
    fontWeight: "800",
  },
  errorCard: {
    backgroundColor: "#FFF1F1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
  },
  errorText: {
    color: "#A52A2A",
    fontSize: 12,
  },
  retryText: {
    color: BURGUNDY,
    fontWeight: "800",
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#252125",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#888888",
    marginTop: 5,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  serviceCard: {
    width: "48%",
    backgroundColor: "#FAF8F8",
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: "#F0EAEA",
  },
  serviceIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#F2E5E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  serviceImage: {
    width: 26,
    height: 26,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#302A2C",
  },
  promoCard: {
    backgroundColor: "#F5E9EC",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  promoContent: {
    flex: 1,
  },
  promoTag: {
    fontSize: 10,
    fontWeight: "800",
    color: BURGUNDY,
    letterSpacing: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#35252A",
    marginTop: 9,
    lineHeight: 26,
  },
  promoDescription: {
    fontSize: 11,
    color: "#75666A",
    marginTop: 8,
  },
  promoEmoji: {
    fontSize: 48,
    marginLeft: 8,
  },
  referralCard: {
    backgroundColor: "#FFF7E8",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#F3E4C8",
  },
  referralContent: {
    flex: 1,
  },
  referralTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A66A13",
    letterSpacing: 1,
  },
  referralTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#352B20",
    marginTop: 9,
    lineHeight: 25,
  },
  referralDescription: {
    fontSize: 11,
    color: "#796B58",
    marginTop: 8,
    lineHeight: 17,
  },
  referralButton: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 14,
  },
  referralButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  referralEmoji: {
    fontSize: 43,
    marginLeft: 8,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAll: {
    color: BURGUNDY,
    fontSize: 12,
    fontWeight: "700",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1EEEE",
  },
  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#F8F2F3",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionImage: {
    width: 24,
    height: 24,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#302A2C",
  },
  transactionDate: {
    fontSize: 10,
    color: "#929292",
    marginTop: 5,
  },
  transactionRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#302A2C",
  },
  creditAmount: {
    color: "#299B68",
  },
  transactionStatus: {
    fontSize: 10,
    marginTop: 5,
  },
  transactionLoader: {
    marginVertical: 25,
  },
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: 25,
    backgroundColor: "#FAF8F8",
    borderRadius: 15,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#302A2C",
  },
  emptyDescription: {
    fontSize: 11,
    color: "#888888",
    marginTop: 6,
  },
});
