import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

import { sendPasswordResetEmail, getAuth } from 'firebase/auth';
import app from '../../firebaseConfig';

const auth = getAuth(app);

export default function RecoverPasswordScreen({ onSendReset, onNavigateSignIn }) {
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const handleSend = async () => {
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    Alert.alert('Error', 'Please enter your email address.');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);

    // Show custom notification
    setShowSuccess(true);

  } catch (error) {
    console.log('Password reset error:', error);

    if (error.code === 'auth/invalid-email') {
      Alert.alert('Error', 'Please enter a valid email address.');
    } else if (error.code === 'auth/user-not-found') {
      Alert.alert(
        'Error',
        'No account was found with this email address.'
      );
    } else {
      Alert.alert(
        'Error',
        'Unable to send password reset email. Please try again.'
      );
    }
  }
};

  return (
  <SafeAreaView style={styles.authContainer}>
    <StatusBar
      barStyle="light-content"
      backgroundColor={COLORS.darkBlue}
    />

    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authTopHeader}>
          <Text style={styles.authBrandTitle}>ARTechSolutions</Text>
          <Text style={styles.authBrandSubtitle}>
            INVENTORY & POS SYSTEM
          </Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Recover Password</Text>

          <Text style={styles.authSubtitle}>
            Enter the email linked to your account. We'll send a password reset link.
          </Text>

          <Text style={styles.inputLabel}>
            LINKED EMAIL ADDRESS
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSend}
          >
            <Text style={styles.primaryButtonText}>
              Send Password Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuthContainer}
            onPress={onNavigateSignIn}
          >
            <Text style={styles.switchAuthText}>
              Remembered it?{' '}
              <Text style={styles.boldText}>
                Back to Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
       </ScrollView>
    </KeyboardAvoidingView>

    {showSuccess && (
      <View style={styles.notificationOverlay}>
        <View style={styles.notificationCard}>

          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>

          <Text style={styles.notificationTitle}>
            Reset Link Sent!
          </Text>

          <Text style={styles.notificationText}>
            A password reset link has been sent to your email.
            {'\n'}
            Please check your inbox or spam folder.
          </Text>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {
  setShowSuccess(false);
  onSendReset();
}}
          >
            <Text style={styles.notificationButtonText}>
              OK
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    )}

  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  keyboardContainer: {
  flex: 1,
},

scrollContainer: {
  flexGrow: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 20,
},
  authTopHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  authBrandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  authBrandSubtitle: {
    fontSize: 10,
    color: '#93C5FD',
    letterSpacing: 1,
  },
  authCard: {
    width: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignSelf: 'center',
    marginVertical: 10,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  authSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  switchAuthContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  boldText: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },
  notificationOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.75)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
},

notificationCard: {
  width: '82%',
  backgroundColor: COLORS.white,
  borderRadius: 20,
  padding: 25,
  alignItems: 'center',
},

successCircle: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: COLORS.accentYellow,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 15,
},

successCheck: {
  fontSize: 30,
  fontWeight: 'bold',
  color: COLORS.darkBlue,
},

notificationTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: COLORS.darkBlue,
  marginBottom: 10,
},

notificationText: {
  fontSize: 13,
  color: COLORS.textLight,
  textAlign: 'center',
  lineHeight: 20,
},

notificationButton: {
  width: '100%',
  backgroundColor: COLORS.primaryBlue,
  borderRadius: 8,
  paddingVertical: 12,
  alignItems: 'center',
  marginTop: 20,
},

notificationButtonText: {
  color: COLORS.white,
  fontSize: 15,
  fontWeight: 'bold',
},
});