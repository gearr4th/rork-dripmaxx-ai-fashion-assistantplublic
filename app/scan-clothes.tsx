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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon, X, Check, RotateCcw, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useClothes } from "@/providers/ClothesProvider";

const clothingTypes = ["tops", "bottoms", "shoes", "accessories"];
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
  const { addClothingItem } = useClothes();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedType, setSelectedType] = useState("tops");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [saving, setSaving] = useState(false);

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

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const retakePhoto = () => {
    Alert.alert(
      "Retake Photo",
      "How would you like to add a new photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Take Photo",
          onPress: () => pickImage(true),
        },
        {
          text: "Choose from Gallery",
          onPress: () => pickImage(false),
        },
      ]
    );
  };

  const deletePhoto = () => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setImageUri(null),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!imageUri || !name) {
      Alert.alert("Missing Information", "Please add an image and name");
      return;
    }

    setSaving(true);
    try {
      await addClothingItem({
        name,
        brand,
        type: selectedType,
        color: selectedColor,
        imageUrl: imageUri,
      });
      Alert.alert("Success", "Item added to your wardrobe!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
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
                style={styles.imagePickerButton}
                onPress={() => pickImage(true)}
              >
                <Camera color="#FFD700" size={32} />
                <Text style={styles.imagePickerText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage(false)}
              >
                <ImageIcon color="#FFD700" size={32} />
                <Text style={styles.imagePickerText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={retakePhoto}
                >
                  <RotateCcw color="#FFD700" size={20} />
                  <Text style={styles.actionButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={deletePhoto}
                >
                  <Trash2 color="#FF4444" size={20} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
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
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
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
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    gap: 6,
  },
  deleteButton: {
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  actionButtonText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#FF4444",
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  typeScroll: {
    flexDirection: "row",
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 12,
  },
  typeButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  typeButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: "#000000",
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
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  colorButtonActive: {
    borderColor: "#FFD700",
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
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
});