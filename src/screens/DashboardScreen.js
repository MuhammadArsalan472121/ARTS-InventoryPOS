import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../constants/theme';

export default function DashboardScreen({
  onOpenMenu,
  onOpenProfile,
  user,
  products = [],
  productsCount = 0,
  inventoryItems = [],
  onUpdateInventory,
  onRecordSale,
}) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  // SALE DATE
  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Temporary date values used inside date selector
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getSaleDateString = () => {
    return `${saleDate.getFullYear()}-${String(
      saleDate.getMonth() + 1
    ).padStart(2, '0')}-${String(
      saleDate.getDate()
    ).padStart(2, '0')}`;
  };

  const openDatePicker = () => {
    setSelectedDay(saleDate.getDate());
    setSelectedMonth(saleDate.getMonth());
    setSelectedYear(saleDate.getFullYear());
    setShowDatePicker(true);
  };

  const applySaleDate = () => {
    const maxDays = getDaysInMonth(
      selectedMonth,
      selectedYear
    );

    const validDay = Math.min(selectedDay, maxDays);

    const newDate = new Date(
      selectedYear,
      selectedMonth,
      validDay
    );

    setSaleDate(newDate);
    setShowDatePicker(false);
  };

  // Helper to extract unit selling price from any field key variation
  const getUnitPrice = (item) => {
    return Number(item.salesPrice ?? item.price ?? 0);
  };

  // Helper to extract unit profit from form fields or fallback to (Sales Price - Retail Price)
  const getUnitProfit = (item) => {
    if (
      item.profitPerItem !== undefined &&
      item.profitPerItem !== null &&
      item.profitPerItem !== ''
    ) {
      return Number(item.profitPerItem);
    }

    if (
      item.profit !== undefined &&
      item.profit !== null &&
      item.profit !== ''
    ) {
      return Number(item.profit);
    }

    const sales = getUnitPrice(item);
    const retailCost = Number(
      item.retailPrice ?? item.costPrice ?? 0
    );

    return sales - retailCost;
  };

  // Sync products and inventory items so properties & stock are accurate
  const availableItems = (
    products.length > 0 ? products : inventoryItems
  ).map((prod) => {
    const invMatch = inventoryItems.find(
      (inv) => inv.id === prod.id
    );

    return {
      ...prod,
      stock: invMatch
        ? invMatch.stock
        : prod.stock ?? 0,
      unitPrice: getUnitPrice(prod),
      unitProfit: getUnitProfit(prod),
    };
  });

  // Calculate item profit dynamically for cart / receipt
  const calculateItemProfit = (item) => {
    const qty = Number(item.quantity) || 1;
    const profitPerUnit = getUnitProfit(item);

    return profitPerUnit * qty;
  };

  // Calculate item revenue dynamically
  const calculateItemRevenue = (item) => {
    const qty = Number(item.quantity) || 1;
    const price = getUnitPrice(item);

    return price * qty;
  };

  // Calculate total cart profit
  const totalProfit = cart.reduce((acc, item) => {
    return acc + calculateItemProfit(item);
  }, 0);

  // Calculate total cart revenue
  const totalRevenue = cart.reduce((acc, item) => {
    return acc + calculateItemRevenue(item);
  }, 0);

  // Add item to POS Cart
  const handleAddToCart = (item) => {
    if (item.stock <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (ci) => ci.id === item.id
      );

      if (existingIndex > -1) {
        return prevCart.map((ci, index) =>
          index === existingIndex
            ? {
                ...ci,
                quantity: ci.quantity + 1,
              }
            : ci
        );
      }

      return [
        ...prevCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });

    setSearchQuery('');
    setIsDropdownOpen(false);
    Keyboard.dismiss();
  };

  // Modify Cart Item Quantity
  const handleQuantityChange = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;

            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty,
                }
              : null;
          }

          return item;
        })
        .filter(Boolean)
    );
  };

  // Process Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const txData = {
      id: String(Date.now()),
      items: [...cart],
      totalRevenue,
      totalProfit,

      // IMPORTANT:
      // Reports uses YYYY-MM-DD
      date: getSaleDateString(),
    };

    // Deduct stock in inventory
    const updatedInventory = inventoryItems.map(
      (invItem) => {
        const cartMatch = cart.find(
          (c) => c.id === invItem.id
        );

        if (cartMatch) {
          return {
            ...invItem,
            stock: Math.max(
              0,
              Number(invItem.stock) -
                cartMatch.quantity
            ),
          };
        }

        return invItem;
      }
    );

    if (onUpdateInventory) {
      onUpdateInventory(updatedInventory);
    }

    // Record sales transaction into App state
    if (onRecordSale) {
      onRecordSale(txData);
    }

    setCompletedTransaction(txData);
    setShowReceipt(true);
    setCart([]);
  };

  const filteredItems = availableItems.filter((item) =>
    (item.name || item.productName || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const lowStockCount = availableItems.filter(
    (item) => (Number(item.stock) || 0) <= 5
  ).length;

  return (
    <TouchableWithoutFeedback
      onPress={() => setIsDropdownOpen(false)}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Dashboard POS"
          onOpenMenu={onOpenMenu}
          onOpenProfile={onOpenProfile}
          user={user}
        />

        <View style={styles.contentPadding}>

          {/* KPI Metrics Summary Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>
                PRODUCTS
              </Text>

              <Text style={styles.kpiValue}>
                {productsCount ||
                  availableItems.length}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>
                LOW STOCK
              </Text>

              <Text
                style={[
                  styles.kpiValue,
                  {
                    color:
                      COLORS.dangerRed ||
                      '#EF4444',
                  },
                ]}
              >
                {lowStockCount}
              </Text>
            </View>
          </View>

          {/* ==================================================
              SALE DATE
          ================================================== */}

          <View style={styles.saleDateContainer}>
            <Text style={styles.saleDateLabel}>
              SALE DATE
            </Text>

            <TouchableOpacity
              style={styles.saleDateButton}
              onPress={openDatePicker}
            >
              <Text style={styles.saleDateText}>
                {saleDate.toLocaleDateString()}
              </Text>

              <Text style={styles.changeDateText}>
                Change Date
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Search Dropdown Container */}
          <View
            style={styles.searchSectionContainer}
          >
            <Text style={styles.sectionTitle}>
              Quick Item Search
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Tap to select or search product..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setIsDropdownOpen(true);
              }}
              onFocus={() =>
                setIsDropdownOpen(true)
              }
            />

            {/* Dropdown Menu Overlay */}
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  nestedScrollEnabled
                  style={{ maxHeight: 220 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredItems.length === 0 ? (
                    <Text
                      style={styles.noResultsText}
                    >
                      No matching products found
                    </Text>
                  ) : (
                    filteredItems.map((item) => {
                      const price =
                        getUnitPrice(item);

                      const profit =
                        getUnitProfit(item);

                      const isOutOfStock =
                        item.stock <= 0;

                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            isOutOfStock &&
                              styles.disabledDropdownItem,
                          ]}
                          disabled={isOutOfStock}
                          onPress={() =>
                            handleAddToCart(item)
                          }
                          activeOpacity={0.7}
                        >
                          <View
                            style={{ flex: 1 }}
                          >
                            <Text
                              style={
                                styles.dropdownItemTitle
                              }
                            >
                              {item.name ||
                                item.productName}
                            </Text>

                            <Text
                              style={
                                styles.dropdownItemSub
                              }
                            >
                              Stock: {item.stock}{' '}
                              units • Profit: +Rs.{' '}
                              {profit.toFixed(2)}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.dropdownPriceBadge
                            }
                          >
                            <Text
                              style={
                                styles.dropdownPriceText
                              }
                            >
                              Rs.{' '}
                              {price.toFixed(2)}
                            </Text>

                            {isOutOfStock ? (
                              <Text
                                style={
                                  styles.outOfStockText
                                }
                              >
                                Out of stock
                              </Text>
                            ) : (
                              <Text
                                style={styles.addText}
                              >
                                + Add to Cart
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Cart / POS Order Summary Section */}
          <View style={styles.cartContainer}>
            <Text style={styles.sectionTitle}>
              Active Transaction Cart
            </Text>

            {cart.length === 0 ? (
              <Text style={styles.emptyCartText}>
                No items added to current sale.
              </Text>
            ) : (
              cart.map((item) => {
                const itemProfit =
                  calculateItemProfit(item);

                const itemTotal =
                  calculateItemRevenue(item);

                const price =
                  getUnitPrice(item);

                return (
                  <View
                    key={item.id}
                    style={styles.cartItem}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.cartItemName}
                      >
                        {item.name ||
                          item.productName}
                      </Text>

                      <Text
                        style={
                          styles.cartItemDetails
                        }
                      >
                        Rs. {price.toFixed(2)} ×{' '}
                        {item.quantity} = Rs.{' '}
                        {itemTotal.toFixed(2)}
                      </Text>

                      <Text
                        style={
                          styles.cartItemProfit
                        }
                      >
                        Profit: +Rs.{' '}
                        {itemProfit.toFixed(2)}
                      </Text>
                    </View>

                    <View
                      style={styles.qtyControlRow}
                    >
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          handleQuantityChange(
                            item.id,
                            -1
                          )
                        }
                      >
                        <Text
                          style={
                            styles.qtyBtnText
                          }
                        >
                          -
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>
                        {item.quantity}
                      </Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          handleQuantityChange(
                            item.id,
                            1
                          )
                        }
                      >
                        <Text
                          style={
                            styles.qtyBtnText
                          }
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Dynamic Totals Panel */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total Sales Amount:
                </Text>

                <Text style={styles.totalValue}>
                  Rs.{' '}
                  {totalRevenue.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total Profit Recorded:
                </Text>

                <Text style={styles.profitValue}>
                  +Rs.{' '}
                  {totalProfit.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  cart.length === 0 &&
                    styles.disabledBtn,
                ]}
                onPress={handleCheckout}
                disabled={cart.length === 0}
              >
                <Text
                  style={styles.checkoutBtnText}
                >
                  Complete Sale
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ======================================================
            DATE SELECTOR MODAL
        ====================================================== */}

        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowDatePicker(false)
          }
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>

              <Text style={styles.dateModalTitle}>
                Select Sale Date
              </Text>

              <Text
                style={styles.dateModalSubtitle}
              >
                Choose day, month and year
              </Text>

              {/* DAY */}
              <Text style={styles.dateLabel}>
                Day
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                style={styles.dateScroll}
              >
                {Array.from(
                  {
                    length: getDaysInMonth(
                      selectedMonth,
                      selectedYear
                    ),
                  },
                  (_, index) => index + 1
                ).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dateOption,
                      selectedDay === day &&
                        styles.dateOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedDay(day)
                    }
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        selectedDay === day &&
                          styles.dateOptionTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* MONTH */}
              <Text style={styles.dateLabel}>
                Month
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                style={styles.dateScroll}
              >
                {months.map(
                  (month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthOption,
                        selectedMonth ===
                          index &&
                          styles.dateOptionSelected,
                      ]}
                      onPress={() =>
                        setSelectedMonth(index)
                      }
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          selectedMonth ===
                            index &&
                            styles.dateOptionTextSelected,
                        ]}
                      >
                        {month.substring(
                          0,
                          3
                        )}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              {/* YEAR */}
              <Text style={styles.dateLabel}>
                Year
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                style={styles.dateScroll}
              >
                {Array.from(
                  { length: 21 },
                  (_, index) =>
                    new Date().getFullYear() -
                    10 +
                    index
                ).map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      selectedYear === year &&
                        styles.dateOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedYear(year)
                    }
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        selectedYear ===
                          year &&
                          styles.dateOptionTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.selectedDatePreview}>
                Selected: {selectedDay}{' '}
                {months[selectedMonth]}{' '}
                {selectedYear}
              </Text>

              <View
                style={styles.dateButtonRow}
              >
                <TouchableOpacity
                  style={styles.cancelDateBtn}
                  onPress={() =>
                    setShowDatePicker(false)
                  }
                >
                  <Text
                    style={
                      styles.cancelDateText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyDateBtn}
                  onPress={applySaleDate}
                >
                  <Text
                    style={
                      styles.applyDateText
                    }
                  >
                    Apply Date
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sale Receipt Modal */}
        <Modal
          visible={showReceipt}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.receiptCard}>
              <View
                style={styles.receiptHeaderRow}
              >
                <Text
                  style={styles.receiptTitle}
                >
                  OFFICIAL SALES RECEIPT
                </Text>

                <Text
                  style={styles.receiptInv}
                >
                  INV-782449
                </Text>
              </View>

              <Text
                style={styles.receiptDate}
              >
                Date:{' '}
                {completedTransaction?.date}
              </Text>

              <ScrollView
                style={styles.receiptList}
              >
                {completedTransaction?.items.map(
                  (item) => {
                    const lineProfit =
                      calculateItemProfit(
                        item
                      );

                    const lineTotal =
                      calculateItemRevenue(
                        item
                      );

                    const remainingStock =
                      availableItems.find(
                        (i) =>
                          i.id === item.id
                      )?.stock ?? 0;

                    return (
                      <View
                        key={item.id}
                        style={
                          styles.receiptRow
                        }
                      >
                        <View
                          style={{ flex: 1 }}
                        >
                          <Text
                            style={
                              styles.receiptItemName
                            }
                          >
                            {item.name ||
                              item.productName}
                          </Text>

                          <Text
                            style={
                              styles.receiptItemSub
                            }
                          >
                            Qty Sold:{' '}
                            {item.quantity} |
                            Remaining:{' '}
                            {remainingStock}
                          </Text>
                        </View>

                        <View
                          style={{
                            alignItems:
                              'flex-end',
                          }}
                        >
                          <Text
                            style={
                              styles.receiptItemPrice
                            }
                          >
                            Rs.{' '}
                            {lineTotal.toFixed(
                              2
                            )}
                          </Text>

                          <Text
                            style={
                              styles.receiptItemProfit
                            }
                          >
                            Profit: +Rs.{' '}
                            {lineProfit.toFixed(
                              2
                            )}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                )}
              </ScrollView>

              <View
                style={styles.receiptSummary}
              >
                <View style={styles.totalRow}>
                  <Text
                    style={
                      styles.receiptSummaryLabel
                    }
                  >
                    TOTAL SALES AMOUNT:
                  </Text>

                  <Text
                    style={styles.totalValue}
                  >
                    Rs.{' '}
                    {completedTransaction?.totalRevenue.toFixed(
                      2
                    )}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text
                    style={
                      styles.receiptSummaryLabel
                    }
                  >
                    TOTAL PROFIT RECORDED:
                  </Text>

                  <Text
                    style={styles.profitValue}
                  >
                    +Rs.{' '}
                    {completedTransaction?.totalProfit.toFixed(
                      2
                    )}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={
                  styles.closeReceiptBtn
                }
                onPress={() =>
                  setShowReceipt(false)
                }
              >
                <Text
                  style={
                    styles.closeReceiptText
                  }
                >
                  Close & Return to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  contentPadding: {
    padding: 16,
  },

  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  kpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },

  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },

  // ============================================================
  // SALE DATE
  // ============================================================

  saleDateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  saleDateLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    marginBottom: 6,
  },

  saleDateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  saleDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  changeDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  dateModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    maxHeight: '80%',
  },

  dateModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  dateModalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    marginBottom: 14,
  },

  dateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 6,
    marginTop: 6,
  },

  dateScroll: {
    marginBottom: 4,
  },

  dateOption: {
    minWidth: 42,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  monthOption: {
    minWidth: 58,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  yearOption: {
    minWidth: 65,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  dateOptionSelected: {
    backgroundColor: '#2563EB',
  },

  dateOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  dateOptionTextSelected: {
    color: '#FFFFFF',
  },

  selectedDatePreview: {
    marginTop: 14,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  dateButtonRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },

  cancelDateBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },

  cancelDateText: {
    color: '#374151',
    fontWeight: '800',
  },

  applyDateBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },

  applyDateText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ============================================================
  // SEARCH
  // ============================================================

  searchSectionContainer: {
    position: 'relative',
    zIndex: 99,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },

  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    marginTop: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: 'hidden',
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  disabledDropdownItem: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },

  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  dropdownItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  dropdownPriceBadge: {
    alignItems: 'flex-end',
  },

  dropdownPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },

  addText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },

  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },

  noResultsText: {
    padding: 14,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ============================================================
  // CART
  // ============================================================

  cartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },

  emptyCartText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginVertical: 10,
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  cartItemDetails: {
    fontSize: 12,
    color: '#6B7280',
  },

  cartItemProfit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },

  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  qtyBtn: {
    backgroundColor: '#E5E7EB',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyBtnText: {
    fontWeight: '800',
    color: '#111827',
  },

  qtyText: {
    marginHorizontal: 10,
    fontWeight: '700',
    fontSize: 14,
  },

  totalsBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },

  profitValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },

  checkoutBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  disabledBtn: {
    backgroundColor: '#9CA3AF',
  },

  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  // ============================================================
  // RECEIPT
  // ============================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },

  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  receiptTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },

  receiptInv: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  receiptDate: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 2,
  },

  receiptList: {
    maxHeight: 220,
  },

  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  receiptItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  receiptItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  receiptItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  receiptItemProfit: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },

  receiptSummary: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  receiptSummaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  closeReceiptBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },

  closeReceiptText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});