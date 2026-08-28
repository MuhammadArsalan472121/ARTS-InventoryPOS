import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';

export default function Header({
  title,
  onOpenMenu,
  onOpenProfile,
  user,
}) {
  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'A';

  return (
    <>
      {/* Android status bar */}
      <StatusBar
        backgroundColor={COLORS.darkBlue}
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.headerContainer}>
        {/* Hamburger */}
        <TouchableOpacity
          onPress={onOpenMenu}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        {/* Profile */}
        <TouchableOpacity
          onPress={onOpenProfile}
          style={styles.profileBadge}
          activeOpacity={0.7}
        >
          <Text style={styles.profileBadgeText}>
            {initial}
          </Text>
        </TouchableOpacity>
      </View>
    </>
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
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  hamburger: {
    width: 28,
    height: 23,
    justifyContent: 'space-between',
  },

  hamburgerLine: {
    width: 28,
    height: 3,
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },

  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 8,
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