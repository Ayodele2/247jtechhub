
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BURGUNDY = "#741B2B";

const exams = [
  {
    id: "waec",
    name: "WAEC",
    description: "West African Examinations Council",
    icon: "school-outline" as const,
    price: 3500,
    products: ["WAEC Result Checker PIN"],
  },
  {
    id: "neco",
    name: "NECO",
    description: "National Examinations Council",
    icon: "book-outline" as const,
    price: 1500,
    products: ["NECO Result Checker PIN"],
  },
  {
    id: "jamb",
    name: "JAMB",
    description: "Joint Admissions and Matriculation Board",
    icon: "library-outline" as const,
    price: 8500,
    products: ["JAMB Registration PIN"],
  },
  {
    id: "nabteb",
    name: "NABTEB",
    description: "National Business and Technical Examinations Board",
    icon: "document-text-outline" as const,
    price: 1500,
    products: ["NABTEB Result Checker PIN"],
  },
];

const formatCurrency = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export default function EducationScreen() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [candidateName, setCandidateName] = useState("");
  const [candidateNumber, setCandidateNumber] = useState("");

  const selectedExamDetails = exams.find(
    (exam) => exam.id === selectedExam
  );

  const total =
    selectedExamDetails?.price
      ? selectedExamDetails.price * quantity
      : 0;

  const chooseExam = (examId: string) => {
    const exam = exams.find((item) => item.id === examId);

    setSelectedExam(examId);
    setSelectedProduct(exam?.products[0] ?? "");
    setQuantity(1);
    setCandidateName("");
    setCandidateNumber("");
  };

  const closePurchaseForm = () => {
    setSelectedExam(null);
    setSelectedProduct("");
    setQuantity(1);
    setCandidateName("");
    setCandidateNumber("");
  };

  const handlePurchase = () => {
    if (!selectedExamDetails) return;

    if (!candidateName.trim()) {
      Alert.alert("Missing details", "Please enter the candidate's name.");
      return;
    }

    if (!candidateNumber.trim()) {
      Alert.alert("Missing details", "Please enter the candidate or registration number.");
      return;
    }

    Alert.alert(
      "Demonstration purchase",
      `Your ${selectedExamDetails.name} order has been simulated.\n\nProduct: ${selectedProduct}\nQuantity: ${quantity}\nTotal: ${formatCurrency(total)}\n\nNo payment was made and no examination PIN was generated.`,
      [{ text: "Got it" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Education</Text>
          <Text style={styles.subtitle}>
            Purchase examination pins quickly and securely.
          </Text>

          <View style={styles.demoBanner}>
            <Ionicons
              name="flask-outline"
              size={20}
              color="#946200"
            />
            <View style={styles.demoTextContainer}>
              <Text style={styles.demoTitle}>Demonstration Mode</Text>
              <Text style={styles.demoDescription}>
                Prices are temporary examples. No real purchases can be made yet.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Select Examination</Text>

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
                    <Text style={styles.examPrice}>
                      From {formatCurrency(exam.price)}
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
            <View style={styles.purchaseForm}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formLabel}>PURCHASE DETAILS</Text>
                  <Text style={styles.formTitle}>
                    {selectedExamDetails.name} Purchase
                  </Text>
                </View>

                <TouchableOpacity onPress={closePurchaseForm}>
                  <Ionicons
                    name="close-circle-outline"
                    size={25}
                    color="#888888"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Examination product</Text>

              {selectedExamDetails.products.map((product) => (
                <TouchableOpacity
                  key={product}
                  onPress={() => setSelectedProduct(product)}
                  style={[
                    styles.productOption,
                    selectedProduct === product && styles.selectedProduct,
                  ]}
                >
                  <Text style={styles.productText}>{product}</Text>
                  <Ionicons
                    name={
                      selectedProduct === product
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={BURGUNDY}
                  />
                </TouchableOpacity>
              ))}

              <Text style={styles.inputLabel}>Candidate name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter candidate's full name"
                placeholderTextColor="#A39A9C"
                value={candidateName}
                onChangeText={setCandidateName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>
                Candidate / registration number
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter candidate number"
                placeholderTextColor="#A39A9C"
                value={candidateNumber}
                onChangeText={setCandidateNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Quantity</Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  disabled={quantity <= 1}
                  onPress={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={quantity <= 1 ? "#BDBDBD" : BURGUNDY}
                  />
                </TouchableOpacity>

                <Text style={styles.quantityValue}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    setQuantity((current) => Math.min(10, current + 1))
                  }
                  disabled={quantity >= 10}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={quantity >= 10 ? "#BDBDBD" : BURGUNDY}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Unit price</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(selectedExamDetails.price)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Quantity</Text>
                  <Text style={styles.summaryValue}>{quantity}</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total amount</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(total)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.purchaseButton,
                  !selectedProduct && styles.disabledButton,
                ]}
                onPress={handlePurchase}
                disabled={!selectedProduct}
              >
                <Text style={styles.purchaseButtonText}>
                  Simulate Purchase
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Demo only. No wallet deduction, payment or PIN delivery will occur.
              </Text>
            </View>
          )}
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
    paddingBottom: 35,
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
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#F2E3B9",
    borderRadius: 12,
    padding: 13,
    marginTop: 20,
  },
  demoTextContainer: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#795400",
  },
  demoDescription: {
    fontSize: 11,
    color: "#806D43",
    lineHeight: 17,
    marginTop: 3,
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
  examPrice: {
    fontSize: 12,
    color: BURGUNDY,
    fontWeight: "700",
    marginTop: 6,
  },
  purchaseForm: {
    marginTop: 24,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#FFF7F8",
    borderWidth: 1,
    borderColor: "#F0DDE1",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
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
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#40383A",
    marginBottom: 8,
    marginTop: 16,
  },
  productOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderWidth: 1,
    borderColor: "#EADDE0",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  selectedProduct: {
    borderColor: BURGUNDY,
  },
  productText: {
    fontSize: 13,
    color: "#40383A",
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#EADDE0",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    fontSize: 13,
    color: "#292326",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EADDE0",
    padding: 6,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F8ECEF",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#292326",
  },
  summary: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#777777",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#40383A",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F0EAEA",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#292326",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: BURGUNDY,
  },
  purchaseButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: BURGUNDY,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  disclaimer: {
    fontSize: 11,
    color: "#888888",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 12,
  },
});
