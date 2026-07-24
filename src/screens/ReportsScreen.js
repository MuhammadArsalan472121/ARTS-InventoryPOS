import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function ReportsScreen({ 
  onOpenMenu, 
  onOpenProfile, 
  user, 
  inventoryItems = [] 
}) {
  const [reportPeriod, setReportPeriod] = useState('MONTHLY');

  const totalStock = inventoryItems.reduce((acc, i) => acc + i.stock, 0);
  const lowStockCount = inventoryItems.filter((i) => i.stock <= i.minStock).length;

  return (
    <ScrollView style={styles.tabContainer}>
      <Header title="Reports" onOpenMenu={onOpenMenu}
      onOpenMenu={onOpenMenu}
      onOpenProfile={onOpenProfile} />
      <View style={styles.contentPadding}>
        <Text style={styles.pageTitle}>Inventory Report</Text>
        <Text style={styles.pageSubtitle}>Stock movement breakdown</Text>

        <View style={styles.gridContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL IN STOCK</Text>
            <Text style={styles.statNumber}>{totalStock}</Text>
            <Text style={styles.statSubtextText}>Across all SKUs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LOW STOCK ITEMS</Text>
            <Text style={styles.statNumber}>{lowStockCount}</Text>
            <Text style={styles.statSubtextWarning}>Need reorder</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ADDED THIS MONTH</Text>
            <Text style={styles.statNumber}>138</Text>
            <Text style={styles.statSubtextSuccess}>New units received</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SOLD THIS MONTH</Text>
            <Text style={styles.statNumber}>572</Text>
            <Text style={styles.statSubtextText}>Units dispatched</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Stock Movement</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleBtn, reportPeriod === 'MONTHLY' && styles.toggleBtnActive]}
                onPress={() => setReportPeriod('MONTHLY')}
              >
                <Text style={[styles.toggleBtnText, reportPeriod === 'MONTHLY' && styles.toggleBtnTextActive]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, reportPeriod === 'DAILY' && styles.toggleBtnActive]}
                onPress={() => setReportPeriod('DAILY')}
              >
                <Text style={[styles.toggleBtnText, reportPeriod === 'DAILY' && styles.toggleBtnTextActive]}>Daily</Text>
              </TouchableOpacity>
            </View>
          </View>

          {reportPeriod === 'MONTHLY' ? (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeadCell, { flex: 2 }]}>MONTH</Text>
                <Text style={styles.tableHeadCell}>IN</Text>
                <Text style={styles.tableHeadCell}>OUT</Text>
                <Text style={styles.tableHeadCell}>RET.</Text>
              </View>

              <View style={[styles.tableRow, styles.tableRowHighlight]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>July 2026 (NOW)</Text>
                <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>138</Text>
                <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>572</Text>
                <Text style={styles.tableCell}>14</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[{ flex: 2 }, styles.tableCell]}>June 2026</Text>
                <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>124</Text>
                <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>530</Text>
                <Text style={styles.tableCell}>11</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[{ flex: 2 }, styles.tableCell]}>May 2026</Text>
                <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>103</Text>
                <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>441</Text>
                <Text style={styles.tableCell}>9</Text>
              </View>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeadCell, { flex: 2 }]}>DATE</Text>
                <Text style={styles.tableHeadCell}>IN</Text>
                <Text style={styles.tableHeadCell}>OUT</Text>
                <Text style={styles.tableHeadCell}>RET.</Text>
              </View>

              <View style={[styles.tableRow, styles.tableRowHighlight]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>Jul 10 (Today)</Text>
                <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>12</Text>
                <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>38</Text>
                <Text style={styles.tableCell}>2</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[{ flex: 2 }, styles.tableCell]}>Jul 9</Text>
                <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>8</Text>
                <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>29</Text>
                <Text style={styles.tableCell}>1</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[{ flex: 2 }, styles.tableCell]}>Jul 8</Text>
                <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>20</Text>
                <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>41</Text>
                <Text style={styles.tableCell}>3</Text>
              </View>
            </View>
          )}

          <View style={styles.legendRow}>
            <Text style={[styles.legendText, { color: COLORS.successGreen }]}>• In = Added</Text>
            <Text style={[styles.legendText, { color: COLORS.primaryBlue }]}>• Out = Sold</Text>
            <Text style={[styles.legendText, { color: COLORS.textLight }]}>• Ret. = Returned</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1 },
  contentPadding: { padding: 16 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  pageSubtitle: { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { width: '48%', backgroundColor: COLORS.white, padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderGray },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark, marginVertical: 4 },
  statSubtextSuccess: { fontSize: 10, color: COLORS.successGreen },
  statSubtextWarning: { fontSize: 10, color: COLORS.warningYellow },
  statSubtextText: { fontSize: 10, color: COLORS.textLight },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.borderGray, marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  toggleGroup: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: COLORS.primaryBlue },
  toggleBtnText: { fontSize: 11, color: COLORS.textLight },
  toggleBtnTextActive: { color: COLORS.white, fontWeight: 'bold' },
  tableContainer: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray },
  tableHeadCell: { flex: 1, fontSize: 10, fontWeight: 'bold', color: COLORS.textLight },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray },
  tableRowHighlight: { backgroundColor: '#FEF9C3', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 4 },
  tableCell: { flex: 1, fontSize: 12, color: COLORS.textDark },
  tableCellBold: { fontSize: 12, fontWeight: 'bold', color: COLORS.textDark },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  legendText: { fontSize: 10, fontWeight: '600' },
});