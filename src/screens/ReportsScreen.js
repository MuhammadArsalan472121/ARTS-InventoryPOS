import React, { useState } from 'react';

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';

import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function ReportsScreen({
  onOpenMenu,
  onOpenProfile,
  user,
  salesTransactions = [],
  stockTransactions = [],
}) {
  const [activeMode, setActiveMode] =
    useState('QUICK');

  const [quickFilter, setQuickFilter] =
    useState('Today');

  const [isQuickFilterOpen, setIsQuickFilterOpen] =
    useState(false);

  const [rangeType, setRangeType] =
    useState('DAILY');

  const [fromDate, setFromDate] = useState('');

  const [toDate, setToDate] = useState('');

  const quickFilterOptions = [
    'Today',
    'Yesterday',
    'Last Week',
    'Last Month',
  ];

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const formatLocalDate = (date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getTodayStr = () => {
    return formatLocalDate(new Date());
  };

  const getYesterdayStr = () => {
    const d = new Date();

    d.setDate(d.getDate() - 1);

    return formatLocalDate(d);
  };

  const normalizeDate = (value) => {
    if (!value) {
      return '';
    }

    // Already YYYY-MM-DD
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return value;
    }

    // ISO date/time
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(value)
    ) {
      return formatLocalDate(
        new Date(value)
      );
    }

    if (value instanceof Date) {
      return formatLocalDate(value);
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return formatLocalDate(parsed);
    }

    return '';
  };

  // =====================================================
  // SALES
  // =====================================================

  const getItemsSold = (tx) => {
    if (!Array.isArray(tx?.items)) {
      return 0;
    }

    return tx.items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 1),
      0
    );
  };

  // =====================================================
  // DAILY DATA
  // =====================================================

  const getAggregatedDailyData = () => {
    const dailyMap = {};

    const createDay = (dateKey) => {
      if (!dateKey) return;

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          id: dateKey,
          date: dateKey,
          label:
            dateKey === getTodayStr()
              ? `${dateKey} (Today)`
              : dateKey,

          inQty: 0,
          outQty: 0,
          profit: 0,
          revenue: 0,
        };
      }
    };

    // =================================================
    // STOCK MOVEMENTS
    // =================================================

    (stockTransactions || []).forEach(
      (transaction) => {
        const dateKey = normalizeDate(
          transaction.date ||
            transaction.timestamp
        );

        if (!dateKey) return;

        createDay(dateKey);

        const quantity =
          Number(transaction.quantity) || 0;

        /*
          ADD = STOCK IN
          REMOVE = MANUAL STOCK OUT
        */

        if (
          transaction.action === 'ADD' ||
          !transaction.action
        ) {
          dailyMap[dateKey].inQty += quantity;
        }

        if (
          transaction.action === 'REMOVE'
        ) {
          dailyMap[dateKey].outQty += quantity;
        }
      }
    );

    // =================================================
    // SALES = OUT
    // =================================================

    (salesTransactions || []).forEach(
      (tx) => {
        const dateKey = normalizeDate(
          tx.date || tx.timestamp
        );

        if (!dateKey) return;

        createDay(dateKey);

        dailyMap[dateKey].outQty +=
          getItemsSold(tx);

        dailyMap[dateKey].profit +=
          Number(tx.totalProfit || 0);

        dailyMap[dateKey].revenue +=
          Number(tx.totalRevenue || 0);
      }
    );

    return Object.values(dailyMap).sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    );
  };

  // =====================================================
  // MONTHLY DATA
  // =====================================================

  const getAggregatedMonthlyData = () => {
    const monthlyMap = {};

    const createMonth = (monthKey) => {
      if (!monthKey) return;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          id: monthKey,
          date: monthKey,
          label: monthKey,

          inQty: 0,
          outQty: 0,
          profit: 0,
          revenue: 0,
        };
      }
    };

    // =================================================
    // STOCK MOVEMENTS
    // =================================================

    (stockTransactions || []).forEach(
      (transaction) => {
        const dateKey = normalizeDate(
          transaction.date ||
            transaction.timestamp
        );

        if (!dateKey) return;

        const monthKey =
          dateKey.substring(0, 7);

        createMonth(monthKey);

        const quantity =
          Number(transaction.quantity) || 0;

        if (
          transaction.action === 'ADD' ||
          !transaction.action
        ) {
          monthlyMap[monthKey].inQty +=
            quantity;
        }

        if (
          transaction.action === 'REMOVE'
        ) {
          monthlyMap[monthKey].outQty +=
            quantity;
        }
      }
    );

    // =================================================
    // SALES
    // =================================================

    (salesTransactions || []).forEach(
      (tx) => {
        const dateKey = normalizeDate(
          tx.date || tx.timestamp
        );

        if (!dateKey) return;

        const monthKey =
          dateKey.substring(0, 7);

        createMonth(monthKey);

        monthlyMap[monthKey].outQty +=
          getItemsSold(tx);

        monthlyMap[monthKey].profit +=
          Number(tx.totalProfit || 0);

        monthlyMap[monthKey].revenue +=
          Number(tx.totalRevenue || 0);
      }
    );

    return Object.values(monthlyMap).sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    );
  };

  const dailyDataList =
    getAggregatedDailyData();

  const monthlyDataList =
    getAggregatedMonthlyData();

  // =====================================================
  // FILTERS
  // =====================================================

  const handleSelectQuickFilter = (
    option
  ) => {
    setActiveMode('QUICK');
    setQuickFilter(option);
    setIsQuickFilterOpen(false);
    setFromDate('');
    setToDate('');
  };

  const handleCustomFromChange = (
    text
  ) => {
    setActiveMode('CUSTOM');
    setQuickFilter('Select timeframe...');
    setFromDate(text);
  };

  const handleCustomToChange = (
    text
  ) => {
    setActiveMode('CUSTOM');
    setQuickFilter('Select timeframe...');
    setToDate(text);
  };

  const handleResetFilters = () => {
    setActiveMode('QUICK');
    setQuickFilter('Today');
    setFromDate('');
    setToDate('');
    setIsQuickFilterOpen(false);
  };

  const getFilteredData = () => {
    const today = getTodayStr();

    const yesterday =
      getYesterdayStr();

    // =================================================
    // QUICK FILTERS
    // =================================================

    if (activeMode === 'QUICK') {

      // TODAY
      if (quickFilter === 'Today') {
        return dailyDataList.filter(
          (item) =>
            item.date === today
        );
      }

      // YESTERDAY
      if (
        quickFilter === 'Yesterday'
      ) {
        return dailyDataList.filter(
          (item) =>
            item.date === yesterday
        );
      }

      // LAST WEEK
      if (
        quickFilter === 'Last Week'
      ) {
        const d = new Date();

        d.setDate(
          d.getDate() - 6
        );

        const startDate =
          formatLocalDate(d);

        return dailyDataList.filter(
          (item) =>
            item.date >= startDate &&
            item.date <= today
        );
      }

      // LAST MONTH
      if (
        quickFilter === 'Last Month'
      ) {
        const d = new Date();

        d.setMonth(
          d.getMonth() - 1
        );

        const monthKey =
          `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, '0')}`;

        return monthlyDataList.filter(
          (item) =>
            item.date === monthKey
        );
      }
    }

    // =================================================
    // CUSTOM DAILY
    // =================================================

    if (rangeType === 'DAILY') {
      return dailyDataList.filter(
        (item) =>
          (!fromDate ||
            item.date >= fromDate) &&
          (!toDate ||
            item.date <= toDate)
      );
    }

    // =================================================
    // CUSTOM MONTHLY
    // =================================================

    return monthlyDataList.filter(
      (item) =>
        (!fromDate ||
          item.date >= fromDate) &&
        (!toDate ||
          item.date <= toDate)
    );
  };

  const currentReportData =
    getFilteredData();

  // =====================================================
  // DISPLAY LABEL
  // =====================================================

  const getActiveDisplayLabel = () => {
    if (activeMode === 'QUICK') {
      return `Quick View: ${quickFilter}`;
    }

    return `Custom Range: ${
      fromDate || 'Start'
    } to ${toDate || 'End'}`;
  };

  // =====================================================
  // PRINT
  // =====================================================

  const handlePrint = () => {
    if (!currentReportData.length) {
      Alert.alert(
        'No Data',
        'There is no report data to print for this selection.'
      );

      return;
    }

    Alert.alert(
      'Printing',
      `Sending ${currentReportData.length} report entries to printer...`
    );
  };

  // =====================================================
  // DOWNLOAD
  // =====================================================

  const handleDownload = () => {
    if (!currentReportData.length) {
      Alert.alert(
        'No Data',
        'There is no report data to download for this selection.'
      );

      return;
    }

    Alert.alert(
      'Download Completed',
      `Exported PDF report with ${currentReportData.length} record(s).`
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      style={styles.tabContainer}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Reports"
        onOpenMenu={onOpenMenu}
        onOpenProfile={onOpenProfile}
        user={user}
      />

      <View style={styles.contentPadding}>

        <Text style={styles.pageTitle}>
          Inventory & Sales Report
        </Text>

        <Text style={styles.pageSubtitle}>
          Real-time stock movement breakdown,
          sales & profit analytics
        </Text>

        {/* FILTER CARD */}

        <View style={styles.filterCard}>

          <View style={styles.filterCardHeader}>
            <Text
              style={styles.filterCardTitle}
            >
              1. QUICK TIMEFRAME SEARCH
            </Text>

            {activeMode === 'QUICK' && (
              <Text
                style={styles.activeTag}
              >
                [ ACTIVE ]
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.dropdownSelector,
              activeMode === 'QUICK' &&
                styles.activeInputBorder,
            ]}
            onPress={() =>
              setIsQuickFilterOpen(
                !isQuickFilterOpen
              )
            }
          >
            <Text
              style={
                styles.dropdownValueText
              }
            >
              {quickFilter}
            </Text>

            <Text style={styles.arrowIcon}>
              {isQuickFilterOpen
                ? '▲'
                : '▼'}
            </Text>
          </TouchableOpacity>

          {isQuickFilterOpen && (
            <View
              style={styles.dropdownMenu}
            >
              {quickFilterOptions.map(
                (option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownOption,
                      index ===
                        quickFilterOptions.length -
                          1 && {
                        borderBottomWidth: 0,
                      },
                      quickFilter ===
                        option &&
                        activeMode ===
                          'QUICK' &&
                        styles.dropdownOptionSelected,
                    ]}
                    onPress={() =>
                      handleSelectQuickFilter(
                        option
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        quickFilter ===
                          option &&
                          activeMode ===
                            'QUICK' &&
                          styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.filterCardHeader}>
            <Text
              style={styles.filterCardTitle}
            >
              2. OR CUSTOM DATE RANGE SEARCH
            </Text>

            {activeMode === 'CUSTOM' && (
              <Text
                style={styles.activeTag}
              >
                [ ACTIVE ]
              </Text>
            )}
          </View>

          <View style={styles.rangeHeaderRow}>

            <Text style={styles.subLabel}>
              FORMAT MODE:
            </Text>

            <View style={styles.toggleGroup}>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  rangeType === 'DAILY' &&
                    styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setRangeType('DAILY');
                  setActiveMode('CUSTOM');
                }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    rangeType === 'DAILY' &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  rangeType ===
                    'MONTHLY' &&
                    styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setRangeType(
                    'MONTHLY'
                  );
                  setActiveMode(
                    'CUSTOM'
                  );
                }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    rangeType ===
                      'MONTHLY' &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          <View style={styles.dateInputsRow}>

            <View style={styles.dateFieldFlex}>

              <Text style={styles.subLabel}>
                FROM (
                {rangeType ===
                'MONTHLY'
                  ? 'YYYY-MM'
                  : 'YYYY-MM-DD'}
                )
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  activeMode ===
                    'CUSTOM' &&
                    styles.activeInputBorder,
                ]}
                value={fromDate}
                onChangeText={
                  handleCustomFromChange
                }
                placeholder={
                  rangeType ===
                  'MONTHLY'
                    ? 'YYYY-MM'
                    : 'YYYY-MM-DD'
                }
                placeholderTextColor="#9CA3AF"
              />

            </View>

            <View style={styles.dateFieldFlex}>

              <Text style={styles.subLabel}>
                TO (
                {rangeType ===
                'MONTHLY'
                  ? 'YYYY-MM'
                  : 'YYYY-MM-DD'}
                )
              </Text>

              <TextInput
                style={[
                  styles.textInput,
                  activeMode ===
                    'CUSTOM' &&
                    styles.activeInputBorder,
                ]}
                value={toDate}
                onChangeText={
                  handleCustomToChange
                }
                placeholder={
                  rangeType ===
                  'MONTHLY'
                    ? 'YYYY-MM'
                    : 'YYYY-MM-DD'
                }
                placeholderTextColor="#9CA3AF"
              />

            </View>

          </View>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={
              handleResetFilters
            }
          >
            <Text
              style={styles.resetBtnText}
            >
              ↺ Reset Search Filters
            </Text>
          </TouchableOpacity>

        </View>

        {/* REPORT */}

        <View style={styles.sectionCard}>

          <Text
            style={styles.sectionTitle}
          >
            Stock & Sales Movement
            Breakdown
          </Text>

          <View style={styles.badgeWrap}>
            <Text
              style={
                styles.activeRangeBadge
              }
            >
              {getActiveDisplayLabel()}
            </Text>
          </View>

          <View
            style={styles.tableContainer}
          >

            <View
              style={styles.tableHeader}
            >

              <Text
                style={[
                  styles.tableHeadCell,
                  { flex: 2 },
                ]}
              >
                DATE / PERIOD
              </Text>

              <Text
                style={[
                  styles.tableHeadCell,
                  {
                    flex: 1,
                    textAlign: 'center',
                  },
                ]}
              >
                IN
              </Text>

              <Text
                style={[
                  styles.tableHeadCell,
                  {
                    flex: 1,
                    textAlign: 'center',
                  },
                ]}
              >
                OUT
              </Text>

              <Text
                style={[
                  styles.tableHeadCell,
                  {
                    flex: 1.4,
                    textAlign: 'right',
                  },
                ]}
              >
                PROFIT (PKR)
              </Text>

            </View>

            {currentReportData.length ===
            0 ? (
              <View
                style={
                  styles.emptyContainer
                }
              >
                <Text
                  style={styles.emptyText}
                >
                  No records found
                </Text>

                <Text
                  style={
                    styles.emptySubtext
                  }
                >
                  Add inventory or complete
                  POS sales to generate live
                  reports.
                </Text>
              </View>
            ) : (
              currentReportData.map(
                (item, index) => (
                  <View
                    key={
                      item.id || index
                    }
                    style={[
                      styles.tableRow,
                      index ===
                        currentReportData.length -
                          1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >

                    <Text
                      style={[
                        styles.tableCellBold,
                        { flex: 2 },
                      ]}
                    >
                      {item.label ||
                        item.date}
                    </Text>

                    <Text
                      style={[
                        styles.tableCellSuccess,
                        {
                          flex: 1,
                          textAlign:
                            'center',
                        },
                      ]}
                    >
                      +{item.inQty || 0}
                    </Text>

                    <Text
                      style={[
                        styles.tableCellDanger,
                        {
                          flex: 1,
                          textAlign:
                            'center',
                        },
                      ]}
                    >
                      -{item.outQty || 0}
                    </Text>

                    <Text
                      style={[
                        styles.tableCellProfit,
                        {
                          flex: 1.4,
                          textAlign:
                            'right',
                        },
                      ]}
                    >
                      +Rs.{' '}
                      {Number(
                        item.profit || 0
                      ).toFixed(0)}
                    </Text>

                  </View>
                )
              )
            )}

          </View>

          <View style={styles.actionRow}>

            <TouchableOpacity
              style={styles.printBtn}
              onPress={handlePrint}
            >
              <Text
                style={styles.printBtnText}
              >
                🖨 Print Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={
                handleDownload
              }
            >
              <Text
                style={
                  styles.downloadBtnText
                }
              >
                📥 Export PDF
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor:
      COLORS.lightBackground ||
      '#F3F4F6',
  },

  contentPadding: {
    padding: 16,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  pageSubtitle: {
    fontSize: 12,
    color:
      COLORS.textLight ||
      '#6B7280',
    marginBottom: 16,
  },

  filterCard: {
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    marginBottom: 16,
  },

  filterCardHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  filterCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color:
      COLORS.textLight ||
      '#6B7280',
  },

  activeTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  dropdownSelector: {
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  dropdownValueText: {
    fontSize: 13,
    fontWeight: '600',
    color:
      COLORS.textDark ||
      '#111827',
  },

  arrowIcon: {
    fontSize: 12,
    color:
      COLORS.textLight ||
      '#6B7280',
  },

  dropdownMenu: {
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    marginTop: 6,
    elevation: 4,
  },

  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray ||
      '#E5E7EB',
  },

  dropdownOptionSelected: {
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
  },

  dropdownOptionText: {
    fontSize: 13,
    color:
      COLORS.textDark ||
      '#111827',
  },

  dropdownOptionTextSelected: {
    color:
      COLORS.primaryBlue ||
      '#2563EB',
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor:
      COLORS.borderGray ||
      '#E5E7EB',
    marginVertical: 14,
  },

  rangeHeaderRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  subLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.textLight ||
      '#6B7280',
  },

  toggleGroup: {
    flexDirection: 'row',
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderRadius: 6,
    padding: 2,
  },

  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },

  toggleBtnActive: {
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
    elevation: 1,
  },

  toggleBtnText: {
    fontSize: 10,
    color:
      COLORS.textLight ||
      '#6B7280',
    fontWeight: 'bold',
  },

  toggleBtnTextActive: {
    color:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  dateFieldFlex: {
    flex: 1,
  },

  textInput: {
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color:
      COLORS.textDark ||
      '#111827',
    marginTop: 4,
  },

  activeInputBorder: {
    borderColor:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  resetBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },

  resetBtnText: {
    fontSize: 11,
    color:
      COLORS.dangerRed ||
      '#EF4444',
    fontWeight: 'bold',
  },

  sectionCard: {
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  badgeWrap: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 14,
  },

  activeRangeBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  tableContainer: {
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray ||
      '#E5E7EB',
  },

  tableHeadCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.textLight ||
      '#6B7280',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray ||
      '#E5E7EB',
    alignItems: 'center',
  },

  tableCellBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  tableCellSuccess: {
    fontSize: 12,
    fontWeight: '600',
    color:
      COLORS.successGreen ||
      '#10B981',
  },

  tableCellDanger: {
    fontSize: 12,
    fontWeight: '600',
    color:
      COLORS.dangerRed ||
      '#EF4444',
  },

  tableCellProfit: {
    fontSize: 12,
    fontWeight: 'bold',
    color:
      COLORS.successGreen ||
      '#10B981',
  },

  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyText: {
    color:
      COLORS.textDark ||
      '#111827',
    fontSize: 13,
    fontWeight: 'bold',
  },

  emptySubtext: {
    color:
      COLORS.textLight ||
      '#6B7280',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  printBtn: {
    flex: 1,
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  printBtnText: {
    color:
      COLORS.textDark ||
      '#111827',
    fontWeight: 'bold',
    fontSize: 12,
  },

  downloadBtn: {
    flex: 1,
    backgroundColor:
      COLORS.primaryBlue ||
      '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  downloadBtnText: {
    color:
      COLORS.white ||
      '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});