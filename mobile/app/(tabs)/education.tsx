
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../src/context/AuthContext";
import { apiRequest } from "../../src/lib/api";

const BURGUNDY = "#741B2B";

type EducationProvider = {
  name: string;
  slug: string;
  category?: string;
  logo?: string;
};

type EducationProduct = {
  id: string;
  name: string;
  description: string;
};

type EducationExam = {
  id: string;
  name: string;
  description: string;
  icon: "school-outline" | "library-outline";
  products: EducationProduct[];
};

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  "waec-result": "Check your WAEC examination results.",
  "waec-registration": "Registration PIN for WAEC examinations.",
  jamb: "JAMB examination PIN vending.",
};

function getExamId(slug: string): string | null {
  if (slug === "waec-result" || slug === "waec-registration") {
    return "waec";
  }

  if (slug === "jamb") {
    return "jamb";
  }

  return null;
}

function buildExams(providers: EducationProvider[]): EducationExam[] {
  const waecProviders = providers.filter(
    (provider) => getExamId(provider.slug) === "waec",
  );

  const jambProviders = providers.filter(
    (provider) => getExamId(provider.slug) === "jamb",
  );

  const exams: EducationExam[] = [];

  if (waecProviders.length > 0) {
    exams.push({
      id: "waec",
      name: "WAEC",
      description: "West African Examinations Council",
      icon: "school-outline",
      products: waecProviders.map((provider) => ({
        id: provider.slug,
        name: provider.name,
        description:
          PRODUCT_DESCRIPTIONS[provider.slug] ??
          "WAEC examination service.",
      })),
    });
  }

  if (jambProviders.length > 0) {
    exams.push({
      id: "jamb",
      name: "JAMB",
      description: "Joint Admissions and Matriculation Board",
      icon: "library-outline",
      products: jambProviders.map((provider) => ({
        id: provider.slug,
        name: provider.name,
        description:
          PRODUCT_DESCRIPTIONS[provider.slug] ??
          "JAMB examination service.",
      })),
    });
  }

  return exams;
}

export default function EducationScreen() {
  const { token } = useAuth();

  const [exams, setExams] = useState<EducationExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError("Please sign in to view examination services.");
        setIsLoading(false);
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response = await apiRequest<EducationProvider[]>(
          "/services/education/providers",
          { token },
        );

        if (!Array.isArray(response)) {
          throw new Error("The education provider response was unexpected.");
        }

        const validProviders = response.filter(
          (provider) =>
            provider &&
            typeof provider.name === "string" &&
            typeof provider.slug === "string" &&
            provider.category === "education",
        );

        const availableExams = buildExams(validProviders);

        setExams(availableExams);

        if (availableExams.length === 0) {
          setError("No examination providers are currently available.");
          setSelectedExam(null);
          setSelectedProduct(null);
        } else {
          setSelectedExam((current) =>
            availableExams.some((exam) => exam.id === current)
              ? current
              : null,
          );

          setSelectedProduct((current) => {
            const stillAvailable = availableExams.some((exam) =>
              exam.products.some((product) => product.id === current),
            );

            return stillAvailable ? current : null;
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load examination providers. Please try again.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const selectedExamDetails = exams.find(
    (exam) => exam.id === selectedExam,
  );

  const selectedProductDetails = selectedExamDetails?.products.find(
    (product) => product.id === selectedProduct,
  );

  const chooseExam = (examId: string) => {
    setSelectedExam(examId);
    setSelectedProduct(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadProviders(true)}
            tintColor={BURGUNDY}
          />
        }
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Education</Text>

        <Text style={styles.subtitle}>
          Get examination PINs conveniently from your 247 Jtech wallet.
        </Text>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#946200"
          />

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Service setup in progress
            </Text>

            <Text style={styles.noticeDescription}>
              Provider services are being connected. Prices and purchases
              will become available after catalogue verification.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={BURGUNDY} />
            <Text style={styles.stateText}>
              Loading examination providers...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color="#B42318"
            />

            <Text style={styles.errorTitle}>
              Unable to load services
            </Text>

            <Text style={styles.errorDescription}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadProviders()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={17} color="#FFFFFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Select Examination
            </Text>

            <View style={styles.examList}>
              {exams.map((exam) => {
                const isSelected = selectedExam === exam.id;

                return (
                  <TouchableOpacity
                    key={exam.id}
                    activeOpacity={0.8}
                    onPress={() => chooseExam(exam.id)}
                    style={[
                      styles.examCard,
                      isSelected && styles.selectedCard,
                    ]}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        isSelected && styles.selectedIcon,
                      ]}
                    >
                      <Ionicons
                        name={exam.icon}
                        size={25}
                        color={isSelected ? "#FFFFFF" : BURGUNDY}
                      />
                    </View>

                    <View style={styles.examInfo}>
                      <Text style={styles.examName}>{exam.name}</Text>

                      <Text style={styles.examDescription}>
                        {exam.description}
                      </Text>

                      <Text style={styles.productCount}>
                        {exam.products.length} available service
                        {exam.products.length > 1 ? "s" : ""}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        isSelected
                          ? "checkmark-circle"
                          : "chevron-forward"
                      }
                      size={22}
                      color={isSelected ? BURGUNDY : "#A39A9C"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedExamDetails && (
              <View style={styles.productSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.formLabel}>
                      AVAILABLE SERVICES
                    </Text>

                    <Text style={styles.formTitle}>
                      {selectedExamDetails.name} Products
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedExam(null);
                      setSelectedProduct(null);
                    }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={25}
                      color="#888888"
                    />
                  </TouchableOpacity>
                </View>

                {selectedExamDetails.products.map((product) => {
                  const isProductSelected =
                    selectedProduct === product.id;

                  return (
                    <TouchableOpacity
                      key={product.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedProduct(product.id)}
                      style={[
                        styles.productCard,
                        isProductSelected && styles.selectedProduct,
                      ]}
                    >
                      <View style={styles.productIcon}>
                        <Ionicons
                          name="document-text-outline"
                          size={22}
                          color={BURGUNDY}
                        />
                      </View>

                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>
                          {product.name}
                        </Text>

                        <Text style={styles.productDescription}>
                          {product.description}
                        </Text>

                        <Text style={styles.pendingText}>
                          Catalogue pending
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          isProductSelected
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={21}
                        color={BURGUNDY}
                      />
                    </TouchableOpacity>
                  );
                })}

                {selectedProductDetails && (
                  <View style={styles.selectionSummary}>
                    <Ionicons
                      name="time-outline"
                      size={22}
                      color={BURGUNDY}
                    />

                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryTitle}>
                        {selectedProductDetails.name}
                      </Text>

                      <Text style={styles.summaryDescription}>
                        We are waiting for the provider's confirmed product
                        catalogue and pricing.
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={1}
                  disabled
                  style={styles.disabledButton}
                >
                  <Text style={styles.buttonText}>
                    Purchases Coming Soon
                  </Text>

                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#777777"
          />

          <Text style={styles.footerText}>
            Your wallet remains protected. No examination PIN purchases
            or wallet deductions are enabled yet.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: BURGUNDY,
  },
  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 8,
    lineHeight: 21,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#F2E3B9",
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#795400",
  },
  noticeDescription: {
    fontSize: 12,
    color: "#806D43",
    lineHeight: 18,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#292326",
    marginTop: 28,
    marginBottom: 15,
  },
  examList: {
    gap: 12,
  },
  examCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#F0EAEA",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  selectedCard: {
    borderColor: BURGUNDY,
    backgroundColor: "#FFF7F8",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F8ECEF",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIcon: {
    backgroundColor: BURGUNDY,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#292326",
  },
  examDescription: {
    fontSize: 11,
    color: "#888888",
    marginTop: 4,
  },
  productCount: {
    fontSize: 11,
    color: BURGUNDY,
    fontWeight: "700",
    marginTop: 7,
  },
  productSection: {
    marginTop: 24,
    padding: 17,
    borderRadius: 14,
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#F0DDE1",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888888",
    letterSpacing: 1,
    marginBottom: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BURGUNDY,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: "#EADDE0",
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  selectedProduct: {
    borderColor: BURGUNDY,
    backgroundColor: "#FFFBFC",
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8ECEF",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#292326",
  },
  productDescription: {
    fontSize: 11,
    color: "#777777",
    marginTop: 4,
    lineHeight: 16,
  },
  pendingText: {
    fontSize: 10,
    color: "#946200",
    fontWeight: "700",
    marginTop: 6,
  },
  selectionSummary: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFFFF",
    padding: 13,
    borderRadius: 10,
    marginTop: 8,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#292326",
  },
  summaryDescription: {
    fontSize: 11,
    color: "#777777",
    lineHeight: 17,
    marginTop: 4,
  },
  disabledButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#B9A3A7",
    padding: 16,
    borderRadius: 12,
    marginTop: 18,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
    gap: 12,
  },
  stateText: {
    fontSize: 13,
    color: "#777777",
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: "#FFF5F4",
    borderRadius: 14,
    padding: 20,
    marginTop: 25,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B42318",
    marginTop: 10,
  },
  errorDescription: {
    fontSize: 12,
    color: "#777777",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 7,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BURGUNDY,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 9,
    marginTop: 15,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 25,
    paddingHorizontal: 3,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: "#777777",
    lineHeight: 17,
  },
});
