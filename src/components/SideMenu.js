import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function SideMenu({
  visible,
  activeTab,
  setActiveTab,
  onClose,
  onSignOut,
  user,
}) {
  if (!visible) return null;

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'PRODUCTS', label: 'Products' },
    { id: 'INVENTORY', label: 'Inventory' },
    { id: 'REPORTS', label: 'Reports' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.menuContainer}>
          <View style={styles.innerContent}>

            {/* Header / App Info */}
            <View style={styles.headerSection}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>AR</Text>
              </View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.brandTitle}>
                  ARTechSolutions
                </Text>

                <Text style={styles.brandSubtitle}>
                  Inventory & POS v1.0
                </Text>
              </View>
            </View>

            {/* User Profile Card */}
            <View style={styles.userCard}>
              <Text style={styles.userName}>
                {user?.name || 'Admin User'}
              </Text>

              <Text style={styles.userEmail}>
                {user?.email || 'admin@artech.ph'}
              </Text>
            </View>

            {/* Navigation */}
            <View style={styles.navigationSection}>
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.navItem,
                      isActive && styles.navItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.navItemText,
                        isActive && styles.navItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Actions */}
            <View style={styles.footerSection}>

              <TouchableOpacity
                style={styles.signOutButton}
                activeOpacity={0.7}
                onPress={onSignOut}
              >
                <Text style={styles.signOutText}>
                  Sign Out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.7}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>
                  Close Menu
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  menuContainer: {
    width: '78%',
    flex: 1,
    backgroundColor: COLORS.white,
  },

  innerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,

    // Important for Android bottom navigation area
    paddingBottom: Platform.OS === 'android' ? 18 : 8,

    justifyContent: 'space-between',
  },

  /* ---------- HEADER ---------- */

  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.accentYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  logoBadgeText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.darkBlue,
  },

  headerTextContainer: {
    flex: 1,
  },

  brandTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  brandSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },

  /* ---------- USER ---------- */

  userCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },

  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },

  userEmail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 3,
  },

  /* ---------- NAVIGATION ---------- */

  navigationSection: {
    flex: 1,
  },

  navItem: {
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },

  navItemActive: {
    backgroundColor: '#EFF6FF',
  },

  navItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },

  navItemTextActive: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },

  /* ---------- FOOTER ---------- */

  footerSection: {
    paddingTop: 12,

    // Extra space above Android navigation buttons
    paddingBottom: Platform.OS === 'android' ? 10 : 4,
  },

  signOutButton: {
    minHeight: 52,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  signOutText: {
    color: COLORS.dangerRed,
    fontWeight: 'bold',
    fontSize: 14,
  },

  closeButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
});