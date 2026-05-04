import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,

  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon, X, Check, RotateCcw, Trash2, ScanSearch } from "lucide-react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useClothes } from "@/providers/ClothesProvider";
import { useBudget } from "@/providers/BudgetProvider";
import { analyzeClothingImage, evaluateBudgetAndOccasion } from "@/utils/aiService";
import ImageAnalysisCard from "@/components/ImageAnalysisCard";
import BudgetRecommendationCard from "@/components/BudgetRecommendationCard";
import { ImageAnalysisResult, BudgetRecommendation, Occasion } from "@/types";

const clothingTypes = ["tops", "bottoms", "shoes", "accessories", "jewelry"];
const occasions: { id: Occasion; name: string; icon: string }[] = [
  { id: 'casual', name: 'Casual', icon: '👕' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'party', name: 'Party', icon: '🎉' },
  { id: 'date', name: 'Date', icon: '💕' },
  { id: 'gym', name: 'Gym', icon: '💪' },
  { id: 'formal', name: 'Formal', icon: '🤵' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'daily wear', name: 'Daily', icon: '🌟' },
];
const colors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#808080" },
  { name: "Navy", hex: "#000080" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#008000" },
  { name: "Brown", hex: "#8B4513" },
];

export default function ScanClothesScreen() {
  const { addClothingItemWithAnalysis } = useClothes();
  const { budget } = useBudget();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("tops");
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [selectedJewelrySubtype, setSelectedJewelrySubtype] = useState<'watch' | 'chain' | 'bracelet' | 'ring' | 'earrings' | 'other'>('watch');
  const [saving, setSaving] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [budgetRecommendation, setBudgetRecommendation] = useState<BudgetRecommendation | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('casual');


  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission needed", 
        useCamera 
          ? "Please grant permission to access camera" 
          : "Please grant permission to access photos"
      );
      return;
    }

    const commonOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    };

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(commonOptions)
      : await ImagePicker.launchImageLibraryAsync(commonOptions);

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setImageMime(asset.type ? `${asset.type}/${asset.uri.split('.').pop() ?? 'jpeg'}` : 'image/jpeg');
      setAnalysis(null);
      setName(asset.fileName ?? name);
    }
  };

  const retakePhoto = () => {
    Alert.alert(
      "Retake Photo",
      "How would you like to add a new photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Gallery", onPress: () => pickImage(false) },
      ]
    );
  };

  const deletePhoto = () => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
            setImageUri(null);
            setImageBase64(null);
            setImageMime(null);
            setAnalysis(null);
          } },
      ]
    );
  };

  const handleAnalyze = async () => {
    if (!imageBase64 || !imageMime) {
      Alert.alert("No image", "Please add a clothing photo first.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await analyzeClothingImage({ base64: imageBase64, mimeType: imageMime });
      setAnalysis(res);
      if (!name && res.itemName) setName(res.itemName);
      if (!brand && res.brand) setBrand(res.brand);
      
      const budgetRec = evaluateBudgetAndOccasion(res, budget, selectedOccasion);
      setBudgetRecommendation(budgetRec);

    } catch {
      Alert.alert("Analysis failed", "Could not analyze the image. Please try another photo.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!imageUri || !name || !analysis) {
      Alert.alert("Missing Information", "Please add an image, name, and analyze the item first");
      return;
    }

    setSaving(true);
    try {
      await addClothingItemWithAnalysis({
        name,
        brand,
        type: selectedType,
        color: selectedColor,
        imageUrl: imageUri,
        ...(selectedType === 'jewelry' && { jewelrySubtype: selectedJewelrySubtype }),
      }, analysis);
      Alert.alert("Success", "Item added to your wardrobe with analysis!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={["#020B1C", "#0A1A2F", "#071E2B", "#0C1425"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Add to Wardrobe</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!imageUri ? (
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity
                testID="take-photo"
                style={styles.imagePickerButton}
                onPress={() => pickImage(true)}
              >
                <Camera color="#F97316" size={32} />
                <Text style={styles.imagePickerText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="pick-photo"
                style={styles.imagePickerButton}
                onPress={() => pickImage(false)}
              >
                <ImageIcon color="#F97316" size={32} />
                <Text style={styles.imagePickerText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <View style={styles.imageActions}>
                <TouchableOpacity
                  testID="retake-photo"
                  style={styles.actionButton}
                  onPress={retakePhoto}
                >
                  <RotateCcw color="#FB923C" size={20} />
                  <Text style={styles.actionButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="delete-photo"
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={deletePhoto}
                >
                  <Trash2 color="#FF4444" size={20} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                testID="analyze-button"
                style={[styles.analyzeButton, analyzing && styles.disabledButton]}
                onPress={handleAnalyze}
                disabled={analyzing}
              >
                <LinearGradient colors={["#F97316", "#EA580C"]} style={styles.gradientButtonRow}>
                  {analyzing ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <ScanSearch color="#FFF" size={22} />
                      <Text style={styles.analyzeText}>Analyze Item</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {analysis && (
                <View style={{ marginTop: 16 }}>
                  <ImageAnalysisCard result={analysis} />
                  {budgetRecommendation && (
                    <BudgetRecommendationCard 
                      recommendation={budgetRecommendation} 
                      currency={analysis.currency}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {analysis && (
            <View style={styles.occasionSection}>
              <Text style={styles.label}>Select Occasion for Analysis</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.occasionScroll}
              >
                {occasions.map((occasion) => (
                  <TouchableOpacity
                    key={occasion.id}
                    style={[
                      styles.occasionButton,
                      selectedOccasion === occasion.id && styles.occasionButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedOccasion(occasion.id);
                      if (analysis) {
                        const budgetRec = evaluateBudgetAndOccasion(analysis, budget, occasion.id);
                        setBudgetRecommendation(budgetRec);
                      }
                    }}
                  >
                    <Text style={styles.occasionIcon}>{occasion.icon}</Text>
                    <Text
                      style={[
                        styles.occasionText,
                        selectedOccasion === occasion.id && styles.occasionTextActive,
                      ]}
                    >
                      {occasion.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                testID="item-name-input"
                style={styles.input}
                placeholder="e.g., Black Leather Jacket"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                testID="brand-input"
                style={styles.input}
                placeholder="e.g., Nike, Zara"
                placeholderTextColor="#666"
                value={brand}
                onChangeText={setBrand}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScroll}
              >
                {clothingTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      selectedType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedType === 'jewelry' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jewelry Type</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeScroll}
                >
                  {(['watch', 'chain', 'bracelet', 'ring', 'earrings', 'other'] as const).map((subtype) => (
                    <TouchableOpacity
                      key={subtype}
                      style={[
                        styles.typeButton,
                        selectedJewelrySubtype === subtype && styles.typeButtonActive,
                      ]}
                      onPress={() => setSelectedJewelrySubtype(subtype)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedJewelrySubtype === subtype && styles.typeButtonTextActive,
                        ]}
                      >
                        {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Color</Text>
              <View style={styles.colorGrid}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color.hex}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.hex },
                      selectedColor === color.hex && styles.colorButtonActive,
                    ]}
                    onPress={() => setSelectedColor(color.hex)}
                  >
                    {selectedColor === color.hex && (
                      <Check color={color.hex === "#FFFFFF" ? "#000" : "#FFF"} size={16} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            testID="save-item-button"
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={["#F97316", "#EA580C"]}
              style={styles.gradientButton}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Add to Wardrobe"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#E2E8F0",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  imagePickerContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  imagePickerButton: {
    flex: 1,
    height: 120,
    backgroundColor: "rgba(8, 30, 50, 0.4)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(249, 115, 22, 0.3)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  imageContainer: {
    marginBottom: 32,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    marginBottom: 12,
  },
  imageActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(8, 30, 50, 0.4)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
    gap: 6,
  },
  deleteButton: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  actionButtonText: {
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  deleteButtonText: {
    color: "#EF4444",
  },
  analyzeButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  gradientButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  analyzeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#CBD5E1",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(8, 30, 50, 0.6)",
    borderRadius: 14,
    padding: 16,
    color: "#E2E8F0",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.18)",
  },
  typeScroll: {
    flexDirection: "row",
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(8, 30, 50, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.15)",
    marginRight: 12,
  },
  typeButtonActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  typeButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(100, 116, 139, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  colorButtonActive: {
    borderColor: "#F97316",
    borderWidth: 3,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    padding: 18,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  disabledButton: {
    opacity: 0.6,
  },
  occasionSection: {
    marginBottom: 24,
  },
  occasionScroll: {
    flexDirection: "row",
  },
  occasionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(8, 30, 50, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.15)",
    marginRight: 12,
    gap: 6,
  },
  occasionButtonActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  occasionIcon: {
    fontSize: 16,
  },
  occasionText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  occasionTextActive: {
    color: "#FFFFFF",
  },
});