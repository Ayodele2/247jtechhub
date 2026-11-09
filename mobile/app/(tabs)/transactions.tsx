
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BURGUNDY = "#741B2B";

type TransactionStatus = "Successful" | "Pending" | "Failed";

type Transaction = {
  id: string;
  title: string;
  reference: string;
  date: string;
  amount: number;
  type: "airtime" | "data" | "wallet" | "electricity" | "cable" | "education";
  status: TransactionStatus;
};

const transactions: Transaction[] = [
  {
    id: "TXN001",
    title: "MTN Data Purchase",
    reference: "247TXN10001",
    date: "Today, 10:42 AM",
    amount: -2500,
    type: "data",
    status: "Successful",
  },
  {
    id: "TXN002",
    title: "Wallet Funding",
    reference: "247TXN10002",
    date: "Today, 9:15 AM",
    amount: 5000,
    type: "wallet",
    status: "Successful",
  },
  {
    id: "TXN003",
    title: "Airtel Airtime",
    reference: "247TXN10003",
    date: "Yesterday, 4:15 PM",
    amount: -1000,
    type: "airtime",
    status: "Successful",
  },
  {
    id: "TXN004",
    title: "Electricity Bill",
    reference: "247TXN10004",
    date: "Yesterday, 2:30 PM",
    amount: -3500,
    type: "electricity",
    status: "Pending",
  },
  {
    id: "TXN005",
    title: "WAEC PIN Purchase",
    reference: "247TXN10005",
    date: "Nov 2, 2026, 11:20 AM",
    amount: -3500,
    type: "education",
    status: "Successful",
  },
  {
    id: "TXN006",
    title: "GOtv Subscription",
    reference: "247TXN10006",
    date: "Nov 1, 2026, 8:45 AM",
    amount: -4500,
    type: "cable",
    status: "Failed",
  },
];

const filters = ["All", "Successful", "Pending", "Failed"] as const;

type Filter = (typeof filters)[number];

const formatCurrency = (amount: number) => {
  const absoluteAmount = Math.abs(amount);

  return `${amount >= 0 ? "+" : "-"}₦${absoluteAmount.toLocaleString("en-NG")}`;
};

const getTransactionIcon = (type: Transaction["type"]) => {
  const icons = {
    airtime: "call-outline",
    data: "wifi-outline",
    wallet: "wallet-outline",
    electricity: "flash-outline",
    cable: "tv-outline",
    education: "school-outline",
  } as const;

  return icons[type];
};

const getStatusStyle = (status: TransactionStatus) => {
  switch (status) {
    case "Successful":
      return {
        backgroundColor: "#E8F7EE",
        color: "#159447",
      };
    case "Pending":
      return {
        backgroundColor: "#FFF5E5",
        color: "#C17B13",
      };
    case "Failed":
      return {
        backgroundColor: "#FCEBEC",
        color: "#D33A43",
      };
  }
};

export default function TransactionsScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filteredTransactions =
    activeFilter === "All"
      ? transactions
      : transactions.filter(
          (transaction) => transaction.status === activeFilter
        );

  const successfulCount = transactions.filter(
    (item) => item.status === "Successful"
  ).length;

  const totalSpent = transactions
    .filter(
      (item) => item.status === "Successful" && item.amount < 0
    )
    .reduce((total, item) => total + Math.abs(item.amount), 0);

  const showTransactionDetails = (transaction: Transaction) => {
    alertTransaction(transaction);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Transactions</Text>

          <Text style={styles.subtitle}>
            Keep track of your payments and wallet activity.
          </Text>

          <View style={styles.demoNotice}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#946200"
            />
            <Text style={styles.demoNoticeText}>
              These are sample transactions for demonstration.
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={21}
                  color={BURGUNDY}
                />
              </View>

              <Text style={styles.summaryLabel}>
                Total transactions
              </Text>

              <Text style={styles.summaryNumber}>
                {transactions.length}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  { backgroundColor: "#E8F7EE" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#159447"
                />
              </View>

              <Text style={styles.summaryLabel}>
                Successful
              </Text>

              <Text style={styles.summaryNumber}>
                {successfulCount}
              </Text>
            </View>
          </View>

          <View style={styles.spentCard}>
            <View>
              <Text style={styles.spentLabel}>
                Total successful purchases
              </Text>

              <Text style={styles.spentAmount}>
                ₦{totalSpent.toLocaleString("en-NG")}
              </Text>
            </View>

            <View style={styles.spentIcon}>
              <Ionicons
                name="trending-up-outline"
                size={25}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>
              Transaction History
            </Text>

            <Text style={styles.recordCount}>
              {filteredTransactions.length} records
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((filter) => {
              const selected = activeFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterButton,
                    selected && styles.activeFilterButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.activeFilterText,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.transactionList}>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const statusStyle = getStatusStyle(
                  transaction.status
                );

                return (
                  <TouchableOpacity
                    key={transaction.id}
                    activeOpacity={0.75}
                    onPress={() =>
                      showTransactionDetails(transaction)
                    }
                    style={styles.transactionCard}
                  >
                    <View style={styles.transactionIcon}>
                      <Ionicons
                        name={getTransactionIcon(transaction.type)}
                        size={22}
                        color={BURGUNDY}
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {transaction.title}
                      </Text>

                      <Text style={styles.transactionDate}>
                        {transaction.date}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              statusStyle.backgroundColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusStyle.color },
                          ]}
                        >
                          {transaction.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color:
                              transaction.amount > 0
                                ? "#159447"
                                : "#292326",
                          },
                        ]}
                      >
                        {formatCurrency(transaction.amount)}
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#A39A9C"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={40}
                  color="#B8ACAF"
                />

                <Text style={styles.emptyTitle}>
                  No transactions found
                </Text>

                <Text style={styles.emptyDescription}>
                  There are no {activeFilter.toLowerCase()} transactions to display.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function alertTransaction(transaction: Transaction) {
  const details = [
    `Service: ${transaction.title}`,
    `Reference: ${transaction.reference}`,
    `Date: ${transaction.date}`,
    `Amount: ${formatCurrency(transaction.amount)}`,
    `Status: ${transaction.status}`,
    "",
    "This is a sample transaction. No real payment was processed.",
  ].join("\n");

  Alert.alert("Transaction Details", details, [
    { text: "Close" },
  ]);
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
  demoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: "#FFF8E7",
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 11,
    color: "#806D43",
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    backgroundColor: "#FFF7F8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0EAEA",
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F8ECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#777777",
  },
  summaryNumber: {
    fontSize: 23,
    fontWeight: "700",
    color: "#292326",
    marginTop: 5,
  },
  spentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BURGUNDY,
    borderRadius: 15,
    padding: 18,
    marginTop: 14,
  },
  spentLabel: {
    fontSize: 12,
    color: "#F2DCE1",
  },
  spentAmount: {
    fontSize: 23,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 7,
  },
  spentIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#FFFFFF25",
    alignItems: "center",
    justifyContent: "center",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#292326",
  },
  recordCount: {
    fontSize: 11,
    color: "#888888",
  },
  filterContainer: {
    gap: 9,
    paddingBottom: 5,
  },
  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 17,
    borderRadius: 20,
    backgroundColor: "#F6F3F4",
    borderWidth: 1,
    borderColor: "#F0EAEA",
  },
  activeFilterButton: {
    backgroundColor: BURGUNDY,
    borderColor: BURGUNDY,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777777",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  transactionList: {
    marginTop: 13,
    gap: 12,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#F0EAEA",
    backgroundColor: "#FFFFFF",
    gap: 11,
  },
  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#F8ECEF",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#292326",
  },
  transactionDate: {
    fontSize: 10,
    color: "#888888",
    marginTop: 5,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 7,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
  },
  amountContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#292326",
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    marginTop: 6,
  },
});
