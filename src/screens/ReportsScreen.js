import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

// Mock raw dataset for dynamic reporting across days, weeks, and months
const MOCK_DAILY_DATA = [
  { id: '1', date: '2026-08-05', label: 'Aug 5 (Today)', inQty: 18, outQty: 42, retQty: 3 },
  { id: '2', date: '2026-08-04', label: 'Aug 4 (Yesterday)', inQty: 10, outQty: 30, retQty: 1 },
  { id: '3', date: '2026-08-03', label: 'Aug 3', inQty: 15, outQty: 28, retQty: 0 },
  { id: '4', date: '2026-08-02', label: 'Aug 2', inQty: 22, outQty: 50, retQty: 4 },
  { id: '5', date: '2026-08-01', label: 'Aug 1', inQty: 8, outQty: 25, retQty: 2 },
  { id: '6', date: '2026-07-29', label: 'Jul 29 (Last Week)', inQty: 12, outQty: 38, retQty: 2 },
  { id: '7', date: '2026-07-28', label: 'Jul 28 (Last Week)', inQty: 20, outQty: 41, retQty: 3 },
  { id: '8', date: '2026-07-15', label: 'Jul 15', inQty: 14, outQty: 33, retQty: 1 },
  { id: '9', date: '2026-07-10', label: 'Jul 10', inQty: 25, outQty: 45, retQty: 3 },
];

const MOCK_MONTHLY_DATA = [
  { id: 'm1', date: '2026-08', label: 'August 2026 (Current)', inQty: 85, outQty: 210, retQty: 6 },
  { id: 'm2', date: '2026-07', label: 'July 2026', inQty: 138, outQty: 572, retQty: 14 },
  { id: 'm3', date: '2026-06', label: 'June 2026', inQty: 124, outQty: 530, retQty: 11 },
  { id: 'm4', date: '2026-05', label: 'May 2026', inQty: 103, outQty: 441, retQty: 9 },
  { id: 'm5', date: '2026-04', label: 'April 2026', inQty: 95, outQty: 390, retQty: 6 },
];

export default function ReportsScreen({ 
  onOpenMenu, 
  onOpenProfile, 
  user 
}) {
  // Search state (only ONE active at a time)
  const [activeMode, setActiveMode] = useState('QUICK'); // 'QUICK' or 'CUSTOM'
  const [quickFilter, setQuickFilter] = useState('Today');
  const [isQuickFilterOpen, setIsQuickFilterOpen] = useState(false);

  const [rangeType, setRangeType] = useState('DAILY'); // 'MONTHLY' or 'DAILY'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const quickFilterOptions = ['Today', 'Yesterday', 'Last Week', 'Last Month'];

  // Handle Quick Dropdown Select (Disables Custom Range)
  const handleSelectQuickFilter = (option) => {
    setActiveMode('QUICK');
    setQuickFilter(option);
    setIsQuickFilterOpen(false);
    setFromDate('');
    setToDate('');
  };

  // Handle Custom Input Changes (Disables Quick Filter)
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

  // Reset Filters after search/view
  const handleResetFilters = () => {
    setActiveMode('QUICK');
    setQuickFilter('Today');
    setFromDate('');
    setToDate('');
    setIsQuickFilterOpen(false);
  };

  // Get current active table records dynamically
  const getFilteredData = () => {
    if (activeMode === 'QUICK') {
      if (quickFilter === 'Today') {
        return MOCK_DAILY_DATA.filter((i) => i.date === '2026-08-05');
      }
      if (quickFilter === 'Yesterday') {
        return MOCK_DAILY_DATA.filter((i) => i.date === '2026-08-04');
      }
      if (quickFilter === 'Last Week') {
        return MOCK_DAILY_DATA.filter((i) => i.date >= '2026-07-28' && i.date <= '2026-08-03');
      }
      if (quickFilter === 'Last Month') {
        return MOCK_MONTHLY_DATA.filter((i) => i.date === '2026-07');
      }
    } else {
      // Custom Range mode
      if (rangeType === 'DAILY') {
        return MOCK_DAILY_DATA.filter((i) => (!fromDate || i.date >= fromDate) && (!toDate || i.date <= toDate));
      } else {
        return MOCK_MONTHLY_DATA.filter((i) => (!fromDate || i.date >= fromDate) && (!toDate || i.date <= toDate));
      }
    }
    return [];
  };

  const currentReportData = getFilteredData();

  // Active Label Display logic
  const getActiveDisplayLabel = () => {
    if (activeMode === 'QUICK') {
      return `Quick View: ${quickFilter}`;
    }
    return `Custom Range: ${fromDate || 'Start'} to ${toDate || 'End'}`;
  };

  // Mobile Actions
  const handlePrint = () => {
    if (currentReportData.length === 0) {
      Alert.alert('No Data', 'There is no report data to print for this selection.');
      return;
    }
    Alert.alert('Printing', `Sending ${currentReportData.length} entries to mobile printer...`);
  };

  const handleDownload = () => {
    if (currentReportData.length === 0) {
      Alert.alert('No Data', 'There is no report data to download for this selection.');
      return;
    }
    Alert.alert('Download Completed', `Exported PDF with ${currentReportData.length} records.`);
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
        <Text style={styles.pageTitle}>Inventory Report</Text>
        <Text style={styles.pageSubtitle}>Stock movement breakdown & Analytics</Text>

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
                    quickFilter === opt && activeMode === 'QUICK' && styles.dropdownOptionSelected
                  ]}
                  onPress={() => handleSelectQuickFilter(opt)}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    quickFilter === opt && activeMode === 'QUICK' && styles.dropdownOptionTextSelected
                  ]}>
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
                <Text style={[styles.toggleBtnText, rangeType === 'DAILY' && styles.toggleBtnTextActive]}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, rangeType === 'MONTHLY' && styles.toggleBtnActive]}
                onPress={() => {
                  setRangeType('MONTHLY');
                  setActiveMode('CUSTOM');
                }}
              >
                <Text style={[styles.toggleBtnText, rangeType === 'MONTHLY' && styles.toggleBtnTextActive]}>Monthly</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateFieldFlex}>
              <Text style={styles.subLabel}>FROM ({rangeType === 'MONTHLY' ? 'YYYY-MM' : 'YYYY-MM-DD'})</Text>
              <TextInput
                style={[styles.textInput, activeMode === 'CUSTOM' && styles.activeInputBorder]}
                value={fromDate}
                onChangeText={handleCustomFromChange}
                placeholder={rangeType === 'MONTHLY' ? '2026-07' : '2026-08-01'}
              />
            </View>
            <View style={styles.dateFieldFlex}>
              <Text style={styles.subLabel}>TO ({rangeType === 'MONTHLY' ? 'YYYY-MM' : 'YYYY-MM-DD'})</Text>
              <TextInput
                style={[styles.textInput, activeMode === 'CUSTOM' && styles.activeInputBorder]}
                value={toDate}
                onChangeText={handleCustomToChange}
                placeholder={rangeType === 'MONTHLY' ? '2026-08' : '2026-08-05'}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
            <Text style={styles.resetBtnText}>↺ Reset Search Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Report Display Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stock Movement Breakdown</Text>
          <View style={styles.badgeWrap}>
            <Text style={styles.activeRangeBadge}>{getActiveDisplayLabel()}</Text>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadCell, { flex: 2 }]}>
                {activeMode === 'QUICK' && quickFilter === 'Last Month' ? 'MONTH' : 'DATE / PERIOD'}
              </Text>
              <Text style={styles.tableHeadCell}>IN</Text>
              <Text style={styles.tableHeadCell}>OUT</Text>
              <Text style={styles.tableHeadCell}>RET.</Text>
            </View>

            {currentReportData.length === 0 ? (
              <View style={styles.noDataRow}>
                <Text style={styles.noDataText}>No records found matching current selection.</Text>
              </View>
            ) : (
              currentReportData.map((row, index) => (
                <View key={row.id} style={[styles.tableRow, index === 0 && styles.tableRowHighlight]}>
                  <Text style={[styles.tableCellBold, { flex: 2 }]} numberOfLines={1}>{row.label}</Text>
                  <Text style={[styles.tableCell, { color: COLORS.successGreen }]}>{row.inQty}</Text>
                  <Text style={[styles.tableCell, { color: COLORS.primaryBlue }]}>{row.outQty}</Text>
                  <Text style={styles.tableCell}>{row.retQty}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.legendRow}>
            <Text style={[styles.legendText, { color: COLORS.successGreen }]}>• In = Added</Text>
            <Text style={[styles.legendText, { color: COLORS.primaryBlue }]}>• Out = Sold</Text>
            <Text style={[styles.legendText, { color: COLORS.textLight }]}>• Ret. = Returned</Text>
          </View>
        </View>

        {/* Download & Print Actions */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Text style={styles.downloadButtonText}>⬇ Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
            <Text style={styles.printButtonText}>🖨 Print Report</Text>
          </TouchableOpacity>
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

  filterCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
  },
  filterCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  filterCardTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.textDark },
  activeTag: { fontSize: 9, fontWeight: 'bold', color: COLORS.primaryBlue },
  subLabel: { fontSize: 9, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 4 },

  dropdownSelector: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeInputBorder: { borderColor: COLORS.primaryBlue, borderWidth: 1.5 },
  dropdownValueText: { fontSize: 13, color: COLORS.textDark, fontWeight: '600' },
  arrowIcon: { fontSize: 11, color: COLORS.textLight },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    marginTop: 4,
    elevation: 3,
  },
  dropdownOption: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray },
  dropdownOptionSelected: { backgroundColor: '#EFF6FF' },
  dropdownOptionText: { fontSize: 13, color: COLORS.textDark },
  dropdownOptionTextSelected: { color: COLORS.primaryBlue, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: COLORS.borderGray, marginVertical: 12 },

  rangeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleGroup: { flexDirection: 'row', backgroundColor: COLORS.inputBg, borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: COLORS.primaryBlue },
  toggleBtnText: { fontSize: 11, color: COLORS.textLight },
  toggleBtnTextActive: { color: COLORS.white, fontWeight: 'bold' },

  dateInputsRow: { flexDirection: 'row', gap: 10 },
  dateFieldFlex: { flex: 1 },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark,
  },
  resetBtn: { marginTop: 10, alignSelf: 'flex-end' },
  resetBtnText: { fontSize: 11, color: COLORS.dangerRed, fontWeight: '600' },

  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.textDark },
  badgeWrap: { marginTop: 6, marginBottom: 12, alignItems: 'flex-start' },
  activeRangeBadge: { 
    fontSize: 10, 
    color: COLORS.primaryBlue, 
    fontWeight: 'bold', 
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4,
    flexWrap: 'wrap',
  },

  tableContainer: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray },
  tableHeadCell: { flex: 1, fontSize: 10, fontWeight: 'bold', color: COLORS.textLight },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderGray },
  tableRowHighlight: { backgroundColor: '#FEF9C3', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 4 },
  tableCell: { flex: 1, fontSize: 12, color: COLORS.textDark },
  tableCellBold: { fontSize: 12, fontWeight: 'bold', color: COLORS.textDark },
  noDataRow: { paddingVertical: 16, alignItems: 'center' },
  noDataText: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  legendText: { fontSize: 10, fontWeight: '600' },

  actionButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  downloadButton: { flex: 1, backgroundColor: COLORS.primaryBlue, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  downloadButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 13 },
  printButton: { flex: 1, backgroundColor: COLORS.accentYellow, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  printButtonText: { color: COLORS.darkBlue, fontWeight: 'bold', fontSize: 13 },
});