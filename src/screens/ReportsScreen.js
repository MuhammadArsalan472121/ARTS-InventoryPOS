
import React, { useState } from 'react';

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Header from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function ReportsScreen({
  onOpenMenu,
  onOpenProfile,
  user,
  salesTransactions = [],
  stockTransactions = [],
  inventoryItems = [],
  onAddSale,
  onEditSale,
  onDeleteSale,
}) {

  // =====================================================
  // FILTER STATE
  // =====================================================

  const [activeMode, setActiveMode] =
    useState('QUICK');

  const [quickFilter, setQuickFilter] =
    useState('Today');

  const [isQuickFilterOpen, setIsQuickFilterOpen] =
    useState(false);

  const [rangeType, setRangeType] =
    useState('DAILY');

  const [fromDate, setFromDate] =
    useState('');

  const [toDate, setToDate] =
    useState('');
    
  
  // =====================================================
  // SALES MODAL STATE
  // =====================================================

  const [saleModalVisible, setSaleModalVisible] =
    useState(false);

  const [editingSale, setEditingSale] =
    useState(null);

  const [saleDate, setSaleDate] =
    useState('');

  const [selectedSaleItems, setSelectedSaleItems] =
    useState([]);

  const [selectedProductId, setSelectedProductId] =
    useState('');

  const [selectedQuantity, setSelectedQuantity] =
    useState('1');

  const [isProductDropdownOpen, setIsProductDropdownOpen] =
    useState(false);

  const [saleBusy, setSaleBusy] =
    useState(false);

  // =====================================================
  // QUICK FILTER OPTIONS
  // =====================================================

  const quickFilterOptions = [
    'Today',
    'Yesterday',
    'Last Week',
    'Last Month',
    'Custom Range',
  ];

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const formatLocalDate = (date) => {

    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getTodayStr = () => {
    return formatLocalDate(
      new Date()
    );
  };

  const getYesterdayStr = () => {

    const d = new Date();

    d.setDate(
      d.getDate() - 1
    );

    return formatLocalDate(d);
  };

  const normalizeDate = (value) => {

    if (!value) {
      return '';
    }

    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      return value;
    }

    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(
        value
      )
    ) {
      return formatLocalDate(
        new Date(value)
      );
    }

    if (
      value instanceof Date
    ) {
      return formatLocalDate(
        value
      );
    }

    const parsed =
      new Date(value);

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return formatLocalDate(
        parsed
      );
    }

    return '';
  };

  // =====================================================
  // ITEMS SOLD
  // =====================================================

  const getItemsSold = (tx) => {

    if (
      !Array.isArray(
        tx?.items
      )
    ) {
      return (
        Number(
          tx?.itemsSold
        ) || 0
      );
    }

    return tx.items.reduce(
      (sum, item) =>
        sum +
        (Number(
          item.quantity
        ) || 1),
      0
    );
  };

  // =====================================================
  // DAILY REPORT DATA
  // =====================================================

  const getAggregatedDailyData = () => {

    const dailyMap = {};

    const createDay = (
      dateKey
    ) => {

      if (!dateKey) {
        return;
      }

      if (!dailyMap[dateKey]) {

        dailyMap[dateKey] = {
          id: dateKey,
          date: dateKey,

          label:
            dateKey ===
            getTodayStr()
              ? `${dateKey} (Today)`
              : dateKey,

          inQty: 0,
          outQty: 0,
          profit: 0,
          revenue: 0,
        };
      }
    };

    (stockTransactions || [])
      .forEach(
        (transaction) => {

          const dateKey =
            normalizeDate(
              transaction.date ||
                transaction.timestamp
            );

          if (!dateKey) {
            return;
          }

          createDay(
            dateKey
          );

          const quantity =
            Number(
              transaction.quantity
            ) || 0;

          if (
            transaction.action ===
              'ADD' ||
            !transaction.action
          ) {
            dailyMap[
              dateKey
            ].inQty +=
              quantity;
          }

          if (
            transaction.action ===
            'REMOVE'
          ) {
            dailyMap[
              dateKey
            ].outQty +=
              quantity;
          }
        }
      );

    (salesTransactions || [])
      .forEach(
        (tx) => {

          const dateKey =
            normalizeDate(
              tx.date ||
                tx.timestamp
            );

          if (!dateKey) {
            return;
          }

          createDay(
            dateKey
          );

          dailyMap[
            dateKey
          ].outQty +=
            getItemsSold(tx);

          dailyMap[
            dateKey
          ].profit +=
            Number(
              tx.totalProfit || 0
            );

          dailyMap[
            dateKey
          ].revenue +=
            Number(
              tx.totalRevenue || 0
            );
        }
      );

    return Object.values(
      dailyMap
    ).sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );
  };

  // =====================================================
  // MONTHLY REPORT DATA
  // =====================================================

  const getAggregatedMonthlyData = () => {

    const monthlyMap = {};

    const createMonth = (
      monthKey
    ) => {

      if (!monthKey) {
        return;
      }

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

    (stockTransactions || [])
      .forEach(
        (transaction) => {

          const dateKey =
            normalizeDate(
              transaction.date ||
                transaction.timestamp
            );

          if (!dateKey) {
            return;
          }

          const monthKey =
            dateKey.substring(
              0,
              7
            );

          createMonth(
            monthKey
          );

          const quantity =
            Number(
              transaction.quantity
            ) || 0;

          if (
            transaction.action ===
              'ADD' ||
            !transaction.action
          ) {
            monthlyMap[
              monthKey
            ].inQty +=
              quantity;
          }

          if (
            transaction.action ===
            'REMOVE'
          ) {
            monthlyMap[
              monthKey
            ].outQty +=
              quantity;
          }
        }
      );

    (salesTransactions || [])
      .forEach(
        (tx) => {

          const dateKey =
            normalizeDate(
              tx.date ||
                tx.timestamp
            );

          if (!dateKey) {
            return;
          }

          const monthKey =
            dateKey.substring(
              0,
              7
            );

          createMonth(
            monthKey
          );

          monthlyMap[
            monthKey
          ].outQty +=
            getItemsSold(tx);

          monthlyMap[
            monthKey
          ].profit +=
            Number(
              tx.totalProfit || 0
            );

          monthlyMap[
            monthKey
          ].revenue +=
            Number(
              tx.totalRevenue || 0
            );
        }
      );

    return Object.values(
      monthlyMap
    ).sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );
  };

  const dailyDataList =
    getAggregatedDailyData();

  const monthlyDataList =
    getAggregatedMonthlyData();

  // =====================================================
  // FILTER HANDLERS
  // =====================================================

  const handleSelectQuickFilter = (
    option
  ) => {

    setIsQuickFilterOpen(
      false
    );

    if (
      option ===
      'Custom Range'
    ) {

      setActiveMode(
        'CUSTOM'
      );

      setQuickFilter(
        'Custom Range'
      );

      return;
    }

    setActiveMode(
      'QUICK'
    );

    setQuickFilter(
      option
    );

    setFromDate('');
    setToDate('');
  };

  const handleCustomFromChange = (
    text
  ) => {

    setActiveMode(
      'CUSTOM'
    );

    setQuickFilter(
      'Custom Range'
    );

    setFromDate(text);
  };

  const handleCustomToChange = (
    text
  ) => {

    setActiveMode(
      'CUSTOM'
    );

    setQuickFilter(
      'Custom Range'
    );

    setToDate(text);
  };

  const handleResetFilters = () => {

    setActiveMode(
      'QUICK'
    );

    setQuickFilter(
      'Today'
    );

    setFromDate('');
    setToDate('');

    setRangeType(
      'DAILY'
    );

    setIsQuickFilterOpen(
      false
    );
  };

  // =====================================================
  // FILTER DATA
  // =====================================================

  const getFilteredData = () => {

    const today =
      getTodayStr();

    const yesterday =
      getYesterdayStr();

    if (
      activeMode ===
      'QUICK'
    ) {

      if (
        quickFilter ===
        'Today'
      ) {

        return dailyDataList.filter(
          (item) =>
            item.date ===
            today
        );
      }

      if (
        quickFilter ===
        'Yesterday'
      ) {

        return dailyDataList.filter(
          (item) =>
            item.date ===
            yesterday
        );
      }

      if (
        quickFilter ===
        'Last Week'
      ) {

        const d =
          new Date();

        d.setDate(
          d.getDate() - 6
        );

        const startDate =
          formatLocalDate(d);

        return dailyDataList.filter(
          (item) =>
            item.date >=
              startDate &&
            item.date <=
              today
        );
      }

      if (
        quickFilter ===
        'Last Month'
      ) {

        const d =
          new Date();

        d.setMonth(
          d.getMonth() - 1
        );

        const monthKey =
          `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, '0')}`;

        return monthlyDataList.filter(
          (item) =>
            item.date ===
            monthKey
        );
      }
    }

    if (
      rangeType ===
      'DAILY'
    ) {

      return dailyDataList.filter(
        (item) =>
          (!fromDate ||
            item.date >=
              fromDate) &&
          (!toDate ||
            item.date <=
              toDate)
      );
    }

    return monthlyDataList.filter(
      (item) =>
        (!fromDate ||
          item.date >=
            fromDate) &&
        (!toDate ||
          item.date <=
            toDate)
    );
  };

  const currentReportData =
    getFilteredData();

  const getActiveDisplayLabel = () => {

    if (
      activeMode ===
      'QUICK'
    ) {
      return `Quick View: ${quickFilter}`;
    }

    return `Custom Range: ${
      fromDate || 'Start'
    } to ${
      toDate || 'End'
    }`;
  };

  // =====================================================
  // PRINT / DOWNLOAD
  // =====================================================

  const handlePrint = () => {

    if (
      !currentReportData.length
    ) {

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

  const handleDownload = () => {

    if (
      !currentReportData.length
    ) {

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
  // SALE CALCULATIONS
  // =====================================================

  const getTotalItems = () => {

    return selectedSaleItems.reduce(
      (sum, item) =>
        sum +
        (Number(
          item.quantity
        ) || 0),
      0
    );
  };

  const getTotalRevenue = () => {

    return selectedSaleItems.reduce(
      (sum, item) =>
        sum +
        (
          (Number(
            item.price
          ) || 0) *
          (Number(
            item.quantity
          ) || 0)
        ),
      0
    );
  };

  const getTotalProfit = () => {

    return selectedSaleItems.reduce(
      (sum, item) =>
        sum +
        (
          (
            Number(
              item.price
            ) || 0
          ) -
          (
            Number(
              item.costPrice
            ) || 0
          )
        ) *
        (
          Number(
            item.quantity
          ) || 0
        ),
      0
    );
  };

  // =====================================================
  // ADD SALE ITEM
  // =====================================================

  const handleAddSaleItem = () => {

    if (!selectedProductId) {

      Alert.alert(
        'Select Product',
        'Please select a product from Inventory.'
      );

      return;
    }

    const product =
      inventoryItems.find(
        (item) =>
          item.id ===
          selectedProductId
      );

    if (!product) {

      Alert.alert(
        'Product Not Found',
        'This product is no longer available in Inventory.'
      );

      return;
    }

    const quantity =
      Number(
        selectedQuantity
      );

    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity < 1
    ) {

      Alert.alert(
        'Invalid Quantity',
        'Quantity must be at least 1.'
      );

      return;
    }

    const currentStock =
      Number(
        product.stock
      ) || 0;

    if (
      quantity >
      currentStock
    ) {

      Alert.alert(
        'Insufficient Stock',
        `${product.name} has only ${currentStock} item(s) available.`
      );

      return;
    }

    const existingItem =
      selectedSaleItems.find(
        (item) =>
          item.productId ===
          product.id
      );

    if (existingItem) {

      const newQuantity =
        Number(
          existingItem.quantity
        ) +
        quantity;

      if (
        newQuantity >
        currentStock
      ) {

        Alert.alert(
          'Insufficient Stock',
          `You already selected ${existingItem.quantity} ${product.name}. Only ${currentStock} available.`
        );

        return;
      }

      setSelectedSaleItems(
        (prev) =>
          prev.map(
            (item) =>
              item.productId ===
              product.id
                ? {
                    ...item,
                    quantity:
                      newQuantity,
                  }
                : item
          )
      );

    } else {

      setSelectedSaleItems(
        (prev) => [
          ...prev,
          {
            productId:
              product.id,

            productName:
              product.name,

            quantity:
              quantity,

            price:
              Number(
                product.price
              ) || 0,

            costPrice:
              Number(
                product.costPrice
              ) || 0,
          },
        ]
      );
    }

    setSelectedProductId('');
    setSelectedQuantity('1');
    setIsProductDropdownOpen(
      false
    );
  };

  // =====================================================
  // REMOVE SALE ITEM
  // =====================================================

  const handleRemoveSaleItem = (
    productId
  ) => {

    setSelectedSaleItems(
      (prev) =>
        prev.filter(
          (item) =>
            item.productId !==
            productId
        )
    );
  };

  // =====================================================
  // EDIT SALE QUANTITY
  // =====================================================

  const handleEditSaleQuantity = (
    index,
    text
  ) => {

    setSelectedSaleItems(
      (prev) =>
        prev.map(
          (item, itemIndex) => {

            if (
              itemIndex !==
              index
            ) {
              return item;
            }

            if (
              text === ''
            ) {
              return {
                ...item,
                quantity: '',
              };
            }

            const quantity =
              Number(text);

            if (
              !Number.isFinite(
                quantity
              ) ||
              quantity < 1
            ) {
              return item;
            }

            return {
              ...item,
              quantity:
                quantity,
            };
          }
        )
    );
  };

  // =====================================================
  // OPEN ADD SALE
  // =====================================================

  const openAddSale = () => {

    setEditingSale(null);

    setSaleDate(
      getTodayStr()
    );

    setSelectedSaleItems(
      []
    );

    setSelectedProductId(
      ''
    );

    setSelectedQuantity(
      '1'
    );

    setIsProductDropdownOpen(
      false
    );

    setSaleModalVisible(
      true
    );
  };

  // =====================================================
  // OPEN EDIT SALE
  // =====================================================

  const openEditSale = (
    sale
  ) => {

    setEditingSale(
      sale
    );

    setSaleDate(
      normalizeDate(
        sale.date ||
          sale.timestamp
      )
    );

    setSelectedSaleItems(
      Array.isArray(
        sale.items
      )
        ? sale.items
        : []
    );

    setSelectedProductId(
      ''
    );

    setSelectedQuantity(
      '1'
    );

    setIsProductDropdownOpen(
      false
    );

    setSaleModalVisible(
      true
    );
  };

  // =====================================================
  // CLOSE SALE MODAL
  // =====================================================

  const closeSaleModal = () => {

    if (
      saleBusy
    ) {
      return;
    }

    setSaleModalVisible(
      false
    );

    setEditingSale(
      null
    );

    setSelectedSaleItems(
      []
    );

    setSelectedProductId(
      ''
    );

    setIsProductDropdownOpen(
      false
    );
  };

  // =====================================================
  // SAVE SALE
  // =====================================================

  const handleSaveSale = async () => {

    if (
      saleBusy
    ) {
      return;
    }

    if (
      !saleDate.trim()
    ) {

      Alert.alert(
        'Missing Date',
        'Please enter a sale date.'
      );

      return;
    }

    if (
      selectedSaleItems.length ===
      0
    ) {

      Alert.alert(
        'No Items',
        'Please select at least one product from Inventory.'
      );

      return;
    }

    const totalRevenue =
      getTotalRevenue();

    const totalProfit =
      getTotalProfit();

    setSaleBusy(
      true
    );

    let success =
      false;

    try {

      if (
        editingSale
      ) {

        const saleData = {
          date:
            saleDate.trim(),

          totalRevenue:
            totalRevenue,

          totalProfit:
            totalProfit,

          items:
            selectedSaleItems,
        };

        success =
          await onEditSale(
            editingSale.id,
            saleData
          );

      } else {

        const saleData = {
          date:
            saleDate.trim(),

          items:
            selectedSaleItems,

          totalRevenue:
            totalRevenue,

          totalProfit:
            totalProfit,

          timestamp:
            new Date().toISOString(),
        };

        success =
          await onAddSale(
            saleData
          );
      }

    } catch (error) {

      console.log(
        'Reports sale save error:',
        error
      );

      success =
        false;
    }

    setSaleBusy(
      false
    );

    if (
      success
    ) {

      setSaleModalVisible(
        false
      );

      setEditingSale(
        null
      );

      setSelectedSaleItems(
        []
      );

      setSelectedProductId(
        ''
      );

    } else {

      Alert.alert(
        'Error',
        'Unable to save the sales record.'
      );
    }
  };

  //show notification
  

  // =====================================================
  // DELETE SALE
  // =====================================================

  const handleDeleteSaleRecord = (
    sale
  ) => {

    if (
      saleBusy
    ) {
      return;
    }

    if (
      !onDeleteSale
    ) {

      Alert.alert(
        'Error',
        'Delete Sale function is not connected.'
      );

      return;
    }

    Alert.alert(
      'Delete Sale',
      'Are you sure you want to delete this sales record?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress:
            async () => {

              setSaleBusy(
                true
              );

              let success =
                false;

              try {

                success =
                  await onDeleteSale(
                    sale.id
                  );

              } catch (error) {

                console.log(
                  'Reports sale delete error:',
                  error
                );

                success =
                  false;
              }

              setSaleBusy(
                false
              );

              if (
                !success
              ) {

                Alert.alert(
                  'Error',
                  'Unable to delete the sales record.'
                );
              }
            },
        },

        
      ]
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        style={
          styles.tabContainer
        }
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >

        <Header
          title="Reports"
          onOpenMenu={
            onOpenMenu
          }
          onOpenProfile={
            onOpenProfile
          }
          user={user}
        />

        <View
          style={
            styles.contentPadding
          }
        >

          <Text
            style={
              styles.pageTitle
            }
          >
            Inventory & Sales Report
          </Text>

          <Text
            style={
              styles.pageSubtitle
            }
          >
            Real-time stock movement breakdown,
            sales & profit analytics
          </Text>

          {/* ================================================= */}
          {/* FILTER CARD */}
          {/* ================================================= */}

          <View
            style={
              styles.filterCard
            }
          >

            <View
              style={
                styles.filterCardHeader
              }
            >

              <Text
                style={
                  styles.filterCardTitle
                }
              >
                1. QUICK TIMEFRAME SEARCH
              </Text>

              <Text
                style={
                  styles.activeTag
                }
              >
                [ ACTIVE ]
              </Text>

            </View>

            <TouchableOpacity
              style={[
                styles.dropdownSelector,
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

              <Text
                style={
                  styles.arrowIcon
                }
              >
                {isQuickFilterOpen
                  ? '▲'
                  : '▼'}
              </Text>

            </TouchableOpacity>

            {isQuickFilterOpen && (

              <View
                style={
                  styles.dropdownMenu
                }
              >

                {quickFilterOptions.map(
                  (
                    option,
                    index
                  ) => (

                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownOption,

                        index ===
                          quickFilterOptions.length -
                            1 && {
                          borderBottomWidth:
                            0,
                        },

                        quickFilter ===
                          option &&
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

            {activeMode ===
              'CUSTOM' && (

              <>
                <View
                  style={
                    styles.divider
                  }
                />

                <View
                  style={
                    styles.rangeHeaderRow
                  }
                >

                  <Text
                    style={
                      styles.subLabel
                    }
                  >
                    FORMAT MODE:
                  </Text>

                  <View
                    style={
                      styles.toggleGroup
                    }
                  >

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        rangeType ===
                          'DAILY' &&
                          styles.toggleBtnActive,
                      ]}
                      onPress={() => {
                        setRangeType(
                          'DAILY'
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
                            'DAILY' &&
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

                <View
                  style={
                    styles.dateInputsRow
                  }
                >

                  <View
                    style={
                      styles.dateFieldFlex
                    }
                  >

                    <Text
                      style={
                        styles.subLabel
                      }
                    >
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
                        styles.activeInputBorder,
                      ]}
                      value={
                        fromDate
                      }
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

                  <View
                    style={
                      styles.dateFieldFlex
                    }
                  >

                    <Text
                      style={
                        styles.subLabel
                      }
                    >
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
                        styles.activeInputBorder,
                      ]}
                      value={
                        toDate
                      }
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
              </>
            )}

            <TouchableOpacity
              style={
                styles.resetBtn
              }
              onPress={
                handleResetFilters
              }
            >

              <Text
                style={
                  styles.resetBtnText
                }
              >
                ↺ Reset Search Filters
              </Text>

            </TouchableOpacity>

          </View>

          {/* ================================================= */}
          {/* REPORT */}
          {/* ================================================= */}

          <View
            style={
              styles.sectionCard
            }
          >

            <Text
              style={
                styles.sectionTitle
              }
            >
              Stock & Sales Movement Breakdown
            </Text>

            <View
              style={
                styles.badgeWrap
              }
            >

              <Text
                style={
                  styles.activeRangeBadge
                }
              >
                {getActiveDisplayLabel()}
              </Text>

            </View>

            <View
              style={
                styles.tableContainer
              }
            >

              <View
                style={
                  styles.tableHeader
                }
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
                      textAlign:
                        'center',
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
                      textAlign:
                        'center',
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
                      textAlign:
                        'right',
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
                    style={
                      styles.emptyText
                    }
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
                  (
                    item,
                    index
                  ) => (

                    <View
                      key={`report-${item.id || item.date || 'unknown'}-${index}`}
                      style={[
                        styles.tableRow,

                        index ===
                          currentReportData.length -
                            1 && {
                          borderBottomWidth:
                            0,
                        },
                      ]}
                    >

                      <Text
                        style={[
                          styles.tableCellBold,
                          { flex: 2 },
                        ]}
                      >
                        {
                          item.label ||
                          item.date
                        }
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
                          item.profit ||
                            0
                        ).toFixed(0)}
                      </Text>

                    </View>
                  )
                )
              )}

            </View>

            <View
              style={
                styles.actionRow
              }
            >

              <TouchableOpacity
                style={
                  styles.printBtn
                }
                onPress={
                  handlePrint
                }
              >
                <Text
                  style={
                    styles.printBtnText
                  }
                >
                  🖨 Print Report
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.downloadBtn
                }
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

          {/* ================================================= */}
          {/* SALES RECORDS */}
          {/* ================================================= */}

          <View
            style={
              styles.sectionCard
            }
          >

            <View
              style={
                styles.salesRecordsHeader
              }
            >

              <View
                style={{
                  flex: 1,
                }}
              >

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Sales Records
                </Text>

                <Text
                  style={
                    styles.salesRecordsSubtitle
                  }
                >
                  Manage individual sales entries
                </Text>

              </View>

              <TouchableOpacity
                style={[
                  styles.addSaleBtn,
                  saleBusy &&
                    styles.disabledBtn,
                ]}
                disabled={
                  saleBusy
                }
                onPress={
                  openAddSale
                }
              >

                <Text
                  style={
                    styles.addSaleBtnText
                  }
                >
                  + Add Sale
                </Text>

              </TouchableOpacity>

            </View>

            {salesTransactions.length ===
            0 ? (

              <View
                style={
                  styles.emptyContainer
                }
              >

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  No sales records found
                </Text>

                <Text
                  style={
                    styles.emptySubtext
                  }
                >
                  Add a sale record to manage it
                  from the Reports screen.
                </Text>

              </View>

            ) : (

              salesTransactions.map(
                (
                  sale,
                  index
                ) => {

                  const itemsSold =
                    getItemsSold(
                      sale
                    );

                  return (

                    <View
                      key={`sale-${sale.id || 'unknown'}-${index}`}
                      style={[
                        styles.salesRecordCard,

                        index ===
                          salesTransactions.length -
                            1 && {
                          marginBottom:
                            0,
                        },
                      ]}
                    >

                      <View
                        style={
                          styles.salesRecordTopRow
                        }
                      >

                        <View
                          style={{
                            flex: 1,
                          }}
                        >

                          <Text
                            style={
                              styles.salesRecordDate
                            }
                          >
                            {normalizeDate(
                              sale.date ||
                                sale.timestamp
                            )}
                          </Text>

                          <Text
                            style={
                              styles.salesRecordItems
                            }
                          >
                            {itemsSold}{' '}
                            item
                            {itemsSold !==
                            1
                              ? 's'
                              : ''}{' '}
                            sold
                          </Text>

                        </View>

                        <View
                          style={
                            styles.salesRecordAmounts
                          }
                        >

                          <Text
                            style={
                              styles.salesRecordRevenue
                            }
                          >
                            Rs.{' '}
                            {Number(
                              sale.totalRevenue ||
                                0
                            ).toFixed(0)}
                          </Text>

                          <Text
                            style={
                              styles.salesRecordProfit
                            }
                          >
                            Profit: Rs.{' '}
                            {Number(
                              sale.totalProfit ||
                                0
                            ).toFixed(0)}
                          </Text>

                        </View>

                      </View>

                      <View
                        style={
                          styles.salesRecordActions
                        }
                      >

                        <TouchableOpacity
                          style={[
                            styles.editSaleBtn,
                            saleBusy &&
                              styles.disabledBtn,
                          ]}
                          disabled={
                            saleBusy
                          }
                          onPress={() =>
                            openEditSale(
                              sale
                            )
                          }
                        >

                          <Text
                            style={
                              styles.editSaleBtnText
                            }
                          >
                            Edit
                          </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.deleteSaleBtn,
                            saleBusy &&
                              styles.disabledBtn,
                          ]}
                          disabled={
                            saleBusy
                          }
                          onPress={() =>
                            handleDeleteSaleRecord(
                              sale
                            )
                          }
                        >

                          <Text
                            style={
                              styles.deleteSaleBtnText
                            }
                          >
                            Delete
                          </Text>

                        </TouchableOpacity>

                      </View>

                    </View>
                  );
                }
              )
            )}

          </View>

        </View>

      </ScrollView>

      {/* ================================================= */}
      {/* ADD / EDIT SALE MODAL */}
      {/* ================================================= */}

      <Modal
        visible={
          saleModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeSaleModal
        }
      >

        <KeyboardAvoidingView
          style={
            styles.keyboardAvoidingView
          }
          behavior={
            Platform.OS ===
            'ios'
              ? 'padding'
              : 'height'
          }
          keyboardVerticalOffset={0}
        >

          <View
            style={
              styles.modalOverlay
            }
          >

            <View
              style={
                styles.saleModal
              }
            >

              {/* HEADER */}

              <View
                style={
                  styles.saleModalHeader
                }
              >

                <View
                  style={
                    styles.saleModalHeaderText
                  }
                >

                  <Text
                    style={
                      styles.saleModalTitle
                    }
                  >
                    {editingSale
                      ? 'Edit Sales Record'
                      : 'Add Sales Record'}
                  </Text>

                  <Text
                    style={
                      styles.saleModalSubtitle
                    }
                  >
                    {editingSale
                      ? 'Update the sales record details.'
                      : 'Select products directly from Inventory.'}
                  </Text>

                </View>

                <TouchableOpacity
                  style={[
                    styles.closeModalBtn,
                    saleBusy &&
                      styles.disabledBtn,
                  ]}
                  onPress={
                    closeSaleModal
                  }
                  disabled={
                    saleBusy
                  }
                >

                  <Text
                    style={
                      styles.closeModalBtnText
                    }
                  >
                    ✕
                  </Text>

                </TouchableOpacity>

              </View>

              <ScrollView
                style={
                  styles.saleModalScroll
                }
                contentContainerStyle={
                  styles.saleModalScrollContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >

                {/* DATE */}

                <Text
                  style={
                    styles.modalLabel
                  }
                >
                  SALE DATE
                </Text>

                <TextInput
                  style={
                    styles.modalInput
                  }
                  value={
                    saleDate
                  }
                  onChangeText={
                    setSaleDate
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />

                {/* ================================================= */}
                {/* INVENTORY PRODUCT SELECTOR */}
                {/* ================================================= */}

                {!editingSale && (
                  <>
                    <Text
                      style={
                        styles.modalLabel
                      }
                    >
                      SELECT INVENTORY ITEM
                    </Text>

                    <TouchableOpacity
                      style={
                        styles.productSelector
                      }
                      onPress={() =>
                        setIsProductDropdownOpen(
                          !isProductDropdownOpen
                        )
                      }
                      disabled={
                        saleBusy
                      }
                    >

                      <Text
                        style={
                          selectedProductId
                            ? styles.productSelectorText
                            : styles.productSelectorPlaceholder
                        }
                      >
                        {selectedProductId
                          ? inventoryItems.find(
                              (item) =>
                                item.id ===
                                selectedProductId
                            )?.name ||
                            'Select product'
                          : 'Select product'}
                      </Text>

                      <Text
                        style={
                          styles.arrowIcon
                        }
                      >
                        {isProductDropdownOpen
                          ? '▲'
                          : '▼'}
                      </Text>

                    </TouchableOpacity>

                    {isProductDropdownOpen && (

                      <View
                        style={
                          styles.productDropdown
                        }
                      >

                        {inventoryItems.length ===
                        0 ? (

                          <View
                            style={
                              styles.noInventoryOption
                            }
                          >

                            <Text
                              style={
                                styles.noInventoryText
                              }
                            >
                              No inventory items available.
                            </Text>

                          </View>

                        ) : (

                          inventoryItems.map(
                            (
                              item
                            ) => {

                              const alreadySelected =
                                selectedSaleItems.some(
                                  (
                                    selected
                                  ) =>
                                    selected.productId ===
                                    item.id
                                );

                              return (

                                <TouchableOpacity
                                  key={
                                    item.id
                                  }
                                  style={
                                    styles.productDropdownOption
                                  }
                                  onPress={() => {

                                    if (
                                      Number(
                                        item.stock
                                      ) <=
                                      0
                                    ) {

                                      Alert.alert(
                                        'Out of Stock',
                                        `${item.name} currently has no stock available.`
                                      );

                                      return;
                                    }

                                    setSelectedProductId(
                                      item.id
                                    );

                                    setIsProductDropdownOpen(
                                      false
                                    );
                                  }}
                                >

                                  <View
                                    style={{
                                      flex: 1,
                                    }}
                                  >

                                    <Text
                                      style={
                                        styles.productOptionName
                                      }
                                    >
                                      {
                                        item.name
                                      }
                                    </Text>

                                    <Text
                                      style={
                                        styles.productOptionStock
                                      }
                                    >
                                      Stock: {
                                        Number(
                                          item.stock
                                        ) || 0
                                      } • Rs. {
                                        Number(
                                          item.price
                                        ) || 0
                                      }
                                    </Text>

                                  </View>

                                  {alreadySelected && (
                                    <Text
                                      style={
                                        styles.selectedCheck
                                      }
                                    >
                                      ✓
                                    </Text>
                                  )}

                                </TouchableOpacity>
                              );
                            }
                          )
                        )}

                      </View>
                    )}

                    {/* QUANTITY */}

                    <Text
                      style={
                        styles.modalLabel
                      }
                    >
                      QUANTITY
                    </Text>

                    <View
                      style={
                        styles.quantityRow
                      }
                    >

                      <TextInput
                        style={
                          styles.quantityInput
                        }
                        value={
                          selectedQuantity
                        }
                        onChangeText={
                          setSelectedQuantity
                        }
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor="#9CA3AF"
                        editable={
                          !saleBusy
                        }
                      />

                      <TouchableOpacity
                        style={[
                          styles.addItemBtn,
                          saleBusy &&
                            styles.disabledBtn,
                        ]}
                        onPress={
                          handleAddSaleItem
                        }
                        disabled={
                          saleBusy
                        }
                      >

                        <Text
                          style={
                            styles.addItemBtnText
                          }
                        >
                          + Add Item
                        </Text>

                      </TouchableOpacity>

                    </View>
                  </>
                )}

                {/* ================================================= */}
                {/* SELECTED ITEMS */}
                {/* ================================================= */}

                <Text
                  style={
                    styles.modalLabel
                  }
                >
                  SELECTED ITEMS
                </Text>

                {selectedSaleItems.length ===
                0 ? (

                  <View
                    style={
                      styles.noSelectedItems
                    }
                  >

                    <Text
                      style={
                        styles.noSelectedItemsText
                      }
                    >
                      No items selected yet.
                    </Text>

                  </View>

                ) : (

                  selectedSaleItems.map(
                    (
                      item,
                      index
                    ) => (

                      <View
                        key={`selected-item-${item.productId || 'unknown'}-${index}`}
                        style={
                          styles.selectedItemCard
                        }
                      >

                        <View
                          style={{
                            flex: 1,
                          }}
                        >

                          <Text
                            style={
                              styles.selectedItemName
                            }
                          >
                            {
                              item.productName
                            }
                          </Text>

                          {editingSale ? (

                            <TextInput
                              style={[
                                styles.quantityInput,
                                {
                                  width: 80,
                                  flex: 0,
                                  marginTop: 4,
                                },
                              ]}
                              value={
                                String(
                                  item.quantity
                                )
                              }
                              onChangeText={(text) =>
                                handleEditSaleQuantity(
                                  index,
                                  text
                                )
                              }
                              keyboardType="numeric"
                              placeholder="1"
                              placeholderTextColor="#9CA3AF"
                              editable={
                                !saleBusy
                              }
                            />

                          ) : (

                            <Text
                              style={
                                styles.selectedItemDetails
                              }
                            >
                              Qty: {
                                item.quantity
                              } × Rs. {
                                Number(
                                  item.price
                                ).toFixed(0)
                              }
                            </Text>
                          )}

                        </View>

                        <Text
                          style={
                            styles.selectedItemTotal
                          }
                        >
                          Rs.{' '}
                          {(
                            Number(
                              item.price
                            ) *
                            Number(
                              item.quantity
                            )
                          ).toFixed(0)}
                        </Text>

                        {!editingSale && (
                          <TouchableOpacity
                            style={
                              styles.removeItemBtn
                            }
                            onPress={() =>
                              handleRemoveSaleItem(
                                item.productId
                              )
                            }
                            disabled={
                              saleBusy
                            }
                          >

                            <Text
                              style={
                                styles.removeItemBtnText
                              }
                            >
                              ✕
                            </Text>

                          </TouchableOpacity>
                        )}

                      </View>
                    )
                  )
                )}

                {/* ================================================= */}
                {/* TOTALS */}
                {/* ================================================= */}

                <View
                  style={
                    styles.saleTotalsCard
                  }
                >

                  <View
                    style={
                      styles.totalRow
                    }
                  >

                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      Total Items
                    </Text>

                    <Text
                      style={
                        styles.totalValue
                      }
                    >
                      {
                        getTotalItems()
                      }
                    </Text>

                  </View>

                  <View
                    style={
                      styles.totalRow
                    }
                  >

                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      Total Revenue
                    </Text>

                    <Text
                      style={
                        styles.totalRevenueValue
                      }
                    >
                      Rs.{' '}
                      {getTotalRevenue().toFixed(
                        0
                      )}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.totalRow
                    }
                  >

                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      Total Profit
                    </Text>

                    <Text
                      style={
                        styles.totalProfitValue
                      }
                    >
                      Rs.{' '}
                      {getTotalProfit().toFixed(
                        0
                      )}
                    </Text>

                  </View>

                </View>

                {/* BUTTONS */}

                <View
                  style={
                    styles.modalButtonRow
                  }
                >

                  <TouchableOpacity
                    style={
                      styles.cancelSaleBtn
                    }
                    onPress={
                      closeSaleModal
                    }
                    disabled={
                      saleBusy
                    }
                  >

                    <Text
                      style={
                        styles.cancelSaleBtnText
                      }
                    >
                      Cancel
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveSaleBtn,
                      saleBusy &&
                        styles.disabledBtn,
                    ]}
                    disabled={
                      saleBusy
                    }
                    onPress={
                      handleSaveSale
                    }
                  >

                    <Text
                      style={
                        styles.saveSaleBtnText
                      }
                    >
                      {saleBusy
                        ? 'Saving...'
                        : editingSale
                        ? 'Save Changes'
                        : 'Add Sale'}
                    </Text>

                  </TouchableOpacity>

                </View>

                <View
                  style={
                    styles.modalBottomSpace
                  }
                />

              </ScrollView>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor:
      '#F3F4F6',
  },

  tabContainer: {
    flex: 1,
    backgroundColor:
      COLORS.lightBackground ||
      '#F3F4F6',
  },

  scrollContent: {
    paddingBottom: 30,
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

  // =====================================================
  // FILTER
  // =====================================================

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

  // =====================================================
  // REPORT
  // =====================================================

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
    marginBottom: 16,
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

  // =====================================================
  // SALES RECORDS
  // =====================================================

  salesRecordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  salesRecordsSubtitle: {
    fontSize: 10,
    color:
      COLORS.textLight ||
      '#6B7280',
    marginTop: 3,
  },

  addSaleBtn: {
    backgroundColor:
      COLORS.accentYellow ||
      '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 10,
  },

  addSaleBtnText: {
    color:
      COLORS.darkBlue ||
      '#1E3A8A',
    fontSize: 11,
    fontWeight: 'bold',
  },

  salesRecordCard: {
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 9,
    padding: 12,
    marginBottom: 10,
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
  },

  salesRecordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  salesRecordDate: {
    fontSize: 13,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  salesRecordItems: {
    fontSize: 10,
    color:
      COLORS.textLight ||
      '#6B7280',
    marginTop: 3,
  },

  salesRecordAmounts: {
    alignItems: 'flex-end',
  },

  salesRecordRevenue: {
    fontSize: 13,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  salesRecordProfit: {
    fontSize: 10,
    fontWeight: '600',
    color:
      COLORS.successGreen ||
      '#10B981',
    marginTop: 3,
  },

  salesRecordActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },

  editSaleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
  },

  editSaleBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  deleteSaleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor:
      '#FEF2F2',
    borderWidth: 1,
    borderColor:
      '#FECACA',
  },

  deleteSaleBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.dangerRed ||
      '#EF4444',
  },

  disabledBtn: {
    opacity: 0.5,
  },

  // =====================================================
  // SALE MODAL
  // =====================================================

  keyboardAvoidingView: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  saleModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    elevation: 8,
  },

  saleModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  saleModalHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  saleModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  saleModalSubtitle: {
    fontSize: 11,
    color:
      COLORS.textLight ||
      '#6B7280',
    marginTop: 4,
    marginBottom: 10,
  },

  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeModalBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  saleModalScroll: {
    width: '100%',
  },

  saleModalScrollContent: {
    paddingBottom: 4,
  },

  modalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color:
      COLORS.textLight ||
      '#6B7280',
    marginBottom: 4,
    marginTop: 10,
  },

  modalInput: {
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 12,
    color:
      COLORS.textDark ||
      '#111827',
  },

  // =====================================================
  // PRODUCT SELECTOR
  // =====================================================

  productSelector: {
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.primaryBlue ||
      '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  productSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color:
      COLORS.textDark ||
      '#111827',
  },

  productSelectorPlaceholder: {
    fontSize: 12,
    color:
      '#9CA3AF',
  },

  productDropdown: {
    backgroundColor:
      COLORS.white ||
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    marginTop: 5,
    elevation: 5,
    maxHeight: 180,
  },

  productDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.borderGray ||
      '#E5E7EB',
  },

  productOptionName: {
    fontSize: 12,
    fontWeight: '700',
    color:
      COLORS.textDark ||
      '#111827',
  },

  productOptionStock: {
    fontSize: 10,
    color:
      COLORS.textLight ||
      '#6B7280',
    marginTop: 2,
  },

  selectedCheck: {
    fontSize: 16,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  noInventoryOption: {
    padding: 14,
    alignItems: 'center',
  },

  noInventoryText: {
    fontSize: 11,
    color:
      COLORS.textLight ||
      '#6B7280',
  },

  // =====================================================
  // QUANTITY
  // =====================================================

  quantityRow: {
    flexDirection: 'row',
    gap: 8,
  },

  quantityInput: {
    flex: 1,
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 12,
    color:
      COLORS.textDark ||
      '#111827',
  },

  addItemBtn: {
    backgroundColor:
      COLORS.accentYellow ||
      '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addItemBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color:
      COLORS.darkBlue ||
      '#1E3A8A',
  },

  // =====================================================
  // SELECTED ITEMS
  // =====================================================

  noSelectedItems: {
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
  },

  noSelectedItemsText: {
    fontSize: 11,
    color:
      COLORS.textLight ||
      '#6B7280',
    textAlign: 'center',
  },

  selectedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      COLORS.inputBg ||
      '#F9FAFB',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 7,
  },

  selectedItemName: {
    fontSize: 12,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  selectedItemDetails: {
    fontSize: 10,
    color:
      COLORS.textLight ||
      '#6B7280',
    marginTop: 2,
  },

  selectedItemTotal: {
    fontSize: 11,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
    marginHorizontal: 8,
  },

  removeItemBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor:
      '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeItemBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color:
      COLORS.dangerRed ||
      '#EF4444',
  },

  // =====================================================
  // TOTALS
  // =====================================================

  saleTotalsCard: {
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderColor:
      COLORS.borderGray ||
      '#E5E7EB',
    borderRadius: 9,
    padding: 12,
    marginTop: 8,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color:
      COLORS.textLight ||
      '#6B7280',
  },

  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  totalRevenueValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color:
      COLORS.primaryBlue ||
      '#2563EB',
  },

  totalProfitValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color:
      COLORS.successGreen ||
      '#10B981',
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  cancelSaleBtn: {
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

  cancelSaleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color:
      COLORS.textDark ||
      '#111827',
  },

  saveSaleBtn: {
    flex: 1,
    backgroundColor:
      COLORS.primaryBlue ||
      '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  saveSaleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color:
      COLORS.white ||
      '#FFFFFF',
  },

  modalBottomSpace: {
    height: 10,
  },
});

