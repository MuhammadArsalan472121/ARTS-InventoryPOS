import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/theme';

import { sendPasswordResetEmail, getAuth } from 'firebase/auth';
import app from '../../firebaseConfig';

const auth = getAuth(app);

export default function RecoverPasswordScreen({ onSendReset, onNavigateSignIn }) {
  const [email, setEmail] = useState('');

  const handleSend = async () => {
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    Alert.alert('Error', 'Please enter your email address.');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);

    Alert.alert(
      'Success',
      'Password reset link has been sent to your email.'
    );

    onSendReset();

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
      <View style={styles.authTopHeader}>
        <Text style={styles.authBrandTitle}>ARTechSolutions</Text>
        <Text style={styles.authBrandSubtitle}>INVENTORY & POS SYSTEM</Text>
      </View>

      <View style={styles.authCard}>
        <Text style={styles.authTitle}>Recover Password</Text>
        <Text style={styles.authSubtitle}>Enter the email linked to your account. We'll send a password reset link.</Text>

        <Text style={styles.inputLabel}>LINKED EMAIL ADDRESS</Text>
        <TextInput style={styles.textInput} placeholder="your@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSend}>
          <Text style={styles.primaryButtonText}>Send Password Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAuthContainer} onPress={onNavigateSignIn}>
          <Text style={styles.switchAuthText}>
            Remembered it? <Text style={styles.boldText}>Back to Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
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
});