

import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function ReportsScreen({
  onOpenMenu,
  onOpenProfile,
  user,
  salesTransactions = [], // Real live POS sales passed from state
}) {
  // Search state (only ONE active at a time)
  const [activeMode, setActiveMode] = useState('QUICK'); // 'QUICK' or 'CUSTOM'
  const [quickFilter, setQuickFilter] = useState('Today');
  const [isQuickFilterOpen, setIsQuickFilterOpen] = useState(false);

  const [rangeType, setRangeType] = useState('DAILY'); // 'MONTHLY' or 'DAILY'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const quickFilterOptions = ['Today', 'Yesterday', 'Last Week', 'Last Month'];

  // Dynamic Date Helpers
const getTodayStr = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
  const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
const normalizeTransactionDate = (date) => {
  if (!date) return getTodayStr();

  const dateString = String(date).trim();

  // New Dashboard format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.substring(0, 10);
  }

  // Old format: M/D/YYYY, time
  const match = dateString.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  if (match) {
    const month = String(match[1]).padStart(2, '0');
    const day = String(match[2]).padStart(2, '0');
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  return getTodayStr();
};
  // Aggregate live POS sales into daily breakdown records
  const getAggregatedDailyData = () => {
    if (!salesTransactions || salesTransactions.length === 0) {
      return [];
    }

    const dailyMap = {};
    salesTransactions.forEach((tx) => {
      const dateKey = normalizeTransactionDate(tx.date);
      const itemsSold = tx.items
        ? tx.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
        : 0;

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          id: dateKey,
          date: dateKey,
          label: dateKey === getTodayStr() ? `${dateKey} (Today)` : dateKey,
          inQty: 0,
          outQty: 0,
          retQty: 0,
          profit: 0,
          revenue: 0,
        };
      }

      dailyMap[dateKey].outQty += itemsSold;
      dailyMap[dateKey].profit += Number(tx.totalProfit || 0);
      dailyMap[dateKey].revenue += Number(tx.totalRevenue || 0);
    });

    return Object.values(dailyMap);
  };

  // Aggregate live POS sales into monthly breakdown records
  const getAggregatedMonthlyData = () => {
    if (!salesTransactions || salesTransactions.length === 0) {
      return [];
    }

    const monthlyMap = {};
    salesTransactions.forEach((tx) => {
      const dateKey = normalizeTransactionDate(tx.date);
      const monthKey = dateKey.substring(0, 7); // YYYY-MM
      const itemsSold = tx.items
        ? tx.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
        : 0;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          id: monthKey,
          date: monthKey,
          label: monthKey,
          inQty: 0,
          outQty: 0,
          retQty: 0,
          profit: 0,
          revenue: 0,
        };
      }

      monthlyMap[monthKey].outQty += itemsSold;
      monthlyMap[monthKey].profit += Number(tx.totalProfit || 0);
      monthlyMap[monthKey].revenue += Number(tx.totalRevenue || 0);
    });

    return Object.values(monthlyMap);
  };

  const dailyDataList = getAggregatedDailyData();
  const monthlyDataList = getAggregatedMonthlyData();

  // Handle Quick Dropdown Select
  const handleSelectQuickFilter = (option) => {
    setActiveMode('QUICK');
    setQuickFilter(option);
    setIsQuickFilterOpen(false);
    setFromDate('');
    setToDate('');
  };

  // Handle Custom Input Changes
  const handleCustomFromChange = (text) => {
    setActiveMode('CUSTOM');
    setQuickFilter('Select timeframe...');
    setFromDate(text);
  };

  const handleCustomToChange = (text) => {
    setActiveMode('CUSTOM');
    setQuickFilter('Select timeframe...');
    setToDate(text);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setActiveMode('QUICK');
    setQuickFilter('Today');
    setFromDate('');
    setToDate('');
    setIsQuickFilterOpen(false);
  };

  // Get filtered table records
  const getFilteredData = () => {
    const todayStr = getTodayStr();
    const yesterdayStr = getYesterdayStr();

    if (activeMode === 'QUICK') {
      if (quickFilter === 'Today') {
        return dailyDataList.filter((i) => i.date === todayStr);
      }
      if (quickFilter === 'Yesterday') {
        return dailyDataList.filter((i) => i.date === yesterdayStr);
      }
      if (quickFilter === 'Last Week') {
        return dailyDataList;
      }
      if (quickFilter === 'Last Month') {
        return monthlyDataList;
      }
    } else {
      // Custom Range mode
      if (rangeType === 'DAILY') {
        return dailyDataList.filter(
          (i) => (!fromDate || i.date >= fromDate) && (!toDate || i.date <= toDate)
        );
      } else {
        return monthlyDataList.filter(
          (i) => (!fromDate || i.date >= fromDate) && (!toDate || i.date <= toDate)
        );
      }
    }
    return dailyDataList;
  };

  const currentReportData = getFilteredData();

  // Active Label Display logic
  const getActiveDisplayLabel = () => {
    if (activeMode === 'QUICK') {
      return `Quick View: ${quickFilter}`;
    }
    return `Custom Range: ${fromDate || 'Start'} to ${toDate || 'End'}`;
  };

  // Actions
  const handlePrint = () => {
    if (currentReportData.length === 0) {
      Alert.alert('No Data', 'There is no sales data to print for this selection.');
      return;
    }
    Alert.alert('Printing', `Sending ${currentReportData.length} report entries to printer...`);
  };

  const handleDownload = () => {
    if (currentReportData.length === 0) {
      Alert.alert('No Data', 'There is no sales data to download for this selection.');
      return;
    }
    Alert.alert('Download Completed', `Exported PDF report with ${currentReportData.length} record(s).`);
  };

  return (
    <ScrollView style={styles.tabContainer}>
      <Header
        title="Reports"
        onOpenMenu={onOpenMenu}
        onOpenProfile={onOpenProfile}
        user={user}
      />
      <View style={styles.contentPadding}>
        <Text style={styles.pageTitle}>Inventory & Sales Report</Text>
        <Text style={styles.pageSubtitle}>Real-time stock movement breakdown, sales & profit analytics</Text>

        {/* Filter Section Card */}
        <View style={styles.filterCard}>
          <View style={styles.filterCardHeader}>
            <Text style={styles.filterCardTitle}>1. QUICK TIMEFRAME SEARCH</Text>
            {activeMode === 'QUICK' && <Text style={styles.activeTag}>[ ACTIVE ]</Text>}
          </View>

          {/* Quick Dropdown */}
          <TouchableOpacity
            style={[styles.dropdownSelector, activeMode === 'QUICK' && styles.activeInputBorder]}
            activeOpacity={0.8}
            onPress={() => setIsQuickFilterOpen(!isQuickFilterOpen)}
          >
            <Text style={styles.dropdownValueText}>{quickFilter}</Text>
            <Text style={styles.arrowIcon}>{isQuickFilterOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {isQuickFilterOpen && (
            <View style={styles.dropdownMenu}>
              {quickFilterOptions.map((opt, index) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.dropdownOption,
                    index === quickFilterOptions.length - 1 && { borderBottomWidth: 0 },
                    quickFilter === opt && activeMode === 'QUICK' && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => handleSelectQuickFilter(opt)}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      quickFilter === opt && activeMode === 'QUICK' && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Custom Range Search */}
          <View style={styles.filterCardHeader}>
            <Text style={styles.filterCardTitle}>2. OR CUSTOM DATE RANGE SEARCH</Text>
            {activeMode === 'CUSTOM' && <Text style={styles.activeTag}>[ ACTIVE ]</Text>}
          </View>

          <View style={styles.rangeHeaderRow}>
            <Text style={styles.subLabel}>FORMAT MODE:</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleBtn, rangeType === 'DAILY' && styles.toggleBtnActive]}
                onPress={() => {
                  setRangeType('DAILY');
                  setActiveMode('CUSTOM');
                }}
              >
                <Text style={[styles.toggleBtnText, rangeType === 'DAILY' && styles.toggleBtnTextActive]}>
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, rangeType === 'MONTHLY' && styles.toggleBtnActive]}
                onPress={() => {
                  setRangeType('MONTHLY');
                  setActiveMode('CUSTOM');
                }}
              >
                <Text style={[styles.toggleBtnText, rangeType === 'MONTHLY' && styles.toggleBtnTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateFieldFlex}>
              <Text style={styles.subLabel}>
                FROM ({rangeType === 'MONTHLY' ? 'YYYY-MM' : 'YYYY-MM-DD'})
              </Text>
              <TextInput
                style={[styles.textInput, activeMode === 'CUSTOM' && styles.activeInputBorder]}
                value={fromDate}
                onChangeText={handleCustomFromChange}
                placeholder={rangeType === 'MONTHLY' ? 'YYYY-MM' : 'YYYY-MM-DD'}
              />
            </View>
            <View style={styles.dateFieldFlex}>
              <Text style={styles.subLabel}>
                TO ({rangeType === 'MONTHLY' ? 'YYYY-MM' : 'YYYY-MM-DD'})
              </Text>
              <TextInput
                style={[styles.textInput, activeMode === 'CUSTOM' && styles.activeInputBorder]}
                value={toDate}
                onChangeText={handleCustomToChange}
                placeholder={rangeType === 'MONTHLY' ? 'YYYY-MM' : 'YYYY-MM-DD'}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
            <Text style={styles.resetBtnText}>↺ Reset Search Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Report Display Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stock & Sales Movement Breakdown</Text>
          <View style={styles.badgeWrap}>
            <Text style={styles.activeRangeBadge}>{getActiveDisplayLabel()}</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadCell, { flex: 2 }]}>DATE / PERIOD</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>IN</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>OUT</Text>
              <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>RET</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.4, textAlign: 'right' }]}>PROFIT (PKR)</Text>
            </View>

            {currentReportData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No sales recorded yet</Text>
                <Text style={styles.emptySubtext}>Complete transactions in Dashboard POS to generate live reports.</Text>
              </View>
            ) : (
              currentReportData.map((item, idx) => {
                const profitAmount = item.profit || 0;

                return (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.tableRow,
                      idx === currentReportData.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={[styles.tableCellBold, { flex: 2 }]}>{item.label || item.date}</Text>
                    <Text style={[styles.tableCellSuccess, { flex: 1, textAlign: 'center' }]}>
                      +{item.inQty}
                    </Text>
                    <Text style={[styles.tableCellDanger, { flex: 1, textAlign: 'center' }]}>
                      -{item.outQty}
                    </Text>
                    <Text style={[styles.tableCellWarning, { flex: 1, textAlign: 'center' }]}>
                      +{item.retQty}
                    </Text>
                    <Text style={[styles.tableCellProfit, { flex: 1.4, textAlign: 'right' }]}>
                      +Rs. {profitAmount.toFixed(0)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Action Footer Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Text style={styles.printBtnText}>🖨 Print Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
              <Text style={styles.downloadBtnText}>📥 Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, backgroundColor: COLORS.lightBackground || '#F3F4F6' },
  contentPadding: { padding: 16 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark || '#111827' },
  pageSubtitle: { fontSize: 12, color: COLORS.textLight || '#6B7280', marginBottom: 16 },

  filterCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    marginBottom: 16,
  },
  filterCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterCardTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.textLight || '#6B7280' },
  activeTag: { fontSize: 10, fontWeight: 'bold', color: COLORS.primaryBlue || '#2563EB' },

  dropdownSelector: {
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValueText: { fontSize: 13, fontWeight: '600', color: COLORS.textDark || '#111827' },
  arrowIcon: { fontSize: 12, color: COLORS.textLight || '#6B7280' },
  dropdownMenu: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    marginTop: 6,
    elevation: 4,
  },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray || '#E5E7EB' },
  dropdownOptionSelected: { backgroundColor: COLORS.inputBg || '#F9FAFB' },
  dropdownOptionText: { fontSize: 13, color: COLORS.textDark || '#111827' },
  dropdownOptionTextSelected: { color: COLORS.primaryBlue || '#2563EB', fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: COLORS.borderGray || '#E5E7EB', marginVertical: 14 },

  rangeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight || '#6B7280' },
  toggleGroup: { flexDirection: 'row', backgroundColor: COLORS.inputBg || '#F9FAFB', borderRadius: 6, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  toggleBtnActive: { backgroundColor: COLORS.white || '#FFFFFF', elevation: 1 },
  toggleBtnText: { fontSize: 10, color: COLORS.textLight || '#6B7280', fontWeight: 'bold' },
  toggleBtnTextActive: { color: COLORS.primaryBlue || '#2563EB' },

  dateInputsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateFieldFlex: { flex: 1 },
  textInput: {
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark || '#111827',
    marginTop: 4,
  },
  activeInputBorder: { borderColor: COLORS.primaryBlue || '#2563EB' },

  resetBtn: { alignItems: 'center', paddingVertical: 6 },
  resetBtnText: { fontSize: 11, color: COLORS.dangerRed || '#EF4444', fontWeight: 'bold' },

  sectionCard: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark || '#111827' },
  badgeWrap: { flexDirection: 'row', marginTop: 4, marginBottom: 14 },
  activeRangeBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primaryBlue || '#2563EB',
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  tableContainer: { borderWidth: 1, borderColor: COLORS.borderGray || '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray || '#E5E7EB',
  },
  tableHeadCell: { fontSize: 10, fontWeight: 'bold', color: COLORS.textLight || '#6B7280' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray || '#E5E7EB',
    alignItems: 'center',
  },
  tableCellBold: { fontSize: 12, fontWeight: 'bold', color: COLORS.textDark || '#111827' },
  tableCellSuccess: { fontSize: 12, fontWeight: '600', color: COLORS.successGreen || '#10B981' },
  tableCellDanger: { fontSize: 12, fontWeight: '600', color: COLORS.dangerRed || '#EF4444' },
  tableCellWarning: { fontSize: 12, fontWeight: '600', color: COLORS.warningYellow || '#D97706' },
  tableCellProfit: { fontSize: 12, fontWeight: 'bold', color: COLORS.successGreen || '#10B981' },

  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: COLORS.textDark || '#111827', fontSize: 13, fontWeight: 'bold' },
  emptySubtext: { color: COLORS.textLight || '#6B7280', fontSize: 11, marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  printBtn: {
    flex: 1,
    backgroundColor: COLORS.inputBg || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.borderGray || '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  printBtnText: { color: COLORS.textDark || '#111827', fontWeight: 'bold', fontSize: 12 },
  downloadBtn: { flex: 1, backgroundColor: COLORS.primaryBlue || '#2563EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: COLORS.white || '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
});