
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/theme';

import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
} from 'firebase/auth';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import app, { db } from '../../firebaseConfig';
const auth = getAuth(app);

export default function SignUpScreen({ onSignUpSuccess, onNavigateSignIn }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper validation functions
  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const validatePassword = (pass) => {
    // Requires >= 8 chars and at least 1 special character
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    return pass.length >= 8 && specialCharRegex.test(pass);
  };

  const handlePressSignUp = async () => {
  setErrorMessage('');

  if (!name || !email || !password || !confirmPassword) {
    setErrorMessage('Please fill in all required fields.');
    return;
  }

  if (!validateEmail(email.trim())) {
    setErrorMessage('Please enter a valid email address.');
    return;
  }

  if (!validatePassword(password)) {
    setErrorMessage(
      'Password must be at least 8 characters and contain at least 1 special character (!@#$%^&*).'
    );
    return;
  }

  if (password !== confirmPassword) {
    setErrorMessage('Passwords do not match.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
  auth,
  email.trim(),
  password
);

const user = userCredential.user;

console.log('Firebase user created:', user.uid);
// Send email verification
await sendEmailVerification(user);

console.log('Verification email sent:', user.email);

// Save additional user information in Firestore
await setDoc(doc(db, 'users', user.uid), {
  name: name.trim(),
  email: email.trim(),
  phone: phone.trim(),
  role: 'Admin',
  createdAt: serverTimestamp(),
});

console.log('User profile saved to Firestore');

Alert.alert(
  'Verify Your Email',
  'Your account has been created successfully. A verification link has been sent to your email. Please check your inbox or spam folder and verify your email before signing in.'
);

onSignUpSuccess();

  } catch (error) {
    console.log('Firebase signup error:', error);

    if (error.code === 'auth/email-already-in-use') {
      setErrorMessage('This email is already registered.');
    } else if (error.code === 'auth/invalid-email') {
      setErrorMessage('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      setErrorMessage('Password is too weak.');
    } else {
      setErrorMessage('Unable to create account. Please try again.');
    }
  }
};
  return (
    <SafeAreaView style={styles.authContainer}>
      <ScrollView style={{ flex: 1, width: '100%' }}>
        <View style={styles.authTopHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>AR</Text>
          </View>
          <Text style={styles.authBrandTitle}>ARTechSolutions</Text>
          <Text style={styles.authBrandSubtitle}>INVENTORY & POS SYSTEM</Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Create Account</Text>
          <Text style={styles.authSubtitle}>Fill in your details to get started</Text>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>FULL NAME *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Maria Santos"
            placeholderTextColor={COLORS.textLight}
            value={name}
            onChangeText={(val) => { setName(val); setErrorMessage(''); }}
          />

          <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textLight}
            value={email}
            onChangeText={(val) => { setEmail(val); setErrorMessage(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={styles.textInput}
            placeholder="+63 917 000 0000"
            placeholderTextColor={COLORS.textLight}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>PASSWORD *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Min 8 chars with 1 special character (@,#,$)"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            value={password}
            onChangeText={(val) => { setPassword(val); setErrorMessage(''); }}
          />

          <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Repeat your password"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            value={confirmPassword}
            onChangeText={(val) => { setConfirmPassword(val); setErrorMessage(''); }}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handlePressSignUp}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchAuthContainer} onPress={onNavigateSignIn}>
            <Text style={styles.switchAuthText}>
              Already have an account? <Text style={styles.boldText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accentYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
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
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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