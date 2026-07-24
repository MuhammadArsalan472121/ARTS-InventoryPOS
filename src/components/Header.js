import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Header({ title, onOpenMenu, onOpenProfile, user }) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onOpenMenu} style={styles.iconButton}>
        <Text style={styles.hamburgerIcon}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{title}</Text>

      <TouchableOpacity onPress={onOpenProfile} style={styles.profileBadge}>
        <Text style={styles.profileBadgeText}>{initial}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    backgroundColor: COLORS.darkBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    padding: 4,
  },
  hamburgerIcon: {
    color: COLORS.white,
    fontSize: 22,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBadgeText: {
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    fontSize: 14,
  },
});