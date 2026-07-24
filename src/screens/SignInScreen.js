import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../constants/theme';

export default function SignInScreen({ onSignIn, onNavigateSignUp, onNavigateRecover }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Validation functions
  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handlePressSignIn = () => {
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // Clear error and proceed
   // Extract a default name from the email (e.g. "john" from "john@email.com")
    const cleanEmail = email.trim();
    const extractedName = cleanEmail.split('@')[0];
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);

    onSignIn({ 
      email: cleanEmail, 
      name: formattedName 
    });
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
      <View style={styles.authTopHeader}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>AR</Text>
        </View>
        <Text style={styles.authBrandTitle}>ARTechSolutions</Text>
        <Text style={styles.authBrandSubtitle}>INVENTORY & POS SYSTEM</Text>
      </View>

      <View style={styles.authCard}>
        <Text style={styles.authTitle}>Welcome back</Text>
        <Text style={styles.authSubtitle}>Sign in to your admin account</Text>

        {/* Display Error Message Banner if validation fails */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          style={styles.textInput}
          placeholder="admin@artech.ph"
          value={email}
          onChangeText={(val) => { setEmail(val); setErrorMessage(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(val) => { setPassword(val); setErrorMessage(''); }}
        />

        <TouchableOpacity style={styles.forgotButton} onPress={onNavigateRecover}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handlePressSignIn}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAuthContainer} onPress={onNavigateSignUp}>
          <Text style={styles.switchAuthText}>
            Don't have an account? <Text style={styles.boldText}>Sign Up</Text>
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
    justify: 'center',
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 12,
    color: COLORS.primaryBlue,
    fontWeight: '600',
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