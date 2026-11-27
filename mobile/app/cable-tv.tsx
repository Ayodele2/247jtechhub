
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "../src/context/AuthContext";
import { apiRequest } from "../src/lib/api";

const BURGUNDY = "#741B2B";

type CableProvider = {
  name: string;
  category: string;
  slug: string;
  logo?: string;
};

type CablePackage = {
  code: string;
  description: string;
  price: number | string;
  variation?: string;
};

type BouquetResponse = {
  packages: CablePackage[];
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export default function CableTVScreen() {
  const { token } = useAuth();

  const [providers, setProviders] = useState<CableProvider[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<CableProvider | null>(null);

  const [packages, setPackages] = useState<CablePackage[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<CablePackage | null>(null);

  const [isValidationModalVisible, setIsValidationModalVisible] =
    useState(false);
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<unknown>(null);
  const [validationError, setValidationError] = useState("");

  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [error, setError] = useState("");

  const loadProviders = useCallback(async () => {
    if (!token) {
      setIsLoadingProviders(false);
      return;
    }

    try {
      setError("");

      const result = await apiRequest<CableProvider[]>(
        "/services/cable/providers",
        { token },
      );

      setProviders(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Cable TV providers.",
      );
    } finally {
      setIsLoadingProviders(false);
    }
  }, [token]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const selectProvider = async (provider: CableProvider) => {
    if (!token) return;

    setSelectedProvider(provider);
    setSelectedPackage(null);
    setIsValidationModalVisible(false);
    setPackages([]);
    setSmartCardNumber("");
    setValidationResult(null);
    setValidationError("");
    setIsLoadingPackages(true);
    setError("");

    try {
      const result = await apiRequest<BouquetResponse>(
        `/services/cable/${provider.slug}/bouquets`,
        { token },
      );

      setPackages(
        Array.isArray(result.packages) ? result.packages : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load subscription packages.",
      );
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleValidate = async () => {
    if (!token || !selectedProvider) return;

    const number = smartCardNumber.trim();

    if (!/^\d{5,20}$/.test(number)) {
      setValidationError(
        "Enter a valid smart-card number containing 5–20 digits.",
      );
      return;
    }

    try {
      setIsValidating(true);
      setValidationError("");
      setValidationResult(null);

      const result = await apiRequest<unknown>(
        "/services/cable/validate",
        {
          method: "POST",
          token,
          body: {
            service: selectedProvider.slug,
            smartCardNumber: number,
          },
        },
      );

      setValidationResult(result);
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : "Unable to validate this smart-card number. Please try again.",
      );
    } finally {
      setIsValidating(false);
    }
  };

  const isValidCardNumber = /^\d{5,20}$/.test(
    smartCardNumber.trim(),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#241F20" />
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>Cable TV</Text>
          <Text style={styles.headerSubtitle}>
            Choose your TV subscription
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Select provider</Text>

        {isLoadingProviders ? (
          <ActivityIndicator color={BURGUNDY} />
        ) : (
          <View style={styles.providerGrid}>
            {providers.map((provider) => {
              const selected =
                selectedProvider?.slug === provider.slug;

              return (
                <Pressable
                  key={provider.slug}
                  onPress={() => void selectProvider(provider)}
                  style={[
                    styles.providerCard,
                    selected && styles.selectedCard,
                  ]}
                >
                  <View style={styles.providerIcon}>
                    <Ionicons
                      name="tv-outline"
                      size={27}
                      color={BURGUNDY}
                    />
                  </View>

                  <Text style={styles.providerName}>
                    {provider.name}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color={BURGUNDY}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadProviders()}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {selectedProvider ? (
          <>
            <Text style={styles.sectionTitle}>
              {selectedProvider.name} packages
            </Text>

            {isLoadingPackages ? (
              <ActivityIndicator color={BURGUNDY} />
            ) : packages.length > 0 ? (
              <View style={styles.packageList}>
                {packages.map((item) => {
                  const selected =
                    selectedPackage?.code === item.code;

                  return (
                    <Pressable
                      key={item.code}
                      onPress={() => {
                        setSelectedPackage(item);
                        setSmartCardNumber("");
                        setValidationResult(null);
                        setValidationError("");
                        setIsValidationModalVisible(true);
                      }}
                      style={[
                        styles.packageCard,
                        selected && styles.selectedCard,
                      ]}
                    >
                      <View style={styles.packageDetails}>
                        <Text style={styles.packageName}>
                          {item.description}
                        </Text>

                        <Text style={styles.packagePrice}>
                          {formatNaira(Number(item.price))}
                        </Text>
                      </View>

                      <Ionicons
                        name={
                          selected
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={22}
                        color={BURGUNDY}
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No packages available for this provider.
              </Text>
            )}
          </>
        ) : null}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={BURGUNDY}
          />
          <Text style={styles.noticeText}>
            Selecting a package and validating your smart-card
            does not make a payment. Subscription purchases are
            not enabled yet.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={isValidationModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsValidationModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>
                  Validate smart-card
                </Text>
                <Text style={styles.modalSubtitle}>
                  Confirm the decoder details before proceeding.
                </Text>
              </View>

              <Pressable
                onPress={() => setIsValidationModalVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close validation"
              >
                <Ionicons name="close" size={22} color="#55484A" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets={
                Platform.OS === "ios"
              }
              showsVerticalScrollIndicator={false}
            >
              {selectedPackage ? (
                <View style={styles.selectedPackageSummary}>
                  <Text style={styles.summaryProvider}>
                    {selectedProvider?.name}
                  </Text>

                  <Text style={styles.summaryPackage}>
                    {selectedPackage.description}
                  </Text>

                  <Text style={styles.summaryPrice}>
                    {formatNaira(Number(selectedPackage.price))}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>
                {selectedProvider?.name} smart-card / IUC number
              </Text>

              <TextInput
                style={styles.input}
                value={smartCardNumber}
                onChangeText={(value) => {
                  setSmartCardNumber(
                    value.replace(/\D/g, "").slice(0, 20),
                  );
                  setValidationResult(null);
                  setValidationError("");
                }}
                placeholder="Enter smart-card number"
                placeholderTextColor="#A69B9D"
                keyboardType="number-pad"
                maxLength={20}
                autoFocus
                secureTextEntry={false}
                selectionColor={BURGUNDY}
                autoCorrect={false}
                autoComplete="off"
              />

              <Text style={styles.inputHint}>
                Your digits will remain visible so you can check them.
              </Text>

              <Pressable
                onPress={() => void handleValidate()}
                disabled={!isValidCardNumber || isValidating}
                style={[
                  styles.validateButton,
                  (!isValidCardNumber || isValidating) &&
                    styles.disabledButton,
                ]}
              >
                {isValidating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text style={styles.validateButtonText}>
                      Validate smart-card
                    </Text>
                  </>
                )}
              </Pressable>

              {validationError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>
                    {validationError}
                  </Text>
                </View>
              ) : null}

              {validationResult !== null ? (
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color="#16803C"
                    />
                    <Text style={styles.resultTitle}>
                      Validation response received
                    </Text>
                  </View>

                  <Text style={styles.resultDescription}>
                    Review the provider response below. Customer details
                    will be displayed in a structured confirmation once
                    the provider response format is confirmed.
                  </Text>

                  <Text style={styles.resultJson}>
                    {typeof validationResult === "string"
                      ? validationResult
                      : JSON.stringify(validationResult, null, 2)}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.modalNotice}>
                Validation does not make a payment. Subscription purchases
                are not enabled yet.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0ECEC",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F7F3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#241F20",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8B8284",
    marginTop: 3,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#241F20",
    marginBottom: 14,
    marginTop: 10,
  },
  providerGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  providerCard: {
    flex: 1,
    minHeight: 105,
    borderWidth: 1,
    borderColor: "#EEE7E8",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 8,
  },
  selectedCard: {
    borderColor: BURGUNDY,
    backgroundColor: "#FCF5F6",
  },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#F8EFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#30292A",
  },
  packageList: {
    gap: 10,
  },
  packageCard: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#EEE7E8",
    borderRadius: 13,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  packageDetails: {
    flex: 1,
    gap: 5,
  },
  packageName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#30292A",
  },
  packagePrice: {
    fontSize: 13,
    fontWeight: "700",
    color: BURGUNDY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 12, 14, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
    maxHeight: "90%",
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  modalHeading: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#241F20",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#8B8284",
    marginTop: 5,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7F3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  selectedPackageSummary: {
    backgroundColor: "#FCF5F6",
    borderRadius: 13,
    padding: 14,
    marginBottom: 18,
    gap: 4,
  },
  summaryProvider: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B626B",
    textTransform: "uppercase",
  },
  summaryPackage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#30292A",
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: BURGUNDY,
    marginTop: 3,
  },
  modalNotice: {
    fontSize: 11,
    lineHeight: 17,
    color: "#8B8284",
    marginTop: 15,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#55484A",
    marginBottom: 9,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E8DEDF",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#241F20",
    backgroundColor: "#FFFFFF",
  },
  inputHint: {
    fontSize: 11,
    color: "#8B8284",
    marginTop: 7,
  },
  validateButton: {
    height: 52,
    backgroundColor: BURGUNDY,
    borderRadius: 12,
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  disabledButton: {
    opacity: 0.45,
  },
  validateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  resultCard: {
    backgroundColor: "#F1FAF3",
    borderWidth: 1,
    borderColor: "#D4EBD9",
    borderRadius: 13,
    padding: 14,
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#176B35",
  },
  resultDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#435C49",
    marginTop: 9,
  },
  resultJson: {
    fontSize: 11,
    lineHeight: 17,
    color: "#263A2C",
    marginTop: 12,
    fontFamily: "monospace",
  },
  errorCard: {
    backgroundColor: "#FFF3F3",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
  },
  retryText: {
    color: BURGUNDY,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyText: {
    color: "#8B8284",
    fontSize: 13,
    marginBottom: 12,
  },
  notice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FCF5F6",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  noticeText: {
    flex: 1,
    color: "#55484A",
    fontSize: 12,
    lineHeight: 18,
  },
});
