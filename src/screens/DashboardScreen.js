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
  Platform,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [completedTransaction, setCompletedTransaction] =
    useState(null);

  // ============================================================
  // SALE DATE
  // ============================================================

  const [saleDate, setSaleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateDisplay = (date) => {
    if (!date) return '';

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getSaleDateString = () => {
    return `${saleDate.getFullYear()}-${String(
      saleDate.getMonth() + 1
    ).padStart(2, '0')}-${String(
      saleDate.getDate()
    ).padStart(2, '0')}`;
  };

  const handleSaleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setSaleDate(selectedDate);
    }
  };

  // ============================================================
  // PRICE / PROFIT HELPERS
  // ============================================================

  const getUnitPrice = (item) => {
    return Number(item.salesPrice ?? item.price ?? 0);
  };

  // Profit is still calculated internally.
  // It is NOT displayed anywhere on Dashboard or Receipt.
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

  // ============================================================
  // SYNC PRODUCTS + INVENTORY
  // ============================================================

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

  // ============================================================
  // CART CALCULATIONS
  // ============================================================

  const calculateItemRevenue = (item) => {
    const qty = Number(item.quantity) || 1;
    const price = getUnitPrice(item);

    return price * qty;
  };

  const totalRevenue = cart.reduce((acc, item) => {
    return acc + calculateItemRevenue(item);
  }, 0);

  // Profit is calculated internally only.
  const totalProfit = cart.reduce((acc, item) => {
    const qty = Number(item.quantity) || 1;
    const profitPerUnit = getUnitProfit(item);

    return acc + profitPerUnit * qty;
  }, 0);

  // ============================================================
  // INVOICE NUMBER
  // Format:
  // INV-YYYYMMDDHHmmss
  //
  // Example:
  // INV-20260811214317
  // ============================================================

  const generateInvoiceNumber = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      now.getDate()
    ).padStart(2, '0');

    const hour = String(
      now.getHours()
    ).padStart(2, '0');

    const minute = String(
      now.getMinutes()
    ).padStart(2, '0');

    const second = String(
      now.getSeconds()
    ).padStart(2, '0');

    return `INV-${year}${month}${day}${hour}${minute}${second}`;
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCart = (item) => {
    if (Number(item.stock) <= 0) {
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (ci) => ci.id === item.id
      );

      if (existingIndex > -1) {
        return prevCart.map((ci, index) => {
          if (index !== existingIndex) {
            return ci;
          }

          // Do not allow quantity above available stock.
          if (ci.quantity >= Number(item.stock)) {
            return ci;
          }

          return {
            ...ci,
            quantity: ci.quantity + 1,
          };
        });
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

  // ============================================================
  // CHANGE CART QUANTITY
  // ============================================================

  const handleQuantityChange = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id !== id) {
            return item;
          }

          const newQty =
            Number(item.quantity) + delta;

          if (newQty <= 0) {
            return null;
          }

          // Do not exceed stock.
          if (
            newQty >
            Number(item.stock)
          ) {
            return item;
          }

          return {
            ...item,
            quantity: newQty,
          };
        })
        .filter(Boolean)
    );
  };

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckout = () => {
    if (cart.length === 0) {
      return;
    }

    // Generate invoice automatically.
    // User cannot edit this number.
    const invoiceNumber =
      generateInvoiceNumber();

    const txData = {
      // Internal transaction ID
      id: String(Date.now()),

      // Human-readable invoice number
      invoiceNumber,

      items: [...cart],

      totalRevenue,

      // IMPORTANT:
      // Profit remains stored internally for Reports.
      // It is NOT displayed on Dashboard or Receipt.
      totalProfit,

      // Selected sale date
      date: getSaleDateString(),

      // Actual checkout timestamp
      createdAt: new Date().toISOString(),
    };

    // ========================================================
    // DEDUCT INVENTORY
    // ========================================================

    const updatedInventory =
      inventoryItems.map((invItem) => {
        const cartMatch = cart.find(
          (c) => c.id === invItem.id
        );

        if (cartMatch) {
          return {
            ...invItem,

            stock: Math.max(
              0,
              Number(invItem.stock) -
                Number(cartMatch.quantity)
            ),
          };
        }

        return invItem;
      });

    if (onUpdateInventory) {
      onUpdateInventory(updatedInventory);
    }

    // ========================================================
    // SAVE TRANSACTION TO APP STATE
    // ========================================================

    if (onRecordSale) {
      onRecordSale(txData);
    }

    // Show receipt
    setCompletedTransaction(txData);
    setShowReceipt(true);

    // Clear cart
    setCart([]);
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredItems =
    availableItems.filter((item) =>
      (
        item.name ||
        item.productName ||
        ''
      )
        .toLowerCase()
        .includes(
          searchQuery.toLowerCase()
        )
    );

  // ============================================================
  // LOW STOCK
  // ============================================================

  const lowStockCount =
    availableItems.filter(
      (item) =>
        (Number(item.stock) || 0) <= 5
    ).length;

  // ============================================================
  // UI
  // ============================================================

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        setIsDropdownOpen(false)
      }
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <Header
          title="POS Dashboard"
          onOpenMenu={onOpenMenu}
          onOpenProfile={onOpenProfile}
          user={user}
        />

        <View style={styles.contentPadding}>

          {/* ==================================================
              KPI CARDS
          ================================================== */}

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
              onPress={() =>
                setShowDatePicker(true)
              }
            >
              <Text style={styles.saleDateText}>
                📅 {formatDateDisplay(saleDate)}
              </Text>

              <Text style={styles.changeDateText}>
                Change Date
              </Text>
            </TouchableOpacity>

            {/* SAME CALENDAR APPROACH AS YOUR OTHER PAGE */}
            {showDatePicker && (
              <DateTimePicker
                value={saleDate}
                mode="date"
                display={
                  Platform.OS === 'ios'
                    ? 'compact'
                    : 'calendar'
                }
                onChange={
                  handleSaleDateChange
                }
                maximumDate={
                  new Date(2035, 11, 31)
                }
                minimumDate={
                  new Date(2000, 0, 1)
                }
              />
            )}

          </View>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <View
            style={
              styles.searchSectionContainer
            }
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

            {isDropdownOpen && (
              <View
                style={styles.dropdownMenu}
              >
                <ScrollView
                  nestedScrollEnabled
                  style={{
                    maxHeight: 220,
                  }}
                  keyboardShouldPersistTaps="handled"
                >

                  {filteredItems.length ===
                  0 ? (
                    <Text
                      style={
                        styles.noResultsText
                      }
                    >
                      No matching products found
                    </Text>
                  ) : (
                    filteredItems.map(
                      (item) => {
                        const price =
                          getUnitPrice(item);

                        const isOutOfStock =
                          Number(
                            item.stock
                          ) <= 0;

                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.dropdownItem,
                              isOutOfStock &&
                                styles.disabledDropdownItem,
                            ]}
                            disabled={
                              isOutOfStock
                            }
                            onPress={() =>
                              handleAddToCart(
                                item
                              )
                            }
                            activeOpacity={0.7}
                          >

                            <View
                              style={{
                                flex: 1,
                              }}
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
                                Stock:{' '}
                                {item.stock}{' '}
                                units
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
                                {price.toFixed(
                                  2
                                )}
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
                                  style={
                                    styles.addText
                                  }
                                >
                                  + Add to Cart
                                </Text>
                              )}
                            </View>

                          </TouchableOpacity>
                        );
                      }
                    )
                  )}

                </ScrollView>
              </View>
            )}
          </View>

          {/* ==================================================
              CART
          ================================================== */}

          <View style={styles.cartContainer}>

            <Text style={styles.sectionTitle}>
              Active Transaction Cart
            </Text>

            {cart.length === 0 ? (
              <Text
                style={
                  styles.emptyCartText
                }
              >
                No items added to current sale.
              </Text>
            ) : (
              cart.map((item) => {

                const itemTotal =
                  calculateItemRevenue(
                    item
                  );

                const price =
                  getUnitPrice(item);

                return (
                  <View
                    key={item.id}
                    style={styles.cartItem}
                  >

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.cartItemName
                        }
                      >
                        {item.name ||
                          item.productName}
                      </Text>

                      <Text
                        style={
                          styles.cartItemDetails
                        }
                      >
                        Rs.{' '}
                        {price.toFixed(2)} ×{' '}
                        {item.quantity} = Rs.{' '}
                        {itemTotal.toFixed(2)}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.qtyControlRow
                      }
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

                      <Text
                        style={styles.qtyText}
                      >
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

            {/* ==================================================
                TOTALS
                NO PROFIT SHOWN HERE
            ================================================== */}

            <View style={styles.totalsBox}>

              <View style={styles.totalRow}>
                <Text
                  style={
                    styles.totalLabel
                  }
                >
                  Total Sales Amount:
                </Text>

                <Text
                  style={
                    styles.totalValue
                  }
                >
                  Rs.{' '}
                  {totalRevenue.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  cart.length === 0 &&
                    styles.disabledBtn,
                ]}
                onPress={handleCheckout}
                disabled={
                  cart.length === 0
                }
              >
                <Text
                  style={
                    styles.checkoutBtnText
                  }
                >
                  Complete Sale
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>

        {/* ======================================================
            SALES RECEIPT
            NO PROFIT DISPLAYED
        ====================================================== */}

        <Modal
          visible={showReceipt}
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowReceipt(false)
          }
        >
          <View
            style={styles.modalOverlay}
          >

            <View
              style={styles.receiptCard}
            >

              {/* FIXED HEADER - NO OVERLAPPING */}
              <View
                style={
                  styles.receiptHeader
                }
              >

                <Text
                  style={
                    styles.receiptTitle
                  }
                >
                  OFFICIAL SALES RECEIPT
                </Text>

                <Text
                  style={
                    styles.receiptInvoice
                  }
                >
                  Invoice No:{' '}
                  {completedTransaction?.invoiceNumber}
                </Text>

              </View>

              <Text
                style={
                  styles.receiptDate
                }
              >
                Sale Date:{' '}
                {completedTransaction?.date}
              </Text>

              <ScrollView
                style={
                  styles.receiptList
                }
                showsVerticalScrollIndicator={
                  false
                }
              >

                {completedTransaction?.items?.map(
                  (item) => {

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
                          style={{
                            flex: 1,
                          }}
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
                            {item.quantity}{' '}
                            | Remaining:{' '}
                            {remainingStock}
                          </Text>

                        </View>

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

                      </View>
                    );
                  }
                )}

              </ScrollView>

              {/* RECEIPT TOTAL - NO PROFIT */}
              <View
                style={
                  styles.receiptSummary
                }
              >

                <View
                  style={styles.totalRow}
                >
                  <Text
                    style={
                      styles.receiptSummaryLabel
                    }
                  >
                    TOTAL SALES AMOUNT:
                  </Text>

                  <Text
                    style={
                      styles.totalValue
                    }
                  >
                    Rs.{' '}
                    {completedTransaction?.totalRevenue?.toFixed(
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

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  contentPadding: {
    padding: 16,
  },

  // ==========================================================
  // KPI
  // ==========================================================

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

  // ==========================================================
  // SALE DATE
  // ==========================================================

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

  // ==========================================================
  // SEARCH
  // ==========================================================

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

  // ==========================================================
  // CART
  // ==========================================================

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

  // ==========================================================
  // RECEIPT
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },

  // IMPORTANT:
  // Invoice is now BELOW title instead of beside it.
  receiptHeader: {
    width: '100%',
    marginBottom: 6,
  },

  receiptTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
  },

  receiptInvoice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 5,
  },

  receiptDate: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 12,
  },

  receiptList: {
    maxHeight: 220,
  },

  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginLeft: 10,
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