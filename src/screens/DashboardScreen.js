import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function DashboardScreen({ onOpenMenu, onOpenProfile, user, productsCount = 0, inventoryItems = [] }) {
  // Safe array fallback prevents the .length crash
  const safeItems = inventoryItems || [];

  const lowStockCount = safeItems.filter((item) => item.stock <= item.minStock).length;
  const totalItemsCount = safeItems.reduce((acc, item) => acc + (item.stock || 0), 0);

  return (
    <ScrollView style={styles.tabContainer}>
      <Header title="Dashboard" onOpenMenu={onOpenMenu} onOpenProfile={onOpenProfile} user={user} />
      <View style={styles.contentPadding}>
        <Text style={styles.greetingTitle}>Welcome, {user?.name || 'User'}</Text>
        <Text style={styles.greetingSubtitle}>Thursday, 10 July 2026 - ARTechSolutions</Text>

        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PRODUCTS</Text>
            <Text style={styles.statNumber}>{productsCount}</Text>
            <Text style={styles.statSubtextSuccess}>+12 this month</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LOW STOCK</Text>
            <Text style={styles.statNumber}>{lowStockCount}</Text>
            <Text style={styles.statSubtextWarning}>Reorder needed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TODAY SALES</Text>
            <Text style={styles.statNumber}>PHP 18,240</Text>
            <Text style={styles.statSubtextSuccess}>23% vs yesterday</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL ITEMS</Text>
            <Text style={styles.statNumber}>{totalItemsCount}</Text>
            <Text style={styles.statSubtextText}>Across catalog</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.activityItem}>
            <View>
              <Text style={styles.activityTitle}>Sale completed</Text>
              <Text style={styles.activitySubtitle}>Invoice #INV-2847 - PHP 3,450.00</Text>
            </View>
            <Text style={styles.activityTime}>09:42 AM</Text>
          </View>

          <View style={styles.activityItem}>
            <View>
              <Text style={styles.activityTitle}>Low stock alert</Text>
              <Text style={styles.activitySubtitle}>USB-C Hub - 8 units left</Text>
            </View>
            <Text style={styles.activityTime}>09:18 AM</Text>
          </View>

          <View style={styles.activityItem}>
            <View>
              <Text style={styles.activityTitle}>Stock updated</Text>
              <Text style={styles.activitySubtitle}>Wireless Keyboard +50 units</Text>
            </View>
            <Text style={styles.activityTime}>08:30 AM</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginVertical: 4,
  },
  statSubtextSuccess: {
    fontSize: 10,
    color: COLORS.successGreen,
  },
  statSubtextWarning: {
    fontSize: 10,
    color: COLORS.warningYellow,
  },
  statSubtextText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  activitySubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.textLight,
  },
});