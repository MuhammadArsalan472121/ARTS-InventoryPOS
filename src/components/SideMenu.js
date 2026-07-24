import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/theme';

export default function SideMenu({ visible, activeTab, setActiveTab, onClose, onSignOut, user }) {
  if (!visible) return null;

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard' },
    { id: 'PRODUCTS', label: 'Products' },
    { id: 'INVENTORY', label: 'Inventory' },
    { id: 'REPORTS', label: 'Reports' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop overlay touch to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <SafeAreaView style={styles.menuContainer}>
          <View style={styles.innerContent}>
            {/* Header / App Info */}
            <View style={styles.headerSection}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>AR</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.brandTitle}>ARTechSolutions</Text>
                <Text style={styles.brandSubtitle}>Inventory & POS v1.0</Text>
              </View>
            </View>

            {/* User Profile Card */}
            <View style={styles.userCard}>
              <Text style={styles.userName}>{user?.name || 'Admin User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'admin@artech.ph'}</Text>
            </View>

            {/* Navigation Links */}
            <View style={styles.navigationSection}>
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    onPress={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                  >
                    <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Actions */}
            <View style={styles.footerSection}>
              <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close Menu</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
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
    height: '100%',
    backgroundColor: COLORS.white,
  },
  innerContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
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
  },
  userCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
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
  },
  navigationSection: {
    flex: 1,
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 6,
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
  footerSection: {
    gap: 10,
    paddingBottom: 8,
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: COLORS.dangerRed,
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
});