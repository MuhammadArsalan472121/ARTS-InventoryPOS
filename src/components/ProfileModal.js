import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function ProfileModal({
  visible,
  user,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password fields - frontend only for now
  const [showPasswordSection, setShowPasswordSection] =
    useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }

    // Reset password fields whenever modal opens
    if (visible) {
      setShowPasswordSection(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [user, visible]);

  // Save name only
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }

    // Only name is being changed.
    // Email remains controlled by the account authentication.
    if (onSave) {
      onSave({
        name: name.trim(),
        email: email,
      });
    }
  };

  // Frontend-only password handler
  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      Alert.alert(
        'Current Password Required',
        'Please enter your current password.'
      );
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(
        'New Password Required',
        'Please enter a new password.'
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Invalid Password',
        'Password should contain at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Passwords Do Not Match',
        'New password and confirm password must match.'
      );
      return;
    }

    // Firebase Authentication will be connected here later.
    Alert.alert(
      'Not Connected Yet',
      'Password change will be available after Firebase Authentication is connected.'
    );
  };

  const getInitial = () => {
    return name
      ? name.charAt(0).toUpperCase()
      : 'U';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>

          {/* TITLE */}
          <Text style={styles.title}>
            User Profile
          </Text>

          {/* AVATAR */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {getInitial()}
            </Text>
          </View>

          {/* NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* EMAIL - READ ONLY */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email Address
            </Text>

            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>
                {email || 'No email available'}
              </Text>

              <Text style={styles.lockText}>
                
              </Text>
            </View>

            <Text style={styles.helperText}>
              Email is linked to your account and cannot
              be changed here.
            </Text>
          </View>

          {/* PASSWORD SECTION HEADER */}
          <TouchableOpacity
            style={styles.passwordHeader}
            onPress={() =>
              setShowPasswordSection(
                !showPasswordSection
              )
            }
          >
            <Text style={styles.passwordHeaderText}>
               Change Password
            </Text>

            <Text style={styles.arrowText}>
              {showPasswordSection ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {/* PASSWORD SECTION */}
          {showPasswordSection && (
            <View style={styles.passwordSection}>

              <Text style={styles.passwordInfo}>
                Your password will be securely updated
                through account authentication when
                Firebase is connected.
              </Text>

              {/* CURRENT PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Current Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>

              {/* NEW PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  New Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>

              {/* CONFIRM PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Confirm New Password
                </Text>

                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.changePasswordBtn}
                onPress={handleChangePassword}
              >
                <Text
                  style={styles.changePasswordText}
                >
                  Change Password
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* BUTTONS */}
          <View style={styles.buttonRow}>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>
                Save Name
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    maxHeight: '90%',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },

  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accentYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },

  inputGroup: {
    width: '100%',
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: COLORS.white,
  },

  // READ ONLY EMAIL
  readOnlyInput: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
  },

  readOnlyText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },

  lockText: {
    fontSize: 14,
    marginLeft: 8,
  },

  helperText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // PASSWORD HEADER
  passwordHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    marginTop: 4,
  },

  passwordHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  arrowText: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  // PASSWORD CONTENT
  passwordSection: {
    width: '100%',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  passwordInfo: {
    fontSize: 10,
    lineHeight: 15,
    color: '#6B7280',
    marginBottom: 12,
  },

  changePasswordBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 2,
  },

  changePasswordText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },

  // BOTTOM BUTTONS
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    alignItems: 'center',
  },

  cancelText: {
    color: COLORS.textDark,
    fontWeight: '600',
  },

  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  saveText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});