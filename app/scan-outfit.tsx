import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon, X, RotateCcw, Trash2, Star } from "lucide-react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { rateOutfit } from "@/utils/aiService";
import { OutfitRating } from "@/types";

const occasions = [
  { id: 'casual', name: 'Casual', icon: '👕' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'party', name: 'Party', icon: '🎉' },
  { id: 'date', name: 'Date', icon: '💕' },
  { id: 'gym', name: 'Gym', icon: '💪' },
  { id: 'formal', name: 'Formal', icon: '🤵' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'daily', name: 'Daily', icon: '🌟' },
];

export default function ScanOutfitScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [rating, setRating] = useState<OutfitRating | null>(null);

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
      setRating(null);
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
            setRating(null);
          } },
      ]
    );
  };

  const handleAnalyze = async () => {
    if (!imageBase64 || !imageMime) {
      Alert.alert("No image", "Please add an outfit photo first.");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await rateOutfit({
        base64: imageBase64,
        mimeType: imageMime,
        occasion: selectedOccasion,
      });
      setRating({ ...result, imageUri: imageUri ?? '' });
    } catch (error) {
      console.log('Rating error:', error);
      Alert.alert("Analysis failed", "Could not analyze the outfit. Please try another photo.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getDripColor = (category: string) => {
    switch (category) {
      case 'Maxx Drip': return '#FFD700';
      case 'Pure Drip': return '#9D4EDD';
      case 'Certified Drip': return '#4CAF50';
      case 'Lowkey Drip': return '#FF6B6B';
      default: return '#888';
    }
  };

  return (
    <LinearGradient
      colors={["#000000", "#1A1A1A", "#000000"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Rate Your Outfit</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#F2F2F2" size={24} />
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
                <Camera color="#FF6B00" size={32} />
                <Text style={styles.imagePickerText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="pick-photo"
                style={styles.imagePickerButton}
                onPress={() => pickImage(false)}
              >
                <ImageIcon color="#FF6B00" size={32} />
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
                  <RotateCcw color="#FF6B00" size={20} />
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
            </View>
          )}

          <View style={styles.occasionSection}>
            <Text style={styles.label}>Occasion?</Text>
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
                  onPress={() => setSelectedOccasion(occasion.id)}
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

          {imageUri && !rating && (
            <TouchableOpacity
              testID="analyze-button"
              style={[styles.analyzeButton, analyzing && styles.disabledButton]}
              onPress={handleAnalyze}
              disabled={analyzing}
            >
              <LinearGradient colors={["#FF6B00", "#FF8C00"]} style={styles.gradientButton}>
                {analyzing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Star color="#000000" size={22} />
                    <Text style={styles.analyzeText}>Rate Outfit</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {rating && (
            <View style={styles.ratingContainer}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>{rating.compositeDripScore}</Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, { color: getDripColor(rating.dripCategory) }]}>
                    {rating.dripCategory}
                  </Text>
                </View>
              </View>

              <View style={styles.criteriaContainer}>
                <Text style={styles.criteriaTitle}>Breakdown</Text>
                
                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaName}>Creativity & Style</Text>
                    <Text style={styles.criteriaScore}>{rating.criteria.creativityAndStyle}/100</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rating.criteria.creativityAndStyle}%` }]} />
                  </View>
                  <Text style={styles.criteriaFeedback}>{rating.detailedFeedback.creativityFeedback}</Text>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaName}>Context & Occasion</Text>
                    <Text style={styles.criteriaScore}>{rating.criteria.contextAndOccasion}/100</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rating.criteria.contextAndOccasion}%` }]} />
                  </View>
                  <Text style={styles.criteriaFeedback}>{rating.detailedFeedback.contextFeedback}</Text>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaName}>Color Coordination</Text>
                    <Text style={styles.criteriaScore}>{rating.criteria.colorCoordination}/100</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rating.criteria.colorCoordination}%` }]} />
                  </View>
                  <Text style={styles.criteriaFeedback}>{rating.detailedFeedback.colorFeedback}</Text>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaName}>Accessory & Footwear</Text>
                    <Text style={styles.criteriaScore}>{rating.criteria.accessoryAndFootwear}/100</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rating.criteria.accessoryAndFootwear}%` }]} />
                  </View>
                  <Text style={styles.criteriaFeedback}>{rating.detailedFeedback.accessoryFeedback}</Text>
                </View>

                <View style={styles.criteriaItem}>
                  <View style={styles.criteriaHeader}>
                    <Text style={styles.criteriaName}>Composition & Fit</Text>
                    <Text style={styles.criteriaScore}>{rating.criteria.compositionAndFit}/100</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${rating.criteria.compositionAndFit}%` }]} />
                  </View>
                  <Text style={styles.criteriaFeedback}>{rating.detailedFeedback.compositionFeedback}</Text>
                </View>
              </View>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Overall Summary</Text>
                <Text style={styles.summaryText}>{rating.overallSummary}</Text>
              </View>
            </View>
          )}
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
    color: "#F2F2F2",
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
    borderColor: "rgba(255, 107, 0, 0.3)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    color: "#FF6B00",
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    marginBottom: 24,
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
    backgroundColor: "rgba(30, 58, 95, 0.4)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    gap: 6,
  },
  deleteButton: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  actionButtonText: {
    color: "#60A5FA",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  deleteButtonText: {
    color: "#EF4444",
  },
  occasionSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 12,
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
    backgroundColor: "rgba(30, 58, 95, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.15)",
    marginRight: 12,
    gap: 6,
  },
  occasionButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
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
  analyzeButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
  },
  analyzeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  disabledButton: {
    opacity: 0.6,
  },
  ratingContainer: {
    marginTop: 8,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 4,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#60A5FA',
  },
  scoreOutOf: {
    fontSize: 16,
    color: '#64748B',
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 58, 95, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  criteriaContainer: {
    marginBottom: 24,
  },
  criteriaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 16,
  },
  criteriaItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.3)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.12)',
  },
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  criteriaScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#60A5FA',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(30, 58, 95, 0.4)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  criteriaFeedback: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 22,
  },
});
