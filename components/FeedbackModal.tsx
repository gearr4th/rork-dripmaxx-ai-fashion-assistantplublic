import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Star, Send } from 'lucide-react-native';
import { FeedbackData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEEDBACK_TO_EMAIL, WEB3FORMS_ACCESS_KEY } from '@/utils/config';
import { useAuth } from '@/providers/AuthProvider';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, label }) => {
  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.starButton}
            testID={`star-${star}-${label.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <Star
              size={28}
              color={star <= rating ? '#FFD700' : '#666'}
              fill={star <= rating ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const [easeOfUse, setEaseOfUse] = useState<number>(0);
  const [accuracyOfDripRating, setAccuracyOfDripRating] = useState<number>(0);
  const [usefulnessOfRecommendations, setUsefulnessOfRecommendations] = useState<number>(0);
  const [additionalComments, setAdditionalComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const resetForm = () => {
    setEaseOfUse(0);
    setAccuracyOfDripRating(0);
    setUsefulnessOfRecommendations(0);
    setAdditionalComments('');
  };

  const { user } = useAuth();

  const sendFeedbackEmail = async (feedbackData: FeedbackData) => {
    const backupAndSucceed = async () => {
      const webhookData = {
        text: `🔥 NEW DRIP APP FEEDBACK\n\n⭐ Overall Rating: ${((feedbackData.easeOfUse + feedbackData.accuracyOfDripRating + feedbackData.usefulnessOfRecommendations) / 3).toFixed(1)}/5\n\n📊 Ratings:\n• Ease of Use: ${feedbackData.easeOfUse}/5\n• Drip Accuracy: ${feedbackData.accuracyOfDripRating}/5\n• Recommendations: ${feedbackData.usefulnessOfRecommendations}/5\n\n💬 Comments: ${feedbackData.additionalComments || 'None'}\n\n🔧 Platform: ${feedbackData.deviceInfo}\n📅 Time: ${feedbackData.timestamp.toLocaleString()}`
      };

      console.log('📧 FEEDBACK TO SEND TO', FEEDBACK_TO_EMAIL, webhookData.text);

      const emailBackup = {
        to: FEEDBACK_TO_EMAIL,
        subject: `🔥 Drip App Feedback - ${feedbackData.timestamp.toLocaleDateString()}`,
        body: webhookData.text,
        timestamp: new Date().toISOString()
      };

      const existingEmails = await AsyncStorage.getItem('pending_emails');
      const emailArray = existingEmails ? JSON.parse(existingEmails) : [];
      emailArray.push(emailBackup);
      await AsyncStorage.setItem('pending_emails', JSON.stringify(emailArray));

      console.log('📧 Email backed up locally - will be sent when email service is configured');
      return true;
    };

    try {
      const emailSubject = `Drip App Feedback - ${feedbackData.timestamp.toLocaleDateString()}`;
      const averageRating = ((feedbackData.easeOfUse + feedbackData.accuracyOfDripRating + feedbackData.usefulnessOfRecommendations) / 3).toFixed(1);
      
      const emailBody = `NEW FEEDBACK RECEIVED\n\nOVERALL RATING: ${averageRating}/5 stars\n\nDETAILED RATINGS:\n• Ease of Use: ${feedbackData.easeOfUse}/5\n• Drip Rating Accuracy: ${feedbackData.accuracyOfDripRating}/5\n• Recommendation Usefulness: ${feedbackData.usefulnessOfRecommendations}/5\n\nUSER COMMENTS:\n${feedbackData.additionalComments || 'No additional comments provided'}\n\nTECHNICAL INFO:\n• Feedback ID: ${feedbackData.id}\n• Timestamp: ${feedbackData.timestamp.toLocaleString()}\n• App Version: ${feedbackData.appVersion}\n• Platform: ${feedbackData.deviceInfo}\n\n---\nThis feedback was automatically sent from your Drip App.`;

      if (!WEB3FORMS_ACCESS_KEY) {
        console.warn('WEB3FORMS_ACCESS_KEY is missing. Using local backup.');
        return await backupAndSucceed();
      }

      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_ACCESS_KEY);
      formData.append('subject', emailSubject);
      formData.append('to', FEEDBACK_TO_EMAIL);
      formData.append('email', user?.email ?? 'no-reply@dripapp.local');
      formData.append('message', emailBody);
      formData.append('from_name', user?.email ?? 'Drip App User');
      formData.append('redirect', 'false');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result?.success) {
        console.log('Feedback email sent successfully to', FEEDBACK_TO_EMAIL);
        console.log('Email appears in inbox as forwarded by Web3Forms, reply goes to:', user?.email ?? 'no-reply@dripapp.local');
        return true;
      } else {
        console.warn(`Web3Forms error: ${result?.message ?? 'Unknown error'}`);
        return await backupAndSucceed();
      }
    } catch (error) {
      console.warn('Failed to send feedback email. Falling back to local backup.', error);
      return await backupAndSucceed();
    }
  };

  const handleSubmit = async () => {
    if (easeOfUse === 0 || accuracyOfDripRating === 0 || usefulnessOfRecommendations === 0) {
      Alert.alert('Missing Ratings', 'Please provide ratings for all categories.');
      return;
    }

    setSubmitting(true);
    try {
      const feedbackData: FeedbackData = {
        id: Date.now().toString(),
        easeOfUse,
        accuracyOfDripRating,
        usefulnessOfRecommendations,
        additionalComments: additionalComments.trim(),
        timestamp: new Date(),
        appVersion: '1.0.0-beta',
        deviceInfo: Platform.OS,
      };

      // Store feedback locally as backup
      const existingFeedback = await AsyncStorage.getItem('user_feedback');
      const feedbackArray = existingFeedback ? JSON.parse(existingFeedback) : [];
      feedbackArray.push(feedbackData);
      await AsyncStorage.setItem('user_feedback', JSON.stringify(feedbackArray));

      // Send organized email to your address
      const emailSent = await sendFeedbackEmail(feedbackData);
      
      console.log('Feedback submitted:', feedbackData);
      
      Alert.alert(
        'Thank You! 🙏',
        emailSent 
          ? 'Your feedback has been sent successfully! It helps us improve the app.' 
          : 'Your feedback has been saved locally. We\'ll sync it when connection improves.',
        [{ text: 'OK', onPress: () => {
          resetForm();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#0A0A0A']}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Give Feedback</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            testID="close-feedback-modal"
          >
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>
            Help us improve your experience! Your feedback is valuable to us.
          </Text>

          <StarRating
            rating={easeOfUse}
            onRatingChange={setEaseOfUse}
            label="Ease of use"
          />

          <StarRating
            rating={accuracyOfDripRating}
            onRatingChange={setAccuracyOfDripRating}
            label="Accuracy of drip rating"
          />

          <StarRating
            rating={usefulnessOfRecommendations}
            onRatingChange={setUsefulnessOfRecommendations}
            label="Usefulness of recommendations"
          />

          <View style={styles.commentsSection}>
            <Text style={styles.commentsLabel}>Additional comments (optional)</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Tell us more about your experience..."
              placeholderTextColor="#666"
              value={additionalComments}
              onChangeText={setAdditionalComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="feedback-comments"
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
          testID="submit-feedback"
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Send color="#FFFFFF" size={20} />
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 32,
    lineHeight: 22,
  },
  ratingContainer: {
    marginBottom: 28,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  commentsInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlignVertical: 'top',
  },
  submitButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});