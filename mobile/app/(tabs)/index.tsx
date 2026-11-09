import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "../../assets/images";

const BURGUNDY = "#741B2B";

const services = [
  { title: "Data", image: images.data },
  { title: "Airtime", image: images.call },
  { title: "Electricity", image: images.electricity },
  { title: "Cable TV", image: images.cable },
  { title: "Education", image: images.learn },
];

const transactions = [
  {
    image: images.pdata,
    title: "MTN Data Purchase",
    date: "Today, 10:42 AM",
    amount: "-₦2,500",
    status: "Successful",
  },
  {
    image: images.call,
    title: "Airtel Airtime",
    date: "Yesterday, 4:15 PM",
    amount: "-₦1,000",
    status: "Successful",
  },
  {
    image: images.wallet,
    title: "Wallet Funding",
    date: "Yesterday, 9:20 AM",
    amount: "+₦5,000",
    status: "Successful",
  },
];

export default function HomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>247 JTECH HUB</Text>
            <Text style={styles.greeting}>
              Hello, Welcome back 👋
            </Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
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

          <Text style={styles.balance}>
            {balanceVisible ? "₦25,000.00" : "₦••••••••"}
          </Text>

          <View style={styles.walletBottom}>
            <Text style={styles.walletNote}>Your wallet balance</Text>

            <TouchableOpacity style={styles.fundButton}>
              <Text style={styles.fundButtonText}>＋ Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
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

        {/* Promotion */}
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

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Image
                  source={transaction.image}
                  style={styles.transactionImage}
                  resizeMode="contain"
                  accessibilityLabel={transaction.title}
                />
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>
                  {transaction.title}
                </Text>

                <Text style={styles.transactionDate}>
                  {transaction.date}
                </Text>
              </View>

              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  {transaction.amount}
                </Text>

                <Text style={styles.transactionStatus}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          ))}
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
    marginBottom: 30,
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
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#302A2C",
  },
  transactionStatus: {
    fontSize: 10,
    color: "#299B68",
    marginTop: 5,
  },
});